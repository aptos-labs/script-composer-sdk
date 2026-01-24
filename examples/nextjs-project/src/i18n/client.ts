'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import enTranslations from './locales/en.json';
import zhTranslations from './locales/zh.json';

type Locale = 'en' | 'zh';
type TranslationKey = string;

const translations: Record<Locale, any> = {
  en: enTranslations,
  zh: zhTranslations,
};

interface I18nContextType {
  locale: Locale;
  changeLanguage: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, any>) => string;
  mounted: boolean;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Detect browser language
    const browserLang = navigator.language.toLowerCase();
    let detectedLocale: Locale = 'en';
    
    if (browserLang.startsWith('zh')) {
      detectedLocale = 'zh';
    }

    // Check localStorage
    const savedLocale = localStorage.getItem('i18nextLng') as Locale | null;
    const initialLocale = savedLocale && (savedLocale === 'en' || savedLocale === 'zh') 
      ? savedLocale 
      : detectedLocale;

    setLocale(initialLocale);
    setMounted(true);
  }, []);

  const changeLanguage = (newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem('i18nextLng', newLocale);
  };

  const t = (key: TranslationKey, params?: Record<string, any>): string => {
    const keys = key.split('.');
    let value: any = translations[locale];
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }
    
    let result = typeof value === 'string' ? value : key;
    
    // Replace placeholders like {{index}}
    if (params) {
      Object.keys(params).forEach(paramKey => {
        result = result.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g'), String(params[paramKey]));
      });
    }
    
    return result;
  };

  return (
    <I18nContext.Provider value={{ locale, changeLanguage, t, mounted }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
