import { useState, useEffect } from "react";
import {
  Language,
  Translations,
  getTranslations,
  getCurrentLanguage,
  setLanguage,
} from "@/lib/i18n";

export function useI18n() {
  const [language, setLanguageState] = useState<Language>("en"); // Default to English for SSR
  const [translations, setTranslations] = useState<Translations>(
    () => getTranslations("en") // Default to English for SSR
  );
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
    const savedLanguage = getCurrentLanguage();
    setLanguageState(savedLanguage);
    setTranslations(getTranslations(savedLanguage));
  }, []);

  useEffect(() => {
    if (isHydrated) {
      setTranslations(getTranslations(language));
    }
  }, [language, isHydrated]);

  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setLanguageState(newLanguage);
  };

  const t = (key: keyof Translations) => {
    return translations[key] || key;
  };

  return {
    language,
    translations,
    changeLanguage,
    t,
    isHydrated,
    // Key untuk memaksa re-render komponen saat bahasa berubah
    languageKey: `${language}-${isHydrated}`,
  };
}
