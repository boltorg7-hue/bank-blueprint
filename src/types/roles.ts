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
  | "customers.read"
  | "customers.write"
  | "kyc.review"
  | "compliance.review"
  | "transfers.approve"
  | "ledger.post"
  | "audit.read"
  | "staff.manage"
  | "settings.manage";

/**
 * UI-side capability map. This is presentation guidance only — the backend
 * remains authoritative for every privileged operation.
 */
export const ROLE_PERMISSIONS: Record<StaffRole, readonly Permission[]> = {
  support_agent: ["customers.read"],
  kyc_agent: ["customers.read", "kyc.review"],
  compliance_officer: ["customers.read", "compliance.review", "audit.read"],
  finance_operator: ["customers.read", "ledger.post"],
  supervisor: ["customers.read", "transfers.approve", "compliance.review"],
  administrator: ["customers.read", "customers.write", "staff.manage", "settings.manage"],
  super_admin: [
    "customers.read",
    "customers.write",
    "kyc.review",
    "compliance.review",
    "transfers.approve",
    "ledger.post",
    "audit.read",
    "staff.manage",
    "settings.manage",
  ],
  auditor: ["audit.read", "customers.read"],
};

export function isStaffRole(role: string | null | undefined): role is StaffRole {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role);
}

export function hasPermission(roles: readonly AppRole[], permission: Permission): boolean {
  return roles.some(
    (role) => isStaffRole(role) && ROLE_PERMISSIONS[role].includes(permission),
  );
}
