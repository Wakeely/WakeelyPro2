// MIGRATION NOTE: your old repo's src/lib/i18n.ts (~730 lines of Arabic +
// English strings) can be copied into this file almost as-is — the shape
// (Language, TranslationDict, translations) is unchanged. Just:
//   1. Copy the body of the old file's `translations = { en: {...}, ar: {...} }`
//      object in below.
//   2. Delete this placeholder content.
// Nothing else in the app needs to change — LanguageProvider.tsx imports
// exactly these three names.

export type Language = "en" | "ar";

export interface TranslationDict {
  [key: string]: string;
}

export const translations: Record<Language, TranslationDict> = {
  en: {
    appName: "Wakeely Pro",
    dashboard: "Dashboard",
    matters: "Matters",
    documents: "Documents",
    // ...paste the rest of the old i18n.ts "en" keys here
  },
  ar: {
    appName: "وكيلك المحترف",
    dashboard: "لوحة التحكم",
    matters: "القضايا",
    documents: "المستندات",
    // ...paste the rest of the old i18n.ts "ar" keys here
  },
};
