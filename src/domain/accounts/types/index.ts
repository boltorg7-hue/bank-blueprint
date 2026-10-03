/** Canonical customer-safe account contracts. */
export type AccountStatus="PENDING"|"ACTIVE"|"RESTRICTED"|"SUSPENDED"|"FROZEN"|"CLOSING"|"CLOSED";
export type AccountType="CURRENT"|"SAVINGS";
export type AccountBalanceProjection={currency:string;minorUnit:number;ledgerBalanceMinor:number;availableBalanceMinor:number;heldBalanceMinor:number;version:number;calculatedAt:string};
export type CustomerAccountSummaryDto={reference:string;displayName:string;accountType:AccountType;currency:string;minorUnit:number;status:AccountStatus;isPrimary:boolean;maskedNumber:string;openedAt:string|null;balance:AccountBalanceProjection|null};
export type AccountCoordinates={accountNumber:string;bankCode:string|null;branchCode:string|null;bic:string|null;iban:string|null};
export type CustomerAccountDetailsDto=CustomerAccountSummaryDto&{holderName:string;coordinates:AccountCoordinates;closedAt:string|null};
export type ActivitySummaryItemDto={reference:string;type:string;direction:"credit"|"debit";displayName:string;amountMinor:number;currency:string;minorUnit:number;occurredAt:string;status:"POSTED"|"PENDING"|"FAILED"};
export type MonthlySummaryDto={periodStart:string;periodEnd:string;currency:string;minorUnit:number;moneyInMinor:number;moneyOutMinor:number;netMinor:number;ledgerAvailable:boolean};
export type DashboardSummaryDto={accounts:CustomerAccountSummaryDto[];primaryAccountReference:string|null;recentActivity:ActivitySummaryItemDto[];monthlySummary:MonthlySummaryDto|null;provisioningPending:boolean};
