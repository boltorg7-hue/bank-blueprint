import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  AdminAccountDto,
  AdminCustomerDto,
  AdminDashboardDto,
  FundingRequestDto,
  StaffContextDto,
  AdminExternalTransferDto,
} from "@/features/admin/types/admin";
import type { CustomerLifecycleState } from "@/types/customer-lifecycle";

type Client = SupabaseClient<any, any, any>;

export class AdminAccessError extends Error {}

function normalizeStaffContext(raw: unknown): StaffContextDto {
  const value = (raw ?? {}) as Record<string, unknown>;
  return {
    authorized: value["authorized"] === true,
    staffReference: typeof value["staffReference"] === "string" ? value["staffReference"] : null,
    displayName: typeof value["displayName"] === "string" ? value["displayName"] : null,
    department: typeof value["department"] === "string" ? value["department"] : null,
    roles: Array.isArray(value["roles"]) ? value["roles"].map(String) : [],
    permissions: Array.isArray(value["permissions"]) ? value["permissions"].map(String) : [],
  };
}

export async function getStaffContext(client: Client): Promise<StaffContextDto> {
  const { data, error } = await client.rpc("get_my_staff_context");
  if (error) throw new AdminAccessError("ADMIN_CONTEXT_UNAVAILABLE");
  return normalizeStaffContext(data);
}

export async function requireAdminPermission(
  client: Client,
  permission?: string,
): Promise<StaffContextDto> {
  const context = await getStaffContext(client);
  if (!context.authorized || (permission && !context.permissions.includes(permission))) {
    throw new AdminAccessError("ADMIN_FORBIDDEN");
  }
  return context;
}

async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function loadAdminCustomers(
  client: Client,
  search = "",
): Promise<AdminCustomerDto[]> {
  await requireAdminPermission(client, "customers.read");
  const admin = await adminClient();
  const query = admin
    .from("profiles")
    .select("id, first_name, middle_name, last_name, phone, lifecycle_state, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const term = search.trim().replace(/[%_,()]/g, "");
  const { data, error } = await query;
  if (error) throw new AdminAccessError("CUSTOMERS_UNAVAILABLE");
  const ids = (data ?? []).map((row: any) => row.id as string);
  const { data: accounts } = ids.length
    ? await admin.from("bank_accounts").select("user_id").in("user_id", ids)
    : { data: [] as any[] };
  const counts = new Map<string, number>();
  for (const account of accounts ?? []) {
    const key = String((account as any).user_id);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const { data: authPage } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const emailById = new Map((authPage?.users ?? []).map((user) => [user.id, user.email ?? null]));
  const mapped: AdminCustomerDto[] = (data ?? []).map((row: any) => ({
      id: row.id,
      reference: `CUS-${String(row.id).replace(/-/g, "").slice(0, 12).toUpperCase()}`,
      fullName: [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(" ") || "Client sans nom",
      email: emailById.get(row.id) ?? null,
      phone: row.phone ?? null,
      lifecycleState: row.lifecycle_state as CustomerLifecycleState,
      accountCount: counts.get(row.id) ?? 0,
      createdAt: row.created_at,
    }));
  if (!term) return mapped;
  const needle = term.toLocaleLowerCase("fr");
  return mapped.filter((customer) =>
    [customer.reference, customer.fullName, customer.email, customer.phone]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase("fr").includes(needle)),
  );
}

export async function loadAdminAccounts(
  client: Client,
  search = "",
): Promise<AdminAccountDto[]> {
  await requireAdminPermission(client, "accounts.read");
  const admin = await adminClient();
  let query = admin
    .from("bank_accounts")
    .select("id, user_id, public_reference, display_name, currency, currency_minor_unit, status, account_number, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const term = search.trim().replace(/[%_,()]/g, "");
  if (term) query = query.or(`public_reference.ilike.%${term}%,account_number.ilike.%${term}%,display_name.ilike.%${term}%`);
  const { data, error } = await query;
  if (error) throw new AdminAccessError("ACCOUNTS_UNAVAILABLE");
  const rows = data ?? [];
  const userIds = [...new Set(rows.map((row: any) => String(row.user_id)))];
  const accountIds = rows.map((row: any) => String(row.id));
  const [{ data: profiles }, { data: balances }] = await Promise.all([
    userIds.length
      ? admin.from("profiles").select("id, first_name, middle_name, last_name").in("id", userIds)
      : Promise.resolve({ data: [] as any[] }),
    accountIds.length
      ? admin.from("account_balances").select("account_id, ledger_balance_minor, available_balance_minor, held_balance_minor").in("account_id", accountIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);
  const profileById = new Map((profiles ?? []).map((row: any) => [row.id, row]));
  const balanceById = new Map((balances ?? []).map((row: any) => [row.account_id, row]));
  return rows.map((row: any) => {
    const profile: any = profileById.get(row.user_id);
    const balance: any = balanceById.get(row.id);
    return {
      id: row.id,
      reference: row.public_reference,
      holderName: profile
        ? [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(" ") || "Client sans nom"
        : "Client indisponible",
      holderReference: profile ? `CUS-${String(profile.id).replace(/-/g, "").slice(0, 12).toUpperCase()}` : "—",
      displayName: row.display_name,
      currency: row.currency,
      minorUnit: Number(row.currency_minor_unit),
      status: row.status,
      maskedNumber: `•••• ${String(row.account_number).slice(-4)}`,
      ledgerBalanceMinor: Number(balance?.ledger_balance_minor ?? 0),
      availableBalanceMinor: Number(balance?.available_balance_minor ?? 0),
      heldBalanceMinor: Number(balance?.held_balance_minor ?? 0),
    };
  });
}

export async function loadFundingRequests(client: Client): Promise<FundingRequestDto[]> {
  const staff = await requireAdminPermission(client);
  const canRead = staff.permissions.includes("finance.adjustment.create") || staff.permissions.includes("finance.adjustment.approve");
  if (!canRead) throw new AdminAccessError("ADMIN_FORBIDDEN");
  const admin = await adminClient();
  const { data, error } = await admin
    .from("funding_requests")
    .select("id, account_id, amount_minor, currency, reason, status, maker_user_id, checker_user_id, created_at, decision_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new AdminAccessError("FUNDING_UNAVAILABLE");
  const rows = data ?? [];
  const accountIds = [...new Set(rows.map((row: any) => String(row.account_id)))];
  const staffIds = [...new Set(rows.flatMap((row: any) => [row.maker_user_id, row.checker_user_id]).filter(Boolean).map(String))];
  const [{ data: accounts }, { data: staffProfiles }] = await Promise.all([
    accountIds.length
      ? admin.from("bank_accounts").select("id, user_id, public_reference").in("id", accountIds)
      : Promise.resolve({ data: [] as any[] }),
    staffIds.length
      ? admin.from("staff_profiles").select("user_id, display_name").in("user_id", staffIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);
  const accountById = new Map((accounts ?? []).map((row: any) => [row.id, row]));
  const names = new Map((staffProfiles ?? []).map((row: any) => [row.user_id, row.display_name]));
  const customerIds = [...new Set((accounts ?? []).map((row: any) => String(row.user_id)))];
  const { data: customers } = customerIds.length
    ? await admin.from("profiles").select("id, first_name, middle_name, last_name").in("id", customerIds)
    : { data: [] as any[] };
  const customerNames = new Map((customers ?? []).map((row: any) => [
    row.id,
    [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(" ") || "Client sans nom",
  ]));
  return rows.map((row: any) => {
    const account: any = accountById.get(row.account_id);
    return {
      id: row.id,
      accountReference: account?.public_reference ?? "—",
      holderName: account ? customerNames.get(account.user_id) ?? "Client indisponible" : "Client indisponible",
      amountMinor: Number(row.amount_minor),
      currency: row.currency,
      reason: row.reason,
      status: row.status,
      makerName: names.get(row.maker_user_id) ?? "Opérateur",
      checkerName: row.checker_user_id ? names.get(row.checker_user_id) ?? "Superviseur" : null,
      createdAt: row.created_at,
      decisionAt: row.decision_at ?? null,
      canDecide: staff.permissions.includes("finance.adjustment.approve"),
    };
  });
}

export async function loadAdminDashboard(client: Client): Promise<AdminDashboardDto> {
  await requireAdminPermission(client, "admin.access");
  const admin = await adminClient();
  const [customers, activeCustomers, accounts, activeAccounts, pending] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("lifecycle_state", "ACTIVE"),
    admin.from("bank_accounts").select("id", { count: "exact", head: true }),
    admin.from("bank_accounts").select("id", { count: "exact", head: true }).eq("status", "ACTIVE"),
    admin.from("funding_requests").select("amount_minor").eq("status", "PENDING"),
  ]);
  const pendingRows = pending.data ?? [];
  return {
    customers: customers.count ?? 0,
    activeCustomers: activeCustomers.count ?? 0,
    accounts: accounts.count ?? 0,
    activeAccounts: activeAccounts.count ?? 0,
    pendingFunding: pendingRows.length,
    pendingFundingMinor: pendingRows.reduce((sum: number, row: any) => sum + Number(row.amount_minor), 0),
  };
}

export async function loadExternalTransfers(client:Client):Promise<AdminExternalTransferDto[]> {
  const staff=await requireAdminPermission(client); if(!staff.permissions.includes("compliance.review")&&!staff.permissions.includes("transfers.approve")) throw new AdminAccessError("ADMIN_FORBIDDEN");
  const admin=await adminClient(); const {data,error}=await admin.from("transfers").select("id,public_reference,sender_user_id,recipient_display_snapshot,amount_minor,currency,status,progress_percent,created_at").eq("transfer_kind","EXTERNAL_TRANSFER").order("created_at",{ascending:false}).limit(100); if(error)throw new AdminAccessError("TRANSFERS_UNAVAILABLE");
  const ids=(data??[]).map((r:any)=>r.sender_user_id); const transferIds=(data??[]).map((r:any)=>r.id);
  const [{data:profiles},{data:reqs}]=await Promise.all([admin.from("profiles").select("id,first_name,last_name").in("id",ids),admin.from("transfer_requirements").select("transfer_id,status").in("transfer_id",transferIds)]);
  const names=new Map((profiles??[]).map((p:any)=>[p.id,[p.first_name,p.last_name].filter(Boolean).join(" ")||"Client"])); const open=new Map<string,number>(); for(const r of reqs??[]){if(["REQUIRED","REPLACEMENT_REQUIRED","UNDER_REVIEW"].includes((r as any).status))open.set((r as any).transfer_id,(open.get((r as any).transfer_id)??0)+1);}
  return (data??[]).map((r:any)=>({reference:r.public_reference,customerName:names.get(r.sender_user_id)??"Client",recipient:r.recipient_display_snapshot,amountMinor:Number(r.amount_minor),currency:r.currency,status:r.status,progressPercent:Number(r.progress_percent),documentsOpen:open.get(r.id)??0,createdAt:r.created_at}));
}
