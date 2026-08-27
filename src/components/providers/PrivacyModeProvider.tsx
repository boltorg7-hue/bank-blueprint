import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Privacy mode (PROMPT 01 §29): hides monetary values so a customer can use
 * the app in public. Purely a display concern — no data is withheld or altered.
 */
const STORAGE_KEY = "vaultis.privacy-mode";

type PrivacyModeContextValue = {
  privacyMode: boolean;
  togglePrivacyMode: () => void;
  setPrivacyMode: (value: boolean) => void;
};

const PrivacyModeContext = createContext<PrivacyModeContextValue>({
  privacyMode: false,
  togglePrivacyMode: () => {},
  setPrivacyMode: () => {},
});

export function PrivacyModeProvider({ children }: { children: ReactNode }) {
  // Starts false on server and first client render to avoid hydration drift.
  const [privacyMode, setPrivacyModeState] = useState(false);

  useEffect(() => {
    try {
      setPrivacyModeState(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* storage unavailable — keep the default */
    }
  }, []);

  const setPrivacyMode = useCallback((value: boolean) => {
    setPrivacyModeState(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({
      privacyMode,
      setPrivacyMode,
      togglePrivacyMode: () => setPrivacyMode(!privacyMode),
    }),
    [privacyMode, setPrivacyMode],
  );

  return <PrivacyModeContext.Provider value={value}>{children}</PrivacyModeContext.Provider>;
}

export function usePrivacyMode(): PrivacyModeContextValue {
  return useContext(PrivacyModeContext);
}

export function PrivacyModeToggle({ className }: { className?: string }) {
  const { privacyMode, togglePrivacyMode } = usePrivacyMode();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      onClick={togglePrivacyMode}
      aria-pressed={privacyMode}
      aria-label={privacyMode ? "Afficher les montants" : "Masquer les montants"}
    >
      {privacyMode ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
    </Button>
  );
}
