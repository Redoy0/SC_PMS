import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getTranslations } from '../translations';
import { passwordChecks } from '../utils/password.js';

function strengthScore(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password) && /[^a-z0-9]/i.test(password)) score++;
  return Math.max(1, score);
}

const BAR_COLORS = ['bg-surface-200', 'bg-danger-500', 'bg-warning-500', 'bg-info-500', 'bg-success-500'];

export default function PasswordField({ id, label, value, onChange, autoComplete = 'new-password', showStrength = false, placeholder }) {
  const { currentLanguage } = useLanguage();
  const t = getTranslations(currentLanguage);
  const [visible, setVisible] = useState(false);
  const checks = passwordChecks(value);
  const score = strengthScore(value);
  const strengthLabels = ['', t.pwWeak, t.pwFair, t.pwGood, t.pwStrong];

  return (
    <div className="form-group">
      <label htmlFor={id} className="label">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className="input pr-11"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          maxLength={64}
          required
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-surface-400 hover:text-surface-600"
          aria-label={visible ? t.hidePassword : t.showPassword}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            {visible ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            )}
          </svg>
        </button>
      </div>

      {showStrength && value && (
        <div className="pt-2 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex flex-1 gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= score ? BAR_COLORS[score] : 'bg-surface-200'}`} />
              ))}
            </div>
            <span className="text-xs font-semibold text-surface-500 w-14 text-right">{strengthLabels[score]}</span>
          </div>
          <ul className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-3">
            {[
              ['length', t.pwRuleLength],
              ['letter', t.pwRuleLetter],
              ['number', t.pwRuleNumber],
            ].map(([key, text]) => (
              <li key={key} className={`flex items-center gap-1.5 ${checks[key] ? 'text-success-600' : 'text-surface-400'}`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={checks[key] ? 'M5 13l4 4L19 7' : 'M12 12h.01'} />
                </svg>
                {text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
