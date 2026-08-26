# PROMPT 06 — DOUBLE-ENTRY LEDGER, TRANSACTIONS & ACCOUNT ACTIVITY ENGINE

Continue from:

PROMPT 00 — Foundation & Modular Architecture  
PROMPT 01 — Design System, Branding & Visual Identity  
PROMPT 02 — Public Website, Landing Page & Customer Acquisition  
PROMPT 03 — Authentication, Registration, KYC & Customer Onboarding  
PROMPT 04 — Customer Banking App Shell, Navigation & Member Experience  
PROMPT 05 — Customer Dashboard, Bank Accounts & Balance Experience

Do NOT rebuild the project.

Do NOT replace the design system.

Do NOT break:

- public routes;
- authentication;
- onboarding;
- customer lifecycle;
- account provisioning;
- account ownership;
- balance projection;
- customer navigation;
- mobile-first behavior.

Do NOT introduce offline-first architecture.

This phase implements the CORE ACCOUNTING ENGINE of the banking platform.

The objective is to create:

- a real double-entry ledger foundation;
- internal ledger accounts;
- balanced journal transactions;
- debit and credit entries;
- immutable posted accounting history;
- controlled transaction posting;
- transaction references;
- reversal transactions;
- account balance projection updates;
- account activity;
- transaction history;
- transaction details;
- monthly account aggregates;
- concurrency protection;
- idempotency;
- auditability;
- server-side financial integrity.

The ledger created in this prompt becomes the authoritative source of truth for financial movements.

---

# 1. ABSOLUTE ACCOUNTING RULE

From this prompt onward:

THE LEDGER IS THE FINANCIAL SOURCE OF TRUTH.

Never change a customer balance directly.

Never implement:

```ts
account.balance += amount
```

Never implement:

```sql
UPDATE account_balances
SET available_balance = available_balance + ...
```

as an independent financial operation.

Financial changes must originate from:

BUSINESS OPERATION

→ VALIDATION

→ LEDGER POSTING

→ BALANCE PROJECTION UPDATE

→ CUSTOMER READ MODEL.

---

# 2. DOUBLE-ENTRY PRINCIPLE

Every posted financial transaction must contain balanced accounting entries.

Conceptually:

```text
TOTAL DEBITS = TOTAL CREDITS
```

for each currency-specific journal transaction.

An unbalanced journal must NEVER be posted.

This rule must be enforced server-side/database-side.

The frontend cannot be trusted to enforce accounting balance.

---

# 3. ACCOUNTING EXAMPLE

For an internal customer-to-customer transfer of 100 monetary units:

Customer A deposit liability account:

```text
DEBIT 100
```

Customer B deposit liability account:

```text
CREDIT 100
```

Result:

Customer A balance decreases.

Customer B balance increases.

Total journal:

```text
DEBITS = 100
CREDITS = 100
```

The actual customer-transfer workflow will be implemented in PROMPT 07.

This example only demonstrates the accounting model.

---

# 4. DO NOT CONFUSE TWO ACCOUNT TYPES

There are now two different concepts:

## BANK ACCOUNT

The product account visible to the customer.

Example:

Personal Account  
•••• 4821  
Available balance: 150,000 XAF

## LEDGER ACCOUNT

Internal accounting account used by the financial engine.

Customers must not see raw internal ledger accounts.

Keep these concepts separate.

---

# 5. LEDGER MODULE

Create a dedicated feature/domain such as:

```text
src/features/ledger/
```

Possible internal organization:

```text
ledger/
├── services/
├── types/
├── schemas/
├── utils/
└── server/
```

The ledger is primarily a server-side domain.

Do NOT create customer UI components inside the ledger module unless absolutely necessary.

Customer transaction UI belongs to:

```text
features/transactions/
```

---

# 6. TRANSACTION FEATURE

Create or complete:

```text
src/features/transactions/
```

Possible structure:

```text
transactions/
├── components/
├── hooks/
├── services/
├── schemas/
├── types/
├── utils/
└── pages/
```

This domain owns the CUSTOMER-FACING transaction experience.

It should consume safe ledger/activity read models.

It must not contain low-level accounting posting rules.

---

# 7. LEDGER ACCOUNT ENTITY

Create an internal ledger account model.

Conceptual fields:

```text
id

code

name

account_class

normal_side

currency

bank_account_id nullable

status

created_at

updated_at
```

Adapt naming to existing conventions.

---

# 8. LEDGER ACCOUNT CLASSES

Support standard conceptual accounting classes:

```text
ASSET

LIABILITY

EQUITY

REVENUE

EXPENSE
```

Do not expose these technical classes to ordinary customers.

---

# 9. NORMAL BALANCE SIDE

Ledger accounts should define or derive their normal balance side.

Conceptually:

```text
ASSET → DEBIT

EXPENSE → DEBIT

LIABILITY → CREDIT

EQUITY → CREDIT

REVENUE → CREDIT
```

This allows balance projections to be calculated consistently.

---

# 10. CUSTOMER DEPOSIT ACCOUNT

A normal customer bank deposit balance is conceptually represented internally as a LIABILITY of the bank.

The system should create or associate an internal ledger liability account with each customer bank account.

For example:

```text
bank_account
ACC-2026-000481

↕

ledger_account
CUSTOMER_DEPOSIT_LIABILITY
```

Do not expose this accounting terminology to the customer UI.

---

# 11. LEDGER ACCOUNT LINK

Each customer bank account should have a controlled link to its corresponding ledger account.

Do not rely on loose string matching.

Use explicit relational keys.

---

# 12. ONE CUSTOMER ACCOUNT → ONE PRIMARY LEDGER ACCOUNT

For the initial implementation:

one customer bank account should map to one primary customer-balance ledger account per currency.

Future products may use additional internal accounts.

Do not add unnecessary complexity now.

---

# 13. CURRENCY CONSISTENCY

A ledger account must have an explicit currency.

Do not post EUR into an XAF ledger account.

Currency mismatch must be rejected server-side.

---

# 14. JOURNAL TRANSACTION ENTITY

Create a ledger transaction / journal entity.

Conceptual fields:

```text
id

public_reference

transaction_type

status

currency

description

source_type

source_reference

idempotency_key

effective_at

posted_at

created_at

created_by

reversal_of nullable

metadata
```

Use only fields that are useful.

Do not create an uncontrolled metadata dumping ground.

---

# 15. JOURNAL ENTRY ENTITY

Create immutable journal entries.

Conceptual fields:

```text
id

ledger_transaction_id

ledger_account_id

entry_side

amount_minor

line_number

description nullable

created_at
```

Where:

```text
entry_side = DEBIT | CREDIT
```

and:

```text
amount_minor > 0
```

Never store a negative amount and a debit/credit side simultaneously if that creates ambiguous semantics.

Prefer:

positive amount

+

explicit side.

---

# 16. POSTED ENTRY IMMUTABILITY

Once a ledger transaction has been POSTED:

its financial entries must never be edited.

Do NOT allow:

update amount;

change account;

change currency;

delete journal line;

rewrite historical financial meaning.

Corrections must use reversal/new entries.

---

# 17. NO DELETING POSTED FINANCIAL HISTORY

Posted ledger transactions must not be physically deleted by ordinary application workflows.

Historical financial movements need to remain auditable.

If an operation must be corrected:

create a reversal transaction.

---

# 18. JOURNAL STATUS

Keep ledger status simple.

Recommended states:

```text
DRAFT

POSTED
```

Potential failed posting attempts should remain operational events/errors rather than half-posted ledger journals.

Do not let partially posted transactions exist.

---

# 19. CUSTOMER TRANSACTION STATUS

Customer-facing activity may support broader status concepts:

```text
PENDING

PROCESSING

COMPLETED

FAILED

CANCELLED

REVERSED
```

However:

PENDING operations must not be represented as posted ledger entries unless money has actually been posted.

Business operation state and ledger posting state are separate concepts.

---

# 20. BUSINESS OPERATION VS LEDGER EVENT

Preserve this distinction:

```text
Transfer
Payment
Adjustment
Refund
Fee
```

are BUSINESS OPERATIONS.

They may result in one or more:

```text
LEDGER TRANSACTIONS
```

Do not turn every UI workflow into a raw ledger mutation.

---

# 21. ATOMIC POSTING

Posting a ledger transaction must be atomic.

Either:

ALL journal entries are posted

AND

balance projections update successfully

OR:

NOTHING is financially posted.

Never allow:

debit succeeded

but

credit failed.

---

# 22. DATABASE TRANSACTION

Use a real PostgreSQL transaction / controlled database function / server-side transactional mechanism appropriate to Supabase.

Do not execute:

insert debit

then separately:

insert credit

from the browser.

---

# 23. POSTING FUNCTION

Create one controlled accounting posting boundary.

Conceptually:

```text
postLedgerTransaction(...)
```

or equivalent.

Only trusted server-side code may call it with validated posting instructions.

---

# 24. POSTING REQUEST MODEL

A posting request may conceptually contain:

```text
transactionType

currency

sourceType

sourceReference

idempotencyKey

description

entries[]
```

Each entry:

```text
ledgerAccountId

side

amountMinor

description?
```

The server must validate everything.

---

# 25. POSTING VALIDATION

Before posting verify:

- authenticated/authorized caller;
- valid transaction type;
- valid ledger accounts;
- all ledger accounts active;
- matching currency;
- positive amounts;
- at least two meaningful accounting lines when appropriate;
- total debit equals total credit;
- source operation authorization;
- idempotency;
- no duplicate financial execution.

---

# 26. ZERO AMOUNTS

Do not create zero-value ledger entries.

Reject:

```text
amount_minor = 0
```

unless there is a very specific future accounting reason.

---

# 27. NEGATIVE ENTRY AMOUNTS

Reject negative `amount_minor`.

The direction must come from:

DEBIT

or

CREDIT.

---

# 28. JOURNAL BALANCING

The server/database must calculate:

```text
sum(debit.amount_minor)

sum(credit.amount_minor)
```

and require exact equality.

Do not accept tolerance errors for integer minor-unit currencies.

---

# 29. MULTI-CURRENCY JOURNALS

For this implementation:

prefer each ledger transaction to operate in one currency.

Do not put:

EUR debit

against

USD credit

inside one simple journal without explicit FX accounting.

Cross-currency transactions require a dedicated future FX model.

---

# 30. MONEY REPRESENTATION

Continue using safe monetary representation from PROMPT 05.

Prefer integer minor units.

Example:

```text
10.50 EUR
```

→

```text
1050
```

Do not use JavaScript floating-point arithmetic as accounting authority.

---

# 31. HIGH-VALUE INTEGER SAFETY

Ensure the chosen JavaScript/TypeScript representation safely handles expected monetary ranges.

Where necessary, use:

BigInt

or

safe serialized integer/decimal handling

instead of unsafe Number arithmetic.

Do not lose precision between PostgreSQL and the frontend.

---

# 32. DATABASE MONEY TYPE

Use an appropriate PostgreSQL type such as:

BIGINT for minor units

or a deliberate NUMERIC strategy.

Do not use FLOAT/REAL for financial values.

---

# 33. TRANSACTION REFERENCE

Generate a customer-safe transaction reference server-side.

Example:

```text
TXN-2026-00001284
```

or another opaque scheme.

Do not expose sequential database primary keys unnecessarily.

---

# 34. INTERNAL ID

Keep internal UUID/identifier separate from public reference.

Customer-facing routes should prefer:

```text
transactionRef
```

rather than raw database IDs.

---

# 35. IDEMPOTENCY

All financial commands that can create a ledger transaction must support idempotency.

A repeated network request must not create duplicate financial movements.

---

# 36. IDEMPOTENCY KEY

Use a server-validated idempotency key.

Possible relationship:

```text
business operation ID

+

operation action
```

Do not trust an arbitrary reused client key without checking ownership/context.

---

# 37. IDEMPOTENCY UNIQUE CONSTRAINT

Use database uniqueness where appropriate.

Example concept:

```text
UNIQUE(idempotency_key)
```

within the correct financial command scope.

Do not rely only on:

if exists then return

application code without database protection.

---

# 38. DUPLICATE POSTING TEST

If the same financial operation is submitted five times:

only one financial result must exist.

All repeated calls should resolve safely to the existing outcome or an equivalent idempotent result.

---

# 39. CONCURRENCY

Design for simultaneous operations against the same account.

Example:

Available balance = 100.

Two transactions simultaneously attempt to use:

80

and

80.

The system must not allow both to succeed if funds/reservation policy does not permit it.

---

# 40. BALANCE CONCURRENCY

Do not use:

read balance

→ calculate in JavaScript

→ write new balance.

Use transactional server/database protections.

Possible approaches:

- row-level locking;
- atomic SQL operations;
- transaction-safe posting functions;
- version checking.

Choose the simplest robust mechanism compatible with PostgreSQL/Supabase.

---

# 41. BALANCE PROJECTION

PROMPT 05 introduced:

```text
ledger_balance

available_balance

held_balance
```

The ledger must now become the authority behind `ledger_balance`.

---

# 42. LIABILITY ACCOUNT BALANCE FORMULA

For the customer liability ledger account, conceptually:

```text
ledger_balance
=
credits
-
debits
```

because liability accounts normally carry a credit balance.

This formula belongs in accounting services/read models.

Do not calculate it independently across UI components.

---

# 43. OTHER LEDGER ACCOUNT FORMULAS

For asset/expense accounts:

conceptually:

```text
debits - credits
```

For liability/equity/revenue:

conceptually:

```text
credits - debits
```

Centralize these rules.

---

# 44. BALANCE PROJECTION UPDATE

After a successful ledger posting:

update the affected account balance projections inside the same controlled transaction where possible.

Avoid delayed inconsistent state where:

ledger says 500

but dashboard says 700

for long periods.

---

# 45. REBUILDABLE PROJECTION

Balance projection must be reconstructable from ledger entries.

This is essential.

If projections become corrupted:

the system should conceptually be able to recompute them from ledger history.

---

# 46. PROJECTION IS NOT SOURCE OF TRUTH

If ledger and projection ever disagree:

ledger wins.

Projection is a performance/read model.

---

# 47. PROJECTION VERSION

Update:

```text
version
```

or equivalent each time the projection changes.

This can help diagnose stale state.

---

# 48. PROJECTION TIMESTAMP

Update:

```text
calculated_at
```

after successful financial posting.

---

# 49. HELD BALANCE

Ledger posting controls booked/current balance.

Available balance may also depend on holds.

Do not automatically treat every hold as a posted ledger transaction.

---

# 50. HOLD FOUNDATION

Create a simple generic hold/reservation model if not already present.

Conceptual entity:

```text
account_holds
```

fields:

```text
id

account_id

amount_minor

currency

status

reason_type

source_reference

created_at

expires_at nullable

released_at nullable

captured_at nullable
```

This prepares PROMPT 07 transfers.

---

# 51. HOLD STATES

Recommended:

```text
ACTIVE

RELEASED

CAPTURED

EXPIRED
```

Do not create customer-editable holds.

---

# 52. AVAILABLE BALANCE

Conceptually:

```text
available_balance
=
ledger_balance
-
active_holds
```

according to product/account rules.

The backend projection must remain authoritative.

---

# 53. HOLDS DO NOT CHANGE BOOKED BALANCE

An ACTIVE hold generally reduces available funds but does not necessarily change posted/booked ledger balance.

When the underlying financial operation posts:

the hold may become CAPTURED

and corresponding ledger entries are posted.

---

# 54. HOLD RELEASE

If the operation fails/cancels before posting:

release the hold.

Do not leave unavailable funds permanently locked.

Actual transfer-specific behavior comes in PROMPT 07.

---

# 55. HOLD IDEMPOTENCY

Creating/releasing/capturing a hold must also be safely idempotent.

---

# 56. HOLD OWNERSHIP

Customers may view customer-safe hold information where appropriate.

They must never directly:

create;

release;

capture

financial holds.

---

# 57. OPENING ACCOUNT LEDGER

When a new account is provisioned:

create its linked internal ledger account.

A zero-balance account requires no fake money transaction.

Do not seed fake funds.

---

# 58. OPENING BALANCE

If legitimate opening funds are ever introduced:

they must use a balanced ledger transaction.

Do not initialize a nonzero balance by editing the projection.

---

# 59. CHART OF ACCOUNTS FOUNDATION

Create a minimal internal chart-of-accounts capability.

It should support accounts such as:

customer deposit liabilities;

bank settlement/cash account placeholder;

fees revenue account placeholder;

adjustment/clearing account placeholder.

Do not overbuild an enterprise general ledger.

---

# 60. SYSTEM LEDGER ACCOUNTS

System ledger accounts should be created/configured server-side.

Customers must never create them.

---

# 61. SYSTEM ACCOUNT CODES

Use stable machine-readable codes.

Examples conceptually:

```text
CUSTOMER_DEPOSITS

SETTLEMENT_CLEARING

FEE_REVENUE

ADJUSTMENT_CLEARING
```

Actual codes may be more structured.

Do not scatter hardcoded IDs through the codebase.

---

# 62. LEDGER ACCOUNT REGISTRY

Create a configuration/service capable of resolving required system ledger accounts by stable code.

Do not write:

```text
ledgerAccountId = "abc123"
```

throughout feature code.

---

# 63. TRANSACTION TYPES

Prepare extensible ledger transaction types such as:

```text
ACCOUNT_OPENING

TRANSFER

FUNDING

FEE

REFUND

ADJUSTMENT

REVERSAL
```

Do not implement business workflows for every type yet.

---

# 64. SOURCE REFERENCE

Every ledger transaction should indicate which business operation created it.

Examples later:

```text
source_type = TRANSFER

source_reference = TRF-...
```

This makes accounting history traceable.

---

# 65. SOURCE UNIQUENESS

Where one business operation should create exactly one posting:

enforce that relationship.

Do not accidentally post the same transfer twice.

---

# 66. POSTING DESCRIPTION

Keep a controlled internal accounting description.

Do not use arbitrary customer-entered text as the only accounting meaning.

Customer transfer notes may be stored separately.

---

# 67. METADATA

If metadata is used:

whitelist allowed metadata fields.

Never store:

passwords;

OTP;

full secrets;

raw identity documents;

unnecessary personal data

inside ledger metadata.

---

# 68. LEDGER AUDIT TRAIL

Record:

who/what initiated posting;

source operation;

time;

reference;

entries.

Accounting history should explain every financial balance change.

---

# 69. REVERSAL PRINCIPLE

Do not edit a posted erroneous transaction.

Create a new balanced reversal transaction.

---

# 70. REVERSAL LINK

A reversal transaction must reference the original journal.

Example:

```text
reversal_of = original_ledger_transaction_id
```

---

# 71. REVERSAL ENTRIES

A full reversal creates opposite entries.

Original:

```text
A DEBIT 100
B CREDIT 100
```

Reversal:

```text
A CREDIT 100
B DEBIT 100
```

The reversal itself must also balance.

---

# 72. REVERSAL IDEMPOTENCY

The same original transaction must not be fully reversed twice accidentally.

Use controlled server-side checks and uniqueness where appropriate.

---

# 73. ORIGINAL TRANSACTION IMMUTABILITY

Do not change original entries when reversed.

Customer-facing read model may show:

Reversed

but the original ledger event remains historically intact.

---

# 74. PARTIAL REVERSALS

Do not implement partial reversal unless clearly required now.

Prepare architecture so partial adjustments could later be supported.

For this phase, full controlled reversal is sufficient.

---

# 75. FAILED BUSINESS OPERATION

A failed operation that never financially posted:

must not create a fake posted ledger transaction.

It may exist in operational logs/business feature tables.

---

# 76. CUSTOMER TRANSACTION READ MODEL

Create a safe customer-facing transaction/activity projection.

This must hide raw internal ledger mechanics.

Conceptual fields:

```text
reference

accountRef

type

direction

displayTitle

displayDescription

amountMinor

currency

status

occurredAt

completedAt

counterpartyDisplay nullable

sourceReference nullable
```

---

# 77. TRANSACTION DIRECTION

Customer-facing:

```text
INCOMING

OUTGOING

NEUTRAL
```

or equivalent.

Do not expose:

DEBIT/CREDIT

as the only user terminology.

---

# 78. CUSTOMER AMOUNT SIGN

UI may display:

```text
+25,000 XAF
```

for incoming

and:

```text
-10,000 XAF
```

for outgoing.

But internal accounting amounts remain positive with explicit debit/credit side.

---

# 79. TRANSACTION DISPLAY TYPE

Customer-facing transaction categories may include later:

Transfer received

Transfer sent

Account funding

Fee

Refund

Adjustment.

Use readable labels.

Do not expose internal journal codes.

---

# 80. TRANSACTION ROUTES

Fully implement:

```text
/app/transactions
```

and:

```text
/app/transactions/:transactionRef
```

Also upgrade:

```text
/app/activity
```

to use authoritative activity data.

---

# 81. ACTIVITY PAGE

The Activity page is the simplified customer history experience.

It may combine:

posted account transactions;

future transfer states;

future holds/pending items

through a safe read model.

---

# 82. TRANSACTIONS PAGE

The Transactions page may provide more detailed filtering/search than the primary Activity screen.

Avoid unnecessary duplication.

If Activity can fully satisfy the product UX, transactions may remain a deeper route.

---

# 83. TRANSACTION LIST

Display:

transaction title;

counterparty/description;

date/time;

amount;

currency;

status.

Use TransactionRow from PROMPT 01.

---

# 84. MOBILE TRANSACTION LIST

On mobile:

avoid tables.

Use responsive rows/cards.

Primary information:

description

date

amount

status.

---

# 85. DESKTOP TRANSACTION TABLE

Desktop may use a structured table.

Potential columns:

Date

Description

Type

Amount

Status.

Do not expose internal ledger account codes.

---

# 86. TRANSACTION PAGINATION

Use server-side pagination.

Prefer cursor-based pagination for large histories where appropriate.

Do not load thousands of transactions into the browser.

---

# 87. ACTIVITY PAGE SIZE

Use sensible default page sizes.

Example conceptual range:

20–50 entries.

Do not hardcode excessively large queries.

---

# 88. TRANSACTION SORT

Default:

newest first.

Use deterministic secondary ordering to avoid duplicates/missing rows across pagination.

---

# 89. FILTERS

Prepare useful filters:

date range;

direction;

status;

transaction type;

amount range where appropriate.

Do not overload the first version.

---

# 90. MOBILE FILTERS

On mobile:

open filters in a bottom sheet.

Reuse the BottomSheet component.

Do not squeeze six filter controls into a tiny header.

---

# 91. SEARCH

Allow search by customer-safe fields such as:

transaction reference;

display description;

counterparty display

where appropriate.

Do not expose raw database full-text access to internal fields.

---

# 92. DATE RANGE

Support clear options:

Today

Last 7 days

This month

Last month

Custom range.

Use customer/bank timezone rules consistently.

---

# 93. TRANSACTION DETAIL PAGE

Create a professional detail view.

Possible sections:

Transaction status

Amount

Direction

Description

Date/time

Transaction reference

Related account

Counterparty information if applicable

Additional customer-safe details.

---

# 94. TRANSACTION DETAIL MOBILE

Use a clean receipt-like layout.

Do not use a giant desktop table.

Important information first:

Amount

Status

Description

Then details.

---

# 95. TRANSACTION REFERENCE COPY

Allow:

Copy reference.

Use safe feedback.

---

# 96. INTERNAL DATA PROTECTION

Do NOT show customers:

ledger account IDs;

journal entry IDs;

internal chart-of-account codes;

admin notes;

risk flags;

internal reconciliation IDs unless explicitly customer-safe.

---

# 97. TRANSACTION STATUS DISPLAY

Use customer-friendly statuses:

Pending

Processing

Completed

Failed

Cancelled

Reversed.

A posted ledger event usually maps to:

Completed

unless later reversed.

---

# 98. REVERSED TRANSACTION UI

If reversed:

show:

Reversed

and optionally a customer-safe link to the reversing transaction.

Explain clearly without exposing accounting internals.

---

# 99. FAILED TRANSACTION UI

Failed operations should explain:

The transaction was not completed.

Do not imply funds moved if no ledger posting occurred.

---

# 100. PENDING TRANSACTION UI

Pending must not look identical to completed.

Do not include pending items in posted balance calculations unless applicable rules explicitly say so.

---

# 101. DASHBOARD RECENT ACTIVITY

Replace PROMPT 05 recent-activity placeholder with authoritative activity data.

Show:

latest completed/pending customer-safe activity.

Do not query raw ledger entries directly from UI.

---

# 102. MONTHLY SUMMARY

Upgrade the PROMPT 05 monthly summary using real posted account activity.

Calculate:

Money in

Money out

Net movement

from authoritative ledger/customer transaction read models.

---

# 103. MONTHLY SUMMARY RULE

Only include financial entries that meet the defined posted/completed criteria.

Do not mix:

failed;

cancelled

transactions into money-in/out totals.

---

# 104. INCOMING CALCULATION

For the customer's deposit account:

customer-facing INCOMING activity corresponds to net accounting movements that increase the customer balance.

Do not implement direction by guessing from transaction text.

Derive it from ledger/account relation.

---

# 105. OUTGOING CALCULATION

OUTGOING activity corresponds to movements that decrease the customer balance.

Again:

derive from accounting entries.

---

# 106. INTERNAL TRANSFER PREPARATION

PROMPT 07 will create transfers.

This prompt must expose a safe ledger posting interface that the transfer module can use.

Transfer module should not implement its own accounting engine.

---

# 107. ACCOUNT HOLD PREPARATION FOR TRANSFERS

PROMPT 07 should be able to call controlled operations such as conceptually:

```text
createHold()

releaseHold()

captureHoldAndPost()
```

Do not expose these directly to the browser.

---

# 108. LEDGER SERVICE API

Conceptual server API:

```text
postLedgerTransaction()

reverseLedgerTransaction()

getLedgerAccountBalance()

createAccountHold()

releaseAccountHold()

captureAccountHold()
```

Exact implementation may differ.

Keep it internal.

---

# 109. CUSTOMER TRANSACTION SERVICE API

Conceptual safe methods:

```text
getAccountActivity()

getTransactions()

getTransactionDetails()

getMonthlyActivitySummary()
```

These may be accessible to the authenticated customer with ownership enforcement.

---

# 110. RLS FOR LEDGER

Ordinary customers should generally NOT receive direct broad SELECT access to raw ledger tables.

Prefer controlled customer-safe views/server functions.

Raw ledger contains internal accounting information.

---

# 111. LEDGER WRITE SECURITY

Customers must have NO direct:

INSERT;

UPDATE;

DELETE

permission on:

ledger accounts;

ledger transactions;

ledger entries;

balance projections;

financial holds.

---

# 112. CUSTOMER READ SECURITY

Customer-safe read services must validate:

authenticated user;

account ownership;

customer/account lifecycle;

resource reference.

---

# 113. STAFF ACCESS

Do not implement full staff ledger browsing yet.

Prepare future authorization hooks.

PROMPT 12/13 will define admin financial controls.

---

# 114. SERVICE ROLE

Do not expose Supabase service-role credentials to the frontend.

Privileged ledger functions stay server-side.

---

# 115. SQL FUNCTION SECURITY

If using PostgreSQL SECURITY DEFINER functions:

lock down:

search_path;

permissions;

input validation.

Do not create an unrestricted public RPC capable of posting arbitrary ledger entries.

---

# 116. FINANCIAL COMMAND AUTHORIZATION

A server function must know WHY an operation is allowed.

Do not create:

```text
postAnyLedgerEntries(entries)
```

available to arbitrary authenticated users.

Instead:

business features call trusted internal accounting services.

---

# 117. INTERNAL POSTING BOUNDARY

The generic posting engine may be internal-only.

Customer-facing modules should call domain operations such as future:

```text
executeInternalTransfer()
```

which internally call the posting engine.

This prevents abuse.

---

# 118. DATABASE CONSTRAINTS

Add constraints where appropriate:

- amount > 0;
- valid side;
- currency required;
- ledger account active;
- public reference unique;
- idempotency uniqueness;
- line numbers unique per journal if used;
- foreign-key integrity.

---

# 119. BALANCED JOURNAL DATABASE ENFORCEMENT

Do not rely only on TypeScript.

Use database-side transactional validation to guarantee balance before commit.

---

# 120. NO HALF JOURNALS

Other queries must never observe a permanently half-created posted journal.

Create all entries and mark/post atomically.

---

# 121. RECONSTRUCTION TEST

Implement a development/admin-only verification utility or test that can:

recalculate an account's ledger balance from entries

and compare it to the balance projection.

Do not expose this tool to ordinary customers.

---

# 122. PROJECTION MISMATCH

If a mismatch is detected:

log a high-severity internal integrity event.

Do not silently "fix" the ledger.

The ledger remains authoritative.

Projection can be rebuilt through a controlled process.

---

# 123. FINANCIAL INTEGRITY CHECK

Provide test utilities for:

journal balance;

duplicate postings;

projection consistency;

currency mismatch;

reversal correctness.

---

# 124. AUDIT EVENTS

Create internal events for significant ledger actions:

```text
ledger_transaction_posted

ledger_transaction_reversed

balance_projection_updated

hold_created

hold_released

hold_captured
```

Do not store sensitive unnecessary payloads.

---

# 125. TIMESTAMPS

Use consistent server-generated timestamps.

Important distinctions:

```text
created_at

effective_at

posted_at
```

Do not let the browser arbitrarily define official financial posting time.

---

# 126. POSTING TIME

`posted_at` should be authoritative server/database time.

---

# 127. EFFECTIVE DATE

Prepare an effective date concept for future accounting requirements.

For normal instant internal transactions:

effective time may equal posting time.

Do not overcomplicate backdating now.

---

# 128. BACKDATED TRANSACTIONS

Do not allow customers to backdate financial postings.

Administrative backdating, if ever supported, requires privileged future workflows.

---

# 129. TRANSACTION DESCRIPTIONS

Use structured description generators.

Example later:

Transfer to Marie D.

rather than storing raw technical codes as customer text.

---

# 130. COUNTERPARTY PRIVACY

Customer transaction history may display an appropriate counterparty label.

Do not expose more personal information than needed.

---

# 131. INTERNAL TRANSFER COUNTERPARTY

Future same-bank transfers may display:

recipient display name

+

masked account reference where appropriate.

Do not expose full account number unnecessarily.

---

# 132. TRANSACTION CATEGORY READINESS

Prepare optional customer-friendly categories.

Do not build advanced machine-learning spending categorization yet.

That can come later if required.

---

# 133. TRANSACTION DETAILS AND PRIVACY MODE

When Privacy Mode is active:

transaction amounts on list/detail pages should follow the established hiding rules.

Screen readers must also respect hidden values.

---

# 134. ZERO-VALUE ACTIVITY

Do not generate fake zero-value transactions.

---

# 135. STATEMENTS INTEGRATION READINESS

PROMPT 09 will generate statements using:

posted ledger/customer-safe transaction history.

Prepare consistent historical queries now.

---

# 136. STATEMENT REPRODUCIBILITY

Historical transaction data must remain stable enough for future statement reproduction.

Do not rewrite transaction descriptions/amounts retroactively without controlled versioning/policy.

---

# 137. ACCOUNT CLOSURE READINESS

Closing an account later must not delete its ledger history.

Historical financial records remain preserved.

---

# 138. DATA RETENTION

Do not automatically purge financial journal history as normal user cleanup.

Retention policy will depend on the banking jurisdiction.

Prepare architecture for durable records.

---

# 139. PERFORMANCE INDEXES

Add appropriate indexes based on actual query patterns.

Potential examples:

```text
ledger_entries.ledger_account_id

ledger_entries.ledger_transaction_id

ledger_transactions.public_reference

ledger_transactions.posted_at

ledger_transactions.source_reference

customer_activity.account_id + occurred_at
```

Avoid unnecessary indexes.

---

# 140. PAGINATION INDEX

Ensure the primary activity ordering query is indexed.

For example:

```text
account_id

occurred_at DESC

id
```

or equivalent.

---

# 141. AGGREGATE PERFORMANCE

Monthly money-in/out should not require downloading all transactions to the browser.

Compute aggregates server-side/database-side.

---

# 142. CUSTOMER ACTIVITY VIEW

Consider a secure database view or server-created DTO for customer account activity.

It should expose only safe fields.

Do not make a public unrestricted view.

---

# 143. REALTIME

Realtime updates may refresh account activity and balance after posting.

However:

realtime is optional for correctness.

Normal secure refetch must remain sufficient.

---

# 144. REALTIME SECURITY

If realtime subscriptions are used:

scope them to authorized account data.

Never subscribe customers to global ledger events.

---

# 145. CACHE INVALIDATION

When a financial posting completes:

invalidate/refetch relevant:

account balance;

dashboard summary;

recent activity;

monthly summary;

transaction list.

Do not manually mutate different UI balances independently.

---

# 146. OPTIMISTIC UI

Do NOT optimistically mark financial transactions as completed before the server confirms posting.

Use:

Processing

then authoritative result.

---

# 147. DUPLICATE BUTTON PREVENTION

Financial command buttons must enter loading state and prevent accidental duplicate requests.

This is UX protection.

Server idempotency remains mandatory.

---

# 148. NETWORK FAILURE DURING POSTING

If the client loses connection after submitting a future financial operation:

do not automatically assume failure.

The eventual business operation should be recoverable by idempotency/reference lookup.

Do not blindly retry with a new financial operation ID.

PROMPT 07 will use this pattern.

---

# 149. ONLINE-ONLY RULE

Do not create offline financial posting queues.

No financial operation should be queued in IndexedDB for later execution.

---

# 150. TRANSACTION HISTORY NETWORK FAILURE

Previously loaded transaction data may remain visible temporarily according to query memory behavior, but must clearly indicate refresh failure where freshness matters.

Do not claim offline banking support.

---

# 151. TRANSACTION DETAIL NOT FOUND

If the customer requests a transaction that does not belong to them:

use safe not-found behavior.

Do not reveal another customer's transaction existence.

---

# 152. ACTIVITY EMPTY STATE

If there is no activity:

show:

No account activity yet.

Do not populate fake transactions.

---

# 153. TRANSACTION ERROR STATE

If transaction history fails:

show a local error.

Action:

Retry.

Do not replace it with zero activity.

---

# 154. MONTHLY SUMMARY ERROR

If monthly aggregate fails:

show:

Summary unavailable

not:

0 money in

0 money out

unless those are actual values.

---

# 155. DASHBOARD CONSISTENCY

After financial posting:

Dashboard

Accounts

Activity

Transaction details

must converge on the same authoritative state.

---

# 156. CUSTOMER BALANCE CONSISTENCY

The same selected account must not display:

100,000 XAF on Home

and

120,000 XAF on Accounts

because different components perform their own calculations.

Use shared authoritative read models.

---

# 157. TRANSACTION DETAIL STATUS HISTORY

Prepare customer-safe status timeline if useful.

Example:

Created

Processing

Completed.

Do not expose internal ledger processing steps unnecessarily.

---

# 158. INTERNAL AUDIT VS CUSTOMER TIMELINE

Do not use the full internal audit log as customer-facing status history.

Create a safe projection.

---

# 159. TRANSACTION RECEIPT READINESS

Prepare transaction detail layout so PROMPT 09 may later generate printable/downloadable receipts if desired.

Do not implement official receipts yet.

---

# 160. MOBILE ACTIVITY UX

At 320–430px:

filters accessible;

amount aligned clearly;

status readable;

no horizontal scrolling;

rows touch-friendly.

---

# 161. TABLET ACTIVITY UX

Tablet may use:

enhanced rows

or

compact table.

Keep touch targets usable.

---

# 162. DESKTOP ACTIVITY UX

Desktop may include:

filter toolbar;

transaction table;

pagination;

detail navigation.

Do not make it look like admin accounting software.

---

# 163. CUSTOMER-FACING TERMINOLOGY

Use:

Money in

Money out

Transfer

Transaction

Activity

Completed

Pending.

Avoid exposing terms such as:

liability ledger

journal debit

normal credit balance

to ordinary customers.

---

# 164. ACCESSIBILITY

Transaction interfaces must meet WCAG 2.2 AA quality.

Verify:

list semantics;

table semantics;

filter labels;

status labels;

amount screen-reader output;

focus;

pagination;

bottom-sheet filters;

copy buttons.

---

# 165. SCREEN READER AMOUNTS

Ensure direction is communicated.

Not just:

10,000 XAF

but conceptually:

Money out, 10,000 XAF.

---

# 166. COLOR

Do not rely only on green/red for incoming/outgoing.

Use:

sign;

label;

icon;

accessible text.

---

# 167. SECURITY TEST — LEDGER WRITE

Verify an ordinary customer cannot directly:

create ledger account;

insert journal;

insert journal entry;

modify journal entry;

delete journal entry;

modify balance projection;

create hold;

capture hold.

---

# 168. SECURITY TEST — OTHER CUSTOMER

Customer A must not access Customer B:

transaction history;

transaction detail;

account activity;

balance;

holds.

---

# 169. INTEGRITY TEST — UNBALANCED JOURNAL

Attempt:

Debit 100

Credit 99.

Expected:

REJECTED.

Nothing posted.

No balance projection changed.

---

# 170. INTEGRITY TEST — CURRENCY MISMATCH

Attempt:

XAF account

with EUR journal.

Expected:

REJECTED.

---

# 171. INTEGRITY TEST — DUPLICATE IDEMPOTENCY

Submit identical operation multiple times.

Expected:

one posting.

One financial result.

---

# 172. INTEGRITY TEST — REVERSAL

Post:

A debit 100

B credit 100.

Reverse.

Expected net accounting impact:

zero relative to original.

Both transactions remain in history.

---

# 173. INTEGRITY TEST — PROJECTION

For every test account:

recompute ledger balance.

Compare to projection.

Expected:

exact match.

---

# 174. CONCURRENCY TEST

Run multiple simultaneous posting attempts against one account.

Verify:

no lost updates;

no duplicate posting;

no inconsistent projection;

available-balance rules preserved.

---

# 175. ATOMICITY TEST

Force an error between journal preparation and projection update.

Expected:

entire transaction rollback.

No partial debit.

No partial credit.

---

# 176. HOLD TEST

Create hold.

Expected:

ledger balance unchanged;

available balance reduced.

Release hold.

Expected:

available balance restored.

No ledger posting created merely by release.

---

# 177. HOLD CAPTURE PREPARATION

Capture flow must be designed so future transfer execution can:

consume hold

+

post ledger transaction

atomically or through a safely coordinated transaction.

---

# 178. DATABASE MIGRATIONS

Create migrations cleanly.

Do not manually mutate production schema outside the established migration process.

Document:

tables;

constraints;

indexes;

functions;

policies.

---

# 179. BACKFILL

If PROMPT 05 already created customer accounts and zero balance projections:

safely provision corresponding ledger accounts.

Do not duplicate bank accounts.

Do not create fake money entries.

---

# 180. EXISTING NONZERO DEMO BALANCES

If existing development fixtures contain nonzero balances:

do not silently turn them into production ledger state.

Either:

convert development fixtures using controlled opening transactions

or:

reset clearly marked development data.

Document the choice.

---

# 181. NO SILENT FINANCIAL MIGRATION

Never invent financial history to make existing numbers match.

If real data exists, require an explicit controlled migration strategy.

For development fixtures only, controlled reset/backfill is acceptable.

---

# 182. CODE QUALITY

Keep ledger logic centralized.

Do not place debit/credit calculation code throughout:

dashboard;

accounts;

transfers;

admin.

Future features must reuse the ledger service.

---

# 183. NO GOD LEDGER FILE

Do not create one enormous 2,000-line accounting service.

Separate:

posting;

validation;

projection;

reversal;

holds

when useful.

Keep architecture understandable.

---

# 184. TYPE SAFETY

Use explicit types for:

Money

Currency

LedgerSide

LedgerAccountClass

LedgerTransactionType

CustomerTransactionStatus.

Avoid `any`.

---

# 185. MONEY TYPE

Create or reuse a consistent money value structure.

Conceptual:

```ts
type Money = {
  amountMinor: bigint | string;
  currency: CurrencyCode;
}
```

Adapt to serialization requirements.

Do not pass unsafe floats.

---

# 186. SERVER / CLIENT SERIALIZATION

If BigInt is used:

handle JSON/server serialization deliberately.

Do not accidentally convert large monetary values to unsafe Number.

---

# 187. LOGGING

Internal logs may contain:

transaction reference;

operation type;

status;

error category.

Avoid logging:

full personal banking details;

sensitive documents;

authentication secrets.

---

# 188. OBSERVABILITY

Prepare structured error categories for:

posting_validation_failed

ledger_unbalanced

duplicate_operation

projection_failure

authorization_failed.

Do not expose these raw messages to customers.

---

# 189. CUSTOMER ERROR MESSAGES

Customer-facing examples:

We couldn't complete this transaction.

Please try again.

or:

This transaction could not be processed.

Do not show:

LedgerValidationException.

---

# 190. CURRENT IMPLEMENTATION SCOPE

Implement in this prompt:

1. Internal ledger-account model.
2. Customer-bank-account ↔ ledger-account mapping.
3. Minimal chart of accounts.
4. Journal transaction model.
5. Journal entry model.
6. Debit/credit rules.
7. Money/currency integrity.
8. Atomic posting engine.
9. Balanced-journal enforcement.
10. Financial idempotency.
11. Server-side posting authorization.
12. Balance projection integration.
13. Projection rebuild/check utilities.
14. Generic hold/reservation foundation.
15. Hold balance integration.
16. Full reversal engine.
17. Customer-safe transaction read model.
18. Customer Activity page.
19. Transaction list.
20. Transaction details.
21. Filters and pagination.
22. Dashboard recent activity.
23. Real monthly money-in/out aggregates.
24. Safe transaction references.
25. RLS/security policies.
26. Financial integrity tests.
27. Concurrency tests.
28. Responsive mobile transaction UX.
29. Accessibility validation.
30. Development migration/backfill where necessary.

---

# 191. DO NOT IMPLEMENT YET

Do NOT implement the complete:

same-bank transfer workflow;

beneficiary management;

transfer compliance 0–100 journey;

document-request engine;

bank statement generation;

secure bank messaging;

notification engine;

customer security center;

admin financial adjustment UI;

admin transfer blocking UI;

admin approval workflows.

These come later.

---

# 192. PRESERVE PROMPT 05

Keep:

account entities;

currency model;

balance read model;

dashboard;

account details;

privacy mode.

Convert their financial source cleanly to the ledger rather than rebuilding them.

---

# 193. PRESERVE PROMPT 04

Keep:

BankingAppLayout;

mobile navigation;

desktop sidebar;

account context;

network handling;

route access.

---

# 194. PRESERVE PROMPT 03

Customer lifecycle remains authoritative.

Do not give unfinished/restricted customers unauthorized transaction access.

---

# 195. PRESERVE PROMPT 02

Public pages remain unaffected.

Do not expose ledger functionality publicly.

---

# 196. PRESERVE PROMPT 01

Reuse:

TransactionRow;

StatusBadge;

Money formatting;

BottomSheet;

DataTable;

Skeleton;

ErrorState;

PageHeader.

Do not duplicate UI primitives.

---

# 197. PRESERVE PROMPT 00

Maintain:

simple modular architecture;

online-only operation;

server authority;

Supabase security;

feature/service boundaries.

---

# 198. FINAL ACCOUNTING REVIEW

Before completion explicitly verify:

```text
TOTAL DEBITS = TOTAL CREDITS
```

for every posted journal.

Verify:

no customer-writable balance source exists;

posted ledger entries are immutable;

posted transactions cannot be deleted through ordinary flows;

reversals create new balanced entries;

currency mismatches are rejected;

financial operations are idempotent;

balance projections are rebuildable;

projection values match ledger;

holds affect availability without corrupting ledger balance;

no unsafe floating-point accounting exists.

---

# 199. FINAL CUSTOMER TRANSACTION REVIEW

Verify customers can:

view activity;

filter history;

open transaction details;

copy transaction reference;

understand incoming/outgoing money;

see completed/pending/reversed states;

use the experience comfortably on mobile.

Customers must NOT see raw ledger mechanics.

---

# 200. FINAL SECURITY REVIEW

Explicitly verify:

- customers cannot write directly to ledger tables;
- customers cannot edit balances;
- customers cannot create arbitrary holds;
- customers cannot reverse transactions;
- customers cannot read another customer's transactions;
- service-role credentials are not exposed;
- generic posting APIs are not publicly exploitable;
- raw internal accounting data is not included in customer DTOs.

---

# 201. FINAL BUILD REVIEW

Run:

build;

TypeScript checks;

configured lint/tests;

database migration validation;

financial integrity tests.

Resolve all critical errors before completion.

---

# 202. FINAL REPORT

At completion provide:

LEDGER ARCHITECTURE

CHART OF ACCOUNTS

LEDGER ACCOUNT MODEL

JOURNAL TRANSACTION MODEL

JOURNAL ENTRY MODEL

DEBIT / CREDIT RULES

MONEY REPRESENTATION

ATOMIC POSTING ENGINE

IDEMPOTENCY

CONCURRENCY PROTECTION

BALANCE PROJECTION INTEGRATION

HOLD / RESERVATION FOUNDATION

REVERSAL ENGINE

CUSTOMER TRANSACTION READ MODEL

ACTIVITY PAGE

TRANSACTION LIST

TRANSACTION DETAIL

FILTERING / PAGINATION

MONTHLY AGGREGATES

DASHBOARD INTEGRATION

RLS POLICIES

DATABASE FUNCTIONS

CONSTRAINTS / INDEXES

MIGRATIONS

SECURITY TESTS

FINANCIAL INTEGRITY TESTS

CONCURRENCY TESTS

RESPONSIVE VALIDATION

ACCESSIBILITY

FILES CREATED

FILES MODIFIED

DEPENDENCIES ADDED

KNOWN TODOs

Also explicitly confirm:

- project builds successfully;
- TypeScript passes;
- the ledger is now the financial source of truth;
- every posted journal is balanced;
- financial entries are immutable after posting;
- posted history cannot be directly deleted;
- corrections use reversal transactions;
- transaction posting is atomic;
- duplicate requests cannot double-post funds;
- balances are projections derived from ledger state;
- balance projections can be rebuilt;
- customer balance projection matches the ledger;
- customers cannot manipulate ledger entries;
- customers cannot manipulate balance values;
- holds reduce available balance without directly rewriting ledger history;
- monthly summary now uses authoritative financial data;
- customer transaction history is server-backed;
- no unsafe floating-point accounting is used;
- no offline-first architecture was introduced;
- no offline financial queue exists;
- PROMPT 00 architecture remains intact;
- PROMPT 01 design system remains reused;
- PROMPT 02 public website remains functional;
- PROMPT 03 authentication/onboarding remains authoritative;
- PROMPT 04 application shell remains intact;
- PROMPT 05 account/dashboard experience now uses ledger-backed financial data.

Stop after completing the ledger, transaction engine and customer activity experience.

Do NOT automatically implement transfers.

The next phase is:

PROMPT 07 — BENEFICIARIES, INTERNAL TRANSFERS & FUND MOVEMENT WORKFLOW.