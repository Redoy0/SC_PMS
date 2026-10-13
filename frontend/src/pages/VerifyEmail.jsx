import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getTranslations } from '../translations';
import AuthLayout, { FormError, FormSuccess } from '../components/AuthLayout.jsx';

const LENGTH = 6;
const RESEND_SECONDS = 60;

export default function VerifyEmailPage() {
  const { login } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = getTranslations(currentLanguage);
  const location = useLocation();
  const email = location.state?.email || new URLSearchParams(location.search).get('email') || '';

  const [digits, setDigits] = useState(Array(LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const inputs = useRef([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  useEffect(() => { inputs.current[0]?.focus(); }, []);

  if (!email) return <Navigate to="/register" replace />;

  const code = digits.join('');

  const submit = async (value = code) => {
    if (value.length !== LENGTH) return;
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const res = await apiFetch('/auth/verify-email', { method: 'POST', body: JSON.stringify({ email, code: value }) });
      login(res.accessToken, res.user);
    } catch (err) {
      setError(err.message || t.somethingWentWrong);
      setDigits(Array(LENGTH).fill(''));
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const setDigit = (index, raw) => {
    const value = raw.replace(/\D/g, '');
    if (!value) {
      setDigits((d) => d.map((x, i) => (i === index ? '' : x)));
      return;
    }
    // Typing or pasting several digits fills the following boxes
    const next = [...digits];
    value.slice(0, LENGTH - index).split('').forEach((ch, offset) => { next[index + offset] = ch; });
    setDigits(next);
    const focusIndex = Math.min(index + value.length, LENGTH - 1);
    inputs.current[focusIndex]?.focus();
    if (next.every(Boolean)) submit(next.join(''));
  };

  const onKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) inputs.current[index - 1]?.focus();
    if (e.key === 'ArrowLeft' && index > 0) inputs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const resend = async () => {
    setError('');
    setInfo('');
    try {
      await apiFetch('/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) });
      setInfo(t.codeResent);
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(err.message || t.somethingWentWrong);
    }
  };

  return (
    <AuthLayout
      title={t.verifyEmailTitle}
      subtitle={<>{t.verifyEmailSubtitle} <strong className="text-surface-800 break-all">{email}</strong></>}
      footer={
        <>
          {t.wrongEmail}{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">{t.startOver}</Link>
        </>
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-5">
        <div className="flex justify-between gap-2" role="group" aria-label={t.verificationCode}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              onFocus={(e) => e.target.select()}
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              maxLength={LENGTH}
              aria-label={`${t.digit} ${i + 1}`}
              className="h-14 w-full min-w-0 rounded-xl border border-surface-300 bg-white text-center text-2xl font-bold text-surface-900 transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
            />
          ))}
        </div>

        <FormError message={error} />
        <FormSuccess message={info} />

        <button type="submit" disabled={loading || code.length !== LENGTH} className="btn-primary w-full">
          {loading ? (<><span className="spinner"></span>{t.pleaseWait}</>) : t.verifyAndContinue}
        </button>

        <p className="text-center text-sm text-surface-500">
          {t.didntGetCode}{' '}
          {cooldown > 0 ? (
            <span className="font-medium">{t.resendIn.replace('{s}', cooldown)}</span>
          ) : (
            <button type="button" onClick={resend} className="font-semibold text-brand-600 hover:text-brand-700">
              {t.resendCode}
            </button>
          )}
        </p>
      </form>
    </AuthLayout>
  );
}
