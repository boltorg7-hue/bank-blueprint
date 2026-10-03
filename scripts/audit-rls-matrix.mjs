#!/usr/bin/env node
/**
 * Static RLS / privilege matrix for the final migration state.
 *
 * This is intentionally migration-aware: CREATE POLICY / GRANT / REVOKE
 * statements are replayed in filename order so the report reflects the
 * effective migration history rather than a union of historical statements.
 *
 * Usage:
 *   node scripts/audit-rls-matrix.mjs
 *   node scripts/audit-rls-matrix.mjs --json
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MIGRATIONS_ROOT = path.join(ROOT, "supabase", "migrations");

const SENSITIVE_TABLES = [
  "profiles",
  "bank_accounts",
  "account_balances",
  "ledger_accounts",
  "ledger_transactions",
  "ledger_entries",
  "transfers",
  "transfer_requirements",
  "transfer_compliance_cases",
  "funding_requests",
  "identity_verifications",
  "verification_documents",
  "customer_documents",
  "notifications",
  "admin_audit_events",
  "account_status_history",
  "support_threads",
  "support_messages",
  "customer_security_sessions",
  "customer_security_events",
  "security_step_up_grants",
];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function normalizeIdentifier(value) {
  return value.replace(/["']/g, "").trim();
}

function tableKey(value) {
  const normalized = normalizeIdentifier(value);
  return normalized.includes(".") ? normalized.split(".").pop() : normalized;
}

function ensure(map, name) {
  const key = tableKey(name);
  if (!map.has(key)) {
    map.set(key, {
      table: key,
      created: false,
      rls: false,
      policies: new Map(),
      grants: new Set(),
      revokes: new Set(),
    });
  }
  return map.get(key);
}

function splitColumns(statement) {
  return statement
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

const files = walk(MIGRATIONS_ROOT)
  .filter((file) => file.endsWith(".sql"))
  .sort((a, b) => a.localeCompare(b));

const tables = new Map();

for (const file of files) {
  const sql = fs.readFileSync(file, "utf8");
  const migration = path.relative(ROOT, file);

  for (const match of sql.matchAll(
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?("?[^\s(]+"?)/gi,
  )) {
    ensure(tables, match[1]).created = true;
  }

  for (const match of sql.matchAll(
    /ALTER\s+TABLE\s+(?:ONLY\s+)?(?:public\.)?("?[^\s]+?"?)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi,
  )) {
    ensure(tables, match[1]).rls = true;
  }

  for (const match of sql.matchAll(
    /ALTER\s+TABLE\s+(?:ONLY\s+)?(?:public\.)?("?[^\s]+?"?)\s+DISABLE\s+ROW\s+LEVEL\s+SECURITY/gi,
  )) {
    ensure(tables, match[1]).rls = false;
  }

  for (const match of sql.matchAll(
    /CREATE\s+POLICY\s+"?([^"\n]+?)"?\s+ON\s+(?:public\.)?([a-zA-Z0-9_]+)/gi,
  )) {
    const policy = match[1].trim();
    const table = ensure(tables, match[2]);
    table.policies.set(policy, migration);
  }

  for (const match of sql.matchAll(
    /DROP\s+POLICY\s+(?:IF\s+EXISTS\s+)?\s*"?([^"\n]+?)"?\s+ON\s+(?:public\.)?([a-zA-Z0-9_]+)/gi,
  )) {
    const policy = match[1].trim();
    ensure(tables, match[2]).policies.delete(policy);
  }

  for (const match of sql.matchAll(
    /GRANT\s+([^;]+?)\s+ON\s+(?:TABLE\s+)?((?:public\.)?[^\s;]+(?:\s*,\s*(?:public\.)?[^\s;]+)*)\s+TO\s+([^;]+);/gi,
  )) {
    const privileges = match[1].trim();
    const targets = match[2].split(",").map(tableKey);
    const grantees = match[3].split(",").map((item) => item.trim());
    for (const target of targets) {
      const table = ensure(tables, target);
      for (const grantee of grantees) {
        table.grants.add(`${grantee}: ${privileges}`);
      }
    }
  }

  for (const match of sql.matchAll(
    /REVOKE\s+([^;]+?)\s+ON\s+(?:TABLE\s+)?((?:public\.)?[^\s;]+(?:\s*,\s*(?:public\.)?[^\s;]+)*)\s+FROM\s+([^;]+);/gi,
  )) {
    const privileges = match[1].trim();
    const targets = match[2].split(",").map(tableKey);
    const grantees = match[3].split(",").map((item) => item.trim());
    for (const target of targets) {
      const table = ensure(tables, target);
      for (const grantee of grantees) {
        table.revokes.add(`${grantee}: ${privileges}`);
      }
    }
  }

  // Keep migration origin on the record for diagnostics when a table is
  // referenced before its CREATE TABLE statement.
  void migration;
}

const rows = [...tables.values()]
  .filter((row) => row.created || row.rls || row.policies.size > 0)
  .sort((a, b) => a.table.localeCompare(b.table));

const matrix = rows.map((row) => ({
  table: row.table,
  sensitive: SENSITIVE_TABLES.includes(row.table),
  rlsEnabled: row.rls,
  policyCount: row.policies.size,
  policies: [...row.policies.keys()].sort(),
  grants: [...row.grants].sort(),
  revokes: [...row.revokes].sort(),
  serviceRoleGranted: [...row.grants].some((grant) =>
    /(?:^|:)\\s*service_role\\b/i.test(grant),
  ),
}));

const failures = matrix
  .filter((row) => row.sensitive)
  .flatMap((row) => {
    const issues = [];
    if (!row.rlsEnabled) issues.push("RLS_OFF");
    if (row.policyCount === 0) issues.push("NO_POLICY");
    return issues.map((issue) => ({ table: row.table, issue }));
  });

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ files: files.length, matrix, failures }, null, 2));
} else {
  console.log("RLS / privilege matrix");
  console.log("=======================");
  console.log(`Migrations scanned: ${files.length}`);
  console.log("");
  console.log("table | sensitive | RLS | policies | service_role");
  console.log("----- | --------- | --- | -------- | ------------");
  for (const row of matrix) {
    console.log(
      `${row.table} | ${row.sensitive ? "YES" : "no"} | ${row.rlsEnabled ? "ON" : "OFF"} | ${row.policyCount} | ${row.serviceRoleGranted ? "YES" : "no"}`,
    );
  }

  if (failures.length) {
    console.error("\nCertification failures:");
    for (const failure of failures) {
      console.error(`- ${failure.table}: ${failure.issue}`);
    }
    process.exitCode = 1;
  } else {
    console.log("\nSensitive-table static certification: PASS");
  }
}
