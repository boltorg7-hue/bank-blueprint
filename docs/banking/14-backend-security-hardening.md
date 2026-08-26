# PROMPT 14 — MAXIMUM BACKEND SECURITY, SUPABASE HARDENING, RLS, SECRETS & ZERO-TRUST AUTHORIZATION

Continue from PROMPT 00 through PROMPT 13.

This is a SECURITY HARDENING PHASE.

Do NOT rebuild the application.

Do NOT replace working banking domains.

Do NOT weaken the ledger.

Do NOT weaken maker-checker.

Do NOT bypass RLS.

Do NOT expose privileged credentials.

Do NOT introduce offline-first behavior.

Do NOT treat frontend route guards as security boundaries.

The goal is to perform a COMPLETE BACKEND SECURITY REVIEW AND HARDENING of the digital banking platform.

The system now contains highly sensitive capabilities:

- customer identities;
- authentication;
- KYC documents;
- bank accounts;
- balances;
- ledger entries;
- transfers;
- external transfers;
- financial holds;
- compliance cases;
- statements;
- secure documents;
- secure messages;
- notifications;
- customer security controls;
- staff/admin accounts;
- financial adjustments;
- maker-checker approvals;
- reversals.

Every one of these domains must now be audited and hardened.

---

# 1. SECURITY OBJECTIVE

Adopt the principle:

NEVER TRUST THE CLIENT.

Treat every browser request as potentially manipulated.

Treat:

route parameters;

hidden inputs;

React state;

localStorage;

cookies not cryptographically validated;

URL query parameters;

client-generated role values;

client-generated customer IDs;

client-generated account IDs;

client-generated statuses

as UNTRUSTED INPUT.

Authorization decisions must happen on trusted server/database boundaries.

---

# 2. SECURITY PHILOSOPHY

Apply:

DEFENSE IN DEPTH

+

ZERO TRUST

+

LEAST PRIVILEGE

+

DENY BY DEFAULT

+

EXPLICIT AUTHORIZATION

+

IMMUTABLE AUDIT

+

FAIL CLOSED.

If authorization cannot be confidently established:

DENY ACCESS.

Do not fail open.

---

# 3. THREAT MODEL

Create a concise documented threat model.

Consider at minimum:

anonymous attacker;

authenticated malicious customer;

compromised customer account;

malicious/compromised staff account;

privilege-escalation attempt;

IDOR/BOLA attacks;

mass assignment;

stolen token;

stolen server secret;

XSS;

CSRF where relevant;

SQL injection;

unsafe RPC exposure;

Storage object enumeration;

document URL leakage;

API abuse;

brute force;

credential stuffing;

replay of financial commands;

double-submit attacks;

race conditions;

dependency compromise;

configuration mistakes.

Do not assume authenticated users are trustworthy.

---

# 4. SECURITY TRUST BOUNDARIES

Document trust boundaries:

PUBLIC BROWSER

CUSTOMER BROWSER

ADMIN BROWSER

TANSTACK SERVER

EDGE FUNCTIONS

SUPABASE AUTH

POSTGREST / DATA API

POSTGRES

STORAGE

EXTERNAL PROVIDERS.

Clearly identify where authorization must be performed.

---

# 5. DATABASE SCHEMA CLASSIFICATION

Audit every database schema.

Create a deliberate distinction between:

EXPOSED API DATA

and

PRIVATE INTERNAL DATA.

Prefer privileged internal structures in an unexposed schema such as:

```text
private
```

or another intentional internal schema.

Examples that should strongly favor PRIVATE/UNEXPOSED placement:

- raw ledger internals;
- system ledger-account registry;
- financial approval internals;
- internal audit metadata;
- staff authorization helpers;
- risk/compliance internals;
- financial reconciliation internals;
- secret/provider configuration references.

Do not expose internal tables through Data API merely because frontend does not currently query them.

---

# 6. EXPOSED SCHEMAS

Audit Supabase:

Exposed schemas

configuration.

Expose only schemas genuinely needed by customer/admin Data API operations.

Do NOT expose internal schemas by default.

---

# 7. EXPLICIT DATABASE GRANTS

Audit all PostgreSQL grants.

Do not rely on historical defaults.

Explicitly determine privileges for:

```text
anon
authenticated
```

and privileged backend roles.

Remove unnecessary:

SELECT

INSERT

UPDATE

DELETE

EXECUTE

USAGE.

---

# 8. DENY-BY-DEFAULT GRANTS

For highly privileged structures:

revoke broad access first.

Then explicitly grant only required permissions.

Never use:

GRANT ALL

to ordinary authenticated users on banking tables.

---

# 9. SUPABASE API KEY STRATEGY

Review the current project's key configuration.

Prefer current Supabase:

```text
sb_publishable_...
```

for browser-safe client access where supported.

Use:

```text
sb_secret_...
```

only in secure backend/server environments.

If the project still uses legacy:

```text
anon
service_role
```

document the migration plan.

Do not blindly rotate working production credentials without validation.

---

# 10. LEGACY KEY MIGRATION

If supported by the deployed project:

migrate from legacy keys toward:

PUBLISHABLE KEY

+

SECRET KEY.

After all application components are verified against the new key system:

disable legacy keys no longer required.

Do NOT disable active legacy keys prematurely and break production.

---

# 11. SECRET KEY ABSOLUTE RULE

Supabase secret keys/service-role-equivalent privileges bypass RLS.

Therefore:

NEVER expose them in:

browser bundles;

`VITE_*` variables;

public environment variables;

React code;

HTML;

client logs;

source maps;

Git history;

public CI logs.

---

# 12. BUILD-TIME SECRET AUDIT

Inspect generated frontend bundles for accidental secrets.

Search for:

```text
sb_secret_
service_role
SUPABASE_SERVICE_ROLE
JWT secret
private API keys
external provider secrets
```

Fail the security audit if privileged secrets appear in client artifacts.

---

# 13. ENVIRONMENT VARIABLE CLASSIFICATION

Classify variables explicitly as:

PUBLIC

SERVER_ONLY

SECRET.

Example:

PUBLIC:

Supabase URL

publishable key

non-sensitive brand config.

SERVER_ONLY:

secret key

external provider credentials

financial integration credentials

internal webhook secrets.

---

# 14. SECRET MANAGEMENT

Secrets must live in secure platform secret/environment management.

Do not hardcode secrets in:

TypeScript;

SQL migrations;

README;

Lovable prompts;

frontend configuration;

Git repository.

---

# 15. SECRET ROTATION

Document rotation procedures for:

Supabase secret keys;

external provider credentials;

webhook secrets;

database credentials;

JWT signing keys where applicable.

Security architecture must support rotation without rewriting the application.

---

# 16. JWT SIGNING STRATEGY

Audit Supabase Auth signing-key configuration.

Where supported, prefer modern asymmetric JWT signing keys.

Prefer:

ES256 / P-256

or the currently recommended secure asymmetric strategy.

Avoid new production dependence on legacy shared JWT secret when migration is available.

---

# 17. JWT VERIFICATION

Server code must VALIDATE JWTs.

Do not merely:

decode token

and trust claims.

Verify:

signature;

issuer;

audience where applicable;

expiry;

expected token context.

Use official Supabase-supported verification mechanisms.

---

# 18. NEVER TRUST CLIENT JWT CLAIM OVERRIDES

A client must never be able to claim:

```text
role=admin
customer_id=...
mfa_verified=true
```

and gain privileges without server-verified claims/backend state.

---

# 19. AUTHORIZATION DATA

Do not place rapidly changing high-risk authorization state only in long-lived JWT custom claims.

Examples:

financial permissions;

account freeze;

staff suspension.

For sensitive actions:

revalidate authoritative database state.

---

# 20. SESSION SECURITY

Preserve PROMPT 11.

Audit:

session lifetime;

inactivity rules;

maximum sessions where supported;

refresh behavior;

revocation behavior;

staff vs customer policy.

High-privilege staff should use stronger session policies.

---

# 21. SHORT-LIVED ACCESS TOKENS

Use reasonable access-token lifetime according to Supabase security configuration.

Do not create custom multi-day bearer tokens for banking APIs.

---

# 22. REFRESH TOKEN SECURITY

Never log refresh tokens.

Never expose them in URLs.

Use official authentication/session mechanisms.

---

# 23. AUTH SCHEMA

Do not expose raw:

```text
auth.users
auth.sessions
```

through customer APIs.

Create safe profile/session abstractions.

---

# 24. RLS MASTER AUDIT

Create a complete inventory of every application table.

For EVERY exposed table document:

RLS enabled?

SELECT policy?

INSERT policy?

UPDATE policy?

DELETE policy?

Staff policy?

Backend-only?

Storage relation?

Test coverage?

No table may be skipped.

---

# 25. RLS ENABLED

Enable RLS on EVERY table accessible through the Data API unless there is a documented and reviewed reason not to.

Do not assume SQL-created tables automatically have the desired security state.

---

# 26. RLS DENY DEFAULT

With RLS enabled:

absence of a valid policy should mean no ordinary client access.

Add policies intentionally.

---

# 27. CUSTOMER OWNERSHIP POLICY

Customer-owned resources must typically validate:

```text
(select auth.uid()) = trusted_owner_auth_user_id
```

or a safe ownership relation.

Do not authorize solely using a customer ID supplied by the client.

---

# 28. AUTHENTICATED ROLE

Policies intended for signed-in customers should specify:

```text
TO authenticated
```

Do not unnecessarily execute expensive ownership policy logic for anonymous traffic.

---

# 29. NULL AUTH UID

Explicitly account for unauthenticated state.

Do not assume:

```text
auth.uid() = user_id
```

has intuitive behavior when `auth.uid()` is NULL.

Use clear authenticated-role policies.

---

# 30. ACCOUNT RLS

Audit:

bank_accounts

account balances/projections

account relationships.

Customer can read only authorized account data.

Customer cannot:

INSERT active account;

change account owner;

change currency;

change account status;

change protected identifiers.

---

# 31. BALANCE RLS

Customer:

SELECT permitted safe balance projection.

Customer:

NO INSERT.

NO UPDATE.

NO DELETE.

Financial projection mutation occurs only through trusted ledger procedures.

---

# 32. LEDGER RLS

Raw ledger tables should not have ordinary customer write access.

Strongly prefer:

NO customer direct SELECT to internal ledger entries unless deliberately exposed through a customer-safe view.

NO customer INSERT.

NO customer UPDATE.

NO customer DELETE.

---

# 33. LEDGER PRIVATE SCHEMA

Where practical:

move/protect internal ledger implementation in an unexposed schema.

Expose only controlled read models/server functions required by the application.

Do not make ledger security dependent on obscurity.

---

# 34. TRANSFER RLS

Customer may access only transfers in which they are authorized.

Customer must not directly set:

status;

progress;

destination internal ID;

compliance state;

ledger transaction ID;

settlement status;

hold ID.

---

# 35. BENEFICIARY RLS

Customer may manage only their own beneficiary records.

Protected destination resolution remains server-authoritative.

Prevent destination-ID injection.

---

# 36. COMPLIANCE RLS

Customer may read only customer-safe compliance case information for their own transfer.

Customer cannot:

approve;

reject;

change risk result;

set document accepted;

set progress 100.

---

# 37. KYC RLS

Customer can read/write only permitted onboarding/KYC submission fields.

Customer cannot change:

verified status;

review decision;

staff review metadata.

---

# 38. DOCUMENT RLS

Customer-generated/uploaded document metadata:

ownership-restricted.

Official documents:

customer read only.

Compliance review status:

staff/system controlled.

---

# 39. STATEMENT RLS

Customers can access only statements belonging to their authorized accounts.

No customer can alter:

opening balance;

closing balance;

transaction snapshot;

statement version;

official status.

---

# 40. MESSAGE RLS

Customer can access only their conversations.

Customer can insert messages only as CUSTOMER.

Never allow customer to set:

sender_type = STAFF

or:

SYSTEM.

---

# 41. NOTIFICATION RLS

Customer may:

read own notifications;

mark own notifications read/archive.

Customer cannot create trusted transactional notification events.

---

# 42. SECURITY EVENT RLS

Customer may read customer-safe own security history.

Customer cannot insert/update/delete trusted security events.

---

# 43. STAFF RLS

Staff directory and authorization tables require strict access.

Ordinary customer:

NO ACCESS.

Low-level support staff:

only permitted staff data if required.

Role-management data:

restricted to appropriate administrators.

---

# 44. FINANCIAL ADJUSTMENT RLS

Ordinary customer:

NO CREATE

NO APPROVE

NO EXECUTE.

Staff access uses permission-aware server operations.

Do not expose direct financial-adjustment table writes through broad staff RLS.

---

# 45. AUDIT RLS

Audit logs:

NO ordinary customer modification.

NO ordinary staff UPDATE.

NO ordinary staff DELETE.

Authorized auditors/admin viewers:

read according to role.

---

# 46. RLS POLICY PERFORMANCE

Index columns used frequently in RLS predicates.

Examples:

customer_id

auth_user_id

account_id

owner_id

staff_id.

Do not allow security policies to become a denial-of-service bottleneck.

---

# 47. RLS AUTH FUNCTION OPTIMIZATION

Where safe and appropriate, use patterns such as:

```text
(select auth.uid())
```

rather than repeatedly evaluating unchanged auth functions for every row.

Do not optimize at the cost of correctness.

---

# 48. RLS POLICY TESTS

Every important RLS policy must have tests.

When a migration adds or modifies a policy:

add/update the corresponding security tests in the same change.

Use pgTAP or equivalent Supabase/Postgres testing where practical.

---

# 49. RLS CROSS-USER TEST

For every customer-owned resource:

Customer A attempts to access Customer B object.

Expected:

DENIED / zero authorized rows.

Test:

SELECT

INSERT references

UPDATE

DELETE

RPC.

---

# 50. BOLA / IDOR TEST MATRIX

Explicitly test manipulation of:

customerRef;

accountRef;

transactionRef;

transferRef;

beneficiaryRef;

statementRef;

documentRef;

conversationRef;

notificationRef;

sessionRef.

Changing any reference must never grant unauthorized access.

---

# 51. PROPERTY-LEVEL AUTHORIZATION

Prevent mass assignment.

Do not implement:

```ts
update(table, request.body)
```

on sensitive entities.

Whitelist allowed mutable fields.

---

# 52. CUSTOMER UPDATE DTOs

Example:

customer can change:

preferred display settings

allowed profile values.

Customer cannot change:

```text
role
banking_status
kyc_status
balance
account_status
staff_role
risk_state
ledger_id
transfer_progress
```

even if these fields are injected into request payload.

---

# 53. STAFF UPDATE DTOs

Admin commands also need explicit allowlists.

Do not create:

```text
adminUpdateCustomer(anyFields)
```

for privileged actors.

Use domain commands.

---

# 54. DATABASE FUNCTIONS AUDIT

Inventory EVERY PostgreSQL function/RPC.

For each function document:

schema;

purpose;

security invoker/definer;

who can execute;

whether reachable via Data API;

whether it performs privileged writes;

search_path configuration;

test coverage.

---

# 55. SECURITY INVOKER DEFAULT

Prefer:

SECURITY INVOKER

where elevated privileges are unnecessary.

Do not use SECURITY DEFINER for convenience.

---

# 56. SECURITY DEFINER RESTRICTION

Use SECURITY DEFINER only when required.

For every such function:

```text
SET search_path = ''
```

and schema-qualify every database object.

Example concept:

```sql
SELECT ...
FROM private.financial_adjustments
```

not an unqualified table reference.

---

# 57. SECURITY DEFINER LOCATION

Prefer privileged helper functions in an unexposed schema.

Do not expose powerful functions merely because the frontend could call them.

---

# 58. FUNCTION EXECUTE PRIVILEGES

Audit default function EXECUTE privileges.

For sensitive functions:

REVOKE execute from:

```text
PUBLIC
anon
authenticated
```

unless explicitly needed.

Then grant narrowly.

---

# 59. DEFAULT FUNCTION PRIVILEGES

Consider hardening default privileges so newly created functions do not unexpectedly become callable by broad roles.

Document any global privilege changes carefully.

---

# 60. NO GENERIC FINANCIAL RPC

Ensure there is NO client-accessible function like:

```text
setBalance()
modifyBalance()
postLedgerEntries()
setTransferStatus()
markTransferComplete()
approveKyc()
setUserRole()
```

---

# 61. NARROW FINANCIAL COMMANDS

Only explicit server-authorized operations may reach internal posting logic.

Examples:

executeInternalTransfer

executeApprovedAdjustment

executeApprovedReversal.

Each revalidates authorization and current state.

---

# 62. DATABASE VIEWS AUDIT

Inventory all views.

Remember that view security can differ from underlying table RLS.

Review each view carefully.

---

# 63. SECURITY INVOKER VIEWS

For exposed customer/admin views on supported PostgreSQL versions:

prefer:

```text
security_invoker = true
```

so underlying RLS remains effective.

---

# 64. PRIVILEGED VIEWS

If a view intentionally bypasses normal RLS:

place it in an unexposed/internal context

and expose only through controlled server service.

Document the reason.

---

# 65. SELECT STAR AVOIDANCE

For customer/admin-safe APIs:

avoid:

```sql
SELECT *
```

from sensitive tables.

Return explicit permitted columns.

---

# 66. CUSTOMER-SAFE DTOs

Maintain explicit safe projections.

Example account response should not include:

risk flags;

internal staff notes;

raw ledger IDs;

system control fields.

---

# 67. STAFF ROLE-AWARE DTOs

Do not return full sensitive customer records simply because endpoint belongs to admin.

Shape output by permission.

---

# 68. STORAGE MASTER AUDIT

Inventory every Supabase Storage bucket.

For each:

public/private;

allowed MIME types;

maximum file size;

upload permissions;

download permissions;

owner strategy;

signed URL lifetime;

purpose.

---

# 69. PUBLIC BUCKET POLICY

Sensitive banking data must NEVER live in public buckets.

Private only:

KYC;

compliance documents;

statements;

receipts;

message attachments;

financial evidence.

---

# 70. STORAGE OWNERSHIP

Do not assume Storage `owner_id` automatically protects access.

RLS/storage policies must explicitly enforce access.

---

# 71. STORAGE POLICIES

Audit:

SELECT

INSERT

UPDATE

DELETE

on `storage.objects`.

Restrict by:

bucket;

authenticated identity;

authorized business resource.

---

# 72. STORAGE API USAGE

Do not directly mutate Supabase Storage metadata tables for normal file operations.

Use supported Storage API operations.

---

# 73. FILE PATHS

Do not use predictable file paths as authorization.

A path being difficult to guess is NOT security.

---

# 74. SIGNED URL LIFETIME

Use short-lived signed URLs for sensitive document access.

Avoid long-duration links.

Remember:

signed URL remains valid until its expiry.

Therefore keep expiry short for highly sensitive data.

---

# 75. DOCUMENT DOWNLOAD AUTHORIZATION

Authorization occurs BEFORE generating signed URL.

Do not simply accept:

storagePath

from client.

Resolve authorized document from safe document reference.

---

# 76. FILE UPLOAD TYPE

Enforce allowed MIME types/size in:

storage configuration

and

server validation.

Do not trust filename extension.

---

# 77. FILE CONTENT VALIDATION

Where practical:

inspect server-detected file type.

Reject inconsistent or unsupported uploads.

---

# 78. DANGEROUS FILES

Do not allow executable/script files in customer document uploads.

Restrict to required document formats.

---

# 79. FILE NAME SANITIZATION

Do not use raw uploaded filename as storage authorization key.

Generate safe internal object names.

Store display filename separately if required.

---

# 80. MALWARE SCANNING READINESS

Prepare a security integration boundary for file malware scanning if production compliance requires it.

If no scanning provider exists:

do NOT claim files are malware-scanned.

---

# 81. SERVER FUNCTION SECURITY

Audit all TanStack server functions / Edge Functions.

Every privileged handler must:

authenticate;

authorize;

validate input;

validate resource ownership;

validate state;

rate-limit where appropriate;

use idempotency when financial;

return safe DTO.

---

# 82. NO AUTHORIZATION BY ROUTE

This is forbidden:

```text
/admin URL means user is admin
```

The server must independently validate staff authorization.

---

# 83. INPUT VALIDATION

Use schema validation on every server boundary.

Validate:

type;

length;

enum;

format;

range;

references.

Reject unknown fields for sensitive commands where practical.

---

# 84. SQL INJECTION

Use parameterized Supabase/PostgreSQL APIs.

Do not concatenate untrusted request values into raw SQL.

Audit all raw SQL generation.

---

# 85. DYNAMIC ORDER/FILTER

Whitelist dynamic:

sort columns;

filter fields;

table names if applicable.

Never insert arbitrary client strings into SQL identifiers.

---

# 86. XSS DEFENSE

Treat all customer/staff free text as untrusted.

Escape or safely render:

transfer notes;

support messages;

internal notes;

beneficiary nicknames;

document titles.

Avoid `dangerouslySetInnerHTML`.

If genuinely required:

use rigorous sanitizer with allowlist.

---

# 87. CONTENT SECURITY POLICY

Add/verify a restrictive CSP compatible with required application functionality.

Prefer:

explicit allowed origins

rather than broad wildcards.

Avoid:

```text
unsafe-eval
```

and unnecessary:

```text
unsafe-inline
```

where architecture permits.

---

# 88. SECURITY HEADERS

Review appropriate headers such as:

Content-Security-Policy

X-Content-Type-Options

Referrer-Policy

Permissions-Policy

frame protection via CSP/frame-ancestors

HSTS at production HTTPS layer.

Do not add conflicting/obsolete headers blindly.

---

# 89. CLICKJACKING PROTECTION

Sensitive bank/admin pages should not be freely embedded in hostile third-party frames.

Use:

CSP frame-ancestors

appropriately.

---

# 90. HTTPS ONLY

Production banking application must use HTTPS.

Do not send:

auth tokens;

banking data;

documents

over plaintext HTTP.

---

# 91. DATABASE SSL

Enable/enforce SSL for direct Postgres connections where supported and operationally appropriate.

---

# 92. DATABASE NETWORK RESTRICTIONS

For direct Postgres/pooler access:

use Supabase Network Restrictions where compatible with deployment architecture.

Allow only required IP ranges/connections.

Document exceptions.

Remember that these restrictions do not replace API authorization.

---

# 93. DIRECT DATABASE ACCESS

Avoid unnecessary direct DB access from developer laptops/third parties in production.

Use controlled credentials and least privilege.

---

# 94. PRODUCTION DATABASE PASSWORD

Use strong randomly generated credentials.

Never reuse developer passwords.

Never store them in frontend environment.

---

# 95. EDGE FUNCTION SECRETS

External provider credentials belong in Edge/server secrets.

Do not return them to client.

---

# 96. CORS

Configure CORS narrowly.

Allow only intended production origins for sensitive custom server APIs where applicable.

Do not blindly use:

```text
Access-Control-Allow-Origin: *
```

for credentialed privileged APIs.

---

# 97. CORS IS NOT AUTHORIZATION

Even correct CORS does not replace authentication/RLS.

Do both.

---

# 98. CSRF

Audit whether any authentication/session mechanism uses cookies.

For cookie-authenticated state-changing requests:

implement appropriate CSRF protection and SameSite policy.

Do not add unnecessary custom CSRF mechanism if architecture uses bearer-token flows where it is not applicable.

Document the threat model.

---

# 99. COOKIES

Where secure cookies are used:

prefer appropriate:

Secure

HttpOnly

SameSite

Path

expiration settings.

Do not store sensitive custom authorization flags in unsigned cookies.

---

# 100. OPEN REDIRECTS

Audit:

login redirects;

notification deep links;

password reset callbacks;

step-up return URLs.

Allow only approved internal destinations.

---

# 101. SSR AUTH SECURITY

Follow official Supabase SSR/session patterns for the current stack.

Do not trust stale client-side user objects for server authorization.

Server must obtain validated authentication context.

---

# 102. SERVER REQUEST AUTH

Every protected server action must resolve current authenticated identity from trusted request/session context.

Do not accept:

```text
authUserId
```

from request body as identity proof.

---

# 103. ADMIN IDENTITY

Admin server action resolves staff identity from authenticated user.

Then loads authoritative:

staff status

roles

permissions.

Client does not provide trusted role.

---

# 104. STAFF SUSPENSION

Every sensitive staff operation should revalidate:

staff.status == ACTIVE.

A suspended staff token must not continue privileged operations simply because JWT has not expired.

---

# 105. PERMISSION REVALIDATION

For critical operations, resolve current permissions at execution time.

Do not rely exclusively on a permission snapshot loaded hours earlier.

---

# 106. FINANCIAL STEP-UP

Preserve PROMPT 11/13.

Sensitive financial commands should validate required authentication assurance.

Do not trust:

```text
mfaComplete=true
```

from client.

---

# 107. RATE LIMITING

Implement/rationalize server-side rate limiting for attack-prone endpoints:

login-related wrappers;

registration;

password recovery;

OTP resend;

MFA challenge;

beneficiary lookup;

document upload;

message send;

global search;

statement generation;

PDF generation;

external settlement status queries.

---

# 108. FINANCIAL RATE LIMITING

Financial commands require:

idempotency

and reasonable rate/abuse controls.

Never depend solely on button disable.

---

# 109. BENEFICIARY LOOKUP ABUSE

Prevent internal beneficiary resolution from becoming a bank customer enumeration API.

Use:

rate limits;

minimum required identifier;

minimal responses;

monitoring.

---

# 110. LOGIN BRUTE FORCE

Use Supabase Auth/provider protections.

Do not reveal whether email exists through detailed errors.

---

# 111. OTP ABUSE

Protect send/resend endpoints.

Use server/provider throttling.

Do not rely only on visible countdown timer.

---

# 112. RESOURCE CONSUMPTION

Protect expensive functionality:

PDF generation;

large reports;

large date ranges;

file uploads;

search.

Apply bounds.

---

# 113. MAXIMUM QUERY LIMITS

Set sensible maximum page sizes.

Do not let client request:

```text
limit=1000000
```

on sensitive endpoints.

---

# 114. PAGINATION

Use server-side pagination for large datasets.

---

# 115. REQUEST SIZE

Limit body/file sizes appropriately.

---

# 116. FINANCIAL IDEMPOTENCY AUDIT

Review every money-moving command:

internal transfer;

external transfer submission;

admin credit;

admin debit;

reversal.

Confirm stable idempotency.

---

# 117. REPLAY PROTECTION

A previously completed financial request must not execute again because the same payload is replayed.

Bind idempotency to:

actor

operation

business resource

appropriate request context.

---

# 118. STATE MACHINE AUTHORITY

Audit all workflow statuses.

Customers must not directly set:

KYC verified

account active

transfer completed

progress 100

document accepted

financial adjustment approved.

Staff permissions must also follow allowed state transitions.

---

# 119. DATABASE CONSTRAINTS AS SECURITY

Use constraints as another protection layer.

Examples:

positive financial amount;

valid currency;

foreign-key integrity;

unique references;

one ledger posting per operation;

maker != checker where applicable;

valid ownership.

---

# 120. FOREIGN KEYS

Audit all critical relationships.

Prevent orphan:

transfers;

ledger entries;

documents;

approval decisions;

balances.

---

# 121. DELETE POLICIES

Be extremely conservative with DELETE on banking data.

Financial/audit history should generally be preserved.

Use lifecycle/archive/status instead of deletion where required.

---

# 122. IMMUTABLE FINANCIAL TABLES

Ensure posted ledger entries cannot be modified/deleted through ordinary roles.

---

# 123. IMMUTABLE AUDIT

Ensure audit events cannot be modified/deleted by normal staff.

---

# 124. DATABASE TRIGGERS

Audit triggers for privilege/security risks.

Ensure triggers:

do not trust client-controlled protected fields;

do not create privilege escalation;

use explicit schemas.

---

# 125. SEARCH_PATH ATTACK RESISTANCE

For privileged PostgreSQL functions:

pin search_path.

Fully qualify relations.

Do not leave privilege escalation through object-name shadowing.

---

# 126. EXTENSIONS

Inventory PostgreSQL extensions.

Keep only needed extensions.

Document security impact of privileged extensions.

Do not enable arbitrary extensions for convenience.

---

# 127. DATABASE ROLES

Inventory PostgreSQL roles and grants.

Remove unused privileged roles where safe.

Do not allow application clients to connect as database owner.

---

# 128. MIGRATION SECURITY

Schema/RLS/grant changes must be migration-controlled.

Do not make undocumented manual production security changes.

---

# 129. SECURITY MIGRATION REVIEW

Every migration touching:

RLS;

GRANT;

FUNCTION;

TRIGGER;

STORAGE policy;

financial constraint

must receive explicit security review.

---

# 130. ENVIRONMENT SEPARATION

Maintain distinct:

development

staging

production

environments.

Do not reuse production secrets in preview/development environments.

---

# 131. DEVELOPMENT DATA

Do not copy real customer banking/KYC data into development environments.

Use sanitized/synthetic test data.

---

# 132. PREVIEW DEPLOYMENTS

Preview deployments must not automatically receive full production secrets.

Use restricted credentials/environment configuration.

---

# 133. CI/CD SECURITY

Protect deployment secrets.

Do not print secrets in build logs.

Use least-privilege CI credentials.

---

# 134. DEPENDENCY AUDIT

Audit frontend/backend dependencies.

Remove:

unused packages;

abandoned packages;

duplicate security libraries.

Check known vulnerabilities with configured package tooling.

---

# 135. LOCKFILE

Keep package lockfile committed and controlled.

Avoid unpredictable dependency resolution in production.

---

# 136. DEPENDENCY UPDATES

Security updates should be deliberate and tested.

Do not blindly auto-update major financial dependencies without validation.

---

# 137. SUPPLY-CHAIN SAFETY

Review new packages before installation.

Ask:

Is this actually necessary?

Is it maintained?

Does an existing dependency already solve the problem?

Avoid installing packages for trivial helpers.

---

# 138. EXTERNAL SCRIPTS

Minimize third-party browser scripts on authenticated banking/admin pages.

Every third-party script increases XSS/data-exfiltration risk.

---

# 139. ANALYTICS

Do not send sensitive banking data to generic analytics.

Forbidden:

balances;

account numbers;

transaction amounts;

KYC details;

message contents;

document names;

staff internal notes.

---

# 140. ERROR TRACKING

Sanitize observability payloads.

Do not send secrets/PII automatically in exception contexts.

---

# 141. LOGGING POLICY

Create explicit structured logging rules.

Allowed examples:

request correlation ID;

operation reference;

safe status;

error category.

Never log:

password;

OTP;

access token;

refresh token;

MFA secret;

recovery code;

secret key;

raw KYC document;

full card/bank credentials.

---

# 142. CORRELATION IDS

Use safe request/operation correlation IDs for debugging security incidents.

Do not use sensitive financial identifiers as public trace IDs unnecessarily.

---

# 143. SECURITY EVENTS

Create/centralize internal security events.

Examples:

authorization_denied

suspicious_rate_limit

staff_permission_denied

invalid_financial_transition

duplicate_financial_request

storage_access_denied

security_definer_failure

integrity_mismatch.

---

# 144. ALERTING

Prepare operational alerting for high-risk signals.

Examples:

repeated admin authorization failures;

large spike in login failures;

repeated cross-object access attempts;

ledger/projection mismatch;

unexpected secret-key use;

multiple failed maker-checker attempts.

Avoid fake AI threat detection.

---

# 145. AUDIT AUTHORIZATION FAILURES

Log significant privileged authorization failures safely.

Do not flood audit logs with every harmless public 404.

---

# 146. ADMIN SENSITIVE VIEW AUDIT

Record access to highly sensitive:

KYC files;

financial evidence;

full account identifiers

when policy requires.

---

# 147. CUSTOMER DATA MINIMIZATION

Review database fields.

Remove/avoid storing personal data that serves no legitimate product/regulatory purpose.

More stored data means more breach impact.

---

# 148. ENCRYPTION AT REST

Use platform-provided encrypted infrastructure.

If application-layer encryption is required for especially sensitive fields:

use vetted cryptographic libraries/key management.

Do NOT create custom encryption algorithms.

---

# 149. PASSWORDS

Passwords remain solely under Supabase Auth.

No password copy in application database.

---

# 150. MFA SECRETS

No custom plaintext MFA-secret storage.

Use provider-supported secure flows.

---

# 151. EXTERNAL PROVIDER WEBHOOKS

For future external settlement/communication providers:

verify webhook signatures/authenticity.

Do not accept unsigned callback saying:

```text
transfer=SUCCESS
```

---

# 152. WEBHOOK REPLAY

Where provider supports it:

validate timestamp/event ID

and deduplicate webhook events.

---

# 153. WEBHOOK SOURCE

Do not trust provider result merely because endpoint URL is obscure.

Use cryptographic/provider authentication.

---

# 154. EXTERNAL SETTLEMENT COMPLETION

External transfer 100% remains protected.

A forged browser/API call must never be able to mark external settlement successful.

---

# 155. ADMIN FINANCIAL EXECUTION

A forged request must not bypass:

staff active status;

permission;

maker-checker;

step-up;

approved state;

idempotency;

ledger atomicity.

---

# 156. PUBLIC REFERENCE SECURITY

Opaque references reduce easy enumeration.

However:

they do NOT replace authorization.

Even UUID-like references require ownership/permission checks.

---

# 157. RESPONSE DIFFERENCES

Avoid revealing whether unauthorized private object exists when unnecessary.

Use safe:

not found / unavailable

patterns.

---

# 158. ERROR DETAIL

Customer-facing errors must not contain:

SQL;

table names;

policy names;

stack traces;

provider credentials;

internal filesystem paths.

---

# 159. PRODUCTION DEBUG MODE

Disable verbose development/debug output in production.

---

# 160. SOURCE MAPS

Review production source-map exposure according to debugging/security needs.

Do not accidentally publish embedded secrets regardless of source-map policy.

Secrets must never be in frontend source in the first place.

---

# 161. CUSTOMER PAGES INDEXING

Ensure authenticated customer/admin pages are not search-indexed.

---

# 162. ADMIN DISCOVERY

Do not depend on hiding `/admin`.

Even if attackers know the route:

authorization must block them.

---

# 163. BOT PROTECTION

Apply appropriate anti-bot measures to public abuse-prone flows where necessary.

Examples:

registration;

password recovery;

contact forms.

Do not block accessibility unnecessarily.

---

# 164. CAPTCHA

If challenge technology is introduced:

use reputable integration

and server validation.

Do not build homegrown CAPTCHA.

---

# 165. FINANCIAL BUSINESS FLOW ABUSE

Protect sensitive business flows from automation.

Examples:

rapid beneficiary enumeration;

mass statement generation;

transfer-confirm spam;

document upload abuse.

---

# 166. SESSION FIXATION

Use official auth flows.

Ensure authentication establishes valid new provider session context.

Do not build custom reusable session IDs.

---

# 167. PRIVILEGE ESCALATION TEST

Customer modifies client state to:

```text
role=SUPER_ADMINISTRATOR
```

Expected:

no privilege change.

---

# 168. MASS ASSIGNMENT TEST

Customer sends protected fields in profile update:

```text
banking_status=ACTIVE
kyc_status=VERIFIED
```

Expected:

ignored/rejected.

---

# 169. ADMIN MASS ASSIGNMENT TEST

Support agent sends:

```text
role=SUPER_ADMINISTRATOR
```

during unrelated update.

Expected:

rejected.

---

# 170. ACCOUNT OWNERSHIP TEST

Customer A requests Customer B account reference.

Expected:

denied.

---

# 171. TRANSACTION OWNERSHIP TEST

Customer A requests Customer B transaction.

Expected:

denied.

---

# 172. DOCUMENT OWNERSHIP TEST

Customer A requests Customer B statement signed URL.

Expected:

no URL generated.

---

# 173. STORAGE PATH TAMPER TEST

Customer replaces own object path with another known path.

Expected:

denied.

---

# 174. FUNCTION EXECUTION TEST

Authenticated customer attempts to directly invoke every privileged RPC.

Expected:

EXECUTE denied or internal authorization denies operation.

---

# 175. FUNCTION DISCOVERY REVIEW

Assume attackers may discover endpoint/function names.

Security must remain intact even with complete API knowledge.

---

# 176. STAFF PERMISSION TEST MATRIX

Test each role:

SUPPORT_AGENT

KYC_AGENT

COMPLIANCE_OFFICER

FINANCE_OPERATOR

SUPERVISOR

ADMINISTRATOR

SUPER_ADMINISTRATOR

AUDITOR.

Test permitted AND forbidden commands.

---

# 177. AUDITOR TEST

Auditor:

read allowed data.

No financial mutation.

No KYC decision.

No staff escalation.

---

# 178. SUPPORT TEST

Support:

cannot read raw ledger;

cannot credit;

cannot approve financial adjustment;

cannot reveal restricted KYC data without permission.

---

# 179. FINANCE TEST

Finance Operator:

cannot self-approve four-eyes action;

cannot grant themselves permissions.

---

# 180. SUPER ADMIN TEST

Even Super Admin:

cannot directly rewrite posted ledger journal.

Financial immutability remains.

---

# 181. RLS AUTOMATED TEST SUITE

Build a repeatable security test suite.

For each major table:

anonymous

customer owner

other customer

staff allowed role

staff forbidden role

backend/internal role.

---

# 182. TEST EXPECTATIONS

Explicitly assert:

allowed rows

forbidden rows

allowed command

forbidden command.

Do not rely on visual/manual inspection alone.

---

# 183. PG TAP

Where practical, use pgTAP/Supabase database tests for:

RLS;

grants;

functions;

constraints.

---

# 184. SERVER INTEGRATION SECURITY TESTS

Also test TanStack/Edge/server functions externally through their normal call boundaries.

Database tests alone are insufficient.

---

# 185. NEGATIVE TESTING

Security test suite must intentionally try forbidden actions.

Security is not proven by testing only successful workflows.

---

# 186. FINANCIAL PENETRATION-STYLE TESTS

Safely test in development/staging:

duplicate transfer submission;

forged transfer completion;

forged admin approval;

direct balance update;

direct ledger write;

maker self-approval;

hold capture/release tampering.

Expected:

all unauthorized variants fail.

---

# 187. NO PRODUCTION DESTRUCTIVE SECURITY TESTING

Do not run destructive attack simulations against live production customer data.

Use isolated staging/test environment.

---

# 188. DATABASE INTEGRITY TESTS

Re-run financial guarantees from PROMPT 06–13:

balanced journal;

immutable posted entries;

one posting per operation;

projection reconciliation;

currency validation;

maker-checker;

reversal integrity.

---

# 189. FAIL-CLOSED TEST

Simulate authorization dependency failure.

Sensitive operation must deny rather than proceed with missing permission information.

---

# 190. SECRET SCANNING

Add repository/build checks where possible for accidentally committed credentials.

Look for common secret patterns.

Do not print found secrets into public logs.

---

# 191. GIT HISTORY

If a secret was ever committed:

removing the current file is insufficient.

Rotate/revoke compromised credential.

Do not consider Git deletion alone remediation.

---

# 192. SECURITY DOCUMENTATION

Create/update a dedicated security document.

Suggested:

```text
SECURITY_ARCHITECTURE.md
```

Cover:

trust boundaries;

authentication;

authorization;

RLS;

staff RBAC;

financial security;

storage;

secrets;

audit;

incident response basics.

---

# 193. SECURITY POLICY MATRIX

Create a clear matrix:

RESOURCE

CUSTOMER READ

CUSTOMER WRITE

SUPPORT

KYC

COMPLIANCE

FINANCE

SUPERVISOR

ADMIN

AUDITOR

SERVER INTERNAL.

Use it as review documentation and test input.

---

# 194. RLS MATRIX DOCUMENT

List every exposed table and its policies.

No hidden unreviewed tables.

---

# 195. FUNCTION SECURITY MATRIX

List every RPC/function:

callable by

security mode

search_path

purpose.

---

# 196. STORAGE SECURITY MATRIX

List every bucket:

public/private

upload roles

download roles

allowed file types

maximum size.

---

# 197. SECRET INVENTORY

Document secret NAMES and ownership/rotation procedure.

Never document actual secret VALUES.

---

# 198. SECURITY INCIDENT READINESS

Prepare basic incident procedure:

detect

contain

revoke/rotate compromised credentials

disable affected staff/customer session

preserve audit evidence

reconcile financial state

restore safe service.

Do not overbuild enterprise SOC tooling in this prompt.

---

# 199. COMPROMISED CUSTOMER ACCOUNT

Support actions:

revoke sessions

force/recommend credential reset

security restriction

review activity

notify customer.

Use PROMPT 11.

---

# 200. COMPROMISED STAFF ACCOUNT

Immediate actions should support:

disable staff

revoke sessions

audit privileged actions

rotate affected credentials if needed.

---

# 201. COMPROMISED SECRET

Document:

revoke

rotate

identify exposure window

review audit

redeploy affected server components.

---

# 202. LEDGER BREACH RESPONSE

If suspicious financial state appears:

do not manually edit ledger.

Use audit + reconciliation + controlled reversal/correction.

---

# 203. DATABASE BACKUPS

Review production backup/PITR strategy appropriate to available Supabase plan and banking requirements.

Security includes recoverability.

Do not claim backup capability that is not actually enabled.

---

# 204. BACKUP ACCESS

Backup administration must be restricted to appropriate platform administrators.

---

# 205. RESTORE TEST READINESS

Document how restore procedures would be tested in non-production environment.

Do not test destructive restoration against production casually.

---

# 206. DATA LOSS PREVENTION

Prevent accidental destructive administrative actions.

Financial/audit records should not have generic delete controls.

---

# 207. SECURITY BASELINE CHECK

At application startup/deployment validation, detect dangerous configurations where feasible.

Examples:

public sensitive bucket;

RLS disabled on critical exposed table;

missing financial constraint.

Do not silently continue if critical security invariant is known broken.

---

# 208. PRODUCTION DEPLOYMENT GATE

Before production release require:

security tests pass;

RLS tests pass;

financial integrity tests pass;

TypeScript/build pass;

no secret leakage;

no critical dependency vulnerability known and unaddressed;

migration review complete.

---

# 209. STATIC SECURITY REVIEW

Search codebase for dangerous patterns:

```text
service_role
sb_secret_
dangerouslySetInnerHTML
SELECT *
GRANT ALL
SECURITY DEFINER
disable row level security
localStorage.role
localStorage.isAdmin
balance =
progress = 100
```

Review each occurrence rather than blindly deleting legitimate secure server usage.

---

# 210. DATABASE SECURITY REVIEW

Search SQL migrations for:

RLS disabled;

overly broad policies;

public EXECUTE;

unqualified SECURITY DEFINER references;

broad grants;

unprotected views.

---

# 211. SUPABASE ADVISORS

Run available Supabase security/database advisors where supported.

Review findings.

Do not blindly ignore warnings.

Document intentional exceptions.

---

# 212. PERFORMANCE VS SECURITY

Do not remove RLS because a query is slow.

Optimize:

indexes;

policies;

safe helper functions;

queries.

Preserve authorization.

---

# 213. PRIVILEGED HELPER FUNCTIONS

If RLS helper functions are required:

keep them narrowly scoped.

Example:

has_permission(permission_code)

rather than returning complete staff authorization data unnecessarily.

---

# 214. PERMISSION FUNCTION

A privileged helper must derive caller from:

auth.uid()

not accept trusted caller ID from client.

---

# 215. FINANCIAL AUTHORIZATION

Financial posting internal functions must not be directly executable by ordinary authenticated users.

---

# 216. SETTLEMENT PROVIDER SECURITY

External provider calls:

server-only;

provider secrets server-only;

responses validated;

errors sanitized;

idempotency preserved.

---

# 217. PROVIDER RESPONSE VALIDATION

Never trust external API data blindly.

Validate schema and expected state transitions.

---

# 218. SSRF DEFENSE

Do not allow customer/admin input to determine arbitrary backend URLs fetched by server.

External provider endpoints must come from trusted configuration.

---

# 219. FILE FETCH DEFENSE

Do not create server endpoint:

fetch any URL and attach file.

Only trusted sources/configured workflows.

---

# 220. URL VALIDATION

Where URLs are accepted for legitimate purposes:

validate scheme/domain and purpose.

---

# 221. CUSTOMER HTML CONTENT

Keep customer messaging and transfer references plain text for V1.

This dramatically reduces injection surface.

---

# 222. FRAMEWORK ESCAPING

Preserve React's normal escaping.

Do not bypass it unnecessarily.

---

# 223. FRONTEND AUTHORIZATION DISPLAY

Continue using PermissionGate/UI guards for UX.

But clearly document:

UI guard ≠ security control.

---

# 224. DISABLED BUTTONS

A disabled button does not protect an endpoint.

Server authorization remains mandatory.

---

# 225. HIDDEN ROUTES

A hidden admin route is not protected.

Server authorization remains mandatory.

---

# 226. OPAQUE IDS

Opaque references help reduce enumeration.

Still enforce object authorization.

---

# 227. CLIENT-SIDE VALIDATION

Client validation improves UX only.

Server/database validation is authoritative.

---

# 228. CUSTOMER ACCOUNT STATUS

Every financial command rechecks:

customer status;

account status;

transfer permissions

at execution.

Do not rely on dashboard state.

---

# 229. HOLD SECURITY

Customer cannot directly:

create;

release;

capture

holds.

Staff hold release requires narrow permission and state validation.

---

# 230. STATEMENT SECURITY

Official statement generation derives:

customer

account

transactions

balances

server-side.

Do not accept client-supplied financial snapshot.

---

# 231. PDF SECURITY

Escape document contents.

Prevent arbitrary HTML/template injection.

Bound transaction count/range.

---

# 232. MESSAGE ATTACHMENTS

Validate authorized conversation relationship before permitting attachment access.

---

# 233. NOTIFICATION SECURITY

Notification links must not grant access by themselves.

Authentication + resource authorization still required.

---

# 234. PASSWORD RESET

Preserve safe generic responses.

Avoid account enumeration.

---

# 235. MFA

Provider-controlled.

No arbitrary database update enabling/disabling MFA.

---

# 236. STAFF MFA

Prepare/require strong MFA for privileged staff production policy where supported.

---

# 237. STEP-UP

Financial approval commands should require valid server-side assurance where policy requires.

---

# 238. AUDIT CLOCK

Use database/server timestamps.

Do not trust client clocks for official audit events.

---

# 239. TIME MANIPULATION

Client cannot backdate:

financial transactions;

staff approval;

document review;

security event.

---

# 240. CURRENT IMPLEMENTATION SCOPE

Perform and implement:

1. Complete security threat model.
2. Database schema exposure audit.
3. Supabase key-strategy audit.
4. Migration toward publishable/secret keys where appropriate.
5. JWT signing-key/security review.
6. Authentication/session hardening.
7. Complete table inventory.
8. RLS on all exposed sensitive tables.
9. Deny-by-default policy review.
10. Cross-customer ownership protection.
11. Role/permission RLS review.
12. Property-level authorization.
13. Mass-assignment protection.
14. Database-function inventory.
15. SECURITY INVOKER/DEFINER hardening.
16. `search_path` hardening.
17. EXECUTE privilege hardening.
18. Database-view hardening.
19. Private-schema strategy.
20. Storage bucket audit.
21. Storage RLS.
22. Signed URL policy.
23. File-upload restrictions.
24. Server-function authorization review.
25. Input validation review.
26. SQL-injection review.
27. XSS review.
28. CSP/security headers.
29. CORS review.
30. CSRF/cookie review where applicable.
31. Network/SSL hardening.
32. Secret management.
33. Secret rotation readiness.
34. Rate limiting.
35. Abuse protections.
36. Financial replay/idempotency review.
37. Database constraints review.
38. Immutable financial/audit enforcement.
39. Dependency security audit.
40. Logging/privacy review.
41. Security event/alert foundation.
42. Environment separation.
43. Security documentation.
44. RLS matrix.
45. Permission matrix.
46. Function matrix.
47. Storage matrix.
48. Automated RLS tests.
49. Cross-user negative tests.
50. Staff privilege tests.
51. Financial tampering tests.
52. Build-time secret scan.
53. Production deployment security gate.
54. Backup/recovery readiness documentation.

---

# 241. DO NOT IMPLEMENT

Do NOT introduce:

homemade cryptography;

security through obscurity;

generic unrestricted admin RPCs;

frontend service-role access;

client-authoritative roles;

direct balance editing;

direct ledger editing;

client-generated KYC approval;

client-generated transfer completion;

public sensitive Storage buckets;

offline financial actions.

---

# 242. PRESERVE PROMPT 13

Admin financial actions must remain:

ledger-backed;

maker-checker;

idempotent;

audited.

Backend hardening must make them MORE secure, not bypass them.

---

# 243. PRESERVE PROMPT 12

RBAC remains authoritative.

No admin universal bypass.

---

# 244. PRESERVE PROMPT 11

MFA, sessions and step-up remain authoritative security mechanisms.

---

# 245. PRESERVE PROMPT 10

Secure messaging/notification privacy remains intact.

---

# 246. PRESERVE PROMPT 09

Documents remain private and server-authorized.

---

# 247. PRESERVE PROMPT 08

External transfer cannot reach 100% through forged client state.

---

# 248. PRESERVE PROMPT 07

Internal transfers remain atomic.

---

# 249. PRESERVE PROMPT 06

Ledger remains the financial source of truth.

---

# 250. PRESERVE PROMPT 05

Balances remain server-controlled projections.

---

# 251. PRESERVE PROMPT 04

Customer route guards remain UX layer plus trusted server authorization.

---

# 252. PRESERVE PROMPT 03

Supabase Auth remains authentication authority.

---

# 253. PRESERVE PROMPT 02

Public website remains isolated from privileged banking modules.

---

# 254. PRESERVE PROMPT 01

Design system remains unchanged unless security/accessibility needs require small component improvements.

---

# 255. PRESERVE PROMPT 00

Maintain:

simple modular architecture;

online-only behavior;

server authority;

clear feature/service boundaries.

---

# 256. CRITICAL FINAL SECURITY TEST

Attempt as an ordinary authenticated customer:

- read another customer's account;
- read another customer's balance;
- read another customer's transaction;
- read another customer's transfer;
- download another customer's statement;
- read another customer's KYC document;
- invoke privileged ledger RPC;
- credit own account;
- set own account ACTIVE;
- set KYC VERIFIED;
- set transfer 100%;
- assign ADMIN role;
- approve own document.

Every operation must fail.

---

# 257. CRITICAL STAFF SECURITY TEST

Attempt as SUPPORT_AGENT:

- credit account;
- approve KYC;
- change staff role;
- post ledger;
- approve adjustment;
- read restricted KYC file.

Every unauthorized action must fail.

---

# 258. FINANCE SECURITY TEST

Attempt as FINANCE_OPERATOR:

- approve own adjustment;
- rewrite ledger entry;
- alter audit history;
- change own role;
- bypass step-up.

Every unauthorized action must fail.

---

# 259. SUPER ADMIN SECURITY TEST

Attempt as SUPER_ADMINISTRATOR:

directly modify POSTED ledger entry.

Expected:

REJECTED.

Financial immutability is stronger than ordinary application administration.

---

# 260. SECRET LEAK TEST

Build production frontend.

Inspect client assets.

Expected:

NO:

```text
sb_secret_
service_role
database password
provider secret
private signing key
```

---

# 261. STORAGE SECURITY TEST

Guess or obtain another customer's storage path.

Expected:

no access without authorization.

---

# 262. SIGNED URL TEST

Expired signed URL:

must no longer work after expiry according to provider behavior.

Use short lifetimes for sensitive files.

---

# 263. SECURITY DEFINER TEST

Review every SECURITY DEFINER function.

Expected:

justified;

search_path pinned;

relations schema-qualified;

execution restricted.

---

# 264. RLS COVERAGE TEST

Every exposed sensitive table:

RLS enabled

+

tested.

No accidental unprotected table.

---

# 265. VIEW SECURITY TEST

Every exposed view:

security semantics documented.

Customer-safe views obey underlying authorization.

---

# 266. FINANCIAL TAMPERING TEST

Manipulate request payload:

```text
amount
senderAccount
recipientAccount
status
progress
ledgerTransactionId
approvedBy
```

Server must rederive/revalidate protected values.

---

# 267. REPLAY TEST

Replay completed transfer/admin adjustment request.

Expected:

no duplicate financial impact.

---

# 268. PRODUCTION SECURITY CONFIRMATION

Before declaring this prompt complete, explicitly state whether there are any unresolved:

CRITICAL

HIGH

MEDIUM

security issues.

Do NOT claim:

fully secure

if known serious issues remain.

---

# 269. SECURITY FINDING FORMAT

For every finding provide:

Severity

Affected area

Problem

Risk

Fix implemented

Remaining risk

Test performed.

---

# 270. FINAL REPORT

At completion provide:

THREAT MODEL

TRUST BOUNDARIES

DATABASE SCHEMA EXPOSURE

SUPABASE API KEY STRATEGY

LEGACY KEY MIGRATION STATUS

JWT SIGNING SECURITY

AUTH / SESSION HARDENING

RLS TABLE INVENTORY

RLS POLICIES

CUSTOMER OWNERSHIP TESTS

STAFF AUTHORIZATION TESTS

PROPERTY-LEVEL AUTHORIZATION

DATABASE FUNCTION INVENTORY

SECURITY DEFINER REVIEW

FUNCTION EXECUTE GRANTS

VIEW SECURITY

PRIVATE SCHEMA STRATEGY

STORAGE BUCKET INVENTORY

STORAGE POLICIES

SIGNED URL STRATEGY

FILE SECURITY

SERVER FUNCTION SECURITY

INPUT VALIDATION

INJECTION DEFENSE

XSS DEFENSE

SECURITY HEADERS

CSP

CORS

CSRF / COOKIE REVIEW

DATABASE SSL

NETWORK RESTRICTIONS

SECRET MANAGEMENT

SECRET ROTATION

RATE LIMITING

ABUSE PROTECTION

FINANCIAL REPLAY PROTECTION

DATABASE CONSTRAINTS

AUDIT IMMUTABILITY

LOGGING POLICY

SECURITY EVENTS

DEPENDENCY SECURITY

ENVIRONMENT SEPARATION

BACKUP / RECOVERY READINESS

SECURITY DOCUMENTATION

AUTOMATED SECURITY TESTS

UNRESOLVED FINDINGS

FILES CREATED

FILES MODIFIED

DATABASE MIGRATIONS

POLICIES CHANGED

FUNCTIONS CHANGED

STORAGE POLICIES CHANGED

DEPENDENCIES CHANGED

---

# 271. FINAL REQUIRED CONFIRMATIONS

Explicitly confirm:

- project builds successfully;
- TypeScript passes;
- privileged Supabase secrets are absent from browser bundles;
- secret/service-role-equivalent credentials exist server-side only;
- all exposed sensitive tables use reviewed RLS;
- every critical RLS policy has security tests;
- customers cannot access another customer's resources by changing IDs;
- mass assignment cannot modify protected fields;
- raw ledger data is not customer writable;
- balances remain non-editable;
- customers cannot self-credit;
- customers cannot self-verify KYC;
- customers cannot change transfer progress;
- customers cannot forge 100% external completion;
- customers cannot create staff roles;
- staff permissions are revalidated server-side;
- maker-checker cannot be bypassed;
- posted ledger entries remain immutable;
- privileged PostgreSQL functions are not broadly executable;
- every SECURITY DEFINER function has a justified purpose and hardened search_path;
- exposed views have correct RLS/security-invoker behavior;
- sensitive Storage buckets are private;
- document access is authorization-controlled;
- signed document access is short-lived;
- external provider secrets are never exposed client-side;
- financial commands remain idempotent;
- security events and audit events are protected;
- no high-risk debug information is exposed in production;
- no offline-first architecture was introduced;
- no offline financial/security command queue exists;
- PROMPT 00 through PROMPT 13 remain intact.

Stop after completing backend security hardening.

Do NOT automatically proceed into UI polish.

The next phase is:

PROMPT 15 — RESPONSIVE QA, MOBILE BROWSER HARDENING, PERFORMANCE, ACCESSIBILITY & PRODUCTION POLISH.