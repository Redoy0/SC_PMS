import { useState } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getTranslations } from '../translations';
import { Navigate } from 'react-router-dom';
import LanguageSwitcher from '../components/LanguageSwitcher.jsx';

export default function LoginPage() {
  const { login, token, user } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = getTranslations(currentLanguage);
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const res = await apiFetch(path, { method: 'POST', body: JSON.stringify(form) });
      login(res.token, res.user);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (token && user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-brand-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4">{t.scpmsTitle}</h1>
            <p className="text-xl text-brand-100 leading-relaxed">
              {t.trustedPartnerTagline}
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-brand-100">{t.realtimeGpsTracking}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-brand-100">{t.secureReliableService}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-brand-100">{t.fastEfficientDelivery}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-surface-900">{t.scpmsTitle}</h1>
          </div>

          {/* Card */}
          <div className="card p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-surface-900">
                  {mode === 'login' ? t.welcomeBack : t.createAccount}
                </h2>
                <p className="text-surface-500 mt-1">
                  {mode === 'login' ? t.signInToAccount : t.getStartedWithAccount}
                </p>
              </div>
              <LanguageSwitcher />
            </div>

            {/* Tab Switcher */}
            <div className="flex p-1 bg-surface-100 rounded-xl mb-6">
              <button 
                onClick={() => setMode('login')} 
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  mode === 'login' 
                    ? 'bg-white text-surface-900 shadow-sm' 
                    : 'text-surface-500 hover:text-surface-700'
                }`}
              >
                {t.login}
              </button>
              <button 
                onClick={() => setMode('register')} 
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  mode === 'register' 
                    ? 'bg-white text-surface-900 shadow-sm' 
                    : 'text-surface-500 hover:text-surface-700'
                }`}
              >
                {t.register}
              </button>
            </div>

            {/* Form */}
            <form onSubmit={submit} className="space-y-5">
              {mode === 'register' && (
                <div className="form-group">
                  <label className="label">{t.fullName}</label>
                  <input 
                    className="input" 
                    placeholder={t.johnDoe} 
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})} 
                  />
                </div>
              )}
              
              <div className="form-group">
                <label className="label">{t.email}</label>
                <input 
                  type="email"
                  className="input" 
                  placeholder={t.emailPlaceholder} 
                  value={form.email} 
                  onChange={e => setForm({...form, email: e.target.value})} 
                />
              </div>
              
              <div className="form-group">
                <label className="label">{t.password}</label>
                <input 
                  type="password" 
                  className="input" 
                  placeholder={t.passwordPlaceholder} 
                  value={form.password} 
                  onChange={e => setForm({...form, password: e.target.value})} 
                />
              </div>
              
              {mode === 'register' && (
                <div className="form-group">
                  <label className="label">{t.role}</label>
                  <select 
                    className="select" 
                    value={form.role} 
                    onChange={e => setForm({...form, role: e.target.value})}
                  >
                    <option value="customer">{t.customer}</option>
                    <option value="agent">{t.deliveryAgent}</option>
                  </select>
                </div>
              )}
              
              {error && (
                <div className="alert alert-error">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}
              
              <button 
                type="submit" 
                disabled={loading} 
                className="btn-primary w-full"
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    {t.pleaseWait}
                  </>
                ) : (
                  mode === 'login' ? t.login : t.createAccount
                )}
              </button>
            </form>
          </div>

          {/* Track Parcel Button */}
          <div className="mt-6 p-4 bg-white rounded-2xl border border-surface-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-900">{t.trackYourParcel || 'Track Your Parcel'}</p>
                  <p className="text-xs text-surface-500">{t.trackParcelDescription || 'Enter tracking code to find your parcel'}</p>
                </div>
              </div>
              <a 
                href="/track-parcel" 
                className="btn-success py-2 px-4 text-sm"
              >
                {t.trackNow || 'Track Now'}
              </a>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-surface-500 mt-6">
            {t.copyrightFooter}
          </p>
        </div>
      </div>
    </div>
  );
}
