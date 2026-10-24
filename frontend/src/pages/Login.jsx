import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getTranslations } from '../translations';
import AuthLayout, { FormError, FormSuccess } from '../components/AuthLayout.jsx';
import PasswordField from '../components/PasswordField.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = getTranslations(currentLanguage);
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: location.state?.email || '', password: '', remember: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const notice = location.state?.notice || '';

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(form) });
      login(res.accessToken, res.user);
    } catch (err) {
      if (err.code === 'EMAIL_NOT_VERIFIED') {
        // Send a fresh code and continue on the verification screen
        apiFetch('/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email: form.email }) }).catch(() => {});
        navigate('/verify-email', { state: { email: form.email.trim().toLowerCase() } });
        return;
      }
      setError(err.message || t.somethingWentWrong);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t.welcomeBack}
      subtitle={t.signInToAccount}
      footer={
        <>
          {t.noAccountYet}{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">{t.createAccount}</Link>
          <div className="mt-4">
            <Link to="/track-parcel" className="inline-flex items-center gap-1.5 font-semibold text-success-600 hover:text-success-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {t.trackParcelWithoutAccount}
            </Link>
          </div>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        <FormSuccess message={notice} />

        <div className="form-group">
          <label htmlFor="login-email" className="label">{t.email}</label>
          <input
            id="login-email"
            type="email"
            className="input"
            placeholder={t.emailPlaceholder}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoComplete="email"
            required
          />
        </div>

        <div>
          <PasswordField
            id="login-password"
            label={t.password}
            value={form.password}
            onChange={(password) => setForm({ ...form, password })}
            autoComplete="current-password"
            placeholder={t.passwordPlaceholder}
          />
          <div className="mt-2 flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-sm text-surface-600 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                checked={form.remember}
                onChange={(e) => setForm({ ...form, remember: e.target.checked })}
              />
              {t.rememberMe}
            </label>
            <Link to="/forgot-password" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
              {t.forgotPassword}
            </Link>
          </div>
        </div>

        <FormError message={error} />

        <button type="submit" disabled={loading || !form.email || !form.password} className="btn-primary w-full">
          {loading ? (<><span className="spinner"></span>{t.pleaseWait}</>) : t.login}
        </button>
      </form>
    </AuthLayout>
  );
}
