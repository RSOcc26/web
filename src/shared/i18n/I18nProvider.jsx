import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LOCALES, translate, INTL_LOCALES } from './messages.js';

const STORAGE_KEY = 'cc.locale';
const I18nContext = createContext(null);

// The chosen language is a per-browser convenience; storage may be unavailable
const storedLocale = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

export const I18nProvider = ({ defaultLocale, children }) => {
  const [locale, setLocaleState] = useState(() => {
    const stored = storedLocale();
    return LOCALES.includes(stored) ? stored : defaultLocale;
  });

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next) => {
    if (!LOCALES.includes(next)) return;
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not remembered; the choice still applies for this page load
    }
  }, []);

  const value = useMemo(() => {
    const formats = {
      date: new Intl.DateTimeFormat(INTL_LOCALES[locale], { dateStyle: 'medium' }),
      dateTime: new Intl.DateTimeFormat(INTL_LOCALES[locale], { dateStyle: 'medium', timeStyle: 'short' }),
    };
    return {
      locale,
      setLocale,
      t: (key, params) => translate(locale, key, params),
      // Formats an ISO date string or Date; style is 'date' or 'dateTime'
      formatDate: (value, style = 'date') => formats[style].format(new Date(value)),
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);
