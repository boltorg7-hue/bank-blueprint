import type { CustomerLifecycleState } from "@/types/customer-lifecycle";

export type StaffContextDto = {
  authorized: boolean;
  staffReference: string | null;
  displayName: string | null;
  department: string | null;
  roles: string[];
  permissions: string[];
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
};

export type AdminAccountDto = {
  id: string;
  reference: string;
  holderName: string;
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
