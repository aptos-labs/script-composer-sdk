'use client';

import ScriptComposer from "./components/ScriptComposer";
import Link from 'next/link';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useI18n } from '../i18n/client';

export default function Home() {
  const { t, mounted } = useI18n();

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-12">
        <div className="absolute top-4 right-4 z-10">
          <LanguageSwitcher />
        </div>
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('common.title')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            {t('common.subtitle')}
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/multi-agent"
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {t('multiAgent.title')} →
            </Link>
          </div>
        </div>
        
        <ScriptComposer />
      </div>
    </div>
  );
}
