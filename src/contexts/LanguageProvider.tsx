"use client";

// Adapted from the original AI Studio prototype's LanguageContext.tsx.
// Same public API (useLanguage() -> { language, setLanguage, t, isRtl }),
// so almost every existing component can be copied over unchanged.
//
// What changed vs. the original:
//  - Initial language now comes from the server (a cookie, read in
//    app/layout.tsx) instead of localStorage, so there's no flash of the
//    wrong direction on first load / no SSR-vs-client mismatch.
//  - setLanguage() also writes the cookie (via a tiny server action) so the
//    server knows the preference on the next request too.

import React, { createContext, useContext, useState, useTransition } from "react";
import { translations, type Language, type TranslationDict } from "@/lib/i18n/translations";
import { setLanguageCookie } from "@/lib/i18n/actions";

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationDict;
  isRtl: boolean;
  isPending: boolean;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({
  children,
  initialLanguage,
}: {
  children: React.ReactNode;
  initialLanguage: Language;
}) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);
  const [isPending, startTransition] = useTransition();

  const setLanguage = (lang: Language) => {
    setLanguageState(lang); // instant UI update
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    startTransition(() => {
      setLanguageCookie(lang); // persist for next request/reload
    });
  };

  const t = translations[language];
  const isRtl = language === "ar";

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRtl, isPending }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
};
