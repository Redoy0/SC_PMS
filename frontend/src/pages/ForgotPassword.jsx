import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getTranslations } from '../translations';
import AuthLayout, { FormError, FormSuccess } from '../components/AuthLayout.jsx';

export default function ForgotPasswordPage() {
  const { currentLanguage } = useLanguage();
  const t = getTranslations(currentLanguage);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
      setSent(true);
    } catch (err) {
      setError(err.message || t.somethingWentWrong);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t.forgotPasswordTitle}
      subtitle={t.forgotPasswordSubtitle}
      footer={<Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">{t.backToSignIn}</Link>}
    >
      {sent ? (
        <FormSuccess message={t.resetLinkSent} />
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div className="form-group">
            <label htmlFor="fp-email" className="label">{t.email}</label>
            <input id="fp-email" type="email" className="input" placeholder={t.emailPlaceholder} value={email}
              onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </div>
          <FormError message={error} />
          <button type="submit" disabled={loading || !email} className="btn-primary w-full">
            {loading ? (<><span className="spinner"></span>{t.pleaseWait}</>) : t.sendResetLink}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
