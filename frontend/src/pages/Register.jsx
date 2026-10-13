import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getTranslations } from '../translations';
import AuthLayout, { FormError } from '../components/AuthLayout.jsx';
import PasswordField from '../components/PasswordField.jsx';
import { isPasswordValid } from '../utils/password.js';

const BD_PHONE_RE = /^(?:\+?88)?01[3-9]\d{8}$/;

export default function RegisterPage() {
  const { login } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = getTranslations(currentLanguage);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', acceptTerms: false });
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const touch = (key) => () => setTouched((s) => ({ ...s, [key]: true }));

  const fieldErrors = {
    name: form.name.trim().length < 2 ? t.errName : '',
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()) ? t.errEmail : '',
    phone: !BD_PHONE_RE.test(form.phone.replace(/[\s-]/g, '')) ? t.errPhone : '',
    password: !isPasswordValid(form.password) ? t.errPassword : '',
    confirm: form.confirm !== form.password ? t.errConfirm : '',
    acceptTerms: !form.acceptTerms ? t.errTerms : '',
  };
  const isValid = Object.values(fieldErrors).every((e) => !e);
  const showError = (key) => touched[key] && fieldErrors[key];

  const submit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, phone: true, password: true, confirm: true, acceptTerms: true });
    if (!isValid) return;
    setLoading(true);
    setError('');
    try {
      const { confirm: _confirm, ...payload } = form;
      const res = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
      if (res.accessToken) {
        // Email verification disabled on the server: signed in immediately
        login(res.accessToken, res.user);
        return;
      }
      navigate('/verify-email', { state: { email: res.email } });
    } catch (err) {
      setError(err.message || t.somethingWentWrong);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (key) => `input ${showError(key) ? 'input-error' : ''}`;
  const hint = (k) => (showError(k) ? <p className="text-xs text-danger-600 mt-1">{fieldErrors[k]}</p> : null);

  return (
    <AuthLayout
      title={t.createAccount}
      subtitle={t.registerSubtitle}
      footer={
        <>
          {t.alreadyHaveAccount}{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">{t.login}</Link>
          <p className="mt-3 text-xs text-surface-500">{t.agentSignupNote}</p>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="form-group">
          <label htmlFor="reg-name" className="label">{t.fullName}</label>
          <input id="reg-name" className={inputClass('name')} placeholder={t.johnDoe} value={form.name}
            onChange={(e) => set('name')(e.target.value)} onBlur={touch('name')} autoComplete="name" maxLength={80} required />
          {hint('name')}
        </div>

        <div className="form-group">
          <label htmlFor="reg-email" className="label">{t.email}</label>
          <input id="reg-email" type="email" className={inputClass('email')} placeholder={t.emailPlaceholder} value={form.email}
            onChange={(e) => set('email')(e.target.value)} onBlur={touch('email')} autoComplete="email" required />
          {hint('email')}
        </div>

        <div className="form-group">
          <label htmlFor="reg-phone" className="label">{t.phoneNumber}</label>
          <input id="reg-phone" type="tel" inputMode="tel" className={inputClass('phone')} placeholder="01XXXXXXXXX" value={form.phone}
            onChange={(e) => set('phone')(e.target.value)} onBlur={touch('phone')} autoComplete="tel" maxLength={16} required />
          {hint('phone')}
        </div>

        <div>
          <PasswordField id="reg-password" label={t.password} value={form.password} onChange={(v) => { set('password')(v); touch('password')(); }} showStrength />
        </div>

        <div className="form-group">
          <label htmlFor="reg-confirm" className="label">{t.confirmPassword}</label>
          <input id="reg-confirm" type="password" className={inputClass('confirm')} value={form.confirm}
            onChange={(e) => set('confirm')(e.target.value)} onBlur={touch('confirm')} autoComplete="new-password" maxLength={64} required />
          {hint('confirm')}
        </div>

        <div>
          <label className="flex items-start gap-2.5 text-sm text-surface-600 cursor-pointer">
            <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
              checked={form.acceptTerms} onChange={(e) => { set('acceptTerms')(e.target.checked); touch('acceptTerms')(); }} />
            <span>{t.acceptTermsText}</span>
          </label>
          {hint('acceptTerms')}
        </div>

        <FormError message={error} />

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? (<><span className="spinner"></span>{t.pleaseWait}</>) : t.createAccount}
        </button>
      </form>
    </AuthLayout>
  );
}
