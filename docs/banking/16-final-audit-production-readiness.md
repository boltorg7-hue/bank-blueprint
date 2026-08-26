# PROMPT 16 — FINAL FULL-SYSTEM AUDIT, PRODUCTION READINESS, DOCUMENTATION & RELEASE GATE

Continue from:

PROMPT 00 — Foundation & Modular Architecture  
PROMPT 01 — Design System, Branding & Visual Identity  
PROMPT 02 — Public Website  
PROMPT 03 — Authentication, Registration, KYC & Onboarding  
PROMPT 04 — Customer Banking App Shell  
PROMPT 05 — Accounts, Dashboard & Balance Experience  
PROMPT 06 — Double-Entry Ledger & Transactions  
PROMPT 07 — Beneficiaries & Internal Transfers  
PROMPT 08 — Internal/External Transfer Routing & 0→100 Workflow  
PROMPT 09 — Statements, PDFs & Document Center  
PROMPT 10 — Messaging & Notifications  
PROMPT 11 — Customer Security Center  
PROMPT 12 — Admin Back Office & RBAC  
PROMPT 13 — Admin Financial Controls & Maker-Checker  
PROMPT 14 — Backend Security Hardening  
PROMPT 15 — Responsive QA, Accessibility & Performance

This is the FINAL SYSTEM CONSOLIDATION PHASE.

Do NOT rebuild the application.

Do NOT introduce a new architecture.

Do NOT introduce new core banking features unless a missing implementation is required to make an already-defined feature functional or secure.

Do NOT weaken existing security.

Do NOT bypass ledger rules.

Do NOT bypass maker-checker.

Do NOT fabricate regulatory readiness.

Do NOT claim the product is legally authorized to operate as a real bank merely because the software works.

The objective is:

AUDIT

→ FIX

→ VERIFY

→ DOCUMENT

→ TEST

→ CLASSIFY RISKS

→ RELEASE GATE

→ GO / CONDITIONAL GO / NO-GO.

---

# 1. FINAL OBJECTIVE

Treat the application as a complete digital-banking system candidate.

Verify that the implementation faithfully reflects PROMPT 00 through PROMPT 15.

The final system must contain three clearly separated experiences:

```text
PUBLIC BANK WEBSITE

CUSTOMER BANKING APPLICATION

BANK ADMINISTRATION BACK OFFICE
```

All three must coexist without breaking domain boundaries.

---

# 2. NO FEATURE EXPANSION

Do not use PROMPT 16 to invent:

crypto;

trading;

loans;

cards;

mobile money;

SWIFT;

SEPA;

ACH;

international FX;

AI financial advice;

investment products;

new banking products

unless they were already concretely implemented and legitimately configured.

The purpose is consolidation.

---

# 3. BUILD A MASTER SYSTEM INVENTORY

Before changing code, inspect the COMPLETE project.

Produce a master inventory containing:

- routes;
- layouts;
- features;
- services;
- database tables;
- schemas;
- views;
- functions;
- RPCs;
- storage buckets;
- authentication flows;
- roles;
- permissions;
- RLS policies;
- server functions;
- external providers;
- scheduled/background server processes if any;
- notification channels;
- financial state machines.

Do not assume everything requested in earlier prompts was actually implemented correctly.

---

# 4. IMPLEMENTED VS PLANNED

For every major capability classify it as:

```text
IMPLEMENTED

PARTIALLY_IMPLEMENTED

PLACEHOLDER

NOT_IMPLEMENTED

EXTERNAL_DEPENDENCY_REQUIRED
```

Do not mark a feature implemented merely because a page or button exists.

---

# 5. NO FAKE FUNCTIONALITY

Find and eliminate misleading UI.

Examples:

buttons with no backend action;

fake success screens;

fake balances;

fake KYC approval;

fake external-transfer settlement;

fake SMS delivery;

fake email delivery;

fake passkeys;

fake document scanning;

fake notifications;

fake production metrics.

If an integration is not configured:

surface an honest configuration/development state.

---

# 6. FINAL ARCHITECTURE VERIFICATION

Verify architecture still follows:

```text
ROUTES
  ↓
FEATURES
  ↓
SERVICES
  ↓
TRUSTED SERVER / DATABASE
```

Avoid:

React component directly mutating privileged database state.

---

# 7. MODULAR MONOLITH VERIFICATION

Confirm this remains a SIMPLE MODULAR MONOLITH.

Do not transform into:

microservices;

unnecessary monorepo;

distributed messaging architecture.

Domain responsibilities remain separated.

---

# 8. FEATURE INVENTORY

Verify presence and boundaries of:

```text
public
auth
onboarding
dashboard
accounts
transactions
ledger
transfers
beneficiaries
compliance
documents
statements
messages
notifications
profile
security
admin
```

---

# 9. SHARED COMPONENT AUDIT

Review shared components.

Components belong in shared areas only if genuinely reusable.

Domain-specific logic should not leak into generic UI primitives.

---

# 10. GOD FILE AUDIT

Search for excessively large files.

Examples:

2,000-line page;

giant banking service;

all admin logic in one file;

all transfer logic in one hook.

Split responsibly where necessary.

Do not over-fragment simple code.

---

# 11. CIRCULAR DEPENDENCY AUDIT

Check domain imports.

Prevent circular feature dependencies.

Prefer explicit service contracts.

---

# 12. ROUTE MASTER MATRIX

Generate a final route matrix.

At minimum verify:

## PUBLIC

```text
/
/features
/accounts
/security
/about
/pricing
/help
/contact
/legal
/privacy
/terms
/login
/register
```

## CUSTOMER

```text
/app/dashboard
/app/accounts
/app/accounts/:accountRef
/app/activity
/app/transactions
/app/transactions/:transactionRef
/app/transfers
/app/transfers/new
/app/transfers/:transferRef
/app/beneficiaries
/app/statements
/app/statements/:statementRef
/app/documents
/app/documents/:documentRef
/app/messages
/app/messages/:conversationRef
/app/notifications
/app/profile
/app/security
/app/settings
```

## ADMIN

```text
/admin/dashboard
/admin/customers
/admin/customers/:customerRef
/admin/accounts
/admin/accounts/:accountRef
/admin/transactions
/admin/transfers
/admin/transfers/:transferRef
/admin/kyc
/admin/compliance
/admin/documents
/admin/messages
/admin/security
/admin/finance
/admin/finance/adjustments
/admin/finance/approvals
/admin/finance/reversals
/admin/finance/reconciliation
/admin/audit
/admin/staff
/admin/roles
/admin/reports
/admin/settings
```

Adapt to actual routes.

---

# 13. ROUTE AUTHORIZATION

For every private route classify:

```text
AUTHENTICATED CUSTOMER

ACTIVE BANKING CUSTOMER

RESTRICTED CUSTOMER

STAFF

PERMISSION-SPECIFIC STAFF
```

The URL alone must never grant access.

---

# 14. CUSTOMER LIFECYCLE AUDIT

Verify separation between:

authentication

profile completion

identity verification

banking activation.

A logged-in user is not automatically an active banking customer.

---

# 15. CUSTOMER STATES

Review final lifecycle state machine.

Ensure states are coherent and used consistently.

No impossible transitions.

---

# 16. AUTHENTICATION MASTER AUDIT

Test:

registration;

email verification;

contact verification;

login;

logout;

password reset;

session expiry;

MFA;

step-up;

security recovery.

---

# 17. AUTHORIZATION MASTER AUDIT

Every privileged operation must derive identity from trusted authenticated context.

Never trust caller-supplied:

```text
customerId
role
permission
staffId
isAdmin
```

as authorization proof.

---

# 18. FINAL DATABASE INVENTORY

List every application table and classify:

```text
PUBLIC SAFE
CUSTOMER OWNED
CUSTOMER READ ONLY
STAFF CONTROLLED
SERVER INTERNAL
FINANCIAL IMMUTABLE
AUDIT IMMUTABLE
```

---

# 19. FINAL SCHEMA REVIEW

Confirm sensitive internals are not unnecessarily exposed through public Data API schemas.

---

# 20. RLS FINAL GATE

For every exposed sensitive table:

RLS must be:

```text
ENABLED
```

and tested.

Any critical table without appropriate RLS is a:

```text
NO-GO
```

release blocker.

---

# 21. FINANCIAL DATABASE GATE

Raw financial structures must remain protected.

Customer cannot directly mutate:

ledger;

balance projection;

holds;

financial adjustments;

approval records.

---

# 22. LEDGER MASTER AUDIT

Confirm ledger remains the sole authoritative financial source.

Architecture:

```text
BUSINESS OPERATION
→ JOURNAL
→ LEDGER POSTINGS
→ BALANCE PROJECTION
→ CUSTOMER UI
```

---

# 23. DOUBLE-ENTRY INVARIANT

Every posted journal must satisfy:

```text
TOTAL DEBITS = TOTAL CREDITS
```

No exception.

---

# 24. LEDGER IMMUTABILITY

Posted journal entries cannot be modified/deleted by ordinary application or admin workflows.

Corrections use new entries.

---

# 25. REVERSAL INVARIANT

Reversal creates an equal/opposite journal.

Original remains intact.

---

# 26. DIRECT BALANCE MUTATION SEARCH

Search entire codebase and database functions for unsafe patterns.

Examples:

```text
balance +=
balance -=
setBalance
updateBalance
UPDATE account_balance...
```

Review every occurrence.

No financial command may use projection as independent source of truth.

---

# 27. BALANCE PROJECTION AUDIT

For each customer account:

ledger-derived expected balance

must equal:

balance projection.

---

# 28. RECONCILIATION TEST

Execute reconciliation tests.

Classify every mismatch:

CRITICAL.

Do not hide mismatch.

---

# 29. AVAILABLE BALANCE AUDIT

Confirm:

```text
available balance
```

correctly accounts for active holds.

---

# 30. HOLD INVARIANT

An active hold affects availability.

It must not create artificial money.

---

# 31. HOLD CAPTURE INVARIANT

Captured transfer hold must not double-deduct the account when ledger posting occurs.

---

# 32. INTERNAL TRANSFER MASTER TEST

Test a real development/staging same-bank transfer:

Customer A

→ Customer B.

Required outcome:

```text
transfer type = INTERNAL
```

Sender decreases by exact amount.

Recipient increases by exact amount.

One balanced ledger posting.

Transfer:

```text
COMPLETED
100%
```

---

# 33. INTERNAL TRANSFER FAILURE TEST

Force a destination posting failure.

Expected:

no partial debit;

no partial credit;

transaction rollback;

no 100%.

---

# 34. INTERNAL TRANSFER IDEMPOTENCY

Submit same transfer repeatedly.

Expected:

one financial outcome.

---

# 35. EXTERNAL TRANSFER MASTER TEST

External destination:

must route to:

```text
EXTERNAL_TRANSFER
```

not internal ledger credit.

---

# 36. EXTERNAL 99% INVARIANT

A transfer may remain:

```text
99%
```

while awaiting:

settlement;

customer action;

document;

staff review;

external confirmation.

---

# 37. EXTERNAL 100% INVARIANT

External transfer reaches:

```text
100%
```

ONLY after authoritative final completion.

---

# 38. NO FAKE EXTERNAL CREDIT

External transfer must not create a fictitious internal recipient account credit.

---

# 39. EXTERNAL PROVIDER DEPENDENCY

If no real external settlement provider is connected:

classify production external transfer capability:

```text
EXTERNAL_DEPENDENCY_REQUIRED
```

Do not mark it production-ready.

---

# 40. EXTERNAL ACCOUNTING AUDIT

External postings must balance against properly configured settlement/clearing accounts.

---

# 41. TRANSFER STATE MACHINE AUDIT

Review all legal transitions.

Prevent impossible jumps such as:

```text
DRAFT → COMPLETED
```

without required processing.

---

# 42. TRANSFER PROGRESS AUDIT

Percentage is derived from meaningful workflow state.

No decorative fake timer.

---

# 43. BENEFICIARY SECURITY AUDIT

Verify:

ownership;

destination integrity;

minimal disclosure;

enumeration protection;

destination revalidation.

---

# 44. ADMIN FINANCIAL CREDIT AUDIT

Credit customer account through admin.

Required:

maker request

checker approval when policy requires

balanced journal

projection update

customer activity

audit

notification.

---

# 45. ADMIN FINANCIAL DEBIT AUDIT

Same guarantees for debit.

---

# 46. MAKER-CHECKER INVARIANT

When four-eyes is required:

```text
maker != checker
```

Server/database enforcement required.

---

# 47. SELF-APPROVAL TEST

Attempt maker self-approval.

Expected:

DENIED.

---

# 48. ADMIN FINANCIAL IDEMPOTENCY

Retry approved credit command multiple times.

Expected:

single financial movement.

---

# 49. ADMIN REVERSAL AUDIT

Verify:

original immutable;

reversal new journal;

approval history;

audit.

---

# 50. EXTERNAL REVERSAL CAUTION

Confirm a completed external transfer cannot be "returned" solely via internal ledger reversal unless external settlement truth supports it.

---

# 51. ACCOUNT STATUS AUDIT

Review:

PENDING

ACTIVE

RESTRICTED

SUSPENDED

FROZEN

CLOSED

behavior.

Each must actually affect authorized operations.

---

# 52. CUSTOMER STATUS VS ACCOUNT STATUS

Do not merge customer lifecycle and account status.

One customer may have multiple accounts with distinct statuses.

---

# 53. KYC MASTER AUDIT

Test:

submission

review

additional-document request

acceptance

rejection

banking activation.

---

# 54. KYC SELF-APPROVAL TEST

Customer attempts to mark own KYC VERIFIED.

Expected:

DENIED.

---

# 55. KYC DOCUMENT STORAGE

KYC files remain:

PRIVATE.

No permanent public links.

---

# 56. COMPLIANCE MASTER AUDIT

Review external-transfer compliance workflow end-to-end.

---

# 57. DOCUMENT REQUEST AUDIT

Requested document:

customer uploads

staff reviews

history preserved.

Customer cannot approve own file.

---

# 58. DOCUMENT REPLACEMENT AUDIT

Rejected document replacement must retain review history.

---

# 59. STATEMENT MASTER AUDIT

Generate statement.

Verify:

correct account;

correct period;

correct opening balance;

all qualifying transactions;

correct closing balance;

PDF generation;

private storage.

---

# 60. STATEMENT RECONCILIATION

Official statement must reconcile exactly.

Failure:

NO official statement issued.

---

# 61. STATEMENT IMMUTABILITY

Issued statement financial contents remain immutable.

Corrections use versions.

---

# 62. RECEIPT RULE

Internal completed transfer:

final receipt allowed.

External 99% transfer:

NO completed-transfer receipt.

External 100%:

final receipt allowed.

---

# 63. PDF SECURITY AUDIT

Verify official PDFs are generated server-side from authoritative data.

No browser-provided financial snapshot authority.

---

# 64. DOCUMENT CENTER AUDIT

Customer can access only authorized documents.

Test reference/path tampering.

---

# 65. MESSAGING MASTER AUDIT

Customer ↔ Bank only.

No unrestricted customer-to-customer messaging.

---

# 66. MESSAGE IMPERSONATION TEST

Customer attempts:

```text
sender_type = STAFF
```

Expected:

DENIED.

---

# 67. INTERNAL NOTE AUDIT

Admin internal notes must never appear in customer API/UI.

---

# 68. MESSAGE ATTACHMENT AUDIT

Private storage.

Authorized context required.

---

# 69. NOTIFICATION MASTER AUDIT

Notifications derive from trusted domain events.

They do not mutate domain state.

---

# 70. INTERNAL TRANSFER NOTIFICATION

Only after authoritative transfer completion.

---

# 71. EXTERNAL 99% NOTIFICATION

Never says:

Completed.

---

# 72. STATEMENT NOTIFICATION

`statement_ready` only after PDF/document status is actually READY.

---

# 73. NOTIFICATION DELIVERY DEPENDENCIES

For:

EMAIL

SMS

PUSH

classify each:

```text
CONFIGURED
NOT_CONFIGURED
PARTIAL
```

Do not fake provider delivery.

---

# 74. COMMUNICATION FAILURE INVARIANT

Email/SMS/push failure must NEVER roll back financial transaction.

---

# 75. CUSTOMER SECURITY MASTER AUDIT

Review:

MFA

sessions

devices

password change

step-up

security events

security notifications.

---

# 76. MFA AUTHORITY

MFA state must come from trusted provider/server.

No customer database toggle.

---

# 77. STEP-UP AUDIT

Attempt forged:

```text
stepUpComplete = true
```

Expected:

DENIED.

---

# 78. TRANSFER STEP-UP

If policy requires step-up:

transfer cannot execute before valid assurance.

---

# 79. SESSION REVOCATION AUDIT

Verify customer session revocation behavior is real according to provider capability.

Document limitations.

---

# 80. PASSWORD SECURITY

No application-owned password storage.

---

# 81. TOKEN AUDIT

Search logs/code/storage for:

access tokens

refresh tokens

MFA secrets

recovery codes.

No inappropriate exposure.

---

# 82. STAFF ACCESS MASTER AUDIT

Test every role:

```text
SUPPORT_AGENT
KYC_AGENT
COMPLIANCE_OFFICER
FINANCE_OPERATOR
SUPERVISOR
ADMINISTRATOR
SUPER_ADMINISTRATOR
AUDITOR
```

---

# 83. STAFF PERMISSION MATRIX

Produce final matrix:

ROLE × PERMISSION.

Do not rely only on documentation.

Compare actual backend enforcement.

---

# 84. CUSTOMER ADMIN ACCESS TEST

Customer visits:

```text
/admin
```

Expected:

DENIED.

---

# 85. SUPPORT LIMITATION

Support agent must not:

credit account;

approve financial adjustment;

modify ledger;

approve KYC unless specifically granted.

---

# 86. AUDITOR LIMITATION

Auditor remains effectively read-only.

---

# 87. SUPER ADMIN LIMITATION

Even super administrator cannot directly rewrite posted ledger.

---

# 88. STAFF ROLE ESCALATION

Staff cannot self-promote.

---

# 89. STAFF DISABLEMENT

Disabled staff account must lose access according to session/auth capabilities.

---

# 90. ADMIN CUSTOMER WORKSPACE AUDIT

Verify unified customer detail correctly combines:

profile;

KYC;

accounts;

transactions;

transfers;

documents;

messages;

security;

audit.

Without leaking unauthorized fields.

---

# 91. FIELD-LEVEL PRIVACY

Sensitive fields should appear only where permission warrants.

---

# 92. ADMIN GLOBAL SEARCH

Test:

permissions

enumeration

large results

safe query handling.

---

# 93. AUDIT LOG MASTER TEST

Privileged actions must be traceable.

At minimum:

actor

action

resource

timestamp

reason where required

result.

---

# 94. AUDIT IMMUTABILITY

Normal admin cannot modify/delete prior audit history.

---

# 95. SECURITY HARDENING REGRESSION

Re-run all critical PROMPT 14 checks.

---

# 96. FRONTEND SECRET AUDIT

Production browser bundle must contain NO:

```text
sb_secret_
service_role
database password
provider credentials
private key
```

---

# 97. ENVIRONMENT VARIABLE AUDIT

Classify every environment variable:

PUBLIC

SERVER_ONLY

SECRET.

---

# 98. DATABASE FUNCTION AUDIT

Review every function/RPC.

Confirm:

purpose

execution grant

security invoker/definer

search_path

authorization.

---

# 99. SECURITY DEFINER AUDIT

Every `SECURITY DEFINER` requires explicit justification.

No unreviewed privileged function.

---

# 100. STORAGE MASTER AUDIT

List all buckets.

For each:

purpose

public/private

upload policy

download policy

max size

MIME rules.

---

# 101. ALL SENSITIVE BUCKETS PRIVATE

At minimum:

KYC

compliance docs

statements

receipts

message attachments

financial evidence.

---

# 102. SIGNED URL AUDIT

Short-lived and generated only after authorization.

---

# 103. IDOR / BOLA FINAL TEST

Customer A tries Customer B:

account

transaction

transfer

statement

document

message

notification

session.

Every test must fail safely.

---

# 104. MASS-ASSIGNMENT AUDIT

Test protected-field injection.

Examples:

```text
role
balance
status
kyc_status
progress
approved_by
ledger_transaction_id
```

Server must reject/ignore.

---

# 105. RATE-LIMIT AUDIT

Review rate limits for abuse-prone endpoints.

No essential security control relies only on UI cooldown.

---

# 106. INPUT VALIDATION AUDIT

All trusted boundaries use schemas.

Reject malformed/unknown sensitive fields appropriately.

---

# 107. XSS AUDIT

Search for:

`dangerouslySetInnerHTML`

raw HTML rendering

unsafe markdown.

Review all user/staff-generated text.

---

# 108. SQL INJECTION AUDIT

Review all raw SQL/dynamic query generation.

---

# 109. CORS AUDIT

Review privileged APIs.

CORS remains narrow where relevant.

---

# 110. SECURITY HEADERS AUDIT

Verify production configuration for:

CSP

frame restrictions

content-type protection

referrer policy

permissions policy

HTTPS/HSTS where platform allows.

---

# 111. PUBLIC/PRIVATE CACHE AUDIT

Sensitive financial/API responses must not be cached publicly/shared improperly.

---

# 112. BROWSER STORAGE AUDIT

Inspect:

localStorage

sessionStorage

IndexedDB

Cache Storage.

No authoritative/offline storage of:

balances

transactions

KYC docs

financial commands

staff commands.

---

# 113. ONLINE-ONLY FINAL AUDIT

Confirm there is no accidental offline-first banking implementation.

No queued:

transfer

message

financial adjustment

security change

admin action.

---

# 114. SERVICE WORKER AUDIT

If service worker exists for push:

verify it does not persist sensitive banking data.

---

# 115. RESPONSIVE FINAL AUDIT

Repeat PROMPT 15 tests.

Minimum widths:

```text
320
360
375
390
430
768
1024
1280
1440+
```

---

# 116. MOBILE CUSTOMER CRITICAL PATH

At 320px test:

Login

Dashboard

Account

Activity

Internal transfer

External transfer

Statement

Messages

Security.

---

# 117. MOBILE ADMIN CRITICAL PATH

At 320px test:

Admin login/access

Customer search

Customer detail

Transfer review

KYC

Approval

Financial adjustment review.

---

# 118. SAFE AREA FINAL TEST

Verify:

bottom navigation

sticky CTA

message composer

sheets

dialogs.

---

# 119. VIRTUAL KEYBOARD TEST

No critical input/action hidden behind mobile keyboard.

---

# 120. ACCESSIBILITY FINAL GATE

Target:

```text
WCAG 2.2 AA
```

Review:

keyboard

focus

screen reader

contrast

touch targets

zoom

text scale

reduced motion

accessible authentication

errors.

---

# 121. ACCESSIBILITY RELEASE BLOCKERS

Classify severe barriers on primary banking operations as:

NO-GO.

Examples:

unable to complete transfer using keyboard;

critical button inaccessible;

MFA inaccessible;

hidden form errors.

---

# 122. CORE WEB VITAL FINAL REVIEW

Measure where tooling allows:

LCP

INP/lab proxy

CLS.

Do not invent field data.

---

# 123. TARGETS

Aim for:

```text
LCP <= 2.5 s
INP <= 200 ms
CLS <= 0.1
```

for good real-user performance.

---

# 124. BUNDLE AUDIT

Confirm public visitors do not download:

admin modules;

PDF server engine;

finance admin code

unnecessarily.

---

# 125. DEPENDENCY FINAL AUDIT

List all production dependencies.

Identify:

unused

duplicated

outdated/high-risk

unnecessary.

Remove only after verifying usage.

---

# 126. BUILD WARNINGS

Resolve serious:

TypeScript

React

hydration

dependency

security

warnings.

---

# 127. TEST SUITE INVENTORY

Document every automated test category:

unit

integration

database/RLS

financial integrity

security

UI

accessibility

end-to-end.

---

# 128. CRITICAL E2E FLOWS

Automate or manually verify end-to-end:

1. Visitor → Register
2. Registration → Onboarding
3. KYC submission
4. KYC approval
5. Banking activation
6. Internal transfer
7. External transfer to 99%
8. External completion to 100% when provider/test adapter supports it
9. Statement generation
10. Secure message
11. MFA setup
12. Admin customer review
13. Admin financial adjustment
14. Maker-checker approval
15. Ledger reconciliation.

---

# 129. TEST DATA

Use synthetic/staging data.

Do not run destructive financial test scenarios on production customer accounts.

---

# 130. MIGRATION MASTER REVIEW

List database migrations in order.

Verify fresh database can migrate from baseline to current schema.

---

# 131. FRESH ENVIRONMENT TEST

On staging/test project:

apply migrations from scratch.

Verify application starts successfully.

---

# 132. MIGRATION IDEMPOTENCY

Deployment process should not require manual undocumented fixes.

---

# 133. DATABASE SEEDING

Development/staging seed scripts must be clearly separated from production.

No production fake balances.

---

# 134. BACKUP READINESS

Document actual configured:

database backups

PITR if available

retention

restore procedures.

Do not claim features that are not enabled.

---

# 135. RESTORE RUNBOOK

Create documented non-production restore validation procedure.

---

# 136. FINANCIAL RECOVERY RUNBOOK

Document procedure for:

ledger/projection mismatch;

duplicate-event suspicion;

external settlement discrepancy;

failed financial posting recovery.

Never recommend editing ledger directly.

---

# 137. SECURITY INCIDENT RUNBOOK

Document:

detect

contain

revoke sessions

disable compromised staff

rotate credentials

preserve audit evidence

reconcile finance

recover service.

---

# 138. SECRET ROTATION RUNBOOK

Document for:

Supabase privileged key

external settlement provider

email provider

SMS provider

webhook secret.

Never include actual secret values.

---

# 139. EXTERNAL DEPENDENCY MATRIX

Create a final matrix.

Examples:

```text
SUPABASE
AUTH
KYC PROVIDER
EXTERNAL SETTLEMENT PROVIDER
EMAIL PROVIDER
SMS PROVIDER
PUSH
PDF GENERATION
FILE SCANNING
OBSERVABILITY
```

For each:

CONFIGURED

OPTIONAL

REQUIRED FOR PRODUCTION

NOT CONFIGURED.

---

# 140. KYC PROVIDER READINESS

If no real KYC provider exists:

do not classify automated KYC as production ready.

Manual staff review may remain a workflow if legally/operationally appropriate.

---

# 141. EXTERNAL PAYMENT RAIL READINESS

If no settlement provider exists:

external bank transfer remains:

NOT PRODUCTION OPERATIONAL.

Internal transfers may still technically function.

---

# 142. EMAIL/SMS PROVIDER READINESS

Notification adapters without credentials/integration must be classified accordingly.

---

# 143. LEGAL/REGULATORY READINESS

Review all public claims.

Do not claim:

licensed bank

regulated institution

deposit insurance

specific regulator approval

unless provided and verified externally.

---

# 144. SOFTWARE ≠ BANK LICENSE

Explicitly document:

Technical completion does NOT itself authorize operating a bank or holding/transferring customer funds.

Production launch may require:

appropriate banking/payment licenses;

regulated partners;

KYC/AML policies;

privacy/legal review;

data-retention policies;

external settlement contracts;

security assessment;

jurisdiction-specific compliance.

Do not fabricate these.

---

# 145. BRAND/LEGAL CONFIG GATE

Production launch requires real configured:

bank legal name

support information

privacy documents

terms

registered details

regulatory disclosures if applicable.

No placeholder legal identity.

---

# 146. PRICING GATE

No invented fees.

All displayed fees must come from actual configured business policy.

---

# 147. BANKING LIMITS GATE

No invented production transfer limits.

Limits must be configured by real bank policy.

---

# 148. COMPLIANCE THRESHOLDS GATE

No fake AML/risk thresholds.

Use legitimate policy configuration.

---

# 149. ADMIN APPROVAL POLICY GATE

Maker-checker/approval limits must be configured by actual operational policy.

---

# 150. OBSERVABILITY READINESS

Verify production-safe monitoring for:

server errors

financial integrity failures

external provider failures

authorization failures

document-generation failures.

Do not log sensitive payloads.

---

# 151. HEALTH CHECKS

Prepare non-sensitive health checks for critical services where appropriate.

Do not expose secrets or database internals.

---

# 152. ALERT SEVERITY

Define at minimum:

CRITICAL

HIGH

MEDIUM

INFO

for operational incidents.

---

# 153. CRITICAL ALERT EXAMPLES

Examples:

ledger/projection mismatch;

financial duplicate suspicion;

privileged authorization anomaly;

external settlement inconsistency;

database unavailable.

---

# 154. NO FAKE AI FRAUD DETECTION

Do not introduce arbitrary AI security scoring in final phase.

---

# 155. PRODUCTION LOGGING

Confirm logs do not contain:

passwords

OTP

tokens

MFA secrets

full KYC docs

full bank credentials

secret keys.

---

# 156. CORRELATION

Ensure major server operations have safe correlation/business references for investigation.

---

# 157. CUSTOMER SUPPORT READINESS

Verify support can investigate issues without impersonating customer.

No:

Login as customer.

---

# 158. ADMIN SUPPORT AUDIT

Staff tools should show enough context while respecting least privilege.

---

# 159. DATA RETENTION CONFIG

Document data classes whose retention needs real policy:

financial history

KYC

security events

messages

documents

audit logs.

Do not invent legal retention durations.

---

# 160. ACCOUNT CLOSURE AUDIT

Closing customer/account must NOT destroy required historical:

ledger;

transactions;

statements;

audit;

communications

according to retention policy.

---

# 161. CUSTOMER DATA DELETION

Do not implement simple "delete everything" where financial/regulatory retention may apply.

Separate:

account closure

from:

data deletion/privacy request.

---

# 162. PRIVACY DOCUMENTATION

Ensure privacy policy does not claim behavior different from implementation.

---

# 163. COOKIE/ANALYTICS REVIEW

No unnecessary trackers in authenticated banking/admin areas.

---

# 164. PRODUCTION CONFIGURATION INVENTORY

Create a checklist of required configuration values.

Examples:

```text
APP_URL
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SERVER_SUPABASE_SECRET_KEY
BANK_DISPLAY_NAME
BANK_LEGAL_NAME
SUPPORT_EMAIL
```

plus optional configured providers.

Never include secret values in documentation.

---

# 165. ENVIRONMENT VALIDATOR

Where practical, add startup/config validation.

If critical server-only configuration is missing:

fail clearly.

Do not silently use insecure defaults.

---

# 166. DEVELOPMENT FALLBACKS

Ensure dev mocks cannot accidentally activate in production.

---

# 167. PRODUCTION FEATURE FLAGS

If providers are absent:

feature flags/config should clearly disable unsupported actions.

Example:

External transfer unavailable

rather than simulated production completion.

---

# 168. FINAL CODE CLEANUP

Remove:

unused components;

abandoned experiments;

duplicate services;

stale routes;

unused dependencies;

dead code.

Do not remove code merely because static analysis fails to understand dynamic use.

---

# 169. TODO AUDIT

Search:

```text
TODO
FIXME
HACK
TEMP
MOCK
DEMO
```

Review every occurrence.

Critical TODOs cannot remain hidden before release.

---

# 170. CONSOLE AUDIT

Remove accidental debugging output.

---

# 171. PLACEHOLDER AUDIT

Search production-facing text for:

Lorem ipsum

Sample

Demo

Test Bank

fake customer names

fake balances.

---

# 172. ERROR MESSAGE AUDIT

No raw SQL/provider stack traces in UI.

---

# 173. FINAL DOCUMENTATION SET

Create or update:

```text
README.md
ARCHITECTURE.md
SECURITY_ARCHITECTURE.md
BANKING_LEDGER.md
TRANSFER_WORKFLOWS.md
RLS_PERMISSION_MATRIX.md
ADMIN_RBAC.md
OPERATIONS_RUNBOOK.md
INCIDENT_RESPONSE.md
DEPLOYMENT.md
PRODUCTION_READINESS.md
```

Adapt filenames to existing documentation conventions.

Do not duplicate identical content unnecessarily.

---

# 174. README FINALIZATION

README should explain:

project purpose;

architecture;

local setup;

environment configuration;

commands;

testing;

deployment;

documentation index.

Do not include secrets.

---

# 175. ARCHITECTURE DOCUMENT

Document:

Public

Customer

Admin

features

services

backend

trust boundaries.

---

# 176. LEDGER DOCUMENTATION

Explain:

double entry

journal

ledger accounts

balance projections

holds

reversals

financial adjustments.

---

# 177. TRANSFER DOCUMENTATION

Explain clearly:

```text
INTERNAL → 100%
```

after atomic completion.

```text
EXTERNAL → 0–99 → 100
```

only after authoritative settlement.

---

# 178. SECURITY DOCUMENTATION

Include:

authentication

MFA

RLS

RBAC

private storage

secrets

financial protection

audit.

---

# 179. ADMIN RBAC DOCUMENT

List roles and permission responsibilities.

---

# 180. OPERATIONS RUNBOOK

Document routine operational workflows:

KYC review

external transfer review

document request

customer restriction

financial adjustment

reconciliation.

---

# 181. DEPLOYMENT DOCUMENT

Document:

build

tests

migration

environment checks

release

rollback strategy.

---

# 182. RELEASE VERSION

Prepare a release identifier strategy.

Example:

semantic application version.

Do not expose internal build information unnecessarily.

---

# 183. DATABASE MIGRATION RELEASE CHECK

Never deploy application code requiring schema changes before corresponding migration safety is confirmed.

---

# 184. ROLLBACK STRATEGY

Application rollback must not assume database migrations can always be destructively reversed.

Prefer forward-fix strategy for financial schema when necessary.

Document it.

---

# 185. BLUE/GREEN READINESS

Do not add complex deployment architecture unless hosting platform supports/needs it.

At minimum avoid deployment processes that create inconsistent app/schema versions.

---

# 186. RELEASE GATE CATEGORIES

Create final release gates:

```text
BUILD

FUNCTIONAL

FINANCIAL

SECURITY

DATA

ACCESSIBILITY

RESPONSIVE

PERFORMANCE

OPERATIONS

LEGAL/REGULATORY

EXTERNAL INTEGRATIONS
```

---

# 187. GATE STATUS

Each gate must be classified:

```text
PASS

PASS_WITH_CONDITIONS

FAIL

NOT_APPLICABLE
```

---

# 188. CRITICAL NO-GO CONDITIONS

Automatically classify release as:

```text
NO-GO
```

if any of the following exists:

- unprotected customer financial data;
- privileged secret exposed to browser;
- ledger imbalance;
- direct balance mutation;
- cross-customer data access;
- customer able to self-credit;
- customer able to self-verify KYC;
- customer able to forge transfer completion;
- admin maker-checker bypass;
- staff role escalation vulnerability;
- public sensitive Storage bucket;
- external transfer pretending to settle without real settlement confirmation;
- critical unresolved authentication bypass;
- critical financial race condition;
- known destructive migration issue affecting funds.

---

# 189. HIGH-SEVERITY CONDITIONS

HIGH issues may result in:

NO-GO

or:

CONDITIONAL GO

only if feature is safely disabled and risk isolated.

Document decision.

---

# 190. MEDIUM ISSUES

List remediation priority.

Do not hide them.

---

# 191. LOW ISSUES

May be post-release candidates if they do not threaten security, accessibility of critical flows, or financial correctness.

---

# 192. TECHNICAL GO ≠ BANKING GO

Produce TWO separate conclusions:

```text
TECHNICAL RELEASE READINESS
```

and:

```text
REAL-WORLD BANKING OPERATIONS READINESS
```

These are not the same.

---

# 193. TECHNICAL RELEASE READINESS

May be:

GO

CONDITIONAL GO

NO-GO.

Based on code/security/testing/infrastructure.

---

# 194. BANKING OPERATIONS READINESS

Must evaluate whether required external/regulatory prerequisites are actually present.

Examples:

banking authorization/license;

regulated entity/partner;

KYC policy/provider;

settlement provider;

legal terms;

privacy compliance;

operational staffing;

incident response;

financial reconciliation procedures.

If unknown:

state:

```text
NOT VERIFIED
```

Do not assume.

---

# 195. PRODUCTION CLAIM

Do NOT write:

"The bank is ready for production"

unless both technical AND real-world requirements are actually verified.

Prefer:

"The software satisfies the defined technical release gates, subject to listed external/regulatory requirements."

---

# 196. FINAL CUSTOMER JOURNEY TEST

Test:

Visitor

→ Register

→ Verify

→ Complete onboarding

→ KYC

→ Account activated

→ View balance

→ Internal transfer

→ Recipient credited

→ View transaction

→ Download statement

→ Receive notification

→ Contact bank

→ Configure MFA.

---

# 197. FINAL EXTERNAL JOURNEY TEST

Test:

Active customer

→ External beneficiary

→ External transfer

→ validation

→ security

→ compliance

→ document if required

→ 99%

→ authoritative settlement

→ 100%

→ final receipt.

If provider unavailable:

stop and classify external settlement dependency.

---

# 198. FINAL ADMIN JOURNEY TEST

Test:

Staff login

→ customer search

→ KYC review

→ transfer review

→ document review

→ customer communication

→ account restriction

according to permissions.

---

# 199. FINAL FINANCE JOURNEY TEST

Test:

Finance Operator

→ request account credit

→ Supervisor approves

→ ledger posts

→ balance projection updates

→ customer activity updates

→ customer notification

→ statement includes adjustment

→ audit records maker/checker.

---

# 200. FINAL SECURITY JOURNEY TEST

Test:

Customer enables MFA

→ logs in

→ sees session

→ sensitive transfer requires step-up

→ challenge verified

→ transfer executes.

---

# 201. FINAL INCIDENT SIMULATION

In staging:

simulate compromised staff account response.

Verify ability to:

disable staff

revoke sessions where supported

inspect audit

prevent future privileged actions.

---

# 202. FINAL FINANCIAL INCIDENT SIMULATION

In staging:

introduce projection mismatch.

Expected:

integrity alert

reconciliation identifies mismatch

controlled projection rebuild

NO ledger rewrite.

---

# 203. FINAL ERROR FLOW

Simulate network disconnect immediately after transfer confirmation.

Recover authoritative state without duplicate transfer.

---

# 204. FINAL MOBILE FLOW

Run customer critical journey from narrow mobile viewport.

---

# 205. FINAL ACCESSIBILITY FLOW

Run critical journey using keyboard and representative assistive semantics.

---

# 206. FINAL PRODUCTION BUILD

Run production build.

Resolve all blocking errors.

---

# 207. TYPESCRIPT

Run full TypeScript check.

No ignored critical type errors.

---

# 208. LINT

Run configured linting.

Do not suppress serious errors just to pass.

---

# 209. DATABASE TESTS

Run:

constraints

RLS

financial functions

migrations

integrity tests.

---

# 210. SECURITY TESTS

Run negative tests.

Not only happy path.

---

# 211. BUILD ARTIFACT SECRET SCAN

Inspect production artifact.

No privileged secret.

---

# 212. DEPLOYMENT DRY RUN

Where possible:

deploy to staging/preview with production-like configuration.

Run smoke tests.

---

# 213. FINAL FILE INVENTORY

Report significant files created/modified across final audit.

Do not list every trivial generated file unless useful.

---

# 214. FINAL DATABASE INVENTORY

Report:

tables

views

functions

policies

indexes

constraints

storage buckets.

---

# 215. FINAL EXTERNAL INTEGRATION INVENTORY

Report each integration and status.

---

# 216. FINAL SECURITY FINDINGS

For every unresolved issue:

```text
Severity
Area
Description
Impact
Remediation
Status
Release impact
```

---

# 217. FINAL FINANCIAL FINDINGS

Separate financial integrity issues from general bugs.

---

# 218. FINAL ACCESSIBILITY FINDINGS

Separate accessibility blockers on critical banking flows.

---

# 219. FINAL PERFORMANCE FINDINGS

Distinguish:

LAB

FIELD DATA

NOT MEASURED.

---

# 220. FINAL DOCUMENTATION INDEX

Create a navigable documentation index referencing all major technical documents.

---

# 221. FINAL ARCHITECTURE SUMMARY

Produce a concise final architecture map.

Example:

```text
PUBLIC WEB
      │
CUSTOMER APP
      │
ADMIN APP
      │
SERVER DOMAIN SERVICES
      │
AUTHORIZATION / SECURITY
      │
BANKING SERVICES
      │
LEDGER
      │
POSTGRES / SUPABASE
```

External providers attach only through server adapters.

---

# 222. FINAL DATA-FLOW SUMMARY

Document important flows.

Example internal transfer:

```text
Customer
→ Transfer Service
→ Security Check
→ Funds Hold
→ Ledger
→ Sender Projection
→ Recipient Projection
→ Transaction Read Models
→ Notification
```

---

# 223. EXTERNAL TRANSFER DATA FLOW

```text
Customer
→ Transfer Service
→ Security
→ Compliance
→ Hold
→ External Settlement Adapter
→ Settlement Confirmation
→ Ledger
→ Transfer 100%
→ Receipt
→ Notification
```

---

# 224. ADMIN CREDIT DATA FLOW

```text
Finance Maker
→ Adjustment Request
→ Supervisor Checker
→ Approved Financial Command
→ Ledger
→ Balance Projection
→ Customer Activity
→ Audit
→ Notification
```

---

# 225. SECURITY DATA FLOW

```text
Client Request
→ Authenticated Identity
→ RLS / Permission
→ Server Validation
→ Domain Command
→ Database Constraint
→ Audit
```

---

# 226. FINAL QUALITY PRINCIPLE

The system must never rely on one protection layer.

Example financial transfer requires:

authenticated customer

+

account ownership

+

account status

+

available funds

+

business state machine

+

step-up if required

+

idempotency

+

database transaction

+

double-entry ledger

+

database constraints

+

audit.

---

# 227. NO SINGLE POINT OF TRUST IN UI

Do not trust:

disabled button

hidden field

hidden route

client role

client balance.

---

# 228. FINAL CUSTOMER EXPERIENCE PRINCIPLE

Despite all backend complexity, customer UX must remain simple.

Customer should see:

what happened

what is required

what money is available

whether a transfer completed

what to do next.

---

# 229. FINAL ADMIN EXPERIENCE PRINCIPLE

Staff UI must expose complexity only when operationally useful.

Do not expose customers' private/internal data unnecessarily.

---

# 230. FINAL FINANCIAL PRINCIPLE

Every cent/unit represented by the bank must be explainable through ledger history.

---

# 231. FINAL SECURITY PRINCIPLE

Assume attackers know:

routes

API names

database shape

workflow.

Security must still hold.

---

# 232. FINAL AUDIT PRINCIPLE

Never declare a test:

PASS

unless it was actually executed or reliably verified.

If not testable:

write:

```text
NOT TESTED IN CURRENT ENVIRONMENT
```

---

# 233. FINAL IMPLEMENTATION SCOPE

PROMPT 16 must:

1. inspect the complete application;
2. inventory architecture;
3. inventory routes;
4. inventory database;
5. inventory storage;
6. inventory server functions;
7. inventory external integrations;
8. verify customer lifecycle;
9. verify authentication;
10. verify RLS;
11. verify RBAC;
12. verify ledger;
13. verify balance projections;
14. verify internal transfers;
15. verify external transfers;
16. verify holds;
17. verify compliance;
18. verify documents;
19. verify statements;
20. verify messaging;
21. verify notifications;
22. verify customer security;
23. verify admin;
24. verify finance controls;
25. verify maker-checker;
26. verify audit logs;
27. verify secrets;
28. verify storage security;
29. verify responsive behavior;
30. verify accessibility;
31. verify performance;
32. verify network behavior;
33. verify production build;
34. verify migrations;
35. verify automated tests;
36. run negative security tests;
37. run financial integrity tests;
38. clean placeholders/dead code;
39. finalize documentation;
40. prepare release gates;
41. classify external dependencies;
42. classify unresolved risks;
43. produce technical GO / CONDITIONAL GO / NO-GO;
44. produce banking-operations readiness status.

---

# 234. DO NOT IMPLEMENT AFTER FINAL AUDIT WITHOUT REPORTING

If a major architectural issue is found:

fix it if reasonably possible.

Document:

what changed

why

impact

test performed.

Do not silently redesign core architecture.

---

# 235. FINAL REPORT — SECTION 1

Provide:

```text
EXECUTIVE SUMMARY
```

Explain overall system state.

---

# 236. FINAL REPORT — SECTION 2

```text
SYSTEM ARCHITECTURE STATUS
```

---

# 237. FINAL REPORT — SECTION 3

```text
FEATURE COMPLETENESS MATRIX
```

For every major feature:

IMPLEMENTED

PARTIAL

NOT IMPLEMENTED

EXTERNAL DEPENDENCY.

---

# 238. FINAL REPORT — SECTION 4

```text
ROUTE MATRIX
```

---

# 239. FINAL REPORT — SECTION 5

```text
DATABASE & STORAGE INVENTORY
```

---

# 240. FINAL REPORT — SECTION 6

```text
AUTHENTICATION & CUSTOMER SECURITY
```

---

# 241. FINAL REPORT — SECTION 7

```text
RLS & AUTHORIZATION
```

---

# 242. FINAL REPORT — SECTION 8

```text
STAFF RBAC
```

---

# 243. FINAL REPORT — SECTION 9

```text
FINANCIAL LEDGER INTEGRITY
```

---

# 244. FINAL REPORT — SECTION 10

```text
INTERNAL TRANSFER AUDIT
```

---

# 245. FINAL REPORT — SECTION 11

```text
EXTERNAL 0→99→100 TRANSFER AUDIT
```

---

# 246. FINAL REPORT — SECTION 12

```text
KYC / COMPLIANCE
```

---

# 247. FINAL REPORT — SECTION 13

```text
STATEMENTS / DOCUMENTS
```

---

# 248. FINAL REPORT — SECTION 14

```text
MESSAGING / NOTIFICATIONS
```

---

# 249. FINAL REPORT — SECTION 15

```text
ADMIN BACK OFFICE
```

---

# 250. FINAL REPORT — SECTION 16

```text
ADMIN FINANCIAL CONTROLS
```

---

# 251. FINAL REPORT — SECTION 17

```text
SECURITY HARDENING
```

---

# 252. FINAL REPORT — SECTION 18

```text
ACCESSIBILITY
```

---

# 253. FINAL REPORT — SECTION 19

```text
RESPONSIVE / BROWSER QA
```

---

# 254. FINAL REPORT — SECTION 20

```text
PERFORMANCE
```

---

# 255. FINAL REPORT — SECTION 21

```text
DEPENDENCIES & EXTERNAL SERVICES
```

---

# 256. FINAL REPORT — SECTION 22

```text
MIGRATIONS / BACKUPS / RECOVERY
```

---

# 257. FINAL REPORT — SECTION 23

```text
TEST SUITE RESULTS
```

---

# 258. FINAL REPORT — SECTION 24

```text
UNRESOLVED FINDINGS
```

Sorted:

CRITICAL

HIGH

MEDIUM

LOW.

---

# 259. FINAL REPORT — SECTION 25

```text
RELEASE GATE
```

For:

BUILD

FUNCTIONAL

FINANCIAL

SECURITY

DATA

ACCESSIBILITY

RESPONSIVE

PERFORMANCE

OPERATIONS

EXTERNAL INTEGRATIONS

LEGAL/REGULATORY.

---

# 260. FINAL REPORT — SECTION 26

```text
TECHNICAL RELEASE DECISION
```

One of:

```text
GO
CONDITIONAL GO
NO-GO
```

Explain precisely why.

---

# 261. FINAL REPORT — SECTION 27

```text
REAL-WORLD BANKING OPERATIONS READINESS
```

One of:

```text
VERIFIED
PARTIALLY VERIFIED
NOT VERIFIED
NOT READY
```

Do not automatically inherit technical GO.

---

# 262. FINAL REPORT — SECTION 28

```text
REQUIRED ACTIONS BEFORE PRODUCTION
```

Prioritized list.

---

# 263. FINAL REPORT — SECTION 29

```text
POST-LAUNCH MONITORING REQUIREMENTS
```

Only if launch gate allows it.

---

# 264. FINAL REQUIRED CONFIRMATIONS

At the end explicitly state whether each is TRUE, FALSE or NOT VERIFIED:

- production build passes;
- TypeScript passes;
- critical automated tests pass;
- migrations apply successfully from clean environment;
- no privileged secret exists in browser bundle;
- all exposed sensitive tables are protected;
- cross-customer IDOR tests fail safely;
- staff RBAC is server-authoritative;
- customer cannot self-credit;
- customer cannot self-verify KYC;
- customer cannot forge transfer completion;
- ledger is financial source of truth;
- every posted journal balances;
- posted ledger entries are immutable;
- balance projections reconcile;
- holds do not double-deduct;
- internal transfer atomically debits sender and credits recipient;
- completed internal transfer reaches 100%;
- external transfer may stop below 100%;
- external transfer reaches 100% only after authoritative completion;
- admin credits/debits use balanced ledger postings;
- maker cannot self-approve when four-eyes is required;
- financial commands are idempotent;
- official statements reconcile;
- sensitive customer documents are private;
- secure messages cannot be forged as staff;
- notifications do not change financial state;
- MFA/step-up are server/provider-authoritative;
- staff cannot directly edit ledger;
- auditors remain read-only;
- no customer impersonation exists;
- WCAG 2.2 AA remains target;
- primary mobile flows work from 320px;
- no sensitive offline financial storage/queue exists;
- external providers required for production are identified;
- legal/regulatory readiness is explicitly separated from technical readiness.

---

# 265. FINAL STOP CONDITION

After the audit:

DO NOT automatically add new major features.

DO NOT start another architecture rewrite.

DO NOT declare production ready merely because the UI works.

Stop after:

- audit;
- fixes;
- testing;
- documentation;
- risk classification;
- release-gate decision.

The project should then have a clear answer to:

```text
WHAT IS IMPLEMENTED?

WHAT IS SECURE?

WHAT IS FINANCIALLY CORRECT?

WHAT IS STILL MISSING?

WHAT DEPENDS ON EXTERNAL PROVIDERS?

WHAT BLOCKS PRODUCTION?

WHAT CAN SAFELY BE RELEASED?

WHAT MUST BE VERIFIED BEFORE REAL BANKING OPERATIONS?
```

This completes the Digital Banking Foundation from PROMPT 00 through PROMPT 16.