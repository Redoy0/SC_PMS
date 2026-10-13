import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getTranslations } from '../translations';
import LanguageSwitcher from '../components/LanguageSwitcher.jsx';
import { roleHomePath } from '../utils/roleHome.js';

// Heroicons-style outline paths, rendered at 24x24
const ICONS = {
  box: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  pin: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  qr: 'M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h2v2h-2v-2zm4 0h2v2h-2v-2zm-4 4h2v2h-2v-2zm4 0h2v2h-2v-2z',
  shield: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  mail: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  globe: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  bolt: 'M13 10V3L4 14h7v7l9-11h-7z',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  truck: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0',
  cog: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  check: 'M5 13l4 4L19 7',
  arrow: 'M14 5l7 7m0 0l-7 7m7-7H3',
};

function Icon({ name, className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={ICONS[name]} />
    </svg>
  );
}

// Illustrative tracking card for the hero; sample data, not a live parcel
function HeroTrackingPreview({ t }) {
  const steps = [
    { label: t.pending, done: true },
    { label: t.assigned, done: true },
    { label: t.pickedUp, done: true },
    { label: t.inTransit, active: true },
    { label: t.delivered },
  ];
  return (
    <div className="relative">
      <div className="absolute -inset-6 bg-gradient-to-tr from-brand-500/20 via-info-400/10 to-success-400/20 blur-2xl rounded-[2rem]" aria-hidden="true" />
      <div className="relative card-elevated p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-surface-400">{t.trackingCode}</p>
            <p className="font-mono text-lg font-bold text-surface-900">K7Q2M9XW4P</p>
          </div>
          <span className="badge badge-in-transit">
            <span className="status-dot bg-info-500 animate-pulse-soft" />
            {t.inTransit}
          </span>
        </div>

        {/* Stylised route map */}
        <div className="relative h-44 rounded-xl overflow-hidden bg-surface-100 border border-surface-200">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 176" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <pattern id="lp-grid" width="22" height="22" patternUnits="userSpaceOnUse">
                <path d="M22 0H0V22" fill="none" stroke="#e2e8f0" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="320" height="176" fill="url(#lp-grid)" />
            <path d="M0 120 C60 110 80 60 140 70 S240 140 320 90" fill="none" stroke="#cbd5e1" strokeWidth="10" strokeLinecap="round" />
            <path d="M36 128 C80 116 96 66 150 72 S220 120 284 46" fill="none" stroke="#c7d2fe" strokeWidth="6" strokeLinecap="round" />
            <path d="M36 128 C80 116 96 66 150 72 S190 100 205 104" fill="none" stroke="#4f46e5" strokeWidth="6" strokeLinecap="round" />
          </svg>
          <div className="absolute left-[8%] top-[66%] -translate-x-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md ring-2 ring-brand-500 text-brand-600">
            <Icon name="box" className="w-4 h-4" />
          </div>
          <div className="absolute left-[64%] top-[58%] -translate-x-1/2 -translate-y-1/2">
            <span className="absolute inset-0 rounded-full bg-success-400/50 animate-ping" />
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-success-500 text-white shadow-lg">
              <Icon name="truck" className="w-5 h-5" />
            </div>
          </div>
          <div className="absolute left-[89%] top-[26%] -translate-x-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md ring-2 ring-danger-400 text-danger-500">
            <Icon name="pin" className="w-4 h-4" />
          </div>
          <div className="absolute bottom-2 left-2 glass rounded-lg px-2.5 py-1 text-xs font-semibold text-surface-700 flex items-center gap-1.5">
            <span className="status-dot status-dot-online" />
            {t.liveTrackingActive}
          </div>
        </div>

        {/* Lifecycle timeline */}
        <ol className="mt-5 grid grid-cols-5 gap-1">
          {steps.map((s, i) => (
            <li key={i} className="flex flex-col items-center text-center">
              <div
                className={`h-2 w-full rounded-full ${
                  s.done ? 'bg-brand-600' : s.active ? 'bg-gradient-to-r from-brand-600 to-brand-300' : 'bg-surface-200'
                }`}
              />
              <span className={`mt-2 text-[11px] leading-tight font-semibold ${s.done || s.active ? 'text-surface-800' : 'text-surface-400'}`}>
                {s.label}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default function Landing() {
  const { user, token, logout } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = getTranslations(currentLanguage);
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const signedIn = Boolean(user && token);

  const onTrack = (e) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    navigate(`/track-parcel?code=${encodeURIComponent(trimmed)}`);
  };

  const navLinks = [
    { href: '#features', label: t.lpNavFeatures },
    { href: '#how-it-works', label: t.lpNavHowItWorks },
    { href: '#roles', label: t.lpNavRoles },
    { href: '#technology', label: t.lpNavTechnology },
  ];

  const features = [
    { icon: 'pin', title: t.lpFeatLiveTitle, body: t.lpFeatLiveBody, tone: 'bg-brand-50 text-brand-600' },
    { icon: 'qr', title: t.lpFeatQrTitle, body: t.lpFeatQrBody, tone: 'bg-success-50 text-success-600' },
    { icon: 'search', title: t.lpFeatPublicTitle, body: t.lpFeatPublicBody, tone: 'bg-info-50 text-info-600' },
    { icon: 'shield', title: t.lpFeatRbacTitle, body: t.lpFeatRbacBody, tone: 'bg-warning-50 text-warning-600' },
    { icon: 'chart', title: t.lpFeatAnalyticsTitle, body: t.lpFeatAnalyticsBody, tone: 'bg-danger-50 text-danger-600' },
    { icon: 'mail', title: t.lpFeatNotifyTitle, body: t.lpFeatNotifyBody, tone: 'bg-brand-50 text-brand-600' },
  ];

  const steps = [
    { title: t.lpStep1Title, body: t.lpStep1Body },
    { title: t.lpStep2Title, body: t.lpStep2Body },
    { title: t.lpStep3Title, body: t.lpStep3Body },
    { title: t.lpStep4Title, body: t.lpStep4Body },
  ];

  const roles = [
    { icon: 'user', title: t.customer, desc: t.lpRoleCustomerDesc, points: [t.lpRoleCustomer1, t.lpRoleCustomer2, t.lpRoleCustomer3] },
    { icon: 'truck', title: t.deliveryAgent, desc: t.lpRoleAgentDesc, points: [t.lpRoleAgent1, t.lpRoleAgent2, t.lpRoleAgent3], highlight: true },
    { icon: 'cog', title: t.lpRoleAdmin, desc: t.lpRoleAdminDesc, points: [t.lpRoleAdmin1, t.lpRoleAdmin2, t.lpRoleAdmin3] },
  ];

  const stack = [
    { name: 'React', role: t.lpStackFrontend },
    { name: 'Node.js + Express', role: t.lpStackApi },
    { name: 'MongoDB', role: t.lpStackDb },
    { name: 'Socket.IO', role: t.lpStackRealtime },
    { name: 'Leaflet + OSM', role: t.lpStackMaps },
    { name: 'JWT', role: t.lpStackAuth },
  ];

  const highlights = [
    { value: '6', label: t.lpStatStages },
    { value: '3', label: t.lpStatRoles },
    { value: t.lpStatRealtimeValue, label: t.lpStatRealtime },
    { value: '2', label: t.lpStatLanguages },
  ];

  return (
    <div className="min-h-screen bg-white text-surface-800">
      {/* Navigation */}
      <header className="navbar">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-glow">
              <Icon name="box" className="w-5 h-5" />
            </div>
            <span className="font-bold text-surface-900 leading-tight">
              SCPMS<span className="hidden sm:inline font-medium text-surface-500"> · {t.scpmsTitle}</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="btn-ghost btn-sm">{l.label}</a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <LanguageSwitcher />
            {signedIn ? (
              <>
                <Link to={roleHomePath(user.role)} className="btn-primary">{t.lpGoToDashboard}</Link>
                <button onClick={logout} className="btn-secondary">{t.logout}</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">{t.login}</Link>
                <Link to="/register" className="btn-primary">{t.lpGetStarted}</Link>
              </>
            )}
          </div>

          <button
            className="md:hidden btn-ghost p-2"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-surface-200 bg-white animate-fade-in">
            <div className="container py-4 flex flex-col gap-1">
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="btn-ghost justify-start">{l.label}</a>
              ))}
              <div className="pt-3 mt-2 border-t border-surface-100 flex flex-wrap items-center gap-2">
                <LanguageSwitcher />
                {signedIn ? (
                  <Link to={roleHomePath(user.role)} className="btn-primary flex-1">{t.lpGoToDashboard}</Link>
                ) : (
                  <Link to="/register" className="btn-primary flex-1">{t.lpGetStarted}</Link>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50/70 via-white to-white" aria-hidden="true" />
          <div className="absolute -top-32 -right-32 -z-10 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl" aria-hidden="true" />
          <div className="absolute top-40 -left-32 -z-10 h-80 w-80 rounded-full bg-success-200/30 blur-3xl" aria-hidden="true" />

          <div className="container grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:py-28">
            <div className="motion-safe:animate-slide-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm">
                <Icon name="bolt" className="w-3.5 h-3.5" />
                {t.lpBadge}
              </span>
              <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-surface-900 sm:text-5xl lg:text-[3.4rem] lg:leading-[1.08]">
                {t.lpHeroTitleA} <span className="gradient-text">{t.lpHeroTitleB}</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-surface-600">{t.lpHeroSubtitle}</p>

              <form onSubmit={onTrack} className="mt-8 max-w-xl">
                <label htmlFor="lp-track" className="label">{t.trackYourParcel}</label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-surface-400">
                      <Icon name="search" />
                    </span>
                    <input
                      id="lp-track"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder={t.lpTrackPlaceholder}
                      className="input h-12 pl-11 font-mono uppercase placeholder:font-sans placeholder:normal-case"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>
                  <button type="submit" className="btn-primary btn-lg h-12" disabled={!code.trim()}>
                    {t.trackNow}
                    <Icon name="arrow" className="w-4 h-4" />
                  </button>
                </div>
                <p className="mt-2 text-sm text-surface-500">{t.lpTrackHint}</p>
              </form>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-surface-600">
                {[t.lpHeroPoint1, t.lpHeroPoint2, t.lpHeroPoint3].map((p) => (
                  <span key={p} className="inline-flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success-100 text-success-600">
                      <Icon name="check" className="w-3.5 h-3.5" />
                    </span>
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <div className="mx-auto w-full max-w-md lg:max-w-none motion-safe:animate-fade-in">
              <HeroTrackingPreview t={t} />
            </div>
          </div>
        </section>

        {/* Highlights */}
        <section className="border-y border-surface-200 bg-surface-50">
          <div className="container grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
            {highlights.map((h) => (
              <div key={h.label} className="text-center">
                <p className="text-3xl font-extrabold text-surface-900">{h.value}</p>
                <p className="mt-1 text-sm font-medium text-surface-500">{h.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-20 py-20 sm:py-24">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-wider text-brand-600">{t.lpNavFeatures}</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">{t.lpFeaturesTitle}</h2>
              <p className="mt-4 text-lg text-surface-600">{t.lpFeaturesSubtitle}</p>
            </div>
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div key={f.title} className="card p-6 hover:-translate-y-0.5">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${f.tone}`}>
                    <Icon name={f.icon} className="w-6 h-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-surface-900">{f.title}</h3>
                  <p className="mt-2 leading-relaxed text-surface-600">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20 bg-surface-900 py-20 text-white sm:py-24">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-wider text-brand-300">{t.lpNavHowItWorks}</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{t.lpHowTitle}</h2>
              <p className="mt-4 text-lg text-surface-300">{t.lpHowSubtitle}</p>
            </div>
            <ol className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => (
                <li key={s.title} className="relative rounded-2xl border border-white/10 bg-white/5 p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-lg font-extrabold shadow-glow">
                    {i + 1}
                  </span>
                  <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-surface-300">{s.body}</p>
                </li>
              ))}
            </ol>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-2 text-sm">
              {[t.pending, t.assigned, t.pickedUp, t.inTransit, t.delivered].map((s, i, arr) => (
                <span key={s} className="inline-flex items-center gap-2">
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 font-semibold">{s}</span>
                  {i < arr.length - 1 && <Icon name="arrow" className="w-4 h-4 text-surface-500" />}
                </span>
              ))}
              <span className="ml-1 text-surface-400">/ {t.failed}</span>
            </div>
          </div>
        </section>

        {/* Roles */}
        <section id="roles" className="scroll-mt-20 py-20 sm:py-24">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-wider text-brand-600">{t.lpNavRoles}</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">{t.lpRolesTitle}</h2>
              <p className="mt-4 text-lg text-surface-600">{t.lpRolesSubtitle}</p>
            </div>
            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {roles.map((r) => (
                <div
                  key={r.title}
                  className={`rounded-2xl p-7 ${
                    r.highlight
                      ? 'bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-elevated'
                      : 'card'
                  }`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${r.highlight ? 'bg-white/15' : 'bg-brand-50 text-brand-600'}`}>
                    <Icon name={r.icon} className="w-6 h-6" />
                  </div>
                  <h3 className={`mt-5 text-xl font-bold ${r.highlight ? '' : 'text-surface-900'}`}>{r.title}</h3>
                  <p className={`mt-2 ${r.highlight ? 'text-brand-100' : 'text-surface-600'}`}>{r.desc}</p>
                  <ul className="mt-5 space-y-3">
                    {r.points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5">
                        <span className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${r.highlight ? 'bg-white/20' : 'bg-success-100 text-success-600'}`}>
                          <Icon name="check" className="w-3.5 h-3.5" />
                        </span>
                        <span className={r.highlight ? 'text-white/90' : 'text-surface-700'}>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Technology */}
        <section id="technology" className="scroll-mt-20 border-t border-surface-200 bg-surface-50 py-20 sm:py-24">
          <div className="container grid gap-12 lg:grid-cols-5 lg:items-center">
            <div className="lg:col-span-2">
              <p className="text-sm font-bold uppercase tracking-wider text-brand-600">{t.lpNavTechnology}</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">{t.lpTechTitle}</h2>
              <p className="mt-4 text-lg leading-relaxed text-surface-600">{t.lpTechSubtitle}</p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-3 text-sm text-surface-600 shadow-sm">
                <Icon name="globe" className="w-5 h-5 text-brand-600" />
                {t.lpBilingual}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:col-span-3">
              {stack.map((s) => (
                <div key={s.name} className="card p-5">
                  <p className="font-bold text-surface-900">{s.name}</p>
                  <p className="mt-1 text-sm text-surface-500">{s.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 sm:py-24">
          <div className="container">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 px-6 py-14 text-center text-white shadow-elevated sm:px-12">
              <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
              <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-success-400/20 blur-2xl" aria-hidden="true" />
              <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">{t.lpCtaTitle}</h2>
              <p className="relative mx-auto mt-4 max-w-xl text-lg text-brand-100">{t.lpCtaSubtitle}</p>
              <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                {signedIn ? (
                  <Link to={roleHomePath(user.role)} className="btn btn-lg bg-white text-brand-700 hover:bg-brand-50 shadow-lg">
                    {t.lpGoToDashboard}
                  </Link>
                ) : (
                  <Link to="/register" className="btn btn-lg bg-white text-brand-700 hover:bg-brand-50 shadow-lg">
                    {t.lpCreateAccount}
                  </Link>
                )}
                <Link to="/track-parcel" className="btn btn-lg border border-white/30 text-white hover:bg-white/10">
                  {t.trackYourParcel}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-200 bg-white">
        <div className="container flex flex-col items-center justify-between gap-4 py-8 text-sm text-surface-500 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Icon name="box" className="w-4 h-4" />
            </div>
            <span className="font-semibold text-surface-700">SCPMS</span>
            <span className="hidden sm:inline">· {t.lpFooterThesis}</span>
          </div>
          <p>{t.copyrightFooter}</p>
        </div>
      </footer>
    </div>
  );
}
