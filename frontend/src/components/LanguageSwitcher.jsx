import { useLanguage } from '../context/LanguageContext';
import { getTranslations } from '../translations';

export default function LanguageSwitcher() {
  const { currentLanguage, changeLanguage } = useLanguage();
  const t = getTranslations(currentLanguage);

  return (
    <div className="relative">
      <select
        value={currentLanguage}
        onChange={(e) => changeLanguage(e.target.value)}
        className="select text-sm py-1.5 pr-8 min-w-[100px]"
      >
        <option value="en">🇺🇸 {t.english}</option>
        <option value="bn">🇧🇩 {t.bangla}</option>
      </select>
    </div>
  );
}

