import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/profile")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Profil — RFC" },
      { name: "description", content: "Vos informations personnelles et vos coordonnées." },
    ],
  }),
  component: () => <Outlet />,
});
