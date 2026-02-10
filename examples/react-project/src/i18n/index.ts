import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import zhTranslations from './locales/zh.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      zh: {
        translation: zhTranslations,
      },
    },
    supportedLngs: ['en', 'zh'],
    fallbackLng: 'en',
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      // Convert language codes like zh-CN, zh-TW to zh
      convertDetectedLanguage: (lng: string) => {
        if (lng.startsWith('zh')) return 'zh';
        if (lng.startsWith('en')) return 'en';
        return 'en'; // fallback
      },
    },
    // Only load language code, ignore region
    load: 'languageOnly',
  });

export default i18n;
