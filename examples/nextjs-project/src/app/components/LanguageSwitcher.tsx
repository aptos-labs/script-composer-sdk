'use client';

import { useI18n } from '../../i18n/client';
import { useState, useRef, useEffect } from 'react';

export default function LanguageSwitcher() {
  const { locale, changeLanguage, mounted } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en' as const, name: 'English', display: 'EN' },
    { code: 'zh' as const, name: '中文', display: '中文' },
  ];

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

  const handleLanguageChange = (newLocale: 'en' | 'zh') => {
    changeLanguage(newLocale);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium text-gray-700 min-w-[80px] justify-between"
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
        <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[120px] z-50 transition-all duration-200 animate-[fadeIn_0.2s_ease-in-out]">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg ${
                locale === lang.code
                  ? 'bg-gray-50 text-indigo-600 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
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
