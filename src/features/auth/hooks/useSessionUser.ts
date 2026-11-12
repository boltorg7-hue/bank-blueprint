import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";

import { useLanguage } from "@/components/providers/LanguageProvider";

import { supabase } from "@/integrations/supabase/client";

export type SessionState = { loading: boolean; user: User | null };

/**
 * Client-side session reader for UI affordances (headers, menus).
 * Route protection is handled by the route guards, never by this hook.
 */
export function useSessionUser(): SessionState {
  const [state, setState] = useState<SessionState>({ loading: true, user: null });

  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (active) setState({ loading: false, user: data.user ?? null });
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setState({ loading: false, user: session?.user ?? null });
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return state;
}

/** Sign-out hygiene: cancel queries, sign out, clear cache, then replace history. */
export function useSignOut() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return async function signOut() {
    try {
      await queryClient.cancelQueries();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch {
      toast.error(
        language === "en"
          ? "Sign-out could not be completed. Please try again."
          : "La déconnexion n’a pas abouti. Réessayez.",
      );
      return false;
    }

    queryClient.clear();
    await navigate({ to: "/login", replace: true });
    return true;
  };
}
