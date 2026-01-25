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
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[80px] justify-between"
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <span>{currentLanguage.display}</span>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 12 12"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2 4l4 4 4-4"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-[120px] z-50 transition-all duration-200">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg ${
                currentLang === lang.code
                  ? 'bg-gray-50 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
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
