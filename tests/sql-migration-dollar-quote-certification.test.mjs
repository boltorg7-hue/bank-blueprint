import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("SQL migrations do not contain malformed single-dollar function delimiters", () => {
  const directory = "supabase/migrations";
  const files = fs.readdirSync(directory).filter((file) => file.endsWith(".sql"));
  const malformed = [];
  const uniqueTableNames = [
    "customer_preferences",
    "support_threads",
    "support_messages",
    "customer_security_sessions",
    "customer_security_events",
    "security_step_up_grants",
  ];
  const tableCreateCounts = new Map(uniqueTableNames.map((name) => [name, 0]));

  for (const file of files) {
    const source = fs.readFileSync(path.join(directory, file), "utf8");
    for (const tableName of uniqueTableNames) {
      const expression = new RegExp(
        "CREATE TABLE\\s+(?:IF NOT EXISTS\\s+)?public\\." + tableName + "\\s*\\(",
        "gi",
      );
      tableCreateCounts.set(
        tableName,
        (tableCreateCounts.get(tableName) ?? 0) + [...source.matchAll(expression)].length,
      );
    }
    const lines = source.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (line.trim() === "AS $" || line.trim() === "$;") {
        malformed.push(file + ":" + (index + 1));
      }
    });
    if (/SELECT\s+tr\s*,\s*rail\.is_simulation\s+INTO\s+_t\s*,\s*_simulated/i.test(source)) {
      malformed.push(file + ": composite row in multi-target INTO");
    }
  }

  assert.deepEqual(malformed, []);
  const customerStateFix = fs.readFileSync(
    path.join(directory, "20261002110000_fix_customer_notification_signature.sql"),
    "utf8",
  );
  assert.equal(
    (customerStateFix.match(/CREATE OR REPLACE FUNCTION public\.admin_set_customer_state/g) ?? [])
      .length,
    1,
  );
  const notificationCall = customerStateFix.match(
    /PERFORM public\.emit_customer_notification\(([\s\S]*?)\);/,
  );
  assert.ok(notificationCall);
  assert.equal(notificationCall[1].split(",").length, 7);
  for (const [tableName, count] of tableCreateCounts) {
    assert.equal(count, 1, tableName + " must have one authoritative table creation");
  }
});
