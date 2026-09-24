/**
 * Role & permission model (foundation).
 *
 * Roles are NEVER stored on a profile/user row and never trusted from the
 * client. When Lovable Cloud is enabled (PROMPT 03+), roles live in a
 * dedicated `user_roles` table and are checked server-side.
 */

export const CUSTOMER_ROLE = "customer" as const;

export const STAFF_ROLES = [
  "support_agent",
  "kyc_agent",
  "compliance_officer",
  "finance_operator",
  "supervisor",
  "administrator",
  "super_admin",
  "auditor",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];
export type AppRole = typeof CUSTOMER_ROLE | StaffRole;

export type Permission =
  | "admin.access"
  | "customers.read"
  | "customers.write"
  | "accounts.read"
  | "accounts.manage"
  | "finance.adjustment.create"
  | "finance.adjustment.approve"
  | "kyc.review"
  | "compliance.review"
  | "transfers.approve"
  | "support.read"
  | "support.reply"
  | "ledger.post"
  | "audit.read"
  | "staff.manage"
  | "settings.manage";

/**
 * UI-side capability map. This is presentation guidance only — the backend
 * remains authoritative for every privileged operation.
 */
export const ROLE_PERMISSIONS: Record<StaffRole, readonly Permission[]> = {
  support_agent: ["admin.access", "customers.read", "support.read", "support.reply"],
  kyc_agent: ["admin.access", "customers.read", "kyc.review"],
  compliance_officer: ["admin.access", "customers.read", "compliance.review", "audit.read"],
  finance_operator: ["admin.access", "accounts.read", "finance.adjustment.create", "ledger.post"],
  supervisor: ["admin.access", "customers.read", "accounts.read", "finance.adjustment.approve", "transfers.approve", "compliance.review", "support.read", "support.reply"],
  administrator: ["admin.access", "customers.read", "customers.write", "accounts.read", "accounts.manage", "support.read", "support.reply", "staff.manage", "settings.manage"],
  super_admin: [
    "admin.access",
    "customers.read",
    "customers.write",
    "accounts.read",
    "accounts.manage",
    "finance.adjustment.create",
    "finance.adjustment.approve",
    "kyc.review",
    "compliance.review",
    "transfers.approve",
    "support.read",
    "support.reply",
    "ledger.post",
    "audit.read",
    "staff.manage",
    "settings.manage",
  ],
  auditor: ["admin.access", "audit.read", "customers.read", "accounts.read"],
};

export function isStaffRole(role: string | null | undefined): role is StaffRole {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role);
}

export function hasPermission(roles: readonly AppRole[], permission: Permission): boolean {
  return roles.some(
    (role) => isStaffRole(role) && ROLE_PERMISSIONS[role].includes(permission),
  );
}
