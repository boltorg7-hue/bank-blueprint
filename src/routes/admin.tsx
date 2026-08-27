import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AdminLayout } from "@/components/layout/AdminLayout";

/**
 * Administration namespace (/admin).
 *
 * Authorization is independent from customer authentication: PROMPT 12 wires a
 * `beforeLoad` guard requiring explicit staff roles verified server-side.
 * Customer account activation must never imply admin access.
 */
export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Back-office — Vaultis" },
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
