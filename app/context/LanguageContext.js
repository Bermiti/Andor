'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Static imports of JSON translations for simple bundle loading
import pt from '../../messages/pt.json';
import ptBR from '../../messages/pt-BR.json';
import en from '../../messages/en.json';
import es from '../../messages/es.json';
import fr from '../../messages/fr.json';

const translationsMap = {
  pt: pt,
  'pt-BR': ptBR,
  en: en,
  es: es,
  fr: fr,
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState('pt');
  const [theme, setThemeState] = useState('dark');
  const [mounted, setMounted] = useState(false);

  // Initialize language and theme from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('andor_lang');
    if (savedLang && translationsMap[savedLang]) {
      setLocaleState(savedLang);
    } else {
      // Auto-detect system language
      const navLang = navigator.language;
      if (navLang.startsWith('pt')) {
        if (navLang === 'pt-BR') {
          setLocaleState('pt-BR');
        } else {
          setLocaleState('pt');
        }
      } else if (navLang.startsWith('es')) {
        setLocaleState('es');
      } else if (navLang.startsWith('fr')) {
        setLocaleState('fr');
      } else {
        setLocaleState('en');
      }
    }

    const savedTheme = localStorage.getItem('andor_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setThemeState(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      // Auto-detect browser color scheme preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const themeVal = prefersDark ? 'dark' : 'light';
      setThemeState(themeVal);
      document.documentElement.setAttribute('data-theme', themeVal);
    }
  }, []);

  const setLocale = (newLocale) => {
    if (translationsMap[newLocale]) {
      setLocaleState(newLocale);
      localStorage.setItem('andor_lang', newLocale);
    }
  };

  const setTheme = (newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setThemeState(newTheme);
      localStorage.setItem('andor_theme', newTheme);
      
      // Smooth transitions between modes
      document.documentElement.style.transition = 'background-color 400ms ease, color 400ms ease';
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const activeTranslations = translationsMap[locale] || pt;

  // Custom translation function that resolves dot notation (e.g., 'nav.features')
  const translate = (key) => {
    const keys = key.split('.');
    let current = activeTranslations;
    for (const k of keys) {
      if (current && current[k] !== undefined) {
        current = current[k];
      } else {
        // Fallback to English if not found, then default to pt, then to the key itself
        let fallback = translationsMap['en'];
        let resolved = true;
        for (const fk of keys) {
          if (fallback && fallback[fk] !== undefined) {
            fallback = fallback[fk];
          } else {
            resolved = false;
            break;
          }
        }
        if (resolved) return fallback;

        let ptFallback = pt;
        let ptResolved = true;
        for (const pk of keys) {
          if (ptFallback && ptFallback[pk] !== undefined) {
            ptFallback = ptFallback[pk];
          } else {
            ptResolved = false;
            break;
          }
        }
        if (ptResolved) return ptFallback;

        return key;
      }
    }
    return current;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, theme, setTheme, toggleTheme, t: translate, translations: activeTranslations, mounted }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Mimic next-intl hook structure: useTranslations('namespace') returning a function t('key')
export function useTranslations(namespace) {
  const context = useContext(LanguageContext);
  
  // Default to a dummy translate function during SSR before hydration to avoid mismatches
  if (!context) {
    return (key) => namespace ? `${namespace}.${key}` : key;
  }
  
  const { t } = context;
  return (key) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return t(fullKey);
  };
}
