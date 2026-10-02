import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("auth callback fails closed when confirmation validation cannot be completed", () => {
  const source = read("src/routes/auth.callback.tsx");
  assert.match(source, /checkConfirmationLink/);
  assert.match(source, /catch \{/);
  assert.match(source, /supabase\.auth\.signOut\(\)/);
  assert.match(source, /setFailed\(true\)/);
  assert.doesNotMatch(source, /checkConfirmationLink\([^\n]+\)\.catch\(\(\) => \(\{ valid: true \}\)\)/);
});

test("server-only Supabase boundaries stay out of browser-facing components and routes", () => {
  for (const directory of ["src/components", "src/routes"]) {
    const walk = (path) => {
      for (const entry of readdirSync(new URL(`${path}/`, root), { withFileTypes: true })) {
        const child = join(path, entry.name);
        if (entry.isDirectory()) walk(child);
        else if (/\.(?:ts|tsx)$/.test(entry.name)) {
          assert.doesNotMatch(read(child), /supabaseAdmin|service[_-]?role|client\.server/iu, child);
        }
      }
    };
    walk(directory);
  }
});

test("no browser environment variable exposes a server secret", () => {
  const example = read(".env.example");
  assert.doesNotMatch(example, /VITE_[A-Z0-9_]*(?:SERVICE|SECRET|PRIVATE|API_KEY|TOKEN)/i);
  assert.match(example, /VITE_SUPABASE_PUBLISHABLE_KEY=""/);
  assert.doesNotMatch(example, /AFRICASTALKING_API_KEY="(?!")/);
});

test("all SECURITY DEFINER SQL functions declare a fixed public search_path", () => {
  const migrationDir = new URL("supabase/migrations/", root);
  for (const name of readdirSync(migrationDir).filter((entry) => entry.endsWith(".sql"))) {
    const sql = read(`supabase/migrations/${name}`);
    const functions = sql.match(/(?:CREATE|CREATE OR REPLACE) FUNCTION[\s\S]*?(?=\n(?:CREATE|CREATE OR REPLACE) FUNCTION|$)/gi) ?? [];
    for (const fn of functions) {
      if (/SECURITY DEFINER/i.test(fn)) {
        assert.match(fn, /SET\s+search_path\s*(?:=|TO)?\s*'?public'?/i, name);
      }
    }
  }
});
