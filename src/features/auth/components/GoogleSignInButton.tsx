import { useState } from "react";

import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable/index";
import { genericErrorMessage } from "@/features/auth/lib/auth-errors";
import { useLanguage } from "@/components/providers/LanguageProvider";

/**
 * Managed Google sign-in. The parent coordinates provider state so Google and
 * Apple cannot start competing OAuth redirects from the same registration page.
 */
export function GoogleSignInButton({
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
    onStart?.();
    setPending(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
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
      {language === "en" ? "Continue with Google" : "Continuer avec Google"}
    </Button>
  );
}
