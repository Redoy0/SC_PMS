import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../api';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getTranslations } from '../translations';
import AuthLayout, { FormError } from '../components/AuthLayout.jsx';
import PasswordField from '../components/PasswordField.jsx';
import { isPasswordValid } from '../utils/password.js';

// Handles both "forgot password" links and delivery-agent invitations (?invite=1)
export default function ResetPasswordPage() {
  const { currentLanguage } = useLanguage();
  const t = getTranslations(currentLanguage);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const isInvite = params.get('invite') === '1';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = isPasswordValid(password) && password === confirm;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      await apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) });
      navigate('/login', { replace: true, state: { notice: isInvite ? t.accountActivated : t.passwordUpdated } });
    } catch (err) {
      setError(err.message || t.somethingWentWrong);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={isInvite ? t.setPasswordTitle : t.resetPasswordTitle}
      subtitle={isInvite ? t.setPasswordSubtitle : t.resetPasswordSubtitle}
      footer={<Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">{t.backToSignIn}</Link>}
    >
      {!token ? (
        <div className="space-y-4">
          <FormError message={t.invalidResetLink} />
          <Link to="/forgot-password" className="btn-secondary w-full">{t.requestNewLink}</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <PasswordField id="rp-password" label={t.newPassword} value={password} onChange={setPassword} showStrength />
          <div className="form-group">
            <label htmlFor="rp-confirm" className="label">{t.confirmPassword}</label>
            <input id="rp-confirm" type="password" className={`input ${confirm && confirm !== password ? 'input-error' : ''}`}
              value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" maxLength={64} required />
            {confirm && confirm !== password && <p className="text-xs text-danger-600 mt-1">{t.errConfirm}</p>}
          </div>
          <FormError message={error} />
          <button type="submit" disabled={loading || !canSubmit} className="btn-primary w-full">
            {loading ? (<><span className="spinner"></span>{t.pleaseWait}</>) : (isInvite ? t.activateAccount : t.updatePassword)}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
