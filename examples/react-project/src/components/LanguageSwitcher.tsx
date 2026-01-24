import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';

// Normalize language code to 'en' or 'zh'
const normalizeLanguage = (lang: string): 'en' | 'zh' => {
  if (lang.startsWith('zh')) return 'zh';
  return 'en';
};

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<'en' | 'zh'>(() => normalizeLanguage(i18n.language));
  const dropdownRef = useRef<HTMLDivElement>(null);

  const changeLanguage = (lng: string) => {
    const normalizedLang = normalizeLanguage(lng);
    i18n.changeLanguage(normalizedLang);
    setCurrentLang(normalizedLang);
    setIsOpen(false);
  };

  // Normalize language on mount and listen to language changes
  useEffect(() => {
    // Normalize initial language if needed
    const normalized = normalizeLanguage(i18n.language);
    if (i18n.language !== normalized) {
      i18n.changeLanguage(normalized);
    } else {
      setCurrentLang(normalized);
    }

    const handleLanguageChanged = (lng: string) => {
      const normalized = normalizeLanguage(lng);
      setCurrentLang(normalized);
    };

    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  const languages = [
    { code: 'en' as const, name: 'English', display: 'EN' },
    { code: 'zh' as const, name: '中文', display: '中文' },
  ];

  const currentLanguage = languages.find(lang => lang.code === currentLang) || languages[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="language-switcher" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="language-switcher-button"
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <span className="language-display">{currentLanguage.display}</span>
        <svg
          className={`language-arrow ${isOpen ? 'open' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 4L6 8L10 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="language-dropdown">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`language-option ${currentLang === lang.code ? 'active' : ''}`}
              aria-label={`Switch to ${lang.name}`}
            >
              {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
