import AdminPanel from '../components/AdminPanel.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getTranslations } from '../translations';
import LanguageSwitcher from '../components/LanguageSwitcher.jsx';

function Navbar({ onLogout, user }) {
  const { currentLanguage } = useLanguage();
  const t = getTranslations(currentLanguage);
  
  return (
    <header className="navbar">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-surface-900">{t.scpmsTitle}</span>
            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-medium bg-brand-100 text-brand-700 rounded-full">Admin</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-surface-100 rounded-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="text-sm">
              <div className="font-medium text-surface-900">{user?.name}</div>
              <div className="text-xs text-surface-500 capitalize">{user?.role}</div>
            </div>
          </div>
          <LanguageSwitcher />
          <button 
            onClick={onLogout} 
            className="btn-secondary btn-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">{t.logout}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = getTranslations(currentLanguage);
  
  return (
    <div className="min-h-screen bg-surface-50">
      <Navbar user={user} onLogout={logout} />
      <main className="container py-8">
        <div className="page-header">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="page-title flex items-center gap-3">
                <span className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </span>
                {t.adminDashboard}
              </h1>
              <p className="page-subtitle">Academic control center for parcel workflows, agent allocation, and live operational visibility</p>
            </div>
            <button
              onClick={() => window.location.href = '/admin/tracking'}
              className="btn-primary"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {t.trackAgents}
            </button>
          </div>
        </div>
        <AdminPanel />
      </main>
    </div>
  );
}
