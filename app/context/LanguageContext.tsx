'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { translations, type Lang, type Translations } from '../lib/i18n';

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'it',
  setLang: () => {},
  t: translations.it,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('it');

  useEffect(() => {
    const saved = localStorage.getItem('tit_lang') as Lang | null;
    if (saved === 'en' || saved === 'it') setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('tit_lang', l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
