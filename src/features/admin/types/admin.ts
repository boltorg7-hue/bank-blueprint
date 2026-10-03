import type { CustomerLifecycleState } from "@/types/customer-lifecycle";

export type StaffContextDto = {
  authorized: boolean;
  staffReference: string | null;
  displayName: string | null;
  department: string | null;
  roles: string[];
  permissions: string[];
};

export type AdminActionErrorCode =
  | "INVITATION_ALREADY_REGISTERED"
  | "INVITATION_RATE_LIMITED"
  | "INVITATION_UNAVAILABLE"
  | "APPROVAL_ALREADY_PENDING"
  | "MAKER_CANNOT_APPROVE"
  | "DECISION_ALREADY_RECORDED"
  | "APPLICATION_STATE_CHANGED";

export type AdminActionResult<T = Record<string, never>, C extends AdminActionErrorCode = AdminActionErrorCode> =
  | ({ ok: true } & T)
  | {
      ok: false;
      code: C;
    };

export type AdminDashboardDto = {
  customers: number;
  activeCustomers: number;
  accounts: number;
  activeAccounts: number;
  pendingFunding: number;
  pendingFundingMinor: number;
};

export type AdminCustomerDto = {
  id: string;
  reference: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  lifecycleState: CustomerLifecycleState;
  accountCount: number;
  createdAt: string;
  attentionCount: number;
  attentionReasons: string[];
  oldestAttentionAt: string | null;
};

export type AdminOnboardingDocumentDto = {
  type: string;
  status: string;
  receivedAt: string;
};

export type AdminOnboardingApprovalDto = {
  id: string;
  recommendation: "APPROVE" | "REJECT";
  status: "PENDING_SECOND_REVIEW" | "APPROVED" | "REJECTED" | "CANCELLED";
  reviewerName: string;
  reviewerNote: string;
  reviewedAt: string;
  checkerName: string | null;
  checkerNote: string | null;
  decidedAt: string | null;
};

export type AdminOnboardingCaseDto = {
  customerId: string;
  reference: string;
  fullName: string;
  email: string | null;
  lifecycleState: CustomerLifecycleState;
  onboardingStep: string;
  verificationStatus: string;
  submittedAt: string | null;
  decidedAt: string | null;
  createdAt: string;
  emailVerified: boolean;
  accountReference: string | null;
  accountStatus: string | null;
  approval: AdminOnboardingApprovalDto | null;
  documents: AdminOnboardingDocumentDto[];
};

export type AdminAccountDto = {
  id: string;
  reference: string;
  holderName: string;
  holderId: string;
  holderLifecycleState: CustomerLifecycleState;
  holderCreatedAt: string;
  holderReference: string;
  displayName: string;
  currency: string;
  minorUnit: number;
  status: string;
  maskedNumber: string;
  ledgerBalanceMinor: number;
  availableBalanceMinor: number;
  heldBalanceMinor: number;
};

export type FundingRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type FundingRequestDto = {
  id: string;
  accountReference: string;
  holderName: string;
  amountMinor: number;
  currency: string;
  reason: string;
  status: FundingRequestStatus;
  makerName: string;
  checkerName: string | null;
  createdAt: string;
  decisionAt: string | null;
  canDecide: boolean;
};

export type AdminExternalTransferDto = { reference:string; customerName:string; recipient:string; amountMinor:number; currency:string; status:string; progressPercent:number; documentsOpen:number; createdAt:string };

export type AdminAuditEventDto = {
  id: string;
  actorName: string;
  actorReference: string | null;
  action: string;
  resourceType: string | null;
  resourceReference: string | null;
  permissionChecked: string | null;
  result: "ALLOWED" | "DENIED";
  context: Record<string, unknown>;
  createdAt: string;
};
