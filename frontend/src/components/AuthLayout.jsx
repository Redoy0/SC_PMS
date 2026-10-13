import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getTranslations } from '../translations';
import LanguageSwitcher from './LanguageSwitcher.jsx';

const BOX_ICON = 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4';

const POINTS = [
  { key: 'realtimeGpsTracking', d: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
  { key: 'secureReliableService', d: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { key: 'fastEfficientDelivery', d: 'M13 10V3L4 14h7v7l9-11h-7z' },
];

// Two-column shell shared by sign-in, sign-up, verification and password pages
export default function AuthLayout({ title, subtitle, children, footer }) {
  const { currentLanguage } = useLanguage();
  const t = getTranslations(currentLanguage);

  return (
    <div className="min-h-screen flex">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-brand-400 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white">
          <Link to="/" className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={BOX_ICON} />
            </svg>
          </Link>
          <h1 className="text-4xl font-bold mb-4">{t.scpmsTitle}</h1>
          <p className="text-xl text-brand-100 leading-relaxed mb-10">{t.trustedPartnerTagline}</p>
          <div className="space-y-4">
            {POINTS.map((p) => (
              <div key={p.key} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={p.d} />
                  </svg>
                </div>
                <span className="text-brand-100">{t[p.key]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col bg-surface-50">
        <div className="flex items-center justify-between px-6 py-5 sm:px-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-surface-500 hover:text-brand-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t.backToHome}
          </Link>
          <LanguageSwitcher />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 pb-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="lg:hidden text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={BOX_ICON} />
                </svg>
              </div>
              <p className="font-bold text-surface-900">{t.scpmsTitle}</p>
            </div>

            <div className="card p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-surface-900">{title}</h2>
                {subtitle && <p className="text-surface-500 mt-1">{subtitle}</p>}
              </div>
              {children}
            </div>

            {footer && <div className="mt-6 text-center text-sm text-surface-600">{footer}</div>}
            <p className="text-center text-xs text-surface-400 mt-6">{t.copyrightFooter}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FormError({ message }) {
  if (!message) return null;
  return (
    <div className="alert alert-error" role="alert">
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{message}</span>
    </div>
  );
}

export function FormSuccess({ message }) {
  if (!message) return null;
  return (
    <div className="alert alert-success" role="status">
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <span>{message}</span>
    </div>
  );
}
