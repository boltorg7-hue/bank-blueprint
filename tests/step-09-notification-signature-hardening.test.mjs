import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("notification emitter calls use the current seven-argument signature", () => {
  const sql = read("supabase/migrations/20261002140000_step09_notification_signature_hardening.sql");
  assert.doesNotMatch(sql, /emit_customer_notification\([^;]*NULL\s*,\s*jsonb_build_object/si);
  assert.doesNotMatch(sql, /emit_customer_notification\([^;]*NULL\s*,\s*'\{\}'/si);
  assert.match(sql, /emit_customer_notification\(NEW\.sender_user_id,'external\.document:/);
  assert.match(sql, /emit_customer_notification\(_thread\.customer_user_id,'support\.reply:/);
  assert.match(sql, /emit_customer_notification\(auth\.uid\(\),'security\.password:/);
});
