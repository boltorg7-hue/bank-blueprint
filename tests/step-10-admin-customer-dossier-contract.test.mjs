import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const dossierType = readFileSync(
  "src/features/admin/types/admin-customer-dossier.ts",
  "utf8",
);
const dossierService = readFileSync(
  "src/features/admin/services/admin.server.ts",
  "utf8",
);
const dossierUi = readFileSync(
  "src/features/admin/components/AdminCustomerOperationalDossier.tsx",
  "utf8",
);

test("admin customer dossier exposes all operational domains consumed by the dossier UI", () => {
  for (const domain of [
    "customer",
    "kyc",
    "documents",
    "accounts",
    "transactions",
    "transfers",
    "funding",
    "messages",
    "notifications",
    "security",
    "audit",
  ]) {
    assert.match(dossierType, new RegExp(`\\b${domain}\\s*:`), `missing dossier domain: ${domain}`);
  }

  for (const field of [
    "id",
    "reference",
    "fullName",
    "email",
    "phone",
    "lifecycleState",
    "createdAt",
    "onboardingStep",
    "emailVerified",
  ]) {
    assert.match(dossierType, new RegExp(`\\b${field}\\s*:`), `missing customer field: ${field}`);
  }

  for (const field of [
    "ledgerBalanceMinor",
    "availableBalanceMinor",
    "heldBalanceMinor",
    "statusHistory",
  ]) {
    assert.match(dossierType, new RegExp(`\\b${field}\\s*:`), `missing account/balance field: ${field}`);
  }

  for (const field of [
    "reference",
    "accountReference",
    "transactionType",
    "direction",
    "amountMinor",
    "currency",
    "minorUnit",
    "description",
    "counterparty",
    "status",
    "occurredAt",
  ]) {
    assert.match(dossierType, new RegExp(`\\b${field}\\s*:`), `missing transaction field: ${field}`);
  }

  for (const field of [
    "reference",
    "amountMinor",
    "currency",
    "status",
    "recipient",
    "progressPercent",
    "createdAt",
  ]) {
    assert.match(dossierType, new RegExp(`\\b${field}\\s*:`), `missing transfer field: ${field}`);
  }

  for (const field of [
    "id",
    "accountReference",
    "amountMinor",
    "currency",
    "minorUnit",
    "reason",
    "status",
    "createdAt",
  ]) {
    assert.match(dossierType, new RegExp(`\\b${field}\\s*:`), `missing funding field: ${field}`);
  }

  for (const field of [
    "reference",
    "subject",
    "category",
    "status",
    "lastMessageAt",
  ]) {
    assert.match(dossierType, new RegExp(`\\b${field}\\s*:`), `missing message field: ${field}`);
  }

  for (const field of ["unreadCount", "items", "title", "severity", "readAt", "createdAt"]) {
    assert.match(dossierType, new RegExp(`\\b${field}\\s*:`), `missing notification field: ${field}`);
  }

  for (const field of [
    "sessions",
    "events",
    "restricted",
    "deviceLabel",
    "firstSeenAt",
    "lastSeenAt",
    "revokedAt",
    "type",
    "title",
  ]) {
    assert.match(dossierType, new RegExp(`\\b${field}\\s*:`), `missing security field: ${field}`);
  }

  for (const field of [
    "id",
    "action",
    "actorName",
    "actorReference",
    "resourceType",
    "resourceReference",
    "permissionChecked",
    "result",
    "context",
    "createdAt",
  ]) {
    assert.match(dossierType, new RegExp(`\\b${field}\\s*:`), `missing audit field: ${field}`);
  }

  for (const uiField of [
    "dossier.customer",
    "dossier.kyc",
    "dossier.documents",
    "dossier.accounts",
    "dossier.transactions",
    "dossier.transfers",
    "dossier.funding",
    "dossier.messages",
    "dossier.notifications",
    "dossier.security",
    "dossier.audit",
  ]) {
    assert.match(dossierUi, new RegExp(uiField.replace(/\\./g, "\\\\.")), `UI no longer consumes ${uiField}`);
  }
});

test("admin customer dossier service remains the authoritative server-side aggregator", () => {
  assert.match(dossierService, /export async function loadAdminCustomerDossier/);
  assert.match(dossierService, /requireAdminPermission\(client, "customers\.read"\)/);
  assert.match(dossierService, /admin\.from\("profiles"\)/);
  assert.match(dossierService, /admin\.auth\.admin\.getUserById\(customerId\)/);

  for (const source of [
    "identity_verifications",
    "verification_documents",
    "bank_accounts",
    "account_balances",
    "funding_requests",
    "customer_account_activity",
    "account_status_history",
    "notifications",
    "support_threads",
    "transfers",
  ]) {
    assert.match(dossierService, new RegExp(`admin\\.from\\("\${source}"\\)`), `dossier lost source: ${source}`);
  }
});

test("security and audit data remain permission-gated", () => {
  assert.match(
    dossierService,
    /staff\.permissions\.includes\("security\.read"\) \|\| staff\.permissions\.includes\("admin\.access"\)/,
  );
  assert.match(
    dossierService,
    /staff\.permissions\.includes\("audit\.read"\) \|\| staff\.permissions\.includes\("admin\.access"\)/,
  );

  const securityGate = dossierService.indexOf("const securityAllowed");
  const auditGate = dossierService.indexOf("let audit: any[] = []");
  assert.ok(securityGate >= 0 && auditGate > securityGate);
  assert.match(dossierService.slice(securityGate, auditGate), /securityAllowed/);
  assert.match(dossierService.slice(auditGate), /if \(auditAllowed\)/);
});

test("audit DTO preserves real actor identity, references, authorization metadata and JSON context", () => {
  assert.doesNotMatch(
    dossierService,
    /actorName:\s*"Agent bancaire"/,
    "audit actor identity must not be replaced by a generic label",
  );
  assert.doesNotMatch(
    dossierService,
    /actorReference:\s*null/,
    "audit actor reference must not be erased",
  );
  assert.doesNotMatch(
    dossierService,
    /context:\s*\{\}/,
    "audit JSON context must not be erased",
  );

  for (const field of [
    "actor_user_id",
    "action",
    "resource_type",
    "resource_reference",
    "permission_checked",
    "result",
    "context",
    "created_at",
  ]) {
    assert.match(dossierService, new RegExp(field), `audit source field missing: ${field}`);
  }

  assert.match(
    dossierType,
    /context:\s*Record<string, AdminCustomerDossierJsonValue>/,
    "audit context must use the recursive JSON value contract",
  );
  assert.match(
    dossierType,
    /export type AdminCustomerDossierJsonValue\s*=\s*[\s\S]*AdminCustomerDossierJsonValue\[\][\s\S]*\{ \[key: string\]: AdminCustomerDossierJsonValue \}/,
    "audit context contract must support nested JSON arrays and objects",
  );
  assert.match(
    dossierService,
    /context:\s*row\.context[^\n]*typeof row\.context === "object"/,
    "audit context must preserve object-shaped JSONB",
  );
});

test("dossier exposes a server-derived attention summary instead of recomputing business truth from truncated lists", () => {
  assert.match(
    dossierType,
    /attention:\s*AdminCustomerDossierAttention/,
    "dossier needs an explicit server-derived attention contract",
  );
  assert.match(
    dossierType,
    /export type AdminCustomerDossierAttention\s*=\s*\{[\s\S]*count:\s*number;[\s\S]*reasons:\s*AdminCustomerAttentionReason\[\];[\s\S]*oldestAt:\s*string \| null;/,
    "attention contract must expose count, reasons and oldestAt",
  );
  assert.doesNotMatch(
    dossierType,
    /attentionCount:\s*number/,
    "legacy flattened attentionCount contract must not replace attention.count",
  );
  assert.doesNotMatch(
    dossierType,
    /attentionReasons:\s*string\[\]/,
    "legacy flattened attentionReasons contract must not replace attention.reasons",
  );
  assert.doesNotMatch(
    dossierType,
    /oldestAttentionAt:\s*string \| null/,
    "legacy flattened oldestAttentionAt contract must not replace attention.oldestAt",
  );

  assert.doesNotMatch(
    dossierUi,
    /const attention = \[/,
    "UI must not rebuild attention semantics from limited dossier arrays",
  );
});

test("dossier attention contract keeps the same six business categories as admin_customer_page", () => {
  for (const token of [
    "LIFECYCLE",
    "KYC",
    "DOCUMENTS",
    "NOTIFICATIONS",
    "TRANSFERS",
    "FUNDING",
  ]) {
    assert.match(dossierType, new RegExp(token), `attention category missing: ${token}`);
  }

  const pageMigration = readFileSync(
    "supabase/migrations/20261004100000_admin_customer_page_contract.sql",
    "utf8",
  );
  for (const token of [
    "LIFECYCLE",
    "KYC",
    "DOCUMENTS",
    "NOTIFICATIONS",
    "TRANSFERS",
    "FUNDING",
  ]) {
    assert.match(pageMigration, new RegExp(token), `list RPC lost attention category: ${token}`);
  }
});

test("dossier limits are explicit and presentation-only; the contract must not claim truncated arrays are complete history", () => {
  for (const limit of [12, 20, 10]) {
    assert.match(dossierService, new RegExp(`\\.limit\\(${limit}\\)`));
  }

  assert.match(dossierUi, /slice\(0,4\)/);
  assert.match(dossierUi, /slice\(0,5\)/);
  assert.match(dossierUi, /slice\(0,10\)/);

  assert.match(
    dossierType,
    /recent|summary|attention/i,
    "dossier type should make the operational/summary nature explicit rather than implying complete history",
  );
});
