import type { CustomerLifecycleState } from "@/types/customer-lifecycle";

export type AdminCustomerDossierDto = {
  customer: {
    id: string;
    reference: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    lifecycleState: CustomerLifecycleState;
    createdAt: string;
    onboardingStep: string | null;
    emailVerified: boolean;
  };
  kyc: {
    status: string;
    submittedAt: string | null;
    decidedAt: string | null;
  };
  documents: Array<{ type: string; status: string; createdAt: string }>;
  accounts: Array<{
    reference: string;
    displayName: string;
    currency: string;
    minorUnit: number;
    status: string;
    maskedNumber: string;
    ledgerBalanceMinor: number;
    availableBalanceMinor: number;
    heldBalanceMinor: number;
    statusHistory: Array<{
      id: string;
      previousStatus: string;
      newStatus: string;
      reasonCategory: string;
      internalNote: string | null;
      changedByName: string;
      changedByReference: string | null;
      changedAt: string;
    }>;
  }>;
  transactions: Array<{
    reference: string;
    accountReference: string;
    transactionType: string;
    direction: string;
    amountMinor: number;
    currency: string;
    minorUnit: number;
    description: string | null;
    counterparty: string | null;
    status: string;
    occurredAt: string;
  }>;
  transfers: Array<{
    reference: string;
    amountMinor: number;
    currency: string;
    status: string;
    recipient: string;
    progressPercent: number;
    createdAt: string;
  }>;
  funding: Array<{
    id: string;
    accountReference: string;
    amountMinor: number;
    currency: string;
    minorUnit: number;
    reason: string;
    status: string;
    createdAt: string;
  }>;
  messages: Array<{
    reference: string;
    subject: string;
    category: string;
    status: string;
    lastMessageAt: string;
  }>;
  notifications: {
    unreadCount: number;
    items: Array<{ title: string; severity: string; readAt: string | null; createdAt: string }>;
  };
  security: {
    sessions: Array<{ deviceLabel: string; firstSeenAt: string; lastSeenAt: string; revokedAt: string | null }>;
    events: Array<{ type: string; title: string; createdAt: string }>;
    restricted: boolean;
  };
  audit: Array<{
    id: string;
    action: string;
    actorName: string;
    actorReference: string | null;
    resourceType: string | null;
    resourceReference: string | null;
    permissionChecked: string | null;
    result: "ALLOWED" | "DENIED";
    context: Record<string, string | number | boolean | null>;
    createdAt: string;
  }>;
};
