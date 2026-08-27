import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";

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

/** Sign-out hygiene: cancel in-flight queries, clear cache, then replace history. */
export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/login", replace: true });
  };
}
