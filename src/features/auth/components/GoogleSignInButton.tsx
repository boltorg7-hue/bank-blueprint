import { useState } from "react";

import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable/index";
import { genericErrorMessage } from "@/features/auth/lib/auth-errors";

/**
 * Managed Google sign-in. The redirect target is a public same-origin callback
 * that resolves the trusted lifecycle state before routing (§26).
 */
export function GoogleSignInButton({ onError }: { onError: (message: string) => void }) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
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
      className="w-full touch-target"
      loading={pending}
      onClick={handleClick}
    >
      Continuer avec Google
    </Button>
  );
}
