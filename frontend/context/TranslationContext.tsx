'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface TranslationContextType {
  t: (namespace: string, key: string, paramsOrDefault?: Record<string, any> | string) => string;
  locale: string;
  setLocale: (locale: string) => void;
  isLoading: boolean;
  dir: 'ltr' | 'rtl';
}

const TranslationContext = createContext<TranslationContextType | null>(null);

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState('en');
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [enTranslations, setEnTranslations] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [dir, setDir] = useState<'ltr' | 'rtl'>('ltr');

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
  const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

  useEffect(() => {
    const initTranslations = async () => {
      // 1. Always load English as baseline first
      await fetchBaseline('en');

      // 2. Load saved locale or default
      const savedLocale =
        typeof window !== 'undefined' ? localStorage.getItem('locale') || 'en' : 'en';
      if (savedLocale !== 'en') {
        await loadTargetTranslations(savedLocale);
      } else {
        setIsLoading(false);
      }
    };
    initTranslations();
  }, []);

  const fetchBaseline = async (langCode: string) => {
    try {
      // Simple fetch for baseline, no version check for now to ensure speed
      const res = await fetch(`${apiUrl}/translations/${langCode}`);
      const data = await res.json();
      if (data.success) {
        setEnTranslations(data.data);
        if (langCode === 'en' && locale === 'en') {
          setTranslations(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to load baseline translations', error);
    }
  };

  const loadTargetTranslations = async (langCode: string) => {
    setIsLoading(true);
    try {
      // 1. Check server version
      const versionRes = await fetch(`${apiUrl}/translations/versions`);
      const versionData = await versionRes.json();
      const serverVersion = versionData.success ? versionData.data[langCode] : Date.now();

      // 2. Check local version
      const localVersion =
        typeof window !== 'undefined'
          ? localStorage.getItem(`translations_version_${langCode}`)
          : null;
      const localData =
        typeof window !== 'undefined' ? localStorage.getItem(`translations_${langCode}`) : null;

      // 3. Use local if valid and cached
      if (localData && localVersion && Number(localVersion) >= serverVersion) {
        console.log(`Using cached translations for ${langCode}`);
        setTranslations(JSON.parse(localData));
        setLocaleState(langCode);
      } else {
        // 4. Fetch new if outdated or missing
        console.log(`Fetching new translations for ${langCode}`);
        const res = await fetch(`${apiUrl}/translations/${langCode}`);
        const data = await res.json();

        if (data.success) {
          setTranslations(data.data);
          setLocaleState(langCode);
          if (typeof window !== 'undefined') {
            localStorage.setItem('locale', langCode);
            document.cookie = `next-locale=${langCode}; path=/; max-age=31536000; SameSite=Lax`;
            localStorage.setItem(`translations_${langCode}`, JSON.stringify(data.data));
            localStorage.setItem(`translations_version_${langCode}`, String(serverVersion));
          }
        }
      }

      updateDocumentAttributes(langCode);
    } catch (error) {
      console.error(`Failed to load translations for ${langCode}, falling back to English`, error);
      // Fallback to English if target fails
      setTranslations(enTranslations);
      setLocaleState('en');
    } finally {
      setIsLoading(false);
    }
  };

  const updateDocumentAttributes = (langCode: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', langCode);
      document.cookie = `next-locale=${langCode}; path=/; max-age=31536000; SameSite=Lax`;
      setDir(langCode === 'ar' || langCode === 'he' ? 'rtl' : 'ltr');
      document.documentElement.dir = langCode === 'ar' || langCode === 'he' ? 'rtl' : 'ltr';
      document.documentElement.lang = langCode;
    }
  };

  const setLocale = (newLocale: string) => {
    if (newLocale !== locale) {
      if (newLocale === 'en') {
        setTranslations(enTranslations);
        setLocaleState('en');
        updateDocumentAttributes('en');
      } else {
        loadTargetTranslations(newLocale);
      }
    }
  };

  const t = (namespace: string, key: string, paramsOrDefault?: Record<string, any> | string) => {
    // 1. Try Target Language
    let value = translations[namespace]?.[key];

    // 2. Fallback to English Baseline
    if (!value) {
      value = enTranslations[namespace]?.[key];
    }

    const defaultValue =
      typeof paramsOrDefault === 'string' ? paramsOrDefault : paramsOrDefault?.defaultValue;

    const params = typeof paramsOrDefault === 'object' ? paramsOrDefault : undefined;

    // 3. Fallback to code-provided default value
    if (!value) {
      return defaultValue || key;
    }

    // Replace params
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (k !== 'defaultValue') {
          value = value.replace(`{{${k}}}`, v);
        }
      });
    }

    return value;
  };

  return (
    <TranslationContext.Provider value={{ t, locale, setLocale, isLoading, dir }}>
      {children}
    </TranslationContext.Provider>
  );
}

export const useTranslations = () => {
  const ctx = useContext(TranslationContext);
  if (!ctx) throw new Error('Must be used within TranslationProvider');
  return ctx;
};
