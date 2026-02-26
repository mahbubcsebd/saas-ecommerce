"use client";

import Cookies from "js-cookie";
import React, { createContext, useContext, useEffect, useState } from "react";

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  isRtl: boolean;
  isDefault: boolean;
}

interface LanguageContextType {
  language: Language | null;
  languages: Language[];
  setLanguage: (code: string) => void;
  isLoading: boolean;
  t: (obj: any, field?: string) => string;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [language, setLanguageState] = useState<Language | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

  useEffect(() => {
    const initLanguage = async () => {
      try {
        // Fetch active languages
        const res = await fetch(`${API_URL}/languages/active`);
        if (res.ok) {
          const data = await res.json();
          const activeLanguages: Language[] = data.data || [];
          setLanguages(activeLanguages);

          // Determine initial language
          const savedCode = Cookies.get("NEXT_LOCALE");
          const defaultLang = activeLanguages.find((l) => l.isDefault) || activeLanguages[0];

          let initialLang = defaultLang;

          if (savedCode) {
            const saved = activeLanguages.find((l) => l.code === savedCode);
            if (saved) {
              initialLang = saved;
            }
          }

          setLanguageState(initialLang);

          // Set HTML dir and lang attributes
          if (initialLang) {
            document.documentElement.lang = initialLang.code;
            document.documentElement.dir = initialLang.isRtl ? "rtl" : "ltr";
          }
        }
      } catch (error) {
        console.error("Failed to load languages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initLanguage();
  }, []);

  const setLanguage = (code: string) => {
    const newLang = languages.find((l) => l.code === code);
    if (newLang) {
      setLanguageState(newLang);
      Cookies.set("NEXT_LOCALE", code, { expires: 365 });
      document.documentElement.lang = newLang.code;
      document.documentElement.dir = newLang.isRtl ? "rtl" : "ltr";
    }
  };

  // Helper to get translated content
  // Usage: t(product, 'name') or t(category.translations, 'name') if structured differently
  // Based on my backend, products have `translations` array.
  // We need a smart `t` function.
  const t = (data: any, field: string = 'name') => {
    if (!data || !language) return "";

    // 1. If data is the translation array itself
    if (Array.isArray(data)) {
        const trans = data.find((t: any) => t.langCode === language.code);
        if (trans && trans[field]) return trans[field];
        // Fallback to default/first
        const def = data.find((t: any) => t.langCode === languages.find(l=>l.isDefault)?.code);
        return def?.[field] || data[0]?.[field] || "";
    }

    // 2. If data is an object with `translations` property (e.g. Product)
    if (data.translations && Array.isArray(data.translations)) {
        const trans = data.translations.find((t: any) => t.langCode === language.code);
        if (trans && trans[field]) return trans[field];
    }

    // 3. Fallback to direct property on object (default lang usually)
    if (data[field]) return data[field];

    return "";
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        languages,
        setLanguage,
        isLoading,
        t,
        dir: language?.isRtl ? "rtl" : "ltr",
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
