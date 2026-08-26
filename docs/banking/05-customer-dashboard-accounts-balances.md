# PROMPT 05 — CUSTOMER DASHBOARD, BANK ACCOUNTS & BALANCE EXPERIENCE

Continue from:

PROMPT 00 — Foundation & Modular Architecture  
PROMPT 01 — Design System, Branding & Visual Identity  
PROMPT 02 — Public Website, Landing Page & Customer Acquisition  
PROMPT 03 — Authentication, Registration, KYC & Customer Onboarding  
PROMPT 04 — Customer Banking App Shell, Navigation & Member Experience

Do NOT rebuild the architecture.

Do NOT replace the design system.

Do NOT break public pages, authentication, onboarding, route guards, customer lifecycle rules or customer navigation.

Do NOT introduce offline-first behavior.

This phase implements the first real BANKING DATA EXPERIENCE for authenticated customers.

The objective is to create:

- real customer bank-account entities;
- account overview;
- account balances;
- available funds;
- booked/ledger balance presentation;
- reserved/held funds presentation;
- dashboard financial summary;
- account details;
- banking coordinates;
- account-status states;
- current-account selection;
- account activity preview;
- monthly inflow/outflow summary;
- responsive account experience;
- secure server-backed data access.

This phase must prepare cleanly for the future ledger and transaction engine.

It must NOT create a simplistic editable `balance` field as the source of truth.

---

# 1. CRITICAL ACCOUNTING RULE

The displayed customer balance is NOT the accounting source of truth.

Do NOT build the product around:

```ts
account.balance += amount
```

or:

```ts
UPDATE accounts
SET balance = ...
```

from customer-facing code.

The future ledger will become the authoritative financial source.

For this phase, balances must be treated as a controlled SERVER-MANAGED READ MODEL / PROJECTION.

The customer frontend can READ balances.

The customer frontend must NEVER directly mutate balances.

---

# 2. ACCOUNTING PREPARATION

Prepare the account model so a future double-entry ledger can calculate and update account balance projections.

Conceptually:

LEDGER

→ ACCOUNTING PROJECTION

→ ACCOUNT BALANCE READ MODEL

→ CUSTOMER UI

Do not implement the complete ledger yet.

The detailed accounting engine comes in PROMPT 06.

---

# 3. CUSTOMER ACCOUNT DOMAIN

Create or complete:

```text
src/features/accounts/
```

Possible internal organization:

```text
accounts/
├── components/
├── hooks/
├── services/
├── schemas/
├── types/
├── utils/
└── pages/
```

Only create directories that are actually useful.

Keep account-specific logic inside the account feature.

---

# 4. DASHBOARD DOMAIN

Create or complete:

```text
src/features/dashboard/
```

Dashboard must aggregate small summaries from banking domains.

It must NOT become the owner of:

account logic;

transaction logic;

transfer logic;

statement logic.

Dashboard consumes safe summaries.

---

# 5. CUSTOMER ACCOUNT ENTITY

Create a structured bank account entity.

Conceptual fields may include:

```text
id

customer_id

public_reference

account_type

currency

status

opened_at

closed_at

display_name

primary_account

created_at

updated_at
```

Adapt naming to existing project conventions.

Do not expose internal database IDs unnecessarily.

---

# 6. ACCOUNT PUBLIC REFERENCE

Create a safe customer-facing account reference.

For example:

```text
ACC-2026-000481
```

or an equivalent opaque identifier.

Use it where a route requires an account reference.

Do not use raw internal database UUIDs as the primary customer-facing identifier when avoidable.

---

# 7. BANKING COORDINATES

Prepare structured banking coordinates.

Depending on the target banking jurisdiction, an account may eventually have:

account number;

IBAN;

routing number;

bank code;

branch code;

SWIFT/BIC;

local account identifier.

Do NOT assume IBAN is universal.

Create flexible structures so the banking system can support jurisdiction-specific account details.

---

# 8. ACCOUNT NUMBER SECURITY

Full account identifiers should not be displayed unnecessarily.

Default compact presentation:

```text
•••• 4821
```

Allow controlled actions such as:

View details

Copy account number

Copy IBAN

where applicable.

Do not put complete account numbers in:

browser title;

analytics;

public URL;

toast payload logs.

---

# 9. ACCOUNT TYPE

Prepare account types conceptually such as:

```text
CURRENT

SAVINGS

BUSINESS
```

However, implement only products actually needed by the current banking project.

Do not invent multiple fake banking products merely to populate the UI.

The initial active customer account may be a:

Current Account

or neutral:

Personal Account.

---

# 10. ACCOUNT CURRENCY

Each account must have an explicit currency.

Examples:

EUR

USD

XAF

GBP

Do not assume one global application currency.

Use ISO 4217 currency codes internally where appropriate.

---

# 11. MULTI-CURRENCY READINESS

The architecture should support customers having accounts in different currencies later.

Do not sum:

100 EUR + 100 USD

into a fake:

200 total

without a trusted FX conversion layer.

Dashboard totals must remain currency-aware.

---

# 12. ACCOUNT STATUS

Use explicit account statuses.

For example:

```text
PENDING

ACTIVE

RESTRICTED

SUSPENDED

FROZEN

CLOSING

CLOSED
```

Do not expose raw enum values directly.

Map them to customer-friendly labels.

---

# 13. ACTIVE ACCOUNT

Customer-facing label:

Active

Means the account is available for permitted banking operations.

This does not automatically mean every transaction type is allowed.

Future transfer rules may add additional restrictions.

---

# 14. RESTRICTED ACCOUNT

Restricted accounts may still allow:

viewing balance;

viewing activity;

downloading statements;

accessing support;

security settings.

Transactional capabilities may be limited.

The exact restriction policy should remain centralized.

---

# 15. SUSPENDED / FROZEN ACCOUNT

Do not show normal send-money flows as active.

Display a clear persistent status state.

Example:

Your account currently has transaction restrictions.

Provide:

View details

Contact support

when appropriate.

Do not expose internal investigation information.

---

# 16. CLOSED ACCOUNT

Closed accounts must not allow new financial operations.

Historical access may remain available according to policy.

Prepare the UI so closed accounts can still expose:

past statements;

past transactions;

account details where permitted.

---

# 17. BALANCE MODEL

Prepare the UI and backend projection to distinguish at least:

```text
ledger_balance

available_balance

held_balance
```

Optionally:

```text
pending_balance
```

depending on implementation.

Do not collapse all financial states into one number.

---

# 18. LEDGER BALANCE

Customer-facing wording may be:

Current balance

or:

Booked balance

depending on product language.

This represents posted financial entries.

The exact future calculation comes from the ledger.

---

# 19. AVAILABLE BALANCE

The primary customer figure should generally be:

Available balance

This represents funds currently available for permitted use.

Conceptually:

```text
available_balance
=
ledger_balance
-
applicable_holds
```

But do NOT calculate this independently in UI code.

The backend/read model should provide the authoritative value.

---

# 20. HELD / RESERVED FUNDS

Prepare representation for:

Reserved funds

or:

Funds on hold.

This may later represent:

pending transfer reservations;

compliance holds;

authorization holds;

other temporary restrictions.

Do not call all held funds "fees".

---

# 21. BALANCE READ MODEL

Create a server-managed balance projection entity.

Conceptual fields:

```text
account_id

currency

ledger_balance_minor

available_balance_minor

held_balance_minor

version

calculated_at

updated_at
```

Use appropriate naming conventions.

The customer must have READ access only.

---

# 22. MONEY STORAGE

Do not store money using JavaScript floating-point assumptions.

Prefer integer minor units.

Example:

```text
€10.50
```

stored conceptually as:

```text
1050
```

with:

```text
currency = EUR
```

where the currency uses two decimal minor units.

Use a money abstraction capable of supporting currencies with different decimal rules.

---

# 23. NO FLOATING-POINT FINANCIAL MATH

Do not use:

```ts
0.1 + 0.2
```

style floating arithmetic for authoritative monetary calculations.

Financial computations must eventually use integer minor units or a suitable decimal/money implementation.

The frontend can format trusted amounts.

It must not become the accounting engine.

---

# 24. BALANCE VERSIONING

Prepare the balance projection for versioning.

A conceptual field such as:

```text
version
```

can later help prevent stale financial state updates.

Do not implement unnecessary complexity if the current database transaction model already provides an equivalent solution.

---

# 25. BALANCE UPDATED TIMESTAMP

Expose:

```text
calculated_at
```

or equivalent to the application.

The UI may display:

Updated just now

where useful.

Do not overemphasize timestamps if data is current.

---

# 26. ACCOUNT OWNERSHIP

Every account must be tied to an authorized customer relationship.

At minimum:

```text
customer_id
```

for this phase.

Future versions may support:

joint accounts;

business authorized users;

delegates.

Do not prematurely implement all relationship types.

---

# 27. ACCOUNT RLS

Use Row Level Security.

A customer may read only accounts they are authorized to access.

Customer A must never access Customer B's account by modifying:

URL;

account reference;

request payload;

client state.

---

# 28. BALANCE RLS

Balance projections must follow account ownership.

Do not expose all balances to every authenticated user.

---

# 29. CUSTOMER CANNOT CREATE BANK ACCOUNTS ARBITRARILY

Do not let the browser directly INSERT arbitrary active bank accounts.

Account creation/activation must remain controlled by trusted server workflows.

PROMPT 03 activation logic may trigger initial account provisioning through controlled server-side logic.

---

# 30. CUSTOMER CANNOT EDIT ACCOUNT STATUS

The customer cannot set:

```text
ACTIVE

FROZEN

CLOSED
```

directly.

Status transitions are privileged banking operations.

---

# 31. CUSTOMER CANNOT EDIT CURRENCY

Once a banking account is created, currency changes must not be arbitrary profile edits.

Treat currency as protected financial configuration.

---

# 32. INITIAL ACCOUNT PROVISIONING

When an eligible customer becomes:

BANKING STATUS = ACTIVE

the system may provision an initial account if one does not already exist.

This must be:

server-controlled;

idempotent;

auditable.

Do not create duplicate accounts if the activation process retries.

---

# 33. IDEMPOTENT ACCOUNT CREATION

Use an appropriate uniqueness rule or controlled provisioning function.

Repeated execution must not accidentally produce:

Account 1

Account 2

Account 3

for the same activation event.

---

# 34. ACCOUNT DISPLAY NAME

Provide friendly names.

Examples:

Personal Account

Main Account

Savings

Do not expose technical account type enum as the only label.

---

# 35. DEFAULT ACCOUNT

Prepare a concept of:

primary/default account.

The customer app may use this account initially on:

Dashboard

Transfer

Activity

Statements.

Do not assume forever that the first database row is the default account.

---

# 36. ACCOUNT SELECTOR INTEGRATION

Integrate the AccountContext prepared in PROMPT 04 with real server-backed accounts.

If the customer has one account:

show compact context.

If multiple accounts:

show account selector.

Selection must remain ownership-validated.

---

# 37. SELECTED ACCOUNT STATE

Selected account preference may be maintained as a UI preference.

Do not use client state to bypass authorization.

Every data request must still validate account ownership server-side.

---

# 38. ACCOUNT ROUTES

Complete:

```text
/app/accounts
```

and:

```text
/app/accounts/:accountRef
```

with real data behavior.

---

# 39. ACCOUNTS LIST PAGE

The account overview page should display:

all customer-authorized accounts;

account name;

masked identifier;

currency;

available balance;

status;

relevant contextual action.

Do not overload each account card.

---

# 40. ACCOUNT CARD

Reuse/complete the AccountCard from PROMPT 01.

Display:

Account type/name

Masked account identifier

Available balance

Currency

Status

Primary indicator if relevant.

Actions:

View account

or tap/click card.

---

# 41. MOBILE ACCOUNT CARD

On mobile:

use full-width account cards.

Keep:

balance;

currency;

account name;

status

easy to scan.

Avoid tiny secondary text.

---

# 42. DESKTOP ACCOUNT GRID

Desktop may show:

two or three columns

if multiple accounts exist.

Do not stretch cards to enormous widths.

---

# 43. ACCOUNT DETAIL PAGE

Create a comprehensive:

```text
/app/accounts/:accountRef
```

experience.

Sections may include:

Account summary

Available balance

Current/booked balance

Reserved funds

Account details

Recent activity

Quick actions

Statements shortcut

Security/status information.

---

# 44. ACCOUNT DETAIL HERO

At the top display:

Account name

Masked account number

Status

Available balance

Currency

Privacy toggle.

Keep the information hierarchy clear.

---

# 45. BALANCE PRIVACY

Reuse Privacy Mode.

When enabled, hide:

available balance;

current balance;

held balance;

recent activity amounts

according to the established privacy-mode policy.

Do not hide information inconsistently.

---

# 46. ACCOUNT DETAILS PANEL

Create an account-information section.

Possible fields:

Account holder

Account reference

Account number

IBAN if applicable

BIC/SWIFT if applicable

Currency

Account type

Opened date

Status.

Only show fields actually supported by the current bank configuration.

---

# 47. COPY BANK DETAILS

Allow individual copy actions for permitted account identifiers.

Example:

Copy account number

Copy IBAN

Use clear confirmation.

Do not automatically copy all personal banking information at once.

---

# 48. SHARE BANK DETAILS

Prepare a safe future-compatible pattern for:

Share account details

if desired.

For this phase, copying individual details is sufficient.

Do not generate public share links containing sensitive information.

---

# 49. ACCOUNT QUICK ACTIONS

On account details, useful actions may include:

Send money

View activity

View statements

Account details

Get help.

These actions should navigate to the correct domains.

Do not fake their business logic.

---

# 50. DASHBOARD REAL DATA

Upgrade the shell dashboard from PROMPT 04 to use actual account data.

The dashboard should answer immediately:

How much money can I use?

What accounts do I have?

What happened recently?

Is there anything requiring my attention?

---

# 51. DASHBOARD INFORMATION ARCHITECTURE

Recommended mobile order:

1. Customer/account status alert if needed
2. Available balance
3. Account context
4. Quick actions
5. Recent activity
6. Monthly summary
7. Action-required tasks
8. Secondary shortcuts

Desktop can use a richer grid.

---

# 52. PRIMARY BALANCE CARD

Create the most important dashboard component:

Available Balance Card.

Display:

Available balance

Currency

Selected account

Privacy toggle

Last update when needed.

Possible actions:

View account

Refresh

depending on UX.

---

# 53. BALANCE CARD ERROR STATE

If balance cannot be retrieved:

do NOT display:

0.00

because that falsely implies a zero balance.

Instead display:

Balance unavailable

with:

Retry.

This is critical.

---

# 54. BALANCE CARD LOADING STATE

Use skeletons.

Do not temporarily show:

0

while loading.

---

# 55. STALE BALANCE HANDLING

If the last successful balance is available but refresh fails:

do not silently present it as current.

Display context such as:

Last updated 10 minutes ago

Connection issue

Retry.

Follow the global online-only rules.

---

# 56. NO OFFLINE BALANCE AUTHORITY

Do not use IndexedDB/localStorage to persist balances as authoritative data.

A previously displayed balance may exist temporarily in application/query memory, but must not become an offline banking source of truth.

---

# 57. REFRESH ACCOUNT DATA

Provide a consistent refresh mechanism.

Refresh should fetch:

account summary;

balance projection;

recent activity summary

as appropriate.

Avoid refetch storms.

---

# 58. QUICK ACTIONS ON DASHBOARD

Recommended actions:

Send money

Accounts

Activity

Statements.

If beneficiary creation is strategically important later, expose it from transfer flow rather than overloading Home.

---

# 59. QUICK ACTION ROUTING

Send money

→ `/app/transfers/new`

Accounts

→ `/app/accounts`

Activity

→ `/app/activity`

Statements

→ `/app/statements`

If destination functionality is not fully implemented yet, the route must still have a coherent future-state shell.

---

# 60. MONTHLY SUMMARY

Create a compact financial summary.

Possible values:

Money in

Money out

Net movement

for the current calendar month.

Do not invent data.

---

# 61. MONTHLY SUMMARY SOURCE

Monthly values must be supplied by a trusted server-side aggregate/read model.

Do not calculate them from incomplete client-side lists.

The future transaction engine will provide authoritative values.

---

# 62. TEMPORARY MONTHLY AGGREGATE

If PROMPT 06 has not yet created the transaction engine:

create the interface/service contract now.

For development:

use clearly isolated server/dev fixtures or empty state.

Do NOT seed random financial activity into production tables simply to make charts look attractive.

---

# 63. NO FAKE TREND

Do not show:

+12.4%

or:

"up 25% this month"

unless actual comparison data exists.

Trend indicators must reflect real calculations.

---

# 64. MONEY IN

Customer-facing label:

Money in

Represents completed incoming posted activity within the selected period.

Pending incoming funds must not be mixed arbitrarily.

---

# 65. MONEY OUT

Customer-facing label:

Money out

Represents completed outgoing posted activity within the selected period.

Future transaction logic will define precise classifications.

---

# 66. NET MOVEMENT

If shown:

```text
Money in - Money out
```

must be computed from trusted aggregate data.

Do not describe this automatically as:

profit

or:

income.

A bank account's cash flow is not business profit.

---

# 67. PERIOD SELECTOR

For dashboard summary, default to:

This month.

Do not overcomplicate with advanced analytics filters yet.

Account activity pages can later offer broader ranges.

---

# 68. RECENT ACTIVITY

Create a dashboard recent-activity component.

Display a limited number of latest items.

Example:

5 recent entries.

Actions:

View all activity.

Do not attempt to implement the complete transaction history here.

---

# 69. RECENT ACTIVITY CONTRACT

Prepare a safe activity-summary interface.

Possible fields:

```text
reference

type

direction

display_name

amount_minor

currency

occurred_at

status
```

PROMPT 06 will define authoritative transaction entities.

---

# 70. ACTIVITY DISPLAY

Use TransactionRow visual foundation.

Mobile:

counterparty / description

date

amount

status.

Desktop can show richer details.

---

# 71. ACTIVITY EMPTY STATE

If no posted activity exists:

show:

No account activity yet.

Do not create fake transactions.

---

# 72. ACTIVITY LOADING

Use row skeletons.

Do not block the entire dashboard while activity loads if balance/account summary is already available.

---

# 73. PARALLEL DATA LOADING

Where appropriate, dashboard sections may load independently.

Example:

balance available;

activity still loading.

This improves perceived performance.

Avoid one giant blocking query when unnecessary.

---

# 74. DASHBOARD SERVER AGGREGATOR

Consider a small server-side dashboard summary endpoint/service.

It may return:

customer summary

selected account summary

balance summary

recent activity summary

action-required count.

Do not make it return every object in the customer database.

Keep payload lean.

---

# 75. DASHBOARD PAYLOAD

Avoid sending:

all documents;

all statements;

all transactions;

all beneficiaries;

all messages

on initial dashboard load.

Each domain owns its data.

---

# 76. ACCOUNT STATUS ALERTS

Dashboard should surface relevant account restrictions.

Examples:

Identity document required

Account restricted

Transfer verification pending

Security review required.

Only show trusted tasks.

---

# 77. ACTION REQUIRED PRIORITY

Use stronger visual hierarchy for truly important items.

Do not label routine suggestions as:

URGENT

or:

CRITICAL.

---

# 78. CUSTOMER ACCOUNT SUMMARY

Create a reusable AccountSummary type/service.

Conceptual:

```text
accountRef

displayName

currency

status

maskedIdentifier

availableBalance

ledgerBalance

heldBalance

updatedAt
```

Keep authoritative money values in minor units internally.

---

# 79. FORMAT AT PRESENTATION BOUNDARY

Use centralized money formatter.

Example:

```text
125050
XAF
```

→ appropriate localized display.

Do not concatenate currency symbols manually.

---

# 80. LOCALE-AWARE MONEY

Use:

`Intl.NumberFormat`

or the established formatting utility.

Do not assume:

`,` always means thousands

or:

`.` always means decimals.

---

# 81. ZERO-DECIMAL CURRENCIES

The money model must support currencies where minor-unit conventions differ.

Do not hardcode:

divide by 100

globally without currency metadata.

---

# 82. NEGATIVE BALANCES

Prepare the design to display negative values safely if a banking product allows them.

Do not automatically color all negatives as errors.

A negative balance may be permitted in some account products.

Product rules determine meaning.

---

# 83. ACCOUNT OVERDRAFT READINESS

Do not implement overdraft in this phase.

But do not architect the UI so negative balances become impossible.

---

# 84. RESERVED FUNDS EXPLANATION

If held funds > 0:

provide contextual explanation.

Example:

Some funds are temporarily unavailable.

CTA:

View details

if a relevant future route exists.

Do not expose internal compliance reasons unnecessarily.

---

# 85. HELD FUNDS BREAKDOWN

Do not implement a complete hold engine yet.

Prepare a future-friendly section capable of listing holds later.

PROMPT 06/07 may define actual reservation sources.

---

# 86. BALANCE CONSISTENCY

Whenever the same account balance appears in:

Dashboard

Account list

Account details

ensure it comes from the same trusted balance projection.

Do not calculate independent conflicting values in each screen.

---

# 87. ACCOUNT DATA SERVICE

Create a clean account service boundary.

Conceptual methods:

```text
getCustomerAccounts()

getAccountSummary(accountRef)

getAccountDetails(accountRef)

getAccountBalance(accountRef)
```

Exact implementation may use server functions or queries appropriate to the current stack.

---

# 88. DASHBOARD SERVICE

Conceptual method:

```text
getDashboardSummary()
```

or equivalent.

Do not couple dashboard components directly to raw database table structure if a small service abstraction improves consistency.

---

# 89. SERVER AUTHORIZATION

Every account service must validate:

authenticated user;

customer lifecycle;

account ownership;

required banking status

where relevant.

Do not trust only route guards.

---

# 90. DEFENSE IN DEPTH

Route guard:

prevents obvious unauthorized navigation.

RLS/server authorization:

prevents unauthorized data access.

Both are required.

---

# 91. ACCOUNT DETAIL AUTHORIZATION

When requesting:

`/app/accounts/:accountRef`

the backend must verify that the authenticated customer can access that account.

If not:

return safe not-found/permission behavior.

Do not reveal whether another customer's account exists.

---

# 92. RESOURCE ENUMERATION PROTECTION

Use opaque public references where possible.

Do not expose sequential database IDs such as:

`/accounts/1`

`/accounts/2`

if that increases enumeration risk.

---

# 93. BANKING ACCOUNT CREATION HISTORY

Prepare account entity for:

opened_at

status history

where auditability matters.

Do not overwrite important account lifecycle events without history.

---

# 94. ACCOUNT STATUS HISTORY

Conceptually:

```text
account_status_history
```

with:

account

from_status

to_status

reason/category

changed_by

changed_at.

Customer may not need access to internal reasons.

---

# 95. CUSTOMER-FACING STATUS HISTORY

Do not expose privileged admin notes.

If future UI shows account history, expose only appropriate customer-safe events.

---

# 96. ACCOUNT IDENTIFIER GENERATION

Public account references and banking numbers must be generated server-side.

Do not rely on browser random generation for authoritative banking identifiers.

---

# 97. UNIQUE BANKING IDENTIFIERS

Use appropriate uniqueness constraints.

Do not trust application checks alone.

Database uniqueness should protect relevant identifiers.

---

# 98. ACCOUNT OPEN DATE

Display a customer-friendly:

Opened on

date if useful on details.

Use consistent date formatting.

---

# 99. ACCOUNT HOLDER

Display verified account-holder name.

Do not let a simple profile nickname alter the legal account-holder display where official identity matters.

---

# 100. CUSTOMER DISPLAY NAME VS LEGAL NAME

Keep distinction between:

display name

and

legal identity name.

Financial documents should later use verified legal identity.

---

# 101. DASHBOARD GREETING

If greeting uses first name:

use profile display data.

Do not expose full legal identity unnecessarily.

---

# 102. ACCOUNT CAROUSEL

On mobile, if multiple accounts exist:

a horizontal account carousel may be used.

However:

do not make core account selection dependent on awkward swipe gestures.

Provide clear pagination/selection cues.

A simple vertical list is also acceptable.

Choose usability over visual novelty.

---

# 103. PRIMARY ACCOUNT CARD

Dashboard may show only the selected/default account.

Provide:

View all accounts.

Avoid showing five giant balance cards before recent activity.

---

# 104. DASHBOARD DESKTOP GRID

Suggested desktop composition:

Primary balance/account card

Quick actions

Monthly summary

Recent activity

Action-required panel.

Use responsive grid hierarchy.

Do not create a uniform 4x4 widget dashboard.

---

# 105. MOBILE DASHBOARD PRIORITY

At 320–430px, the dashboard should feel like a banking app.

The first useful information should appear quickly.

Avoid:

huge greeting;

large decorative chart;

oversized illustration

before the balance.

---

# 106. DASHBOARD CHARTS

Do not add charts just because dashboards often have charts.

If no authoritative time-series exists yet:

do not draw a fake chart.

PROMPT 06 can introduce real transaction analytics.

---

# 107. ACCESSIBILITY OF MONEY VALUES

Screen readers must receive meaningful monetary values.

Example:

12,450 euros and 80 cents

depending on localization capability.

Do not expose decorative separators as confusing text.

---

# 108. PRIVACY MODE ACCESSIBILITY

When privacy mode hides values:

screen readers must not continue reading hidden values.

The accessible representation should also reflect privacy mode.

---

# 109. COPY BUTTON ACCESSIBILITY

Use labels such as:

Copy account number

not only:

Copy.

---

# 110. STATUS ACCESSIBILITY

Use semantic label + icon where useful.

Do not communicate account restriction only by red border.

---

# 111. ACCOUNT PAGE EMPTY STATE

If an authenticated active customer unexpectedly has no account:

do not invent one client-side.

Show a controlled provisioning/account-setup state.

Example:

Your banking account is being prepared.

Contact support if the state persists.

---

# 112. PROVISIONING ERROR

If account provisioning fails:

record the server error appropriately;

show safe customer messaging;

do not expose infrastructure details.

Provide support path.

---

# 113. ACCOUNT PROVISIONING TRANSACTION

Use database/server transaction behavior where appropriate so account creation and initial supporting records remain consistent.

Do not leave half-created active accounts.

---

# 114. INITIAL BALANCE

A newly created account should normally begin with a controlled zero ledger/balance projection unless a legitimate opening entry exists.

Do not randomly seed funds.

---

# 115. ADMIN CREDIT PREPARATION

Future admin account credit functionality must create accounting entries.

Do not create a hidden shortcut in this prompt that directly edits balance projection.

PROMPT 13 will implement controlled financial adjustments.

---

# 116. TRANSFER PREPARATION

Future transfer flows will reserve/debit funds through controlled server-side transaction logic.

Do not deduct money from the displayed balance client-side in anticipation of a transfer.

---

# 117. OPTIMISTIC FINANCIAL UPDATES

Avoid optimistic balance changes for sensitive financial operations.

After a future transfer:

fetch or receive authoritative balance state.

UI may show processing state rather than pretending the transfer succeeded.

---

# 118. REAL-TIME READINESS

Supabase realtime or another event mechanism may later refresh account projections.

Do not require realtime for correctness.

The application must remain correct with normal secure refetch behavior.

---

# 119. REAL-TIME SUBSCRIPTION SECURITY

If account balance subscriptions are introduced:

authorize them appropriately.

Do not subscribe customers to global financial tables.

---

# 120. PERFORMANCE

Account summary requests should remain small.

Avoid fetching full histories when only balances are needed.

Use indexes for:

customer ownership;

account reference;

status

where appropriate.

---

# 121. DATABASE INDEXES

Add indexes only where justified.

Potential examples:

```text
bank_accounts.customer_id

bank_accounts.public_reference

account_balances.account_id
```

Use unique indexes for truly unique references.

---

# 122. QUERY SECURITY

Select only required columns.

Do not expose internal operational fields to customer queries simply because they exist.

---

# 123. INTERNAL ACCOUNT FIELDS

Potential internal fields such as:

risk flags;

internal notes;

admin labels;

compliance flags;

fraud scores

must not be part of customer account response payloads.

---

# 124. CUSTOMER-SAFE DTO

Create customer-safe account response models.

Do not return raw database rows directly when they contain sensitive internal fields.

---

# 125. DASHBOARD CUSTOMER-SAFE DTO

Dashboard response should be deliberately shaped.

Return only what the UI needs.

---

# 126. ACCOUNT DATA CACHE

Use the existing query/server-state approach.

Do not persist account financial data into long-term browser storage.

Short-lived in-memory caching may be used according to existing architecture.

---

# 127. QUERY INVALIDATION

Prepare clear invalidation/refetch keys for future:

transfer completed;

account adjustment;

transaction posted.

Do not build feature-to-feature manual state mutation chains.

---

# 128. CUSTOMER REFRESH EXPERIENCE

If account data changes after a trusted operation:

the relevant account summary and dashboard should refresh consistently.

---

# 129. LOADING GRANULARITY

Prefer section-level loading.

Example:

Account info loaded

Recent activity loading.

Do not block viewing the account number because monthly summary is unavailable.

---

# 130. ERROR GRANULARITY

One failed secondary widget should not necessarily destroy the entire account page.

Example:

Balance loads

Monthly summary fails.

Display a local error for summary.

---

# 131. CRITICAL DATA FAILURE

If the authoritative balance itself cannot load:

make the failure clearly visible.

Do not hide it behind an old number.

---

# 132. NETWORK BANNER INTEGRATION

Reuse the online-only network banner from PROMPT 04.

When disconnected:

do not allow refresh-dependent financial assumptions.

Show:

Reconnect to update your banking information.

---

# 133. DASHBOARD ACTIONS WHILE OFFLINE

If offline:

disable or intercept actions that require banking network access.

Do not queue:

transfers;

account changes;

financial commands.

---

# 134. RESPONSIVE ACCOUNT DETAILS

Mobile:

stack:

Balance

Quick actions

Account details

Recent activity.

Desktop:

balance summary + account details can share columns.

Do not hide important details behind hover.

---

# 135. ACCOUNT DETAILS DRAWER

For mobile, some bank coordinates may be shown in a bottom sheet.

This is optional.

A dedicated details section/page is also acceptable.

Choose the simpler accessible pattern.

---

# 136. CONFIDENTIAL DISPLAY

Sensitive fields may have:

Show

Hide

Copy

actions.

Do not display the full value by default if masking is more appropriate.

---

# 137. ACTIVITY LINKS

A dashboard activity row should eventually navigate to:

```text
/app/transactions/:transactionRef
```

or transfer details where appropriate.

Do not implement detailed transaction logic yet.

---

# 138. DASHBOARD URL

Use:

```text
/app/dashboard
```

as the canonical customer home.

`/app` may redirect safely to it.

---

# 139. ACTIVE ACCOUNT CUSTOMER

Only customers allowed by lifecycle/access policy should see normal account balances.

Incomplete onboarding users remain in onboarding.

Restricted users follow centralized policy.

---

# 140. ACCOUNT STATUS VS CUSTOMER STATUS

Keep these separate.

Customer may be:

ACTIVE

while one account is:

RESTRICTED.

Or customer may have:

multiple accounts

with different statuses.

Do not collapse them.

---

# 141. CUSTOMER ACCOUNT RELATION

Future-proof the data model so a customer/account relationship table could later support:

owner;

joint owner;

authorized user.

Do not implement this complexity now unless needed.

---

# 142. AUDITABILITY

Prepare audit events for server-controlled account lifecycle actions.

Examples:

account_created

account_activated

account_restricted

account_suspended

account_closed.

Customer balance views do not need an audit event every time they load.

---

# 143. BALANCE AUDITABILITY

Future ledger entries, not manual balance edits, must explain why a balance changed.

Do not create a generic editable history of balance values as the financial audit trail.

---

# 144. DATA INTEGRITY

Use database constraints where appropriate.

Examples:

account currency required;

account reference unique;

balance projection one active row per account;

minor-unit money values integer-like.

---

# 145. ACCOUNT BALANCE CONSISTENCY

If:

```text
ledger_balance = 1000

held_balance = 200
```

the trusted backend projection should normally provide:

```text
available_balance = 800
```

according to product rules.

Do not ask UI components to derive it independently.

---

# 146. NEGATIVE HELD BALANCE

Held/reserved balance should not become negative under normal rules.

Use data integrity checks appropriate to the accounting design.

Do not over-constrain future products if legitimate exceptions exist.

---

# 147. DASHBOARD SECURITY

Do not send complete account identifiers just to render a masked value when a masked representation can be returned separately.

Where full values are necessary for explicit reveal/copy actions, fetch them through appropriate authorized pathways.

---

# 148. SENSITIVE VALUE REVEAL

If full banking identifiers are hidden by default:

explicit reveal may require:

customer interaction;

optional recent authentication later for especially sensitive values.

Do not overcomplicate basic account-number access unless security policy requires it.

---

# 149. PRINTING

Do not implement full printable account statements yet.

PROMPT 09 will handle statements.

Account details may have simple browser-friendly layout but are not substitutes for official statements.

---

# 150. CUSTOMER DASHBOARD CONTENT

Final customer dashboard should conceptually include:

Greeting/context

Selected account

Available balance

Privacy mode

Quick actions

Monthly money in

Monthly money out

Recent activity

Account-status alerts

Action-required tasks

Statements shortcut

Support shortcut.

Do not overcrowd it.

---

# 151. MOBILE DASHBOARD NAVIGATION

Maintain PROMPT 04 bottom nav:

Home

Accounts

Transfer

Activity

More.

Do not add a new dashboard-specific bottom nav.

---

# 152. TABLET EXPERIENCE

At tablet widths:

use richer grid;

retain touch-friendly targets;

avoid excessively large cards.

---

# 153. DESKTOP EXPERIENCE

On desktop:

use customer sidebar;

balanced dashboard grid;

readable widths;

persistent account context where appropriate.

Do not transform the dashboard into an admin console.

---

# 154. DARK MODE

Balance, statuses and account details must remain legible in dark mode.

Do not reduce financial contrast for aesthetics.

---

# 155. SKELETON PRIVACY

Skeletons must not temporarily reveal sensitive layout values or fake number lengths unnecessarily.

Use neutral placeholders.

---

# 156. EMPTY BALANCE IS NOT ZERO

Differentiate:

Zero balance

from:

Balance unavailable

from:

No account.

These are different states.

---

# 157. ZERO BALANCE

A legitimate zero balance should display correctly.

Example:

0 XAF

or localized equivalent.

Do not treat it as missing data.

---

# 158. ACCOUNT ARCHIVE

Closed accounts may eventually move to an:

Archived accounts

section.

Prepare the list architecture for active vs closed grouping if needed.

Do not implement unnecessary archive interactions yet.

---

# 159. CUSTOMER ACCOUNT SORTING

If multiple accounts:

primary account first;

then logical product ordering.

Do not sort unpredictably on every request.

---

# 160. ACCOUNT SEARCH

Do not add search for two accounts.

Only introduce account search if scale justifies it.

---

# 161. FINANCIAL SUMMARY LIMITATION

Do not claim:

"spending analytics"

until PROMPT 06 provides trustworthy transaction classifications.

For now use:

account activity summary

and:

money in/out.

---

# 162. DATE RANGE

Dashboard monthly summary can use the customer's locale/timezone logic consistently.

Do not mix UTC day boundaries incorrectly with customer-facing dates.

Server calculations should define period boundaries deliberately.

---

# 163. TIMEZONE READINESS

Store financial event timestamps in a consistent backend standard.

Render according to configured banking/customer locale rules.

Do not store localized display strings as canonical timestamps.

---

# 164. CUSTOMER LOCALE

Use existing locale-ready formatting.

Do not build an entirely new i18n system inside account components.

---

# 165. NO DIRECT SUPABASE QUERIES EVERYWHERE

Avoid placing raw balance/account queries in every UI component.

Use:

feature services;

server loaders;

appropriate query hooks

consistent with TanStack Start and the existing project.

---

# 166. SERVER-SIDE DATA LOADING

Use TanStack Start server capabilities where appropriate for secure authenticated data loading.

Do not expose privileged service credentials to the browser.

---

# 167. SERVER FUNCTIONS

Potential controlled server functions may include:

```text
getCustomerAccounts

getAccountDetails

getAccountBalanceProjection

getDashboardSummary

provisionInitialAccount
```

Do not allow customer-controlled parameters that bypass ownership.

---

# 168. INPUT VALIDATION

Validate account references passed to server functions.

Do not concatenate route values into unsafe raw SQL.

Use safe database APIs/query builders.

---

# 169. ACCOUNT NOT FOUND

For unauthorized or nonexistent account references:

return a safe:

Account not available

or appropriate 404/permission experience.

Avoid differentiating in ways that help enumerate accounts.

---

# 170. CUSTOMER SUPPORT SHORTCUT

Account details should offer:

Get help

which can route to:

`/app/messages`

or the relevant support path.

Do not expose internal admin contacts.

---

# 171. DEMO DATA

If development fixtures are required:

use clearly marked values.

Example fixture accounts can live only in development/test areas.

Do not mix demo balances with production tables.

---

# 172. TEST DATA RESET

Development account fixtures should be easy to reset without changing real user data.

---

# 173. ACCOUNT TEST SCENARIOS

Validate at least:

SCENARIO A

Active customer with one account

→ Dashboard shows selected account

→ Balance displays

→ Account detail opens.

SCENARIO B

Active customer with multiple accounts

→ Account selector works

→ Dashboard context changes

→ Ownership remains enforced.

SCENARIO C

Customer with zero balance

→ 0 displayed correctly.

SCENARIO D

Balance service unavailable

→ No fake 0

→ Error + Retry.

SCENARIO E

Restricted account

→ Restriction banner

→ Disallowed transactional CTA unavailable.

SCENARIO F

Closed account

→ Historical details available where allowed

→ No new transaction CTA.

SCENARIO G

Customer tries another customer's account reference

→ Access denied/not found safely.

---

# 174. RESPONSIVE TEST SCENARIOS

Test:

320px

360px

375px

390px

430px

768px

1024px

1280px

1440px+.

Validate:

dashboard;

balance card;

account cards;

account selector;

account detail;

banking coordinates;

copy actions;

privacy mode;

monthly summary;

recent activity.

---

# 175. MOBILE KEYBOARD

Account screens should rarely require keyboard input in this phase.

If renaming/display preferences are introduced later:

ensure keyboard-safe layout.

Do not add unnecessary forms.

---

# 176. ACCESSIBILITY TEST

Verify:

balance accessible labels;

privacy mode behavior;

copy buttons;

account selector;

status semantics;

currency reading;

keyboard navigation;

screen-reader navigation.

---

# 177. SECURITY TEST

Verify:

customer cannot INSERT account;

customer cannot UPDATE balance;

customer cannot UPDATE account status;

customer cannot access another account;

customer cannot change currency;

customer cannot provision additional accounts;

internal operational fields are not exposed.

---

# 178. DATABASE SECURITY TEST

Attempt requests directly rather than relying only on UI.

RLS/server checks must reject unauthorized access.

---

# 179. PERFORMANCE TEST

Dashboard should not require loading the complete future transaction history.

Keep account queries indexed and compact.

---

# 180. BUILD VALIDATION

Run:

build

TypeScript checks

configured lint/tests.

Resolve:

broken imports;

route conflicts;

type mismatches;

responsive overflow.

---

# 181. CURRENT IMPLEMENTATION SCOPE

Implement in this prompt:

1. Real customer account entity.
2. Account ownership relationship.
3. Public account reference.
4. Account status model.
5. Currency-aware account model.
6. Balance projection/read-model foundation.
7. Available/current/held balance support.
8. Secure customer account queries.
9. Account RLS.
10. Balance RLS.
11. Initial account provisioning workflow.
12. Accounts list page.
13. Account detail page.
14. Real account selector integration.
15. Dashboard real account summary.
16. Available Balance Card.
17. Privacy Mode integration.
18. Monthly summary contract.
19. Recent activity contract.
20. Account status alerts.
21. Quick-action routing.
22. Safe copy/reveal of banking coordinates.
23. Loading/error/zero/unavailable states.
24. Mobile-first responsiveness.
25. Accessibility.
26. Security tests.
27. Development fixtures if necessary.

---

# 182. DO NOT IMPLEMENT YET

Do NOT implement the complete:

double-entry ledger;

transaction posting engine;

transfer execution;

beneficiary management;

transfer compliance journey;

statement generation;

document center;

secure messaging;

notification engine;

admin account credit;

admin account debit;

admin financial adjustments.

These come later.

---

# 183. PRESERVE PROMPT 04

Keep:

BankingAppLayout

mobile bottom navigation

desktop sidebar

customer menu

network state

route-access matrix

privacy mode.

Integrate real account data into them rather than rebuilding them.

---

# 184. PRESERVE PROMPT 03

Customer lifecycle remains authoritative.

Incomplete onboarding customers must not gain normal banking access.

Account provisioning must follow trusted activation rules.

---

# 185. PRESERVE PROMPT 02

Public website remains fully functional.

Do not import customer financial code into public marketing bundles unnecessarily.

---

# 186. PRESERVE PROMPT 01

Reuse:

AccountCard

Balance display

Money formatting

StatusBadge

Skeleton

ErrorState

Buttons

Page layout tokens.

Do not duplicate these components.

---

# 187. PRESERVE PROMPT 00

Maintain:

simple modular architecture;

online-only behavior;

server-authoritative financial state;

feature/service boundaries;

Supabase security.

---

# 188. FINAL FINANCIAL INTEGRITY REVIEW

Before completion verify:

There is no customer-writable `balance` source of truth.

Available balance is backend-provided.

Current/booked balance is backend-provided.

Held balance is backend-provided.

Money uses safe integer/decimal representation.

Currency is explicit.

Customer cannot mutate balance.

Customer cannot mutate account status.

Customer cannot provision accounts arbitrarily.

No optimistic client-side balance mutation exists.

---

# 189. FINAL DASHBOARD REVIEW

Verify that the customer dashboard answers:

What account am I viewing?

What money is available?

What happened recently?

What action can I take?

Is anything requiring attention?

without overwhelming the user.

---

# 190. FINAL REPORT

At completion provide:

ACCOUNT DOMAIN CREATED

ACCOUNT DATA MODEL

ACCOUNT STATUS MODEL

CURRENCY MODEL

ACCOUNT PROVISIONING

BALANCE PROJECTION MODEL

AVAILABLE BALANCE

CURRENT / BOOKED BALANCE

HELD FUNDS

RLS POLICIES

SERVER FUNCTIONS

ACCOUNT LIST

ACCOUNT DETAILS

BANKING COORDINATES

ACCOUNT SELECTOR

CUSTOMER DASHBOARD

MONTHLY SUMMARY

RECENT ACTIVITY CONTRACT

PRIVACY MODE

LOADING / ERROR STATES

RESPONSIVE BEHAVIOR

ACCESSIBILITY

SECURITY TESTS

FILES CREATED

FILES MODIFIED

DATABASE CHANGES

INDEXES / CONSTRAINTS

DEPENDENCIES ADDED

TEST SCENARIOS VALIDATED

KNOWN TODOs

Also explicitly confirm:

- project builds successfully;
- TypeScript passes;
- customer accounts are server-backed;
- active customer account provisioning is idempotent;
- balances are NOT directly editable by customers;
- the customer frontend cannot change account status;
- available/current/held balances are distinct;
- money representation avoids unsafe floating-point authority;
- currencies are explicit;
- account ownership is enforced server-side;
- changing an account reference cannot expose another customer's account;
- zero balance is distinguished from unavailable balance;
- stale data is not silently presented as current after failures;
- no offline-first architecture was introduced;
- no offline financial queue exists;
- PROMPT 00 architecture remains intact;
- PROMPT 01 design system is reused;
- PROMPT 02 public website remains functional;
- PROMPT 03 authentication/onboarding remains authoritative;
- PROMPT 04 customer app shell remains intact.

Stop after completing customer accounts, balances and dashboard experience.

Do NOT automatically implement the full transaction engine.

The next phase is:

PROMPT 06 — DOUBLE-ENTRY LEDGER, TRANSACTIONS & ACCOUNT ACTIVITY ENGINE.