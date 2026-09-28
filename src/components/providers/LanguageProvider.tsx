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
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "fr" || stored === "en") {
        setState(stored);
        document.documentElement.lang = stored;
      }
    } catch {
      // Private browsing may block storage; the switch remains usable in this session.
    }
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