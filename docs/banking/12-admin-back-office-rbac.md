# PROMPT 12 — ADMIN BACK OFFICE, USER MANAGEMENT, CUSTOMER OPERATIONS & STAFF PERMISSIONS

Continue from PROMPT 00 through PROMPT 11.

Do NOT rebuild the project.

Do NOT replace the customer application.

Do NOT duplicate the ledger, transfer, compliance, document, security or communication engines.

Do NOT weaken RLS, authorization, auditability or financial integrity.

Do NOT introduce offline-first behavior.

This phase creates the complete STAFF / ADMINISTRATION BACK OFFICE foundation.

The purpose is to allow authorized bank employees to safely manage and review:

- customers;
- customer profiles;
- bank accounts;
- onboarding;
- KYC;
- transfers;
- transaction history;
- compliance cases;
- document requests;
- statements;
- secure messaging;
- customer security cases;
- account restrictions;
- operational alerts;
- staff roles;
- permissions;
- audit events.

This phase must establish strict role separation.

Not every employee is an Administrator.

Not every Administrator is allowed to modify financial state.

---

# 1. FUNDAMENTAL ADMIN PRINCIPLE

The back office is a separate operational application experience.

It is NOT:

the customer dashboard with extra buttons.

It must use:

AdminLayout

+

staff authorization

+

permission checks

+

audit logging.

Never expose administration capabilities by merely hiding customer-side buttons.

---

# 2. ADMIN ROUTE NAMESPACE

Use:

```text
/admin
```

Recommended routes:

```text
/admin/dashboard

/admin/customers

/admin/customers/:customerRef

/admin/accounts

/admin/accounts/:accountRef

/admin/transfers

/admin/transfers/:transferRef

/admin/transactions

/admin/compliance

/admin/compliance/:caseRef

/admin/kyc

/admin/documents

/admin/messages

/admin/security

/admin/reports

/admin/audit

/admin/staff

/admin/roles

/admin/settings
```

Do not create every subpage if a simpler nested workflow is better.

---

# 3. ADMIN LAYOUT

Complete:

```text
AdminLayout
```

It should contain:

- admin sidebar;
- admin top bar;
- search;
- staff identity;
- role context;
- alerts;
- environment indicator where appropriate;
- main operational workspace.

Admin layout must not reuse the customer bottom navigation.

---

# 4. ADMIN MOBILE BEHAVIOR

Admin is primarily an operational desktop/tablet environment.

However:

it must remain usable on mobile browsers.

On small screens:

- sidebar becomes drawer;
- tables become stacked rows/cards;
- actions remain accessible;
- filters become sheets;
- critical controls remain usable.

Do not design mobile admin as an afterthought.

---

# 5. STAFF AUTHENTICATION

Staff access must use authenticated identities separate from ordinary customer authorization.

A customer account must never gain staff access because of a frontend role flag.

---

# 6. STAFF PROFILE ENTITY

Create a staff profile linked to authenticated identity.

Conceptual fields:

```text
id

auth_user_id

public_reference

display_name

email

status

department

role_id

created_at

last_login_at
```

Do not use email alone as permanent authorization identity.

---

# 7. STAFF STATUS

Support:

```text
INVITED

ACTIVE

SUSPENDED

DISABLED
```

A disabled staff account must lose operational access.

---

# 8. ROLE-BASED ACCESS CONTROL

Implement RBAC.

Initial recommended roles:

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

Do not hardcode permissions only by role name in components.

---

# 9. PERMISSION MODEL

Create granular permissions.

Examples:

```text
customers.read

customers.update_basic

customers.restrict

accounts.read

accounts.restrict

transactions.read

transfers.read

transfers.review

transfers.block

transfers.release

kyc.read

kyc.review

kyc.request_document

kyc.approve

kyc.reject

documents.read

documents.review

messages.read

messages.reply

security.read

security.restrict

ledger.read

ledger.adjust

staff.read

staff.manage

roles.manage

audit.read

settings.manage
```

Use only permissions needed.

---

# 10. ROLE ≠ PERMISSION

The server must evaluate actual permissions.

Do not rely on:

```ts
if (role === "ADMIN")
```

throughout the application.

Prefer:

```text
can("transfers.block")
```

or equivalent.

---

# 11. PERMISSION SOURCE

Permissions must come from trusted backend state.

Do not use:

localStorage.permissions.

---

# 12. SERVER-SIDE AUTHORIZATION

Every privileged admin command must check permissions server-side.

UI permission hiding is convenience only.

---

# 13. ADMIN DASHBOARD

Create `/admin/dashboard`.

Display operational summaries such as:

- customers;
- new registrations;
- customers under review;
- KYC pending;
- transfer volume;
- transfers awaiting review;
- blocked transfers;
- document requests;
- support conversations;
- security cases;
- operational alerts.

Do not fabricate production metrics.

---

# 14. ROLE-AWARE DASHBOARD

Dashboard cards should reflect staff permissions.

Example:

Support agent sees:

messages

customer support cases.

Compliance officer sees:

compliance reviews

document requests

external transfers.

Finance operator sees:

financial operations

accounting workflows.

Do not show unusable admin widgets to everyone.

---

# 15. GLOBAL ADMIN SEARCH

Provide safe search.

Supported identifiers may include:

customer reference

account reference

transfer reference

transaction reference

statement reference

conversation reference.

Do not expose unrestricted search across sensitive fields.

---

# 16. SEARCH PRIVACY

Avoid broad search by highly sensitive personal data unless role and policy permit.

Search results must return only permitted fields.

---

# 17. CUSTOMER MANAGEMENT

Implement:

```text
/admin/customers
```

The page should support:

search

filters

pagination

status

onboarding status

KYC status

banking status

created date.

---

# 18. CUSTOMER LIST

Potential columns:

Customer

Customer reference

Account status

KYC status

Banking status

Joined

Actions.

Do not expose complete private profile data in the list.

---

# 19. CUSTOMER DETAIL

Implement:

```text
/admin/customers/:customerRef
```

Create a comprehensive customer workspace.

Recommended sections:

Overview

Profile

Contacts

Addresses

Accounts

KYC

Documents

Transfers

Transactions

Messages

Security

Audit.

---

# 20. CUSTOMER OVERVIEW

Display concise information:

legal name

customer reference

verified contacts

customer lifecycle

KYC status

banking status

account count

active restrictions.

---

# 21. CUSTOMER SENSITIVE DATA

Only display sensitive fields when staff has permission.

Do not show everything merely because the user is in `/admin`.

---

# 22. FIELD MASKING

Use masking where appropriate.

Example:

email

phone

account number

document identifiers.

Allow reveal only when role/policy permits.

---

# 23. CUSTOMER PROFILE EDITING

Support limited controlled editing of appropriate profile fields.

Do not allow arbitrary modification of verified legal identity.

Sensitive identity changes should require:

specific workflow

reason

audit.

---

# 24. VERIFIED IDENTITY FIELDS

Fields such as legal name/date of birth may require controlled amendment.

Do not allow casual inline editing after KYC verification.

---

# 25. CUSTOMER STATUS

Staff may view customer lifecycle state.

Only appropriate roles may change restricted statuses.

---

# 26. ACCOUNT MANAGEMENT

Implement:

```text
/admin/accounts
```

and account detail.

Staff can inspect:

account owner

account reference

currency

status

balances

holds

recent transactions

restrictions.

---

# 27. BALANCE DISPLAY IN ADMIN

Admin may see:

ledger balance

available balance

held balance.

Do not allow these values to be edited directly.

---

# 28. NO DIRECT BALANCE FIELD EDIT

There must be no generic admin form:

```text
Balance: [ editable field ]
```

Financial adjustments come through controlled workflows in PROMPT 13.

---

# 29. ACCOUNT STATUS CONTROLS

Authorized staff may later:

restrict

suspend

freeze

close

according to permission.

For this prompt, build safe account-status management foundation.

---

# 30. STATUS CHANGE REQUIRES REASON

Any privileged status change must require:

reason category

comment

actor

timestamp.

---

# 31. ACCOUNT RESTRICTION

Implement controlled account restriction.

A restricted account may still allow safe read access.

Transactional restrictions depend on policy.

---

# 32. ACCOUNT FREEZE

A freeze must prevent disallowed outgoing transactions.

Server-side rules must enforce it.

---

# 33. ACCOUNT STATUS AUDIT

Record:

from

to

reason

staff actor

time.

Never silently overwrite account status.

---

# 34. TRANSACTION REVIEW

Implement admin transaction list.

Purpose:

inspection

search

reconciliation visibility.

Ordinary staff should not be able to edit ledger-backed transactions.

---

# 35. TRANSACTION DETAIL

Admin detail may show more internal-safe data than customer UI.

Potential:

transaction reference

source operation

ledger posting reference

account

amount

currency

status

timestamps.

Still hide information beyond role permission.

---

# 36. LEDGER READ ACCESS

Only roles with:

```text
ledger.read
```

may inspect raw accounting structures.

Support agents should not see chart-of-accounts internals.

---

# 37. LEDGER WRITE ACCESS

Do NOT implement generic ledger editing.

PROMPT 13 will add controlled financial adjustment commands.

---

# 38. TRANSFER MANAGEMENT

Implement:

```text
/admin/transfers
```

Allow staff to inspect:

internal transfers

external transfers

status

progress

amount

sender

destination

compliance state

documents

timestamps.

---

# 39. TRANSFER FILTERS

Useful filters:

Internal

External

Completed

99% pending

Action required

Compliance review

Blocked

Failed.

---

# 40. TRANSFER DETAIL

Implement:

```text
/admin/transfers/:transferRef
```

Sections:

Overview

Parties

Account information

Progress

Compliance

Requirements

Documents

Status history

Ledger relationship

Messages

Audit.

---

# 41. INTERNAL TRANSFER VISIBILITY

Internal transfer should show:

100% when completed.

Admin must see that recipient account was credited.

---

# 42. EXTERNAL TRANSFER VISIBILITY

External transfer should clearly show:

0–99 progress

current stage

customer requirements

external settlement status.

---

# 43. 99% QUEUE

Create a dedicated operational view/filter for external transfers at:

99%

that are awaiting:

- final settlement;
- staff action;
- customer document;
- external confirmation.

Do not treat all 99% transfers as the same cause.

---

# 44. TRANSFER ACTION PERMISSIONS

Actions such as:

block

release

approve

reject

must have separate permissions.

Do not give them all to Support Agent.

---

# 45. BLOCK TRANSFER

Prepare controlled transfer blocking.

Requirements:

permission check

reason

comment

audit event

status validation.

Do not block a completed transfer by simply rewriting history.

---

# 46. BLOCKABLE STATES

Only valid nonterminal states should be blockable.

Use centralized transition rules.

---

# 47. RELEASE TRANSFER

Prepare release/unblock action.

Require:

permission

reason

valid state

audit.

---

# 48. APPROVAL

Compliance approval belongs to qualified role.

Support Agent must not approve compliance.

---

# 49. REJECTION

Compliance rejection must require structured reason.

Customer-facing reason may differ from internal reason.

---

# 50. KYC ADMIN AREA

Implement:

```text
/admin/kyc
```

and/or:

```text
/admin/compliance
```

for identity/customer verification reviews.

---

# 51. KYC QUEUES

Provide queues such as:

New submissions

Under review

Additional information required

Documents received

Approved

Rejected.

---

# 52. KYC CASE DETAIL

Display:

customer

verification status

profile data

submitted documents

document status

history

review actions.

---

# 53. KYC DOCUMENT VIEW

Authorized staff may securely view required private documents.

Do not expose permanent public URLs.

---

# 54. KYC DOCUMENT ACTIONS

Qualified staff may:

Accept

Reject

Request replacement

Request additional document.

Each action requires audit trail.

---

# 55. CUSTOMER CANNOT SELF-APPROVE

Preserve previous security.

Admin UI must not weaken RLS so customer can update KYC state.

---

# 56. KYC APPROVAL

Only staff with:

```text
kyc.approve
```

may approve.

---

# 57. KYC REJECTION

Use:

structured reason

internal note

customer-safe explanation.

Do not expose fraud/security internals.

---

# 58. COMPLIANCE AREA

Implement transfer-compliance queues.

Examples:

Customer action required

Documents received

Under review

99% settlement pending

Blocked

Escalated.

---

# 59. COMPLIANCE CASE DETAIL

Display:

transfer summary

customer

destination

progress

requirements

documents

status history

risk context where role permits

settlement state.

---

# 60. COMPLIANCE DOCUMENT REVIEW

Support:

Accept

Reject

Replacement required.

Each transition updates transfer requirements appropriately.

---

# 61. APPROVED DOCUMENT

Document approval does NOT automatically mean transfer completed.

For external transfer:

may progress toward settlement pending.

100% still requires authoritative completion.

---

# 62. 100% ADMIN RULE

Staff must not manually set:

progress = 100

unless a defined authoritative completion command allows it.

Do not create a free-form percentage editor.

---

# 63. DOCUMENT ADMIN AREA

Implement:

```text
/admin/documents
```

for customer-safe operational document review.

Separate categories:

KYC uploads

transfer compliance documents

bank-generated statements/documents.

---

# 64. OFFICIAL DOCUMENTS

Staff may inspect statement metadata.

Do not let ordinary staff rewrite issued official PDFs.

---

# 65. STATEMENT IMMUTABILITY

Preserve PROMPT 09.

Correction uses new version.

No silent PDF replacement.

---

# 66. SUPPORT MESSAGING ADMIN AREA

Implement:

```text
/admin/messages
```

for secure customer support.

---

# 67. SUPPORT QUEUES

Potential:

Unassigned

Waiting for bank

Waiting for customer

Open

Resolved

Security

Transfers

Documents.

---

# 68. STAFF REPLY

Authorized staff can reply to customer conversations.

The system must mark sender as STAFF through trusted server action.

Do not trust client-submitted sender type.

---

# 69. CONVERSATION ASSIGNMENT

Support:

assign to team

assign to staff

where permissions allow.

---

# 70. INTERNAL NOTES

Add internal notes separate from customer-visible messages.

Internal notes must never appear in customer conversation.

---

# 71. INTERNAL NOTE SECURITY

Only authorized staff can read/write internal notes.

Do not expose them through customer message API.

---

# 72. SUPPORT RESOLUTION

Authorized staff may mark:

Resolved

Closed.

Require status history.

---

# 73. SECURITY CASES

Implement admin security review foundation.

Staff with relevant permission may inspect:

recent security events

account restrictions

session/security alerts.

---

# 74. NO AUTHENTICATION SECRET ACCESS

Admins must NEVER see:

password

OTP

MFA secret

recovery code

JWT

refresh token.

---

# 75. SESSION ADMIN ACCESS

Do not implement universal ability for admins to impersonate or hijack customer sessions.

Avoid dangerous account takeover shortcuts.

---

# 76. IMPERSONATION

Do NOT implement customer impersonation in V1.

If ever introduced later, it would need extremely strict controls.

For now:

no "Login as customer" button.

---

# 77. PASSWORD RESET BY STAFF

Do not let staff directly set a customer's password.

If support needs recovery:

trigger controlled recovery workflow.

---

# 78. STAFF AUDIT LOG

Every privileged staff action must record:

who

what

when

resource

reason

result.

---

# 79. AUDIT DOMAIN

Implement or complete:

```text
/admin/audit
```

for authorized auditors/admins.

---

# 80. AUDIT EVENT ENTITY

Conceptual:

```text
id

public_reference

actor_type

actor_id

action

resource_type

resource_reference

reason_code nullable

metadata_safe

created_at
```

---

# 81. AUDIT IMMUTABILITY

Audit events must not be editable by ordinary administrators.

Auditor role should typically be read-only.

---

# 82. AUDITOR ROLE

AUDITOR should generally have:

read financial/audit data

without:

customer modification

transfer approval

ledger adjustment

staff-management powers.

---

# 83. SUPPORT AGENT ROLE

Recommended permissions:

customers.read

accounts.read limited

transfers.read

messages.read

messages.reply

documents.read limited.

No:

ledger.adjust

kyc.approve

transfers.block unless explicitly granted.

---

# 84. KYC AGENT ROLE

Recommended:

customers.read

kyc.read

kyc.review

kyc.request_document

documents.review.

Approval may be separated from basic review if four-eyes policy is used.

---

# 85. COMPLIANCE OFFICER ROLE

Recommended:

transfers.read

transfers.review

transfers.block

compliance review

document review

approval/rejection according to policy.

---

# 86. FINANCE OPERATOR ROLE

Recommended:

accounts.read

transactions.read

ledger.read

future controlled adjustments.

Do not automatically grant staff management.

---

# 87. SUPERVISOR ROLE

May approve sensitive actions.

Prepare for four-eyes workflows.

---

# 88. ADMINISTRATOR ROLE

Can manage broad operational configuration.

Still should not automatically bypass financial control rules.

---

# 89. SUPER ADMINISTRATOR

Reserve for rare platform governance.

Even Super Admin should not be able to rewrite posted ledger history directly.

---

# 90. FOUR-EYES FOUNDATION

Prepare maker-checker workflow.

Examples:

financial adjustment initiated by Finance Operator

→ approved by Supervisor.

Compliance action may also require second approval depending on policy.

PROMPT 13 will use this deeply.

---

# 91. MAKER-CHECKER ENTITY

Prepare conceptual approval request:

```text
id

action_type

resource_reference

requested_by

approved_by nullable

status

reason

created_at

decided_at
```

Do not implement every approval workflow yet.

---

# 92. SELF-APPROVAL

Where four-eyes is required:

the initiator must not approve their own action.

Enforce server-side.

---

# 93. ADMIN FILTERS

Use reusable filter system.

Examples:

status

date

role

risk category

account status

transfer type

customer lifecycle.

Mobile filters should use a sheet.

---

# 94. ADMIN TABLES

Desktop can use dense data tables.

Support:

sorting

pagination

filters

column visibility where useful.

Do not put every field into one table.

---

# 95. MOBILE TABLES

Convert operational tables into stacked rows/cards.

No horizontal mega-table dependence.

---

# 96. BULK ACTIONS

Avoid bulk financial/status actions in V1 unless clearly safe.

Bulk email/support may be future functionality.

Do not allow bulk account freeze casually.

---

# 97. CUSTOMER EXPORTS

Do not add bulk PII export by default.

If reporting/export comes later:

permission and audit required.

---

# 98. STAFF NAVIGATION

Admin sidebar may include:

Dashboard

Customers

Accounts

Transfers

Transactions

KYC

Compliance

Documents

Messages

Security

Reports

Audit

Staff

Settings.

Display only sections allowed by permissions.

---

# 99. ADMIN TOP BAR

Include:

global search

operational alerts

staff profile

current role

sign out.

Do not display customer-specific navigation.

---

# 100. STAFF PROFILE MENU

Include:

My profile

Security

Sign out.

Do not allow role self-escalation.

---

# 101. STAFF SECURITY

Staff accounts should also use strong authentication.

At minimum:

MFA readiness

session security

security events.

Do not assume customer security controls automatically equal staff controls.

---

# 102. ADMIN ACCESS MFA

Prepare policy so high-privilege staff may require MFA.

Do not allow Super Admin without strong authentication in production policy.

---

# 103. STAFF ROLE CHANGE

Role changes require:

permission

audit

possibly step-up authentication.

A user cannot change their own role.

---

# 104. STAFF INVITATION

Prepare invite workflow.

Only authorized staff can invite new staff.

Do not create staff account through public registration.

---

# 105. STAFF DEACTIVATION

Disabling staff access must block future admin access.

Where supported:

revoke active sessions.

---

# 106. STAFF DIRECTORY

Implement:

```text
/admin/staff
```

for authorized administrators.

Display:

name

role

department

status

last activity.

---

# 107. ROLE MANAGEMENT

Implement:

```text
/admin/roles
```

only for authorized administrators.

Show:

role

permissions

staff count.

---

# 108. PERMISSION EDITING

Do not let every admin change role permissions.

Require:

roles.manage.

---

# 109. PROTECTED CORE PERMISSIONS

Consider protecting critical permissions from accidental removal/escalation.

Do not overbuild policy engine.

---

# 110. ADMIN SETTINGS

Create only basic operational settings foundation.

Do not place financial rules and security secrets into generic browser-editable forms.

---

# 111. CONFIGURATION SECURITY

Sensitive config such as:

provider API keys

service-role keys

external settlement credentials

must never be visible in admin frontend.

---

# 112. REPORTS FOUNDATION

Prepare:

```text
/admin/reports
```

for future operational summaries.

This phase can include limited read-only metrics.

Do not build a full BI suite.

---

# 113. DASHBOARD METRICS

All metrics must come from trusted server aggregates.

Do not calculate bank-wide metrics from browser-loaded records.

---

# 114. CUSTOMER COUNTS

Examples:

total customers

active customers

KYC pending.

Do not expose these publicly.

---

# 115. TRANSFER METRICS

Examples:

internal completed

external pending

99% awaiting settlement

blocked transfers.

Use authoritative status.

---

# 116. OPERATIONAL ALERTS

Admin dashboard may surface:

KYC backlog

99% external transfers

unanswered messages

blocked transfers

security cases.

Do not create fake urgency.

---

# 117. ACTIVITY FEED

Optional admin operational feed:

recent privileged actions

new cases.

Do not expose sensitive full payloads.

---

# 118. ADMIN NOTIFICATIONS

Prepare staff notification foundation if useful.

Do not merge customer notifications with admin notifications blindly.

---

# 119. CUSTOMER PROFILE VIEW SECURITY

Different roles may see different customer fields.

Use field-level shaping/DTOs where practical.

---

# 120. SERVER-SAFE DTOs

Do not return raw full customer rows to all admin screens.

Create role-aware response models.

---

# 121. DOCUMENT ACCESS

Document downloads must verify:

staff permission

case relevance

resource ownership/authorization.

---

# 122. TEMPORARY SIGNED URLS

Continue short-lived signed access.

Do not expose private storage permanently.

---

# 123. ADMIN RLS

Staff access may use:

role-aware policies

server functions

controlled service-layer authorization.

Do not simply bypass RLS everywhere with service-role client.

---

# 124. SERVICE ROLE USAGE

If service-role access is required:

keep server-side only.

Wrap it in permission-aware server functions.

---

# 125. NO FRONTEND SERVICE ROLE

Never expose privileged Supabase keys in admin browser bundle.

---

# 126. PRIVILEGED COMMAND PATTERN

Use narrow commands.

Examples:

```text
restrictCustomer()

changeAccountStatus()

reviewKycDocument()

approveKycCase()

blockTransfer()

releaseTransfer()

replyToConversation()
```

Avoid:

```text
adminUpdateAnything(table, fields)
```

---

# 127. COMMAND INPUT VALIDATION

Every privileged command validates:

actor identity

permission

resource

current state

reason

request schema.

---

# 128. IDEMPOTENCY

Sensitive commands should be safely idempotent where relevant.

Double-clicking Block must not create inconsistent duplicate events.

---

# 129. CONCURRENCY

Protect simultaneous staff actions.

Example:

Officer A approves transfer

while Officer B rejects it.

Only valid transition may succeed.

Use transactional state checks.

---

# 130. OPTIMISTIC ADMIN UI

Avoid optimistic completion for high-risk admin actions.

Wait for authoritative server response.

---

# 131. CONFIRMATION DIALOGS

Use detailed confirmation for:

freeze account

block transfer

reject KYC

disable staff

other high-impact actions.

Avoid generic:

Are you sure?

---

# 132. REASON CODES

Use structured reason categories.

Examples:

ACCOUNT_SECURITY

COMPLIANCE_REVIEW

DOCUMENT_INVALID

CUSTOMER_REQUEST

OPERATIONAL_ERROR.

Do not rely only on free-text notes.

---

# 133. INTERNAL NOTES

Free-text internal notes may supplement reason code.

Sanitize output.

---

# 134. CUSTOMER-SAFE REASONS

Do not expose internal note directly to customer.

Map to safe explanation where required.

---

# 135. AUDIT EVENT LINKING

Admin UI should allow authorized users to navigate from resource to related audit history.

---

# 136. AUDIT FILTERS

Filter by:

staff

action

resource type

date

result.

---

# 137. AUDIT SEARCH

Allow search by:

public resource reference

staff reference.

Avoid unrestricted search through sensitive metadata.

---

# 138. AUDIT EXPORT

Do not implement bulk audit export unless required.

If added later:

permission + logging required.

---

# 139. ADMIN SESSION EXPIRATION

If staff session expires:

remove access immediately

redirect to secure login.

Do not preserve sensitive forms indefinitely.

---

# 140. UNSAVED ADMIN FORM

For long internal notes/reviews:

warn on navigation when meaningful changes are unsaved.

---

# 141. NETWORK LOSS

Admin back office remains online-only.

Do not queue:

approval

freeze

block

KYC decision

financial command

offline.

---

# 142. NO OFFLINE ADMIN OUTBOX

No IndexedDB pending admin commands.

---

# 143. ADMIN ERROR STATES

Errors should remain actionable.

Examples:

Unable to load customer

Action no longer valid

Permission denied

State changed by another staff member.

---

# 144. STALE DATA

Admin decisions must revalidate current state on server.

Do not approve based solely on stale page state.

---

# 145. STATE CHANGED MESSAGE

If another staff member acted first:

display:

This case has changed since you opened it. Refresh to continue.

---

# 146. SECURITY EVENT VIEW

Authorized security staff may inspect customer-safe/internal security events.

Do not expose authentication secrets.

---

# 147. SUPPORT AGENT LIMITATION

Support must not see:

raw ledger entries

internal risk scoring

full KYC documents

unless permissions explicitly allow it.

---

# 148. DATA MINIMIZATION

Every admin screen should expose only what the role needs.

Being a bank employee does not imply universal access.

---

# 149. SENSITIVE VIEW AUDIT

Consider auditing access to especially sensitive records:

KYC documents

security cases

full account identifiers.

Do not over-log ordinary list views.

---

# 150. PII REVEAL

If staff reveals masked sensitive information:

consider recording a sensitive-access audit event.

---

# 151. NO CUSTOMER IMPERSONATION

Reconfirm:

do not implement:

Login as customer.

Support must guide customers through proper customer flows.

---

# 152. ADMIN ACTIONS VS CUSTOMER COMMUNICATION

When staff performs a customer-impacting action:

generate appropriate domain event.

Example:

KYC document rejected

→ customer notification.

Do not manually write notification text from random admin components.

---

# 153. KYC EVENT INTEGRATION

KYC approval/rejection must feed PROMPT 10 notification system.

---

# 154. TRANSFER BLOCK EVENT

Blocked transfer must feed:

customer notification

possibly secure message/system entry.

---

# 155. TRANSFER RELEASE EVENT

Released transfer may resume workflow according to state machine.

Do not automatically set 100%.

---

# 156. ACCOUNT RESTRICTION EVENT

Account restriction must update:

customer app access policy

dashboard banner

notification.

---

# 157. CUSTOMER STATUS CHANGE

Lifecycle changes should affect route access immediately.

---

# 158. FINANCIAL SAFETY

This prompt does NOT implement direct financial credits/debits.

Those come in PROMPT 13.

Do not sneak in editable balance actions.

---

# 159. FOUR-EYES READINESS

Prepare UI/components for:

Pending approval

Awaiting second reviewer

Approved

Rejected.

PROMPT 13 will use them for financial actions.

---

# 160. ADMIN ACTION COMPONENTS

Create reusable admin-specific components:

AdminPageHeader

AdminDataTable

FilterBar

EntitySummary

StatusHistory

InternalNote

PermissionGate

SensitiveField

ActionPanel

AuditTimeline

ApprovalStatus.

Keep them inside admin feature/shared admin area.

---

# 161. PERMISSION GATE

Create UI helper:

```text
<PermissionGate permission="transfers.block">
```

or equivalent.

Remember:

this is UI convenience only.

Server still enforces.

---

# 162. ADMIN FEATURE STRUCTURE

Recommended:

```text
src/features/admin/
├── dashboard/
├── customers/
├── accounts/
├── transfers/
├── compliance/
├── kyc/
├── documents/
├── messages/
├── security/
├── audit/
├── staff/
├── roles/
└── shared/
```

Adapt to existing architecture.

Do not create a single giant `Admin.tsx`.

---

# 163. ADMIN SERVICE BOUNDARY

Keep privileged data access in server/service modules.

Do not put raw service-role Supabase calls into React components.

---

# 164. ADMIN SEARCH SERVICE

Create server-side role-aware search.

Do not send entire database to client for filtering.

---

# 165. PAGINATION

Use server-side pagination for:

customers

transfers

transactions

audit

messages

KYC cases.

---

# 166. FILTER PERSISTENCE

Optional URL query parameters may preserve filters.

Do not put sensitive values in URLs.

---

# 167. BROWSER TITLES

Use safe titles:

Customer | Admin

Transfer | Admin.

Do not put full personal data in browser titles.

---

# 168. ACCESSIBILITY

Admin must meet WCAG 2.2 AA quality.

Verify:

tables

filters

drawers

dialogs

action menus

status histories

permission-denied states

keyboard navigation.

---

# 169. TABLE ACCESSIBILITY

Use semantic tables on desktop.

Do not build inaccessible clickable rows without keyboard alternatives.

---

# 170. ACTION MENU

Every row action menu must be keyboard accessible.

---

# 171. COLOR

Do not rely only on color for:

blocked

approved

rejected

restricted.

---

# 172. RESPONSIVE TEST MATRIX

Test:

320px

375px

430px

768px

1024px

1280px

1440px+.

Validate:

dashboard

customer list

customer detail

transfer list

transfer detail

KYC

messages

audit

staff.

---

# 173. MOBILE ADMIN ACTION

Critical actions must remain reachable but not accidentally tappable.

Use deliberate confirmation.

---

# 174. DESKTOP DENSITY

Desktop admin may be denser than customer UI.

Still preserve readable spacing.

---

# 175. LARGE DESKTOP

Use wide workspace but controlled panel widths.

Do not stretch text endlessly.

---

# 176. PERFORMANCE

Do not load all customer data on dashboard.

Use aggregate endpoints.

---

# 177. ROLE-BASED CODE SPLITTING

Where practical:

do not load unavailable feature bundles for roles without access.

This is optimization, not security.

---

# 178. LOGGING

Never log:

password

OTP

MFA secret

service-role key

raw KYC document

full sensitive customer data unnecessarily.

---

# 179. ANALYTICS

Do not send sensitive admin operations to generic product analytics with raw PII.

Use internal audit/observability.

---

# 180. ADMIN SECURITY TEST

Customer tries `/admin`.

Expected:

denied.

---

# 181. ROLE TEST — SUPPORT

Support agent tries KYC approval.

Expected:

denied.

---

# 182. ROLE TEST — KYC

KYC agent tries ledger adjustment.

Expected:

denied.

---

# 183. ROLE TEST — AUDITOR

Auditor attempts customer modification.

Expected:

denied.

---

# 184. ROLE TEST — ADMIN

Administrator attempts direct ledger-entry update.

Expected:

impossible.

---

# 185. ROLE ESCALATION TEST

Staff attempts to modify own role.

Expected:

denied unless explicitly authorized and policy allows, preferably never self-escalating.

---

# 186. TRANSFER BLOCK TEST

Authorized compliance officer blocks valid pending transfer.

Expected:

status transition

audit

customer notification.

---

# 187. INVALID BLOCK TEST

Attempt to block already completed internal transfer.

Expected:

rejected.

Do not rewrite completed history.

---

# 188. KYC APPROVAL TEST

Authorized KYC staff approves case.

Expected:

status updated

history created

customer lifecycle updated if appropriate

notification.

---

# 189. KYC SELF-APPROVAL TEST

Ordinary customer submits direct update.

Expected:

rejected.

---

# 190. DOCUMENT ACCESS TEST

Support agent without permission opens raw KYC document.

Expected:

denied.

---

# 191. CUSTOMER RESTRICTION TEST

Authorized staff restricts account.

Expected:

customer transactional access updates

audit event

notification.

---

# 192. CONCURRENT REVIEW TEST

Two staff members open same case.

One approves.

Second tries reject from stale state.

Expected:

second action rejected/refreshed.

---

# 193. INTERNAL NOTE TEST

Internal note is visible in admin.

Customer messaging API must never return it.

---

# 194. STAFF DISABLE TEST

Staff account disabled.

Expected:

future admin access blocked

sessions revoked where supported.

---

# 195. AUDIT IMMUTABILITY TEST

Admin attempts to edit/delete prior audit event.

Expected:

denied.

---

# 196. CURRENT IMPLEMENTATION SCOPE

Implement in this prompt:

1. AdminLayout.
2. Staff identity model.
3. Staff roles.
4. Permission model.
5. RBAC enforcement.
6. Admin dashboard.
7. Global admin search.
8. Customer list.
9. Customer detail workspace.
10. Account list/detail.
11. Account-status-control foundation.
12. Transaction inspection.
13. Transfer list/detail.
14. 99% external-transfer queue.
15. Transfer block/release foundation.
16. KYC queue.
17. KYC case review.
18. KYC document review.
19. Compliance queue.
20. Compliance case review.
21. Document administration.
22. Secure messaging admin console.
23. Internal notes.
24. Security-case foundation.
25. Audit log.
26. Staff directory.
27. Role management.
28. Four-eyes foundation.
29. Permission-aware navigation.
30. Responsive admin UX.
31. Accessibility.
32. RLS/server authorization.
33. Concurrency/state validation.
34. Security tests.
35. Audit tests.

---

# 197. DO NOT IMPLEMENT YET

Do NOT implement full:

- account credit;
- account debit;
- ledger financial adjustment;
- controlled manual reversal;
- maker-checker financial approval;
- high-risk financial operations;
- automated risk engine;
- full BI/reporting suite.

These come in PROMPT 13 and later.

---

# 198. PRESERVE PROMPT 11

Customer security remains separate.

Staff does not gain access to authentication secrets.

---

# 199. PRESERVE PROMPT 10

Use existing notification and secure messaging infrastructure.

Admin actions should emit domain events into it.

---

# 200. PRESERVE PROMPT 09

Official statements remain immutable.

---

# 201. PRESERVE PROMPT 08

External transfer:

99% ≠ completed.

Staff approval alone does not necessarily mean 100%.

---

# 202. PRESERVE PROMPT 07

Internal transfer completion remains ledger-authoritative.

---

# 203. PRESERVE PROMPT 06

Ledger remains immutable financial source of truth.

Admin cannot edit ledger entries directly.

---

# 204. PRESERVE PROMPT 05

Balances remain projections.

---

# 205. PRESERVE PROMPT 04

Admin uses separate AdminLayout.

Do not mix customer shell.

---

# 206. PRESERVE PROMPT 03

Customer lifecycle remains authoritative.

---

# 207. PRESERVE PROMPT 02

Public website remains separate.

---

# 208. PRESERVE PROMPT 01

Reuse design tokens and primitives.

Admin may use denser variants.

---

# 209. PRESERVE PROMPT 00

Maintain:

simple modular architecture;

online-only operation;

server authority;

Supabase security.

---

# 210. FINAL RBAC REVIEW

Explicitly confirm:

Support cannot perform financial adjustments.

KYC staff cannot manage ledger.

Finance staff cannot automatically manage staff roles.

Auditor is read-only.

Customer cannot access `/admin`.

Permissions are enforced server-side.

---

# 211. FINAL ADMIN SECURITY REVIEW

Confirm:

no service-role key in frontend;

no admin action trusts UI alone;

no customer impersonation feature exists;

no staff can view passwords/OTP/MFA secrets;

sensitive document access is permission-controlled;

privileged actions are audited.

---

# 212. FINAL TRANSFER REVIEW

Confirm:

internal completed transfers cannot be retroactively marked blocked;

external 99% cases remain distinct from completed;

staff approval does not fake external settlement completion;

100% remains authoritative.

---

# 213. FINAL FINANCIAL SAFETY REVIEW

Confirm:

no editable balance field exists;

no generic ledger mutation action exists;

no admin can directly modify posted journal entries;

financial adjustments are deferred to PROMPT 13.

---

# 214. FINAL MOBILE REVIEW

Confirm:

admin remains usable from 320px;

sidebar collapses appropriately;

filters work in sheets;

tables adapt;

critical actions are accessible;

no horizontal layout failure.

---

# 215. FINAL REPORT

At completion provide:

ADMIN ARCHITECTURE

ADMIN ROUTES

ADMIN LAYOUT

STAFF IDENTITY MODEL

STAFF STATUS MODEL

ROLE MODEL

PERMISSION MODEL

RBAC IMPLEMENTATION

PERMISSION-AWARE NAVIGATION

ADMIN DASHBOARD

GLOBAL SEARCH

CUSTOMER MANAGEMENT

CUSTOMER DETAIL

ACCOUNT MANAGEMENT

ACCOUNT STATUS CONTROLS

TRANSACTION INSPECTION

TRANSFER MANAGEMENT

99% EXTERNAL TRANSFER QUEUE

TRANSFER BLOCK / RELEASE FOUNDATION

KYC MANAGEMENT

KYC DOCUMENT REVIEW

COMPLIANCE MANAGEMENT

DOCUMENT ADMINISTRATION

SECURE MESSAGING CONSOLE

INTERNAL NOTES

SECURITY CASE FOUNDATION

AUDIT LOG

STAFF DIRECTORY

ROLE MANAGEMENT

FOUR-EYES FOUNDATION

RLS / AUTHORIZATION

AUDIT EVENTS

RESPONSIVE UX

ACCESSIBILITY

SECURITY TESTS

FILES CREATED

FILES MODIFIED

DATABASE CHANGES

SERVER FUNCTIONS

DEPENDENCIES ADDED

KNOWN TODOs

Also explicitly confirm:

- project builds successfully;
- TypeScript passes;
- customers cannot access admin routes;
- staff roles are separate from customer roles;
- permissions are server-authoritative;
- support staff cannot approve KYC unless granted;
- non-finance roles cannot perform financial adjustments;
- auditors remain read-only;
- customer impersonation was not introduced;
- no staff can read authentication secrets;
- admin transfer blocking uses controlled state transitions;
- completed internal transfers cannot be rewritten as blocked;
- external transfers at 99% remain pending until authoritative completion;
- KYC decisions are audited;
- account restrictions are audited;
- internal notes never appear to customers;
- audit events are not customer/admin-editable;
- no direct balance modification was introduced;
- no posted ledger mutation was introduced;
- no offline-first architecture was introduced;
- PROMPT 00 through PROMPT 11 remain intact.

Stop after completing the administration foundation, RBAC, customer operations and review workflows.

The next phase is:

PROMPT 13 — ADMIN FINANCIAL CONTROLS, ACCOUNT CREDIT/DEBIT, MANUAL ADJUSTMENTS, REVERSALS & FOUR-EYES APPROVAL.