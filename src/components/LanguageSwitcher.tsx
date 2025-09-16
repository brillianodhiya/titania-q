"use client";

import { useI18n } from "@/hooks/useI18n";
import { Button } from "./ui/button";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { language, changeLanguage, isHydrated } = useI18n();

  const handleLanguageChange = () => {
    const newLanguage = language === "en" ? "id" : "en";
    changeLanguage(newLanguage);
    // Refresh halaman untuk memastikan semua komponen ter-update
    window.location.reload();
  };

  // Don't render until hydrated to prevent hydration mismatch
  if (!isHydrated) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-2 h-8 px-3"
        disabled
      >
        <Globe className="h-4 w-4" />
        <span className="text-sm font-medium">EN</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLanguageChange}
      className="flex items-center gap-2 h-8 px-3"
      title={language === "en" ? "Switch to Indonesian" : "Switch to English"}
    >
      <Globe className="h-4 w-4" />
      <span className="text-sm font-medium">
        {language === "en" ? "EN" : "ID"}
      </span>
    </Button>
  );
}
