/**
 * Route guard interfaces (foundation only).
 *
 * PROMPT 00 prepares the shape of the guards; real enforcement arrives with
 * authentication in PROMPT 03, where these helpers read trusted server state.
 *
 * Rules that must never be broken:
 * - authorization decisions are never based on localStorage or hidden UI;
 * - customer authentication alone never grants /admin access;
 * - the backend (RLS + server functions) stays authoritative.
 */
import type { AppRole, Permission } from "@/types/roles";
import { hasPermission, isStaffRole } from "@/types/roles";
import type { CustomerLifecycleState } from "@/types/customer-lifecycle";

export type SessionContext = {
  isAuthenticated: boolean;
  roles: readonly AppRole[];
  lifecycle: CustomerLifecycleState;
};

/** Anonymous session used until authentication is implemented (PROMPT 03). */
export const ANONYMOUS_SESSION: SessionContext = {
  isAuthenticated: false,
  roles: [],
  lifecycle: "VISITOR",
};

export function requireCustomer(session: SessionContext): boolean {
  return session.isAuthenticated;
}

export function requireStaff(session: SessionContext, permission?: Permission): boolean {
  if (!session.isAuthenticated) return false;
  const staff = session.roles.some(isStaffRole);
  if (!staff) return false;
  return permission ? hasPermission(session.roles, permission) : true;
}
