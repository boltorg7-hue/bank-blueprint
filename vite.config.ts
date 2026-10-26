// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Public, browser-safe backend values. Fallback used when .env is absent from the
// build (it is excluded by .gitignore, so GitHub-based publishes would otherwise ship without it).
const PUBLIC_ENV = {
  VITE_SUPABASE_URL: "https://cxaztezhwrzzxlafrbvd.supabase.co",
  VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_qMYRknRu4-UF35PmENhmPA_deMhwx_0",
  VITE_SUPABASE_PROJECT_ID: "cxaztezhwrzzxlafrbvd",
};
for (const [key, value] of Object.entries(PUBLIC_ENV)) {
  if (!process.env[key]) process.env[key] = value;
}

export default defineConfig({
  vite: {
    define: Object.fromEntries(
      Object.keys(PUBLIC_ENV).map((key) => [
        `import.meta.env.${key}`,
        JSON.stringify(process.env[key]),
      ]),
    ),
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
