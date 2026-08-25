"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import en from "@/locales/en.json";
import hi from "@/locales/hi.json";
import bn from "@/locales/bn.json";
import ta from "@/locales/ta.json";
import te from "@/locales/te.json";
import mr from "@/locales/mr.json";
import gu from "@/locales/gu.json";
import kn from "@/locales/kn.json";
import ml from "@/locales/ml.json";
import pa from "@/locales/pa.json";

export interface LanguageOption {
  code: string;
  nativeName: string;
  englishName: string;
  complete: boolean;
}

/** Architecture supports 30 languages; these ship with the demo. */
export const LANGUAGES: LanguageOption[] = [
  { code: "en", nativeName: "English", englishName: "English", complete: true },
  { code: "hi", nativeName: "हिन्दी", englishName: "Hindi", complete: true },
  { code: "bn", nativeName: "বাংলা", englishName: "Bengali", complete: false },
  { code: "ta", nativeName: "தமிழ்", englishName: "Tamil", complete: false },
  { code: "te", nativeName: "తెలుగు", englishName: "Telugu", complete: false },
  { code: "mr", nativeName: "मराठी", englishName: "Marathi", complete: false },
  { code: "gu", nativeName: "ગુજરાતી", englishName: "Gujarati", complete: false },
  { code: "kn", nativeName: "ಕನ್ನಡ", englishName: "Kannada", complete: false },
  { code: "ml", nativeName: "മലയാളം", englishName: "Malayalam", complete: false },
  { code: "pa", nativeName: "ਪੰਜਾਬੀ", englishName: "Punjabi", complete: false },
];

const DICTS: Record<string, Record<string, string>> = { en, hi, bn, ta, te, mr, gu, kn, ml, pa };

interface I18nContextValue {
  language: string;
  setLanguage: (code: string) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue>({ language: "en", setLanguage: () => undefined, t: (k) => k });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState("en");

  useEffect(() => {
    const saved = window.localStorage.getItem("ncrp.lang");
    if (saved && DICTS[saved]) setLanguageState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((code: string) => {
    if (!DICTS[code]) return;
    setLanguageState(code);
    window.localStorage.setItem("ncrp.lang", code);
  }, []);

  const t = useCallback(
    (key: string): string => DICTS[language]?.[key] ?? en[key as keyof typeof en] ?? key,
    [language]
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
