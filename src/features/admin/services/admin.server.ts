import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  AdminAccountDto,
  AdminCustomerDto,
  AdminDashboardDto,
  FundingRequestDto,
  StaffContextDto,
  AdminExternalTransferDto,
  AdminOnboardingCaseDto,
  AdminOnboardingCasePageDto,
  AdminActionResult,
  AdminCustomerPageDto,
  AdminAccountPageDto,
  FundingRequestPageDto,
  FundingAccountOptionDto,
  AdminAuditEventPageDto,
  AdminExternalTransferPageDto,
} from "@/features/admin/types/admin";
import type { CustomerLifecycleState } from "@/types/customer-lifecycle";

type Client = SupabaseClient<any, any, any>;

export class AdminAccessError extends Error {}

type AdminCursor = { createdAt: string; id: string };
const ADMIN_PAGE_SIZE = 50;

function encodeAdminCursor(value: AdminCursor): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decodeAdminCursor(value?: string | null): AdminCursor | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (typeof parsed?.createdAt !== "string" || typeof parsed?.id !== "string") return null;
    return { createdAt: parsed.createdAt, id: parsed.id };
  } catch { return null; }
}


const ADMIN_AUTH_EMAIL_CACHE_TTL_MS = 60_000;
const adminAuthEmailCache = new Map<string, { email: string | null; expiresAt: number }>();

async function loadAdminAuthEmails(admin: Client, ids: string[]) {
  const now = Date.now();
  const result = new Map<string, string | null>();
  const missing: string[] = [];
  for (const id of ids) {
    const cached = adminAuthEmailCache.get(id);
    if (cached && cached.expiresAt > now) result.set(id, cached.email);
    else missing.push(id);
  }
  if (!missing.length) return result;

  const responses: Array<{ id: string; email: string | null }> = [];
  for (let offset = 0; offset < missing.length; offset += 8) {
    const batch = missing.slice(offset, offset + 8);
    const batchResults = await Promise.all(
      batch.map(async (id) => {
        try {
          const { data } = await admin.auth.admin.getUserById(id);
          return { id, email: data.user?.email ?? null };
        } catch {
          return { id, email: null };
        }
      }),
    );
    responses.push(...batchResults);
  }

  const expiresAt = now + ADMIN_AUTH_EMAIL_CACHE_TTL_MS;
  for (const entry of responses) {
    result.set(entry.id, entry.email);
    adminAuthEmailCache.set(entry.id, { email: entry.email, expiresAt });
  }
  return result;
}

type AdminAuthUser = {
  email: string | null;
  verified: boolean;
};

async function loadAdminAuthUsers(admin: Client, ids: string[]) {
  const result = new Map<string, AdminAuthUser>();

  for (let offset = 0; offset < ids.length; offset += 8) {
    const batch = ids.slice(offset, offset + 8);
    const batchResults = await Promise.all(
      batch.map(async (id) => {
        try {
          const { data } = await admin.auth.admin.getUserById(id);
          return {
            id,
            email: data.user?.email ?? null,
            verified: Boolean(data.user?.email_confirmed_at),
          };
        } catch {
          return { id, email: null, verified: false };
        }
      }),
    );

    for (const entry of batchResults) {
      result.set(entry.id, {
        email: entry.email,
        verified: entry.verified,
      });
    }
  }

  return result;
}

async function loadAdminEmailVerificationStatus(admin: Client, ids: string[]) {
  const users = await loadAdminAuthUsers(admin, ids);
  return new Map([...users].map(([id, user]) => [id, user.verified]));
}

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
  cursor: string | null = null,
  lifecycle: CustomerLifecycleState | "ALL" = "ALL",
  accountsFilter: "ALL" | "WITH_ACCOUNTS" | "WITHOUT_ACCOUNTS" = "ALL",
  attentionFilter: "ALL" | "NEEDS_ATTENTION" | "CLEAR" = "ALL",
): Promise<AdminCustomerPageDto> {
  await requireAdminPermission(client, "customers.read");
  const admin = await adminClient();
  const cursorValue = decodeAdminCursor(cursor);
  const term = search.trim().replace(/[%_,().*]/g, "");
  const normalizedTerm = term.toLocaleLowerCase("fr");

  const accountOwnerIds = new Set<string>();
  if (accountsFilter !== "ALL") {
    const { data: accountRows, error: accountError } = await admin
      .from("bank_accounts")
      .select("user_id");
    if (accountError) throw new AdminAccessError("CUSTOMERS_UNAVAILABLE");
    for (const row of accountRows ?? []) accountOwnerIds.add(String((row as any).user_id));
  }

  let query = admin.from("profiles")
    .select("id, first_name, middle_name, last_name, phone, lifecycle_state, created_at")
    .order("created_at", { ascending: false });

  if (lifecycle !== "ALL") query = query.eq("lifecycle_state", lifecycle);
  if (accountsFilter === "WITH_ACCOUNTS") {
    if (!accountOwnerIds.size) return { items: [], hasNext: false, nextCursor: null };
    query = query.in("id", [...accountOwnerIds]);
  } else if (accountsFilter === "WITHOUT_ACCOUNTS" && accountOwnerIds.size) {
    query = query.not("id", "in", `(${[...accountOwnerIds].join(",")})`);
  }
  const attentionIds = new Set<string>();
  if (attentionFilter !== "ALL") {
    const { data: inactiveProfiles, error: attentionError } = await admin
      .from("profiles")
      .select("id")
      .neq("lifecycle_state", "ACTIVE");
    if (attentionError) throw new AdminAccessError("CUSTOMERS_UNAVAILABLE");
    for (const row of inactiveProfiles ?? []) attentionIds.add(String((row as any).id));
    const { data: flaggedVerifications } = await admin
      .from("identity_verifications")
      .select("user_id")
      .in("status", ["REJECTED", "ADDITIONAL_INFORMATION_REQUIRED", "EXPIRED"]);
    for (const row of flaggedVerifications ?? []) attentionIds.add(String((row as any).user_id));
  }
  if (attentionFilter === "NEEDS_ATTENTION") {
    if (!attentionIds.size) return { items: [], hasNext: false, nextCursor: null };
    query = query.in("id", [...attentionIds]);
  } else if (attentionFilter === "CLEAR" && attentionIds.size) {
    query = query.not("id", "in", `(${[...attentionIds].join(",")})`);
  }

  if (normalizedTerm) {
    const emailLookup = normalizedTerm.includes("@")
      ? await admin.rpc("auth_user_for_email" as never, { _email: normalizedTerm } as never)
      : { data: null };
    const exactEmailId = emailLookup.data ? String(emailLookup.data) : null;
    const uuidMatch = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normalizedTerm)
      ? normalizedTerm
      : null;
    const referencePrefix = normalizedTerm.replace(/^cus-?/i, "");
    const referenceRange = /^[0-9a-f]{1,12}$/i.test(referencePrefix)
      ? {
          lower: `${referencePrefix.padEnd(12, "0")}-0000-0000-0000-000000000000`,
          upper: `${referencePrefix.padEnd(12, "f")}-ffff-ffff-ffff-ffffffffffff`,
        }
      : null;
    if (exactEmailId || uuidMatch) {
      query = query.in("id", [exactEmailId ?? uuidMatch!]);
    } else if (referenceRange) {
      query = query.gte("id", referenceRange.lower).lte("id", referenceRange.upper);
    } else {
      const pattern = `*${normalizedTerm}*`;
      query = query.or(`first_name.ilike.${pattern},middle_name.ilike.${pattern},last_name.ilike.${pattern},phone.ilike.${pattern}`);
    }
  }

  if (cursorValue) {
    query = query.or(`created_at.lt.${cursorValue.createdAt},and(created_at.eq.${cursorValue.createdAt},id.lt.${cursorValue.id})`);
  }
  const { data, error } = await query.limit(ADMIN_PAGE_SIZE + 1);
  if (error) throw new AdminAccessError("CUSTOMERS_UNAVAILABLE");
  const rows = data ?? [];
  const hasNext = rows.length > ADMIN_PAGE_SIZE;
  const pageRows = rows.slice(0, ADMIN_PAGE_SIZE);
  const ids = pageRows.map((row: any) => String(row.id));

  const { data: accounts } = ids.length ? await admin.from("bank_accounts").select("id,user_id").in("user_id", ids) : { data: [] as any[] };
  const counts = new Map<string, number>();
  for (const account of accounts ?? []) {
    const key = String((account as any).user_id);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const accountIds = (accounts ?? []).map((row: any) => String(row.id));
  const [authById, { data: verifications }, { data: documents }, { data: notifications }, { data: transfers }, { data: funding }] = await Promise.all([
    ids.length ? loadAdminAuthEmails(admin, ids) : Promise.resolve(new Map<string, string | null>()),
    ids.length ? admin.from("identity_verifications").select("user_id,status,submitted_at,decided_at").in("user_id", ids) : Promise.resolve({ data: [] as any[] }),
    ids.length ? admin.from("verification_documents").select("user_id,status,created_at").in("user_id", ids) : Promise.resolve({ data: [] as any[] }),
    ids.length ? admin.from("notifications").select("user_id,read_at,created_at").in("user_id", ids).is("archived_at", null).is("read_at", null) : Promise.resolve({ data: [] as any[] }),
    ids.length ? admin.from("transfers").select("sender_user_id,status,created_at").in("sender_user_id", ids) : Promise.resolve({ data: [] as any[] }),
    accountIds.length ? admin.from("funding_requests").select("account_id,status,created_at").in("account_id", accountIds).eq("status", "PENDING") : Promise.resolve({ data: [] as any[] }),
  ]);

  const accountOwnerById = new Map((accounts ?? []).map((row: any) => [String(row.id), String(row.user_id)]));
  const verificationByUser = new Map<string, { statuses: Set<string>; attentionAt: string[] }>();
  for (const row of verifications ?? []) {
    const id = String((row as any).user_id);
    const current = verificationByUser.get(id) ?? { statuses: new Set<string>(), attentionAt: [] };
    const status = String((row as any).status);
    current.statuses.add(status);
    const timestamp = ["UNDER_REVIEW", "ADDITIONAL_INFORMATION_REQUIRED"].includes(status) ? row.submitted_at : status === "REJECTED" ? row.decided_at : null;
    if (timestamp) current.attentionAt.push(String(timestamp));
    verificationByUser.set(id, current);
  }
  const documentByUser = new Map<string, { statuses: Set<string>; attentionAt: string[] }>();
  for (const row of documents ?? []) {
    const id = String((row as any).user_id);
    const current = documentByUser.get(id) ?? { statuses: new Set<string>(), attentionAt: [] };
    const status = String((row as any).status);
    current.statuses.add(status);
    if (["ACTION_REQUIRED", "REJECTED", "EXPIRED"].includes(status) && (row as any).created_at) current.attentionAt.push(String((row as any).created_at));
    documentByUser.set(id, current);
  }
  const unreadByUser = new Map<string, { count: number; attentionAt: string[] }>();
  for (const row of notifications ?? []) {
    const id = String((row as any).user_id);
    const current = unreadByUser.get(id) ?? { count: 0, attentionAt: [] };
    current.count += 1;
    if ((row as any).created_at) current.attentionAt.push(String(row.created_at));
    unreadByUser.set(id, current);
  }
  const openTransfersByUser = new Map<string, { count: number; attentionAt: string[] }>();
  for (const row of transfers ?? []) {
    if (["PROCESSING", "COMPLIANCE_REVIEW", "DOCUMENT_REQUIRED", "SETTLEMENT_PENDING"].includes(String((row as any).status))) {
      const id = String((row as any).sender_user_id);
      const current = openTransfersByUser.get(id) ?? { count: 0, attentionAt: [] };
      current.count += 1;
      if ((row as any).created_at) current.attentionAt.push(String(row.created_at));
      openTransfersByUser.set(id, current);
    }
  }
  const pendingFundingByUser = new Map<string, { count: number; attentionAt: string[] }>();
  for (const row of funding ?? []) {
    const owner = accountOwnerById.get(String((row as any).account_id));
    if (owner) {
      const current = pendingFundingByUser.get(owner) ?? { count: 0, attentionAt: [] };
      current.count += 1;
      if ((row as any).created_at) current.attentionAt.push(String(row.created_at));
      pendingFundingByUser.set(owner, current);
    }
  }

  const mapped: AdminCustomerDto[] = pageRows.map((row: any) => {
    const id = String(row.id);
    const attentionReasons: string[] = [];
    if (row.lifecycle_state !== "ACTIVE") attentionReasons.push("LIFECYCLE");
    const attentionAt: string[] = [];
    const verification = verificationByUser.get(id);
    if ([...(verification?.statuses ?? [])].some((status) => ["UNDER_REVIEW", "ADDITIONAL_INFORMATION_REQUIRED", "REJECTED"].includes(status))) {
      attentionReasons.push("KYC"); attentionAt.push(...(verification?.attentionAt ?? []));
    }
    const documentState = documentByUser.get(id);
    if ([...(documentState?.statuses ?? [])].some((status) => ["ACTION_REQUIRED", "REJECTED", "EXPIRED"].includes(status))) {
      attentionReasons.push("DOCUMENTS"); attentionAt.push(...(documentState?.attentionAt ?? []));
    }
    if ((unreadByUser.get(id)?.count ?? 0) > 0) { attentionReasons.push("NOTIFICATIONS"); attentionAt.push(...(unreadByUser.get(id)?.attentionAt ?? [])); }
    if ((openTransfersByUser.get(id)?.count ?? 0) > 0) { attentionReasons.push("TRANSFERS"); attentionAt.push(...(openTransfersByUser.get(id)?.attentionAt ?? [])); }
    if ((pendingFundingByUser.get(id)?.count ?? 0) > 0) { attentionReasons.push("FUNDING"); attentionAt.push(...(pendingFundingByUser.get(id)?.attentionAt ?? [])); }
    const oldestAttentionAt = attentionAt.length ? attentionAt.sort((a, b) => Date.parse(a) - Date.parse(b))[0] ?? null : null;
    return {
      id: row.id,
      reference: `CUS-${String(row.id).replace(/-/g, "").slice(0, 12).toUpperCase()}`,
      fullName: [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(" ") || "Client sans nom",
      email: authById.get(row.id) ?? null,
      phone: row.phone ?? null,
      lifecycleState: row.lifecycle_state as CustomerLifecycleState,
      accountCount: counts.get(row.id) ?? 0,
      createdAt: row.created_at,
      attentionCount: attentionReasons.length,
      attentionReasons,
      oldestAttentionAt,
    };
  });
  const last = pageRows[pageRows.length - 1];
  return { items: mapped, hasNext, nextCursor: hasNext && last ? encodeAdminCursor({ createdAt: String(last.created_at), id: String(last.id) }) : null };
}

export async function loadAdminOnboardingCases(
  client: Client,
  search = "",
  cursor: string | null = null,
  status = "ALL",
): Promise<AdminOnboardingCasePageDto> {
  const staff = await requireAdminPermission(client, "customers.read");
  const canReadKycDecisions = staff.permissions.includes("kyc.review") || staff.permissions.includes("kyc.approve");
  const admin = await adminClient();
  const cursorValue = decodeAdminCursor(cursor);
  const term = search.trim().replace(/[%_,()]/g, "").slice(0, 80).toLocaleLowerCase("fr");
  const allowedStatuses = ["ALL", "NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "UNDER_REVIEW", "ADDITIONAL_INFORMATION_REQUIRED", "VERIFIED", "REJECTED"];
  const normalizedStatus = allowedStatuses.includes(status) ? status : "ALL";

  let query = admin
    .from("profiles")
    .select("id, first_name, middle_name, last_name, lifecycle_state, onboarding_step, created_at")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (term) {
    const nameFilter = `first_name.ilike.%${term}%,middle_name.ilike.%${term}%,last_name.ilike.%${term}%`;
    query = query.or(nameFilter);
    if (/^[0-9a-f]{36}$/i.test(term)) query = query.eq("id", term);
  }

  if (normalizedStatus === "NOT_STARTED") {
    query = query.eq("onboarding_step", normalizedStatus);
  }

  if (cursorValue) {
    query = query.or(`created_at.lt.${cursorValue.createdAt},and(created_at.eq.${cursorValue.createdAt},id.lt.${cursorValue.id})`);
  }

  const { data: profiles, error } = await query.limit(ADMIN_PAGE_SIZE + 1);
  if (error) throw new AdminAccessError("ONBOARDING_CASES_UNAVAILABLE");

  let rows = profiles ?? [];

  if (normalizedStatus !== "ALL" && normalizedStatus !== "NOT_STARTED" && normalizedStatus !== "IN_PROGRESS") {
    const { data: matchingVerifications, error: verificationError } = await admin
      .from("identity_verifications")
      .select("user_id")
      .eq("status", normalizedStatus as never);
    if (verificationError) throw new AdminAccessError("ONBOARDING_CASES_UNAVAILABLE");
    const matchingIds = new Set((matchingVerifications ?? []).map((row: any) => String(row.user_id)));
    rows = rows.filter((row: any) => matchingIds.has(String(row.id)));
  }

  const hasNext = rows.length > ADMIN_PAGE_SIZE;
  rows = rows.slice(0, ADMIN_PAGE_SIZE);
  const customerIds = rows.map((row: any) => String(row.id));

  const [{ data: verifications }, { data: documents }, { data: approvals }, { data: accounts }] = await Promise.all([
    customerIds.length
      ? admin.from("identity_verifications").select("user_id,status,submitted_at,decided_at").in("user_id", customerIds)
      : Promise.resolve({ data: [] as any[] }),
    customerIds.length
      ? admin.from("verification_documents").select("user_id,document_type,status,created_at").in("user_id", customerIds).order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as any[] }),
    customerIds.length && canReadKycDecisions
      ? admin.from("onboarding_approval_requests" as any).select("id,customer_id,recommendation,status,reviewer_user_id,reviewer_note,reviewed_at,checker_user_id,checker_note,decided_at").in("customer_id", customerIds).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as any[] }),
    customerIds.length
      ? admin.from("bank_accounts").select("user_id,public_reference,status").in("user_id", customerIds).eq("is_primary", true)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const authUsersById = customerIds.length
    ? await loadAdminAuthUsers(admin, customerIds)
    : new Map<string, AdminAuthUser>();
  const authById = new Map(
    [...authUsersById].map(([id, user]) => [id, user.email]),
  );
  const emailVerifiedById = new Map(
    [...authUsersById].map(([id, user]) => [id, user.verified]),
  );

  const verificationByUser = new Map((verifications ?? []).map((row: any) => [String(row.user_id), row]));
  const documentsByUser = new Map<string, AdminOnboardingCaseDto["documents"]>();
  for (const document of documents ?? []) {
    const userId = String((document as any).user_id);
    const customerDocuments = documentsByUser.get(userId) ?? [];
    customerDocuments.push({
      type: String((document as any).document_type),
      status: String((document as any).status),
      receivedAt: String((document as any).created_at),
    });
    documentsByUser.set(userId, customerDocuments);
  }
  const accountByUser = new Map((accounts ?? []).map((row: any) => [String(row.user_id), row]));
  const staffIds = [...new Set((approvals ?? []).flatMap((row: any) => [row.reviewer_user_id, row.checker_user_id]).filter(Boolean).map(String))];
  const { data: staffProfiles } = staffIds.length
    ? await admin.from("staff_profiles").select("user_id,display_name").in("user_id", staffIds)
    : { data: [] as any[] };
  const staffNames = new Map((staffProfiles ?? []).map((row: any) => [String(row.user_id), String(row.display_name)]));
  const approvalByUser = new Map<string, any>();
  for (const approval of approvals ?? []) if (!approvalByUser.has(String((approval as any).customer_id))) approvalByUser.set(String((approval as any).customer_id), approval);

  const items: AdminOnboardingCaseDto[] = rows.map((row: any) => {
    const verification: any = verificationByUser.get(String(row.id));
    const approval: any = approvalByUser.get(String(row.id));
    const account: any = accountByUser.get(String(row.id));
    const authEmail = authById.get(String(row.id)) ?? null;
    return {
      customerId: String(row.id),
      reference: `CUS-${String(row.id).replace(/-/g, "").slice(0, 12).toUpperCase()}`,
      fullName: [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(" ") || "Client sans nom",
      email: authEmail,
      lifecycleState: row.lifecycle_state as CustomerLifecycleState,
      onboardingStep: String(row.onboarding_step),
      verificationStatus: String(verification?.status ?? "NOT_STARTED"),
      submittedAt: verification?.submitted_at ? String(verification.submitted_at) : null,
      decidedAt: verification?.decided_at ? String(verification.decided_at) : null,
      createdAt: String(row.created_at),
      emailVerified: emailVerifiedById.get(String(row.id)) ?? false,
      accountReference: account?.public_reference ? String(account.public_reference) : null,
      accountStatus: account?.status ? String(account.status) : null,
      approval: approval ? {
        id: String(approval.id),
        recommendation: approval.recommendation,
        status: approval.status,
        reviewerName: staffNames.get(String(approval.reviewer_user_id)) ?? "Agent KYC",
        reviewerNote: String(approval.reviewer_note),
        reviewedAt: String(approval.reviewed_at),
        checkerName: approval.checker_user_id ? staffNames.get(String(approval.checker_user_id)) ?? "Superviseur" : null,
        checkerNote: approval.checker_note ? String(approval.checker_note) : null,
        decidedAt: approval.decided_at ? String(approval.decided_at) : null,
      } : null,
      documents: documentsByUser.get(String(row.id)) ?? [],
    };
  });

  if (term.includes("@")) {
    const { data: exactEmailId } = await admin.rpc("auth_user_for_email" as never, { _email: term } as never);
    const emailId = exactEmailId ? String(exactEmailId) : null;
    if (emailId) {
      const emailMatch = items.find((item) => item.customerId === emailId);
      return emailMatch ? { items: [emailMatch], hasNext: false, nextCursor: null } : { items: [], hasNext: false, nextCursor: null };
    }
    return { items: [], hasNext: false, nextCursor: null };
  }

  const last = rows[rows.length - 1];
  return {
    items,
    hasNext,
    nextCursor: hasNext && last ? encodeAdminCursor({ createdAt: String(last.created_at), id: String(last.id) }) : null,
  };
}
export async function inviteCustomer(
  client: Client,
  actorUserId: string,
  input: { email: string; firstName: string; lastName: string },
  origin: string,
): Promise<AdminActionResult<{ customerId: string; invited: true }, "INVITATION_ALREADY_REGISTERED" | "INVITATION_RATE_LIMITED" | "INVITATION_UNAVAILABLE">> {
  await requireAdminPermission(client, "customers.invite");
  const admin = await adminClient();
  const normalizedEmail = input.email.trim().toLowerCase();
  const { data: existingUserId, error: lookupError } = await admin.rpc("auth_user_for_email" as never, {
    _email: normalizedEmail,
  } as never);
  if (lookupError) throw new AdminAccessError("CUSTOMER_INVITATION_LOOKUP_FAILED");
  if (existingUserId) return { ok: false, code: "INVITATION_ALREADY_REGISTERED" };
  const { data, error } = await admin.auth.admin.inviteUserByEmail(input.email, {
    redirectTo: `${origin}/reset-password`,
    data: { first_name: input.firstName, last_name: input.lastName, invited_by_bank: true },
  });
  if (error || !data.user) {
    const message = error?.message.toLowerCase() ?? "";
    if (error?.status === 429) return { ok: false, code: "INVITATION_RATE_LIMITED" };
    if (error?.status === 422 || message.includes("registered") || message.includes("exists")) {
      return { ok: false, code: "INVITATION_ALREADY_REGISTERED" };
    }
    if (error?.status && error.status < 500) return { ok: false, code: "INVITATION_UNAVAILABLE" };
    throw new AdminAccessError("CUSTOMER_INVITATION_FAILED");
  }
  const { error: auditError } = await admin.rpc("service_record_customer_invitation" as never, {
    _actor_user_id: actorUserId,
    _customer_id: data.user.id,
    _email: normalizedEmail,
  } as never);
  if (auditError) {
    await admin.auth.admin.deleteUser(data.user.id);
    throw new AdminAccessError("CUSTOMER_INVITATION_AUDIT_FAILED");
  }
  return { ok: true, customerId: data.user.id, invited: true as const };
}

export async function reviewOnboardingCase(
  client: Client,
  actorUserId: string,
  input: { customerId: string; recommendation: "APPROVE" | "REJECT" | "REQUEST_INFO"; note: string },
): Promise<AdminActionResult<{ requestId: string | null }, "APPROVAL_ALREADY_PENDING">> {
  await requireAdminPermission(client, "kyc.review");
  const admin = await adminClient();
  const { data, error } = await admin.rpc("service_review_identity_application" as never, {
    _actor_user_id: actorUserId, _customer_id: input.customerId, _recommendation: input.recommendation, _note: input.note,
  } as never);
  if (error) {
    if (error.message.toLowerCase().includes("already pending")) return { ok: false, code: "APPROVAL_ALREADY_PENDING" };
    throw new AdminAccessError("KYC_REVIEW_FAILED");
  }
  return { ok: true, requestId: data ? String(data) : null };
}

export async function decideOnboardingCase(
  client: Client,
  actorUserId: string,
  input: { requestId: string; confirm: boolean; note: string },
): Promise<AdminActionResult<{ decision: Record<string, string | null> | null }, "MAKER_CANNOT_APPROVE" | "DECISION_ALREADY_RECORDED" | "APPLICATION_STATE_CHANGED">> {
  await requireAdminPermission(client, "kyc.approve");
  const admin = await adminClient();
  const { data, error } = await admin.rpc("service_decide_identity_application" as never, {
    _actor_user_id: actorUserId, _request_id: input.requestId, _confirm: input.confirm, _note: input.note,
  } as never);
  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("four-eyes")) return { ok: false, code: "MAKER_CANNOT_APPROVE" };
    if (message.includes("already decided") || message.includes("request not found")) return { ok: false, code: "DECISION_ALREADY_RECORDED" };
    if (message.includes("application state changed")) return { ok: false, code: "APPLICATION_STATE_CHANGED" };
    throw new AdminAccessError("KYC_DECISION_FAILED");
  }
  const decision = data && typeof data === "object" ? data as Record<string, string | null> : null;
  return { ok: true, decision };
}

export async function activateOnboardingCustomer(
  client: Client,
  actorUserId: string,
  input: { customerId: string; reason: string },
) {
  await requireAdminPermission(client, "accounts.manage");
  const admin = await adminClient();
  const { data, error } = await admin.rpc("service_activate_approved_customer" as never, {
    _actor_user_id: actorUserId, _customer_id: input.customerId, _reason: input.reason,
  } as never);
  if (error) throw new AdminAccessError("CUSTOMER_ACTIVATION_FAILED");
  return { accountReference: String(data) };
}

export async function loadAdminAccountStatusHistory(client: Client, accountReference: string): Promise<AdminAccountStatusHistoryDto[]> {
  await requireAdminPermission(client, "accounts.read");
  const admin = await adminClient();
  const { data: account, error: accountError } = await admin.from("bank_accounts").select("id").eq("public_reference", accountReference).maybeSingle();
  if (accountError || !account) throw new AdminAccessError("ACCOUNT_HISTORY_UNAVAILABLE");
  const { data, error } = await admin.from("account_status_history")
    .select("id,previous_status,new_status,reason_category,internal_note,changed_by,created_at")
    .eq("account_id", account.id).order("created_at", { ascending: false }).limit(50);
  if (error) throw new AdminAccessError("ACCOUNT_HISTORY_UNAVAILABLE");
  const actorIds = [...new Set((data ?? []).map((row: any) => String(row.changed_by)).filter(Boolean))];
  const { data: actors } = actorIds.length
    ? await admin.from("staff_profiles").select("user_id,display_name,public_reference").in("user_id", actorIds)
    : { data: [] as any[] };
  const actorMap = new Map((actors ?? []).map((row: any) => [String(row.user_id), row]));
  return (data ?? []).map((row: any) => {
    const actor = actorMap.get(String(row.changed_by));
    return { id:String(row.id), previousStatus:String(row.previous_status), newStatus:String(row.new_status),
      reasonCategory:String(row.reason_category), internalNote:row.internal_note ? String(row.internal_note) : null,
      changedByName:actor?.display_name ? String(actor.display_name) : "Agent bancaire",
      changedByReference:actor?.public_reference ? String(actor.public_reference) : null, changedAt:String(row.created_at) };
  });
}

export async function loadAdminAccounts(
  client: Client,
  search = "",
  cursor: string | null = null,
): Promise<AdminAccountPageDto> {
  await requireAdminPermission(client, "accounts.read");
  const admin = await adminClient();
  let query = admin
    .from("bank_accounts")
    .select("id, user_id, public_reference, display_name, currency, currency_minor_unit, status, account_number, created_at")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  const term = search.trim().replace(/[%_,()]/g, "").slice(0, 80);
  if (term) query = query.or(`public_reference.ilike.%${term}%,account_number.ilike.%${term}%,display_name.ilike.%${term}%`);
  const cursorValue = decodeAdminCursor(cursor);
  if (cursorValue) query = query.or(`created_at.lt.${cursorValue.createdAt},and(created_at.eq.${cursorValue.createdAt},id.lt.${cursorValue.id})`);
  query = query.limit(ADMIN_PAGE_SIZE + 1);
  const { data, error } = await query;
  if (error) throw new AdminAccessError("ACCOUNTS_UNAVAILABLE");
  const rawRows = data ?? [];
  const hasNext = rawRows.length > ADMIN_PAGE_SIZE;
  const rows = rawRows.slice(0, ADMIN_PAGE_SIZE);
  const userIds = [...new Set(rows.map((row: any) => String(row.user_id)))];
  const accountIds = rows.map((row: any) => String(row.id));
  const [{ data: profiles }, { data: balances }] = await Promise.all([
    userIds.length
      ? admin.from("profiles").select("id, first_name, middle_name, last_name, lifecycle_state, created_at").in("id", userIds)
      : Promise.resolve({ data: [] as any[] }),
    accountIds.length
      ? admin.from("account_balances").select("account_id, ledger_balance_minor, available_balance_minor, held_balance_minor").in("account_id", accountIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);
  const profileById = new Map((profiles ?? []).map((row: any) => [row.id, row]));
  const balanceById = new Map((balances ?? []).map((row: any) => [row.account_id, row]));
  const items = rows.map((row: any) => {
    const profile: any = profileById.get(row.user_id);
    const balance: any = balanceById.get(row.id);
    if (!balance) throw new AdminAccessError("ACCOUNT_BALANCE_UNAVAILABLE");
    return {
      id: row.id,
      reference: row.public_reference,
      holderId: String(row.user_id),
      holderLifecycleState: (profile?.lifecycle_state ?? "ACTIVE") as CustomerLifecycleState,
      holderCreatedAt: String(profile?.created_at ?? row.created_at),
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
  const last = rows[rows.length - 1];
  return { items, hasNext, nextCursor: hasNext && last ? encodeAdminCursor({ createdAt: String(last.created_at), id: String(last.id) }) : null };
}

export async function searchFundingAccounts(
  client: Client,
  search = "",
): Promise<FundingAccountOptionDto[]> {
  const staff = await requireAdminPermission(client);
  if (!staff.permissions.includes("finance.adjustment.create") && !staff.permissions.includes("finance.adjustment.approve")) {
    throw new AdminAccessError("ADMIN_FORBIDDEN");
  }
  const admin = await adminClient();
  const term = search.trim().replace(/[%_,()]/g, "").slice(0, 80);
  let query = admin
    .from("bank_accounts")
    .select("id, user_id, public_reference, account_number, display_name, created_at")
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(20);
  if (term) query = query.or(`public_reference.ilike.%${term}%,account_number.ilike.%${term}%,display_name.ilike.%${term}%`);
  const { data, error } = await query;
  if (error) throw new AdminAccessError("FUNDING_ACCOUNTS_UNAVAILABLE");
  const rows = data ?? [];
  const userIds = [...new Set(rows.map((row: any) => String(row.user_id)))];
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id, first_name, middle_name, last_name").in("id", userIds)
    : { data: [] as any[] };
  const names = new Map((profiles ?? []).map((row: any) => [
    String(row.id),
    [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(" ") || "Client sans nom",
  ]));
  return rows.map((row: any) => ({
    id: String(row.id),
    reference: String(row.public_reference),
    holderName: names.get(String(row.user_id)) ?? "Client indisponible",
  }));
}

export async function loadAdminAuditEvents(client: Client, search = "", cursor: string | null = null): Promise<AdminAuditEventPageDto> {
  await requireAdminPermission(client, "audit.read");
  const admin = await adminClient();
  const term = search.trim().replace(/[%,_()]/g, "").slice(0, 80);
  const cursorValue = decodeAdminCursor(cursor);
  let query = admin.from("admin_audit_events").select("id, actor_user_id, action, resource_type, resource_reference, permission_checked, result, context, created_at").order("created_at", { ascending: false }).order("id", { ascending: false });
  if (term) query = query.or(`action.ilike.%${term}%,resource_type.ilike.%${term}%,resource_reference.ilike.%${term}%,permission_checked.ilike.%${term}%`);
  if (cursorValue) query = query.or(`created_at.lt.${cursorValue.createdAt},and(created_at.eq.${cursorValue.createdAt},id.lt.${cursorValue.id})`);
  const { data, error } = await query.limit(ADMIN_PAGE_SIZE + 1);
  if (error) throw new AdminAccessError("AUDIT_UNAVAILABLE");
  const rawRows = data ?? [], hasNext = rawRows.length > ADMIN_PAGE_SIZE, rows = rawRows.slice(0, ADMIN_PAGE_SIZE);
  const actorIds = [...new Set(rows.map((row: any) => String(row.actor_user_id)))];
  const { data: staff } = actorIds.length ? await admin.from("staff_profiles").select("user_id,display_name,public_reference").in("user_id", actorIds) : { data: [] as any[] };
  const staffById = new Map((staff ?? []).map((row: any) => [String(row.user_id), row]));
  const items = rows.map((row: any) => { const actor = staffById.get(String(row.actor_user_id)); return { id: String(row.id), actorName: actor?.display_name ?? "Staff indisponible", actorReference: actor?.public_reference ? String(actor.public_reference) : null, action: String(row.action), resourceType: row.resource_type ? String(row.resource_type) : null, resourceReference: row.resource_reference ? String(row.resource_reference) : null, permissionChecked: row.permission_checked ? String(row.permission_checked) : null, result: row.result === "DENIED" ? "DENIED" : "ALLOWED", context: row.context && typeof row.context === "object" && !Array.isArray(row.context) ? row.context : {}, createdAt: String(row.created_at) }; });
  const last = rows[rows.length - 1];
  return { items, hasNext, nextCursor: hasNext && last ? encodeAdminCursor({ createdAt: String(last.created_at), id: String(last.id) }) : null };
}

export async function loadFundingRequests(client: Client, cursor: string | null = null): Promise<FundingRequestPageDto> {
  const staff = await requireAdminPermission(client);
  const canRead = staff.permissions.includes("finance.adjustment.create") || staff.permissions.includes("finance.adjustment.approve");
  if (!canRead) throw new AdminAccessError("ADMIN_FORBIDDEN");
  const admin = await adminClient();
  const cursorValue = decodeAdminCursor(cursor);
  let query = admin.from("funding_requests").select("id, account_id, amount_minor, currency, reason, status, maker_user_id, checker_user_id, created_at, decision_at").order("created_at", { ascending: false }).order("id", { ascending: false });
  if (cursorValue) query = query.or(`created_at.lt.${cursorValue.createdAt},and(created_at.eq.${cursorValue.createdAt},id.lt.${cursorValue.id})`);
  const { data, error } = await query.limit(ADMIN_PAGE_SIZE + 1);
  if (error) throw new AdminAccessError("FUNDING_UNAVAILABLE");
  const rawRows = data ?? [];
  const hasNext = rawRows.length > ADMIN_PAGE_SIZE;
  const rows = rawRows.slice(0, ADMIN_PAGE_SIZE);
  const accountIds = [...new Set(rows.map((row: any) => String(row.account_id)))];
  const staffIds = [...new Set(rows.flatMap((row: any) => [row.maker_user_id, row.checker_user_id]).filter(Boolean).map(String))];
  const [{ data: accounts }, { data: staffProfiles }] = await Promise.all([
    accountIds.length ? admin.from("bank_accounts").select("id, user_id, public_reference").in("id", accountIds) : Promise.resolve({ data: [] as any[] }),
    staffIds.length ? admin.from("staff_profiles").select("user_id, display_name").in("user_id", staffIds) : Promise.resolve({ data: [] as any[] }),
  ]);
  const accountById = new Map((accounts ?? []).map((row: any) => [row.id, row]));
  const names = new Map((staffProfiles ?? []).map((row: any) => [row.user_id, row.display_name]));
  const customerIds = [...new Set((accounts ?? []).map((row: any) => String(row.user_id)))];
  const { data: customers } = customerIds.length ? await admin.from("profiles").select("id, first_name, middle_name, last_name").in("id", customerIds) : { data: [] as any[] };
  const customerNames = new Map((customers ?? []).map((row: any) => [row.id, [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(" ") || "Client sans nom"]));
  const items = rows.map((row: any) => {
    const account: any = accountById.get(row.account_id);
    return { id: row.id, accountReference: account?.public_reference ?? "—", holderName: account ? customerNames.get(account.user_id) ?? "Client indisponible" : "Client indisponible", amountMinor: Number(row.amount_minor), currency: row.currency, reason: row.reason, status: row.status, makerName: names.get(row.maker_user_id) ?? "Opérateur", checkerName: row.checker_user_id ? names.get(row.checker_user_id) ?? "Superviseur" : null, createdAt: row.created_at, decisionAt: row.decision_at ?? null, canDecide: staff.permissions.includes("finance.adjustment.approve") };
  });
  const last = rows[rows.length - 1];
  return { items, hasNext, nextCursor: hasNext && last ? encodeAdminCursor({ createdAt: String(last.created_at), id: String(last.id) }) : null };
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

export async function loadExternalTransfers(client: Client, cursor: string | null = null): Promise<AdminExternalTransferPageDto> {
  const staff = await requireAdminPermission(client);
  if (!staff.permissions.includes("compliance.review") && !staff.permissions.includes("transfers.approve")) throw new AdminAccessError("ADMIN_FORBIDDEN");
  const admin = await adminClient();
  const cursorValue = decodeAdminCursor(cursor);
  let query = admin.from("transfers").select("id,public_reference,sender_user_id,recipient_display_snapshot,amount_minor,currency,status,progress_percent,created_at").eq("transfer_kind","EXTERNAL_TRANSFER").not("status","in","(COMPLETED,FAILED,REJECTED,CANCELLED,REVERSED)").order("created_at",{ascending:false}).order("id",{ascending:false});
  if (cursorValue) query = query.or(`created_at.lt.${cursorValue.createdAt},and(created_at.eq.${cursorValue.createdAt},id.lt.${cursorValue.id})`);
  const { data, error } = await query.limit(ADMIN_PAGE_SIZE + 1);
  if(error) throw new AdminAccessError("TRANSFERS_UNAVAILABLE");
  const rawRows=data??[], hasNext=rawRows.length>ADMIN_PAGE_SIZE, rows=rawRows.slice(0,ADMIN_PAGE_SIZE);
  const ids=rows.map((r:any)=>r.sender_user_id), transferIds=rows.map((r:any)=>r.id);
  const [{data:profiles},{data:reqs}]=await Promise.all([ids.length?admin.from("profiles").select("id,first_name,last_name").in("id",ids):Promise.resolve({data:[] as any[]}),transferIds.length?admin.from("transfer_requirements").select("transfer_id,status").in("transfer_id",transferIds):Promise.resolve({data:[] as any[]})]);
  const names=new Map((profiles??[]).map((p:any)=>[p.id,[p.first_name,p.last_name].filter(Boolean).join(" ")||"Client"])); const open=new Map<string,number>();
  for(const r of reqs??[]) if(["REQUIRED","REPLACEMENT_REQUIRED","UNDER_REVIEW"].includes(String((r as any).status))) open.set(String((r as any).transfer_id),(open.get(String((r as any).transfer_id))??0)+1);
  const items=rows.map((r:any)=>({reference:r.public_reference,customerName:names.get(r.sender_user_id)??"Client",recipient:r.recipient_display_snapshot,amountMinor:Number(r.amount_minor),currency:r.currency,status:r.status,progressPercent:Number(r.progress_percent),documentsOpen:open.get(r.id)??0,createdAt:r.created_at}));
  const last=rows[rows.length-1];
  return {items,hasNext,nextCursor:hasNext&&last?encodeAdminCursor({createdAt:String(last.created_at),id:String(last.id)}):null};
}

export async function loadAdminCustomerDossier(
  client: Client,
  customerId: string,
): Promise<import("@/features/admin/types/admin-customer-dossier").AdminCustomerDossierDto> {
  const staff = await requireAdminPermission(client, "customers.read");
  const admin = await adminClient();

  const [{ data: profile, error: profileError }, authResult] = await Promise.all([
    admin.from("profiles").select("id,first_name,middle_name,last_name,phone,lifecycle_state,onboarding_step,created_at").eq("id", customerId).maybeSingle(),
    admin.auth.admin.getUserById(customerId),
  ]);
  if (profileError || !profile) throw new AdminAccessError("CUSTOMER_DOSSIER_UNAVAILABLE");

  const reference = `CUS-${customerId.replace(/-/g, "").slice(0, 12).toUpperCase()}`;
  const fullName = [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(" ") || "Client sans nom";
  const [kycResult, documentsResult, accountsResult, notificationsResult, supportResult, transferResult] = await Promise.all([
    admin.from("identity_verifications").select("status,submitted_at,decided_at").eq("user_id", customerId).order("submitted_at", { ascending: false }).limit(1),
    admin.from("verification_documents").select("document_type,status,created_at").eq("user_id", customerId).order("created_at", { ascending: false }).limit(12),
    admin.from("bank_accounts").select("public_reference,display_name,currency,currency_minor_unit,status,account_number,id").eq("user_id", customerId).order("created_at", { ascending: true }),
    admin.from("notifications").select("title,severity,read_at,created_at").eq("user_id", customerId).is("archived_at", null).order("created_at", { ascending: false }).limit(20),
    admin.from("support_threads").select("public_reference,subject,category,status,last_message_at").eq("customer_user_id", customerId).order("last_message_at", { ascending: false }).limit(20),
    admin.from("transfers").select("public_reference,recipient_display_snapshot,amount_minor,currency,status,progress_percent,created_at").eq("sender_user_id", customerId).order("created_at", { ascending: false }).limit(20),
  ]);

  if (kycResult.error || documentsResult.error || accountsResult.error || notificationsResult.error || supportResult.error || transferResult.error) throw new AdminAccessError("CUSTOMER_DOSSIER_UNAVAILABLE");
  const accounts = accountsResult.data ?? [];
  const accountIds = accounts.map((a: any) => String(a.id));
  const accountRefs = accounts.map((a: any) => String(a.public_reference));
  const [{ data: balances }, { data: funding }, { data: transactions }, { data: statusHistory }] = await Promise.all([
    accountIds.length ? admin.from("account_balances").select("account_id,ledger_balance_minor,available_balance_minor,held_balance_minor").in("account_id", accountIds) : Promise.resolve({ data: [] as any[] }),
    accountIds.length ? admin.from("funding_requests").select("id,account_id,amount_minor,currency,reason,status,created_at").in("account_id", accountIds).order("created_at", { ascending: false }).limit(10) : Promise.resolve({ data: [] as any[] }),
    accountRefs.length ? admin.from("customer_account_activity").select("reference,account_reference,transaction_type,direction,amount_minor,currency,minor_unit,display_description,counterparty_display,status,occurred_at").in("account_reference", accountRefs).order("occurred_at", { ascending: false }).limit(10) : Promise.resolve({ data: [] as any[] }),
    accountIds.length ? admin.from("account_status_history").select("id,account_id,previous_status,new_status,reason_category,internal_note,changed_by,created_at").in("account_id", accountIds).order("created_at", { ascending: false }).limit(20) : Promise.resolve({ data: [] as any[] }),
  ]);

  const balanceByAccount = new Map((balances ?? []).map((row: any) => [String(row.account_id), row]));
  const accountById = new Map(accounts.map((row: any) => [String(row.id), row]));
  const statusHistoryByAccount = new Map<string, any[]>();
  for (const row of statusHistory ?? []) {
    const key = String(row.account_id);
    const current = statusHistoryByAccount.get(key) ?? [];
    current.push(row);
    statusHistoryByAccount.set(key, current);
  }
  const statusActorIds = [...new Set((statusHistory ?? []).map((row: any) => String(row.changed_by)).filter(Boolean))];
  const { data: statusActors } = statusActorIds.length
    ? await admin.from("staff_profiles").select("user_id,display_name,public_reference").in("user_id", statusActorIds)
    : { data: [] as any[] };
  const statusActorById = new Map((statusActors ?? []).map((row: any) => [String(row.user_id), row]));
  const securityAllowed = staff.permissions.includes("security.read") || staff.permissions.includes("admin.access");
  const auditAllowed = staff.permissions.includes("audit.read") || staff.permissions.includes("admin.access");
  const [{ data: sessions }, { data: securityEvents }] = securityAllowed
    ? await Promise.all([
        admin.from("customer_security_sessions").select("device_label,first_seen_at,last_seen_at,revoked_at").eq("user_id", customerId).order("last_seen_at", { ascending: false }).limit(20),
        admin.from("customer_security_events").select("event_type,title,created_at").eq("user_id", customerId).order("created_at", { ascending: false }).limit(20),
      ])
    : [{ data: [] as any[] }, { data: [] as any[] }];

  let audit: any[] = [];
  if (auditAllowed) {
    const auditRefs = [reference, ...accountRefs];
    const auditResult = auditRefs.length
      ? await admin.from("admin_audit_events").select("id,actor_user_id,action,resource_type,resource_reference,permission_checked,result,context,created_at").in("resource_reference", auditRefs).order("created_at", { ascending: false }).limit(20)
      : { data: [] as any[] };
    const actorIds = [...new Set((auditResult.data ?? []).map((row: any) => String(row.actor_user_id)).filter(Boolean))];
    const { data: auditActors } = actorIds.length
      ? await admin.from("staff_profiles").select("user_id,display_name,public_reference").in("user_id", actorIds)
      : { data: [] as any[] };
    const auditActorById = new Map((auditActors ?? []).map((row: any) => [String(row.user_id), row]));
    audit = (auditResult.data ?? []).map((row: any) => {
      const actor = auditActorById.get(String(row.actor_user_id));
      return {
        id: String(row.id),
        action: String(row.action),
        actorName: actor?.display_name ? String(actor.display_name) : "Staff indisponible",
        actorReference: actor?.public_reference ? String(actor.public_reference) : null,
        resourceType: row.resource_type ? String(row.resource_type) : null,
        resourceReference: row.resource_reference ? String(row.resource_reference) : null,
        permissionChecked: row.permission_checked ? String(row.permission_checked) : null,
        result: row.result === "DENIED" ? "DENIED" : "ALLOWED",
        context: row.context && typeof row.context === "object" && !Array.isArray(row.context) ? row.context : {},
        createdAt: String(row.created_at),
      };
    });
  }

  const kyc = (kycResult.data ?? [])[0] as any;
  const notifications = notificationsResult.data ?? [];
  return {
    customer: {
      id: customerId,
      reference,
      fullName,
      email: authResult.data.user?.email ?? null,
      phone: profile.phone ?? null,
      lifecycleState: profile.lifecycle_state as CustomerLifecycleState,
      createdAt: String(profile.created_at),
      onboardingStep: profile.onboarding_step ? String(profile.onboarding_step) : null,
      emailVerified: Boolean(authResult.data.user?.email_confirmed_at),
    },
    kyc: {
      status: String(kyc?.status ?? "NOT_STARTED"),
      submittedAt: kyc?.submitted_at ? String(kyc.submitted_at) : null,
      decidedAt: kyc?.decided_at ? String(kyc.decided_at) : null,
    },
    documents: (documentsResult.data ?? []).map((row: any) => ({ type: String(row.document_type), status: String(row.status), createdAt: String(row.created_at) })),
    accounts: accounts.map((row: any) => {
      const balance: any = balanceByAccount.get(String(row.id)) ?? {};
      return {
        reference: String(row.public_reference),
        displayName: String(row.display_name),
        currency: String(row.currency),
        minorUnit: Number(row.currency_minor_unit),
        status: String(row.status),
        maskedNumber: `•••• ${String(row.account_number).slice(-4)}`,
        ledgerBalanceMinor: Number(balance.ledger_balance_minor ?? 0),
        availableBalanceMinor: Number(balance.available_balance_minor ?? 0),
        heldBalanceMinor: Number(balance.held_balance_minor ?? 0),
        statusHistory: (statusHistoryByAccount.get(String(row.id)) ?? []).map((history: any) => {
          const actor = statusActorById.get(String(history.changed_by));
          return {
            id: String(history.id),
            previousStatus: String(history.previous_status),
            newStatus: String(history.new_status),
            reasonCategory: String(history.reason_category),
            internalNote: history.internal_note ? String(history.internal_note) : null,
            changedByName: actor?.display_name ? String(actor.display_name) : "Agent bancaire",
            changedByReference: actor?.public_reference ? String(actor.public_reference) : null,
            changedAt: String(history.created_at),
          };
        }),
      };
    }),
    transactions: (transactions ?? []).map((row: any) => ({
      reference: String(row.reference),
      accountReference: String(row.account_reference),
      transactionType: String(row.transaction_type),
      direction: String(row.direction),
      amountMinor: Number(row.amount_minor),
      currency: String(row.currency),
      minorUnit: Number(row.minor_unit),
      description: row.display_description ? String(row.display_description) : null,
      counterparty: row.counterparty_display ? String(row.counterparty_display) : null,
      status: String(row.status),
      occurredAt: String(row.occurred_at),
    })),
    transfers: (transferResult.data ?? []).map((row: any) => ({
      reference: String(row.public_reference),
      amountMinor: Number(row.amount_minor),
      currency: String(row.currency),
      status: String(row.status),
      recipient: String(row.recipient_display_snapshot ?? "—"),
      progressPercent: Number(row.progress_percent ?? 0),
      createdAt: String(row.created_at),
    })),
    funding: (funding ?? []).map((row: any) => ({
      id: String(row.id),
      accountReference: accountById.get(String(row.account_id))?.public_reference ? String(accountById.get(String(row.account_id)).public_reference) : "—",
      amountMinor: Number(row.amount_minor),
      currency: String(row.currency),
      minorUnit: Number(accountById.get(String(row.account_id))?.currency_minor_unit ?? 2),
      reason: String(row.reason),
      status: String(row.status),
      createdAt: String(row.created_at),
    })),
    messages: (supportResult.data ?? []).map((row: any) => ({
      reference: String(row.public_reference),
      subject: String(row.subject),
      category: String(row.category),
      status: String(row.status),
      lastMessageAt: String(row.last_message_at),
    })),
    notifications: {
      unreadCount: notifications.filter((row: any) => !row.read_at).length,
      items: notifications.map((row: any) => ({ title: String(row.title), severity: String(row.severity), readAt: row.read_at ? String(row.read_at) : null, createdAt: String(row.created_at) })),
    },
    security: {
      sessions: (sessions ?? []).map((row: any) => ({ deviceLabel: String(row.device_label), firstSeenAt: String(row.first_seen_at), lastSeenAt: String(row.last_seen_at), revokedAt: row.revoked_at ? String(row.revoked_at) : null })),
      events: (securityEvents ?? []).map((row: any) => ({ type: String(row.event_type), title: String(row.title), createdAt: String(row.created_at) })),
      restricted: !securityAllowed,
    },
    audit: audit.map((row: any) => ({ action: String(row.action), resourceType: row.resource_type ? String(row.resource_type) : null, resourceReference: row.resource_reference ? String(row.resource_reference) : null, result: row.result === "DENIED" ? "DENIED" : "ALLOWED", createdAt: String(row.created_at) })),
  };
}
