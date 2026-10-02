import { useState } from "react";

import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable/index";
import { genericErrorMessage } from "@/features/auth/lib/auth-errors";
import { useLanguage } from "@/components/providers/LanguageProvider";

/**
 * Apple sign-in entry point.
 * The callback resolves trusted customer lifecycle state before any banking route,
 * so a new OAuth customer is not dropped directly into the banking app.
 */
export function AppleSignInButton({ onError }: { onError: (message: string) => void }) {
  const { language } = useLanguage();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      const result = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: `${window.location.origin}/auth/callback`,
      });
      if (result.error) {
        onError(genericErrorMessage());
        setPending(false);
        return;
      }
      if (result.redirected) return;
      window.location.assign("/auth/callback");
    } catch {
      onError(genericErrorMessage());
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full touch-target"
      loading={pending}
      onClick={handleClick}
    >
      {language === "en" ? "Continue with Apple" : "Continuer avec Apple"}
    </Button>
  );
}
