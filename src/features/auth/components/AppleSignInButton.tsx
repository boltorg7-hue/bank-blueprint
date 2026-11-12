import { useState } from "react";

import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable/index";
import { genericErrorMessage } from "@/features/auth/lib/auth-errors";
import { useLanguage } from "@/components/providers/LanguageProvider";

/**
 * Apple sign-in entry point. Provider activity is coordinated with Google so
 * only one OAuth redirect can be started from the registration page at a time.
 */
export function AppleSignInButton({
  onError,
  onStart,
  disabled = false,
}: {
  onError: (message: string) => void;
  onStart?: () => boolean | void;
  disabled?: boolean;
}) {
  const { language } = useLanguage();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending || disabled) return;
    if (onStart?.() === false) return;
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
      className="w-full touch-target bg-background"
      loading={pending}
      disabled={disabled}
      onClick={handleClick}
    >
      {language === "en" ? "Continue with Apple" : "Continuer avec Apple"}
    </Button>
  );
}
