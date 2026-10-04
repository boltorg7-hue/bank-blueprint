import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("production config exposes only publishable Supabase values to the browser", () => {
  const env = read(".env.example");
  assert.match(env, /VITE_SUPABASE_PROJECT_ID/);
  assert.match(env, /VITE_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(env, /VITE_SUPABASE_URL/);
  assert.doesNotMatch(env, /SERVICE_ROLE|SUPABASE_SERVICE_ROLE_KEY|SECRET_KEY/i);
});

test("the root env file only holds public browser-safe keys", () => {
  let env = "";
  try { env = read(".env"); } catch { return; }
  assert.doesNotMatch(env, /SERVICE_ROLE|SECRET|API_KEY|PASSWORD/i);
});

test("migration files keep SECURITY DEFINER routines scoped to public", () => {
  const migrations = readdirSync(new URL("supabase/migrations/", root))
    .filter((name) => name.endsWith(".sql"))
    .map((name) => read(`supabase/migrations/${name}`));

  const routines = migrations.join("\n").match(/CREATE OR REPLACE FUNCTION[\\s\\S]*?SECURITY DEFINER[\\s\\S]*?;/gi) ?? [];
  for (const routine of routines) {
    assert.match(routine, /SET search_path(?:\\s+TO|\\s*=)\\s*'?public'?/i);
  }
});
