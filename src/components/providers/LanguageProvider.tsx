import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "fr" | "en";
const STORAGE_KEY = "rfc.language";

const LanguageContext = createContext<{ language: Language; setLanguage: (language: Language) => void }>({
  language: "fr",
  setLanguage: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Keep the first client render identical to SSR; restore the choice after hydration.
  const [language, setState] = useState<Language>("fr");

  useEffect(() => {
    let preferred: Language = "fr";
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "fr" || stored === "en") {
        preferred = stored;
      } else {
        const systemLanguages = navigator.languages?.length ? navigator.languages : [navigator.language];
        preferred = systemLanguages.some((locale) => locale.toLowerCase().startsWith("fr")) &&
          !systemLanguages[0]?.toLowerCase().startsWith("en") ? "fr" : "en";
      }
    } catch {
      preferred = navigator.language?.toLowerCase().startsWith("fr") ? "fr" : "en";
    }
    setState(preferred);
    document.documentElement.lang = preferred;
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setState(next);
    document.documentElement.lang = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage is optional.
    }
  }, []);

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}