import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const stepMigrations = readdirSync(new URL("supabase/migrations/", root))
  .filter((name) => /^20260924.*\.sql$/.test(name))
  .map((name) => ({ name, sql: read(`supabase/migrations/${name}`) }));

test("les migrations des étapes 1 à 6 sont présentes dans l’ordre", () => {
  assert.deepEqual(stepMigrations.map(({ name }) => name), [
    "20260924080000_admin_stage1_hardening.sql",
    "20260924090000_customer_profile_preferences.sql",
    "20260924100000_notifications_sms_outbox.sql",
    "20260924110000_simulated_external_admin_workflow.sql",
    "20260924120000_customer_support_messaging.sql",
    "20260924130000_customer_security_center.sql",
  ]);
});

test("chaque fonction SECURITY DEFINER ajoutée fixe son search_path", () => {
  for (const { name, sql } of stepMigrations) {
    const declarations = sql.match(/CREATE OR REPLACE FUNCTION[\s\S]*?AS \$\$/g) ?? [];
    for (const declaration of declarations) {
      if (declaration.includes("SECURITY DEFINER")) {
        assert.match(declaration, /SET search_path\s*(?:=|TO)?\s*'?public'?/i, name);
      }
    }
  }
});

test("les nouvelles tables client activent RLS", () => {
  const sql = stepMigrations.map(({ sql }) => sql).join("\n");
  for (const table of ["customer_preferences", "notifications", "notification_outbox", "support_threads", "support_messages", "customer_security_sessions", "customer_security_events", "security_step_up_grants"]) {
    assert.match(sql, new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`, "i"), table);
  }
});

test("les tables sensibles ne donnent aucune écriture directe au navigateur", () => {
  const sql = stepMigrations.map(({ sql }) => sql).join("\n");
  for (const table of ["notification_outbox", "support_threads", "support_messages", "customer_security_sessions", "customer_security_events", "security_step_up_grants"]) {
    assert.doesNotMatch(sql, new RegExp(`GRANT (?:ALL|INSERT|DELETE).*${table}.*authenticated`, "i"), table);
  }
});

test("les jalons externes restent 90, 95, 99 et 100", () => {
  const migration = read("supabase/migrations/20260827161315_e10a7d78-812a-4cc4-b1ab-5c0cc9f06f70.sql");
  assert.match(migration, /FINAL_REVIEW[^\n]*THEN 90/);
  assert.match(migration, /APPROVED[^\n]*THEN 95/);
  assert.match(migration, /SETTLEMENT_PENDING[^\n]*THEN 99/);
  assert.match(migration, /COMPLETED[^\n]*THEN 100/);
});

test("un virement exige et consomme un step-up avant le service privilégié", () => {
  const fn = read("src/features/transfers/services/transfers.functions.ts");
  const consume = fn.indexOf("consume_security_step_up");
  const execute = fn.indexOf("service.confirmTransfer", consume);
  assert.ok(consume >= 0 && execute > consume);
  assert.match(fn, /RECENT_AUTHENTICATION_REQUIRED/);
});

test("aucun composant ou route n’importe le client Supabase service-role", () => {
  for (const directory of ["src/components", "src/routes"]) {
    const walk = (path) => {
      for (const entry of readdirSync(new URL(`${path}/`, root), { withFileTypes: true })) {
        const child = join(path, entry.name);
        if (entry.isDirectory()) walk(child);
        else if (/\.(?:ts|tsx)$/.test(entry.name)) assert.doesNotMatch(read(child), /client\.server/, child);
      }
    };
    walk(directory);
  }
});

test("la messagerie est uniquement client vers service client", () => {
  const migration = read("supabase/migrations/20260924120000_customer_support_messaging.sql");
  assert.match(migration, /customer_user_id=auth\.uid\(\)/);
  assert.match(migration, /has_permission\(auth\.uid\(\),'support\.reply'\)/);
  assert.doesNotMatch(migration, /recipient_user_id/);
});
