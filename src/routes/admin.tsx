import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AdminLayout } from "@/components/layout/AdminLayout";

/**
 * Administration namespace (/admin).
 *
 * Authorization is independent from customer authentication: PROMPT 12 wires a
 * `beforeLoad` guard requiring explicit staff roles verified server-side.
 * Customer account activation must never imply admin access.
 */
export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login", search: { redirect: location.href } });
  },
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Back-office — RFC" },
      { name: "description", content: "Console opérationnelle réservée au personnel autorisé." },
    ],
  }),
  component: AdminLayoutRoute,
});

function AdminLayoutRoute() {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
