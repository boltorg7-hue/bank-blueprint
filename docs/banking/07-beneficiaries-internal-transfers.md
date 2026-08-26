# PROMPT 07 — BENEFICIARIES, INTERNAL TRANSFERS & FUND MOVEMENT WORKFLOW

Continue from:

PROMPT 00 — Foundation & Modular Architecture  
PROMPT 01 — Design System, Branding & Visual Identity  
PROMPT 02 — Public Website, Landing Page & Customer Acquisition  
PROMPT 03 — Authentication, Registration, KYC & Customer Onboarding  
PROMPT 04 — Customer Banking App Shell, Navigation & Member Experience  
PROMPT 05 — Customer Dashboard, Bank Accounts & Balance Experience  
PROMPT 06 — Double-Entry Ledger, Transactions & Account Activity Engine

Do NOT rebuild the project.

Do NOT replace the design system.

Do NOT duplicate the ledger.

Do NOT create a second financial engine for transfers.

Do NOT directly modify customer balances.

Do NOT introduce offline-first behavior.

This phase implements:

- beneficiary management;
- same-bank beneficiary resolution;
- transfer creation;
- transfer review;
- transfer confirmation;
- balance validation;
- fund reservation;
- transfer execution;
- ledger posting;
- recipient credit;
- sender debit;
- transfer status lifecycle;
- transfer history;
- transfer details;
- failure recovery;
- cancellation rules;
- idempotency;
- concurrency protection;
- security controls;
- customer-facing transfer UX.

The transfer system MUST use the ledger and hold infrastructure created in PROMPT 06.

---

# 1. TRANSFER SCOPE

This phase focuses primarily on:

INTERNAL BANK TRANSFERS

Meaning:

Customer A

→ Customer B

where both accounts belong to the same banking platform.

Do NOT implement external interbank rails yet unless an existing integration already exists.

Do NOT fabricate SWIFT, SEPA, ACH, card-network or mobile-money infrastructure.

---

# 2. CORE TRANSFER PRINCIPLE

A transfer is a BUSINESS OPERATION.

It is NOT itself the ledger.

Flow:

Customer intent

→ Beneficiary validation

→ Transfer validation

→ Security validation

→ Funds reservation

→ Transfer processing

→ Ledger posting

→ Balance projection update

→ Transfer completion

→ Notifications later.

Never implement:

```ts
sender.balance -= amount
recipient.balance += amount
```

---

# 3. TRANSFER MODULE

Create or complete:

```text
src/features/transfers/
```

Possible organization:

```text
transfers/
├── components/
├── hooks/
├── services/
├── schemas/
├── types/
├── utils/
├── pages/
└── server/
```

Keep transfer-specific business rules here.

Do not place them inside:

dashboard;

accounts;

ledger UI;

shared components.

---

# 4. BENEFICIARY MODULE

Create or complete:

```text
src/features/beneficiaries/
```

Possible structure:

```text
beneficiaries/
├── components/
├── hooks/
├── services/
├── schemas/
├── types/
└── pages/
```

Beneficiary management is related to transfers but remains its own feature.

---

# 5. TRANSFER ROUTES

Fully implement:

```text
/app/transfers
```

```text
/app/transfers/new
```

```text
/app/transfers/:transferRef
```

Optional supporting routes:

```text
/app/transfers/:transferRef/review
```

```text
/app/transfers/:transferRef/result
```

Use route structure that best fits the current TanStack Start application.

Do not duplicate routes unnecessarily.

---

# 6. BENEFICIARY ROUTES

Implement:

```text
/app/beneficiaries
```

Potential:

```text
/app/beneficiaries/new
```

```text
/app/beneficiaries/:beneficiaryRef
```

Use modal/sheet patterns only when they remain accessible and understandable.

---

# 7. BENEFICIARY ENTITY

Create a beneficiary model.

Conceptual fields:

```text
id

customer_id

public_reference

beneficiary_type

display_name

destination_account_id

destination_account_reference

destination_bank_type

status

created_at

updated_at

last_used_at
```

Do not store redundant sensitive banking data if a secure relation can be used instead.

---

# 8. INTERNAL BENEFICIARY TYPE

Support:

```text
INTERNAL_CUSTOMER
```

for same-bank transfers.

Architecture may reserve future types:

```text
EXTERNAL_BANK
```

but do NOT implement external transfer behavior yet.

---

# 9. BENEFICIARY OWNERSHIP

A beneficiary record belongs to the sender/customer who created it.

Customer A must not see Customer B's saved beneficiary list.

Use RLS/server authorization.

---

# 10. BENEFICIARY DESTINATION

For an internal beneficiary:

link to the actual destination bank account using a trusted internal relationship.

Do not rely only on copied display text.

---

# 11. BENEFICIARY RESOLUTION

When adding an internal beneficiary, allow customer to identify the recipient using a supported customer-safe identifier.

Possible options:

- bank account number;
- IBAN if applicable;
- customer-specific banking reference;
- another configured same-bank identifier.

Do NOT support arbitrary email/phone transfer lookup unless explicitly designed and secured.

---

# 12. BENEFICIARY LOOKUP PRIVACY

Do not allow the beneficiary search endpoint to become a customer-directory enumeration tool.

If a customer enters a valid destination account identifier:

return only the minimum safe confirmation information.

Example:

```text
Marie D.
•••• 4821
```

Do not expose:

full legal identity;

email;

phone;

address;

customer ID;

other accounts.

---

# 13. INVALID BENEFICIARY

If no valid internal account matches:

display:

We couldn't find an eligible account with those details.

Do not reveal excessive account-existence information.

---

# 14. SELF TRANSFER

Decide explicitly whether transfers between a customer's own accounts are allowed.

If multiple owned accounts are supported:

treat this as a separate transfer case.

Do not create a saved beneficiary unnecessarily for the customer's own account unless product design requires it.

---

# 15. BENEFICIARY CREATION FLOW

Recommended flow:

1. Enter destination account details
2. Resolve beneficiary
3. Show safe recipient confirmation
4. Confirm beneficiary
5. Save beneficiary

CTA examples:

Find beneficiary

Add beneficiary

Do not automatically save a beneficiary simply because a transfer was started.

---

# 16. BENEFICIARY CONFIRMATION

Before saving, show:

Recipient name

Masked destination account

Bank context

Do not expose unnecessary destination data.

---

# 17. BENEFICIARY STATUS

Prepare states such as:

```text
ACTIVE

DISABLED

REMOVED
```

Potential future:

```text
PENDING_VERIFICATION
```

Do not overcomplicate now.

---

# 18. BENEFICIARY REMOVAL

Allow customer to remove/deactivate a saved beneficiary.

This must not alter past transaction history.

Historical transfers should remain understandable even after beneficiary removal.

---

# 19. BENEFICIARY EDITING

Do not allow dangerous mutation of destination account details in-place.

If the destination banking identifier changes:

prefer creating/revalidating a new beneficiary relation.

Display name/nickname may be editable.

---

# 20. BENEFICIARY NICKNAME

Optionally allow a customer-defined nickname.

Example:

Rent account

Mom

Supplier A

Keep this separate from verified recipient identity.

---

# 21. BENEFICIARY SECURITY

Do not allow customers to:

change beneficiary ownership;

change destination to another unauthorized account through raw API calls;

inject internal account IDs;

bypass resolution validation.

---

# 22. BENEFICIARY LIST

Display:

Recipient name

Nickname if present

Masked destination account

Last used when useful.

Actions:

Send money

View

Remove.

---

# 23. MOBILE BENEFICIARY UX

Use vertical cards/rows.

Do not use a wide table.

Search and add actions must remain reachable.

---

# 24. DESKTOP BENEFICIARY UX

Desktop may use a structured list/table.

Do not make it resemble admin customer management.

---

# 25. NEW TRANSFER FLOW

The transfer creation experience should be progressive.

Recommended stages:

1. Source account
2. Beneficiary
3. Amount
4. Reference/message
5. Review
6. Authentication/security confirmation if needed
7. Processing
8. Result

Do not place everything on one huge form.

---

# 26. MOBILE TRANSFER TASK

Use the AppTaskLayout from PROMPT 04.

Mobile:

compact header

progress context

form content

sticky action area

safe-area-aware bottom section.

---

# 27. TRANSFER STEPPER

Use the existing Stepper component.

Possible customer-facing steps:

Recipient

Amount

Review

Confirmation.

Do not expose internal processing/compliance stages in the creation stepper.

The deeper 0→100 compliance journey comes in PROMPT 08.

---

# 28. SOURCE ACCOUNT

If the customer has one eligible account:

select it automatically but display it clearly.

If multiple eligible accounts:

allow selection.

Show:

account name

masked identifier

available balance

currency.

---

# 29. SOURCE ACCOUNT ELIGIBILITY

Only accounts permitted for outgoing transfers may be selected.

Exclude or disable:

closed;

frozen;

suspended;

unsupported currency/account types.

Use server-authoritative rules.

---

# 30. BENEFICIARY SELECTION

Allow:

select saved beneficiary

or

add new beneficiary.

Keep the flow simple.

---

# 31. RECENT BENEFICIARIES

Optionally display a small list of recently used beneficiaries.

Do not fabricate recency.

Use real activity.

---

# 32. TRANSFER AMOUNT

Use MoneyInput from PROMPT 01.

Validate:

positive amount;

supported currency;

account-specific limits later;

available balance.

Do not use floating-point calculations.

---

# 33. TRANSFER CURRENCY

For same-bank V1:

require sender and recipient account currencies to match unless a real FX engine exists.

If:

sender = XAF

recipient = EUR

and no FX system exists:

reject as unsupported.

Do not silently convert.

---

# 34. MINIMUM AMOUNT

Support configurable minimum transfer amount if required.

Do not hardcode arbitrary amounts in UI.

---

# 35. MAXIMUM AMOUNT

Transfer limits will become more sophisticated later.

For now prepare server-controlled validation for:

per-transfer maximum

and possible account/customer restrictions.

Do not rely solely on frontend max attributes.

---

# 36. AVAILABLE BALANCE VALIDATION

Before transfer submission:

server must validate available balance.

The UI may provide immediate guidance using current read-model balance.

But authoritative validation happens server-side.

---

# 37. INSUFFICIENT FUNDS

If insufficient funds:

do not create a financial hold.

Do not create a ledger transfer posting.

Return a safe business error.

Customer-facing message:

Insufficient available funds for this transfer.

---

# 38. RACE CONDITION

Available balance can change between:

form display

and

transfer execution.

Therefore:

revalidate during server-side fund reservation/execution.

Do not assume the displayed balance remains valid.

---

# 39. TRANSFER REFERENCE / MESSAGE

Allow an optional customer-facing transfer note/reference.

Examples:

Invoice 204

Rent August

Keep length limited.

Sanitize and validate.

Do not use customer text as internal accounting authority.

---

# 40. TRANSFER ENTITY

Create a dedicated transfer business entity.

Conceptual fields:

```text
id

public_reference

sender_customer_id

source_account_id

beneficiary_id

destination_account_id

amount_minor

currency

customer_reference

status

processing_stage

idempotency_key

created_at

confirmed_at

processing_started_at

completed_at

failed_at

cancelled_at

ledger_transaction_id nullable

hold_id nullable

failure_code nullable

metadata
```

Adapt to project conventions.

---

# 41. TRANSFER PUBLIC REFERENCE

Generate safe server-side transfer references.

Example:

```text
TRF-2026-00004821
```

Do not use database sequential IDs in customer URLs.

---

# 42. TRANSFER STATUS MODEL

Use explicit business states.

Recommended foundation:

```text
DRAFT

READY_FOR_CONFIRMATION

CONFIRMED

FUNDS_RESERVED

PROCESSING

COMPLIANCE_REVIEW

DOCUMENT_REQUIRED

APPROVED

COMPLETED

FAILED

CANCELLED

BLOCKED

REVERSED
```

PROMPT 08 will expand and control compliance/document stages.

Do not implement fake compliance progression yet.

---

# 43. SIMPLE V1 PATH

For ordinary eligible internal transfers without additional compliance:

```text
DRAFT
→ READY_FOR_CONFIRMATION
→ CONFIRMED
→ FUNDS_RESERVED
→ PROCESSING
→ COMPLETED
```

The engine must nevertheless be extensible for PROMPT 08.

---

# 44. STATUS MACHINE

Implement transfer status transitions centrally.

Do not allow arbitrary:

```ts
transfer.status = "COMPLETED"
```

from UI components.

Use controlled server-side transition rules.

---

# 45. INVALID TRANSITIONS

Reject invalid transitions.

Example:

```text
DRAFT → COMPLETED
```

must not happen directly.

Likewise:

```text
FAILED → PROCESSING
```

unless a specific controlled retry workflow exists.

---

# 46. TRANSFER DRAFT

A DRAFT contains user-entered transfer intent.

No money has moved.

No ledger transaction exists.

No hold is necessarily required yet.

---

# 47. TRANSFER REVIEW

Before confirmation show:

From

To

Recipient

Amount

Currency

Reference/message

Potential fees if genuinely defined

Expected resulting balance if supported as an estimate.

Do not hide important information.

---

# 48. REVIEW CTA

Use explicit CTA.

Example:

Confirm transfer of 50,000 XAF

instead of only:

Continue.

---

# 49. FEE RULE

Do not invent transfer fees.

If internal transfers are free in the product configuration:

show that accurately.

If fee policy is not defined:

do not fabricate a charge.

Prepare a future fee-calculation boundary.

---

# 50. FEE ARCHITECTURE

If future fees are introduced:

fees must be calculated server-side.

They may later produce additional ledger entries.

Do not hardcode fees in the frontend.

---

# 51. TRANSFER CONFIRMATION

When customer confirms:

create/transition the business operation using a trusted server command.

Conceptual:

```text
confirmInternalTransfer(transferRef)
```

Do not post raw ledger entries from the browser.

---

# 52. STEP-UP AUTHENTICATION

Prepare the transfer confirmation flow for stronger authentication.

Depending on configured security policy, a transfer may require:

recent authentication;

OTP;

MFA;

passkey/security challenge.

Do not implement insecure custom OTP logic.

Reuse PROMPT 03 security foundations.

---

# 53. AUTHORIZATION

Before accepting transfer confirmation verify:

authenticated customer;

source-account ownership;

source-account status;

beneficiary ownership;

destination eligibility;

currency;

amount;

available balance;

customer banking status;

transfer status;

security requirements.

---

# 54. BANKING STATUS

Only customers allowed by the centralized access policy can create outgoing transfers.

Incomplete onboarding customers:

no transfer.

Suspended customers:

no transfer.

Restricted customers:

follow restriction policy.

---

# 55. SOURCE ACCOUNT STATUS

Do not allow outgoing transfer from:

FROZEN

SUSPENDED

CLOSED

unless a future privileged workflow explicitly allows it.

---

# 56. DESTINATION ACCOUNT STATUS

Do not credit accounts that are not eligible to receive funds according to bank policy.

The exact policy should be centralized.

---

# 57. FUND RESERVATION

Before long-running processing/compliance:

use the hold infrastructure from PROMPT 06.

Conceptually:

```text
createHold(
  sourceAccount,
  amount,
  transferReference
)
```

This reduces available balance.

It does NOT yet debit the ledger balance.

---

# 58. HOLD REASON

Use a machine-readable reason such as:

```text
TRANSFER_PENDING
```

with:

source_reference = transfer reference.

Do not create ambiguous generic holds.

---

# 59. HOLD AMOUNT

For a no-fee transfer:

hold amount = transfer amount.

If future fees require reservation:

use server-side fee policy.

Do not invent this now.

---

# 60. HOLD CURRENCY

Hold currency must equal source-account currency.

Reject mismatches.

---

# 61. HOLD CREATION ATOMICITY

Transfer status and hold creation should be coordinated transactionally.

Do not create:

FUNDS_RESERVED

if the hold did not actually succeed.

---

# 62. INSUFFICIENT FUNDS DURING HOLD

If available funds changed and hold cannot be created:

transition to a safe failure/needs-review state.

Do not overdraft unless the account product explicitly allows it.

---

# 63. DUPLICATE HOLD PREVENTION

One transfer must not create multiple active holds for the same reserved funds.

Use idempotency and database constraints.

---

# 64. PROCESSING

Once funds are reserved:

transfer enters:

PROCESSING

or compliance workflow depending on rules.

For simple internal V1 transfers:

processing can proceed directly to ledger posting.

---

# 65. LEDGER EXECUTION

A completed internal transfer must use the PROMPT 06 posting engine.

Conceptually:

Sender customer deposit liability ledger account:

```text
DEBIT amount
```

Recipient customer deposit liability ledger account:

```text
CREDIT amount
```

Total debits must equal total credits.

---

# 66. LIABILITY ACCOUNT LOGIC

Because customer deposits are bank liabilities:

debit decreases sender liability balance.

credit increases recipient liability balance.

Do not reverse these signs accidentally.

---

# 67. CAPTURE HOLD AND POST

The preferred execution should safely coordinate:

validate active hold

→ post balanced ledger transaction

→ capture/release appropriate hold state

→ update balance projections

→ mark transfer completed

as one controlled financial workflow.

---

# 68. FINANCIAL ATOMICITY

Never allow:

sender debited

recipient not credited.

Never allow:

recipient credited twice.

Never allow:

transfer completed without a valid ledger posting.

---

# 69. LEDGER SOURCE

Ledger transaction should reference:

```text
source_type = INTERNAL_TRANSFER
```

```text
source_reference = transfer public/internal reference
```

Use the established source-link pattern.

---

# 70. TRANSFER → LEDGER UNIQUENESS

One transfer execution should create exactly one primary transfer ledger posting.

Use uniqueness/idempotency protections.

---

# 71. TRANSFER COMPLETION

Only set:

```text
COMPLETED
```

after:

ledger posting succeeded;

balance projections updated;

hold state correctly finalized.

---

# 72. COMPLETED TRANSFER IMMUTABILITY

Important financial fields should become immutable after completion.

Do not allow editing:

amount;

currency;

source account;

recipient.

If correction is necessary:

use reversal/new transfer workflows.

---

# 73. FAILED BEFORE POSTING

If transfer fails before ledger posting:

release active hold.

Set:

FAILED

with safe failure classification.

No financial debit should remain.

---

# 74. FAILURE AFTER UNCERTAIN NETWORK RESPONSE

If the client loses connection after confirmation:

do not assume the transfer failed.

Client should query:

transfer reference/status.

The idempotent server operation remains authoritative.

---

# 75. TRANSFER RETRY

A retry must never create a new financial execution blindly.

Use original transfer reference/idempotency context.

If existing transfer already completed:

return completed result.

---

# 76. CANCELLATION

Allow customer cancellation only while the transfer is in cancellable states.

Potentially:

DRAFT

READY_FOR_CONFIRMATION

and perhaps certain pre-processing states.

Do not allow customer cancellation after posted completion.

---

# 77. CANCEL ACTIVE HOLD

If customer-controlled cancellation is allowed after a hold exists but before financial posting:

release hold safely

and transition:

CANCELLED.

---

# 78. COMPLETED CANNOT BE CANCELLED

A completed transfer requires:

reversal/refund workflow

not cancellation.

Do not rewrite historical status to CANCELLED.

---

# 79. REVERSAL READINESS

PROMPT 06 already supports ledger reversal.

Prepare transfer state for:

REVERSED.

Ordinary customers should not trigger arbitrary reversal.

Admin financial controls come later.

---

# 80. BLOCKED STATE

Prepare:

BLOCKED

for future administrator/compliance intervention.

PROMPT 08/13 will define its rules.

For now:

do not automatically use BLOCKED for generic technical failures.

---

# 81. COMPLIANCE REVIEW STATE

Prepare:

COMPLIANCE_REVIEW

but do not invent compliance rules yet.

PROMPT 08 will define:

0→99 progress

documentation

review

100% completion.

---

# 82. DOCUMENT REQUIRED STATE

Prepare:

DOCUMENT_REQUIRED

but do not implement the complete documentation workflow here.

---

# 83. TRANSFER PROGRESS MODEL

Separate:

business status

from:

customer progress percentage.

Do not derive arbitrary percentage directly from enum position.

PROMPT 08 will define trustworthy progression.

---

# 84. TRANSFER LIST PAGE

Implement `/app/transfers`.

Show:

recent transfers;

recipient;

amount;

date;

status.

Allow:

New transfer

Filter

Open details.

---

# 85. TRANSFER LIST FILTERS

Useful filters:

status

date

direction if incoming transfers also appear

amount range if useful.

Keep V1 manageable.

---

# 86. SENT VS RECEIVED

A customer should be able to understand:

Sent transfers

Received transfers.

However, received same-bank transfers may already appear in transaction/activity history.

Avoid duplicating confusing records.

---

# 87. TRANSFER HISTORY MODEL

Transfer feature should expose business-operation history.

Transaction/activity shows financial movement.

These are related but not identical.

Example:

Transfer may show:

Processing

before ledger posting.

Transaction history only shows posted financial outcome once appropriate.

---

# 88. TRANSFER DETAIL PAGE

Implement `/app/transfers/:transferRef`.

Display:

status

amount

recipient

source account

destination safe details

reference/message

created date

completion date when applicable

progress/state timeline

related transaction reference when posted.

---

# 89. TRANSFER DETAIL HERO

Prioritize:

Amount

Recipient

Status.

Do not make the public reference the largest visual element.

---

# 90. TRANSFER TIMELINE

Use customer-safe milestones.

For simple transfer:

Created

Confirmed

Processing

Completed.

For future compliance:

additional stages may appear.

Do not expose low-level database states.

---

# 91. RELATED TRANSACTION

Once completed:

link transfer detail to the customer-safe transaction detail.

Do not expose ledger journal IDs.

---

# 92. SENDER EXPERIENCE

After successful transfer:

show a persistent success screen.

Example:

Transfer completed

50,000 XAF sent to Marie D.

Actions:

View transfer

View activity

Make another transfer.

---

# 93. RECIPIENT EXPERIENCE

Recipient account balance and activity must update from the same ledger posting.

No separate manual recipient-credit operation.

---

# 94. RECIPIENT ACTIVITY

Recipient should see customer-safe incoming transaction.

Example:

Transfer received

+50,000 XAF

From: appropriate safe sender display.

Respect privacy policy.

---

# 95. SENDER DISPLAY TO RECIPIENT

Do not expose more sender data than needed.

Possible:

verified account-holder display name

plus masked account reference if appropriate.

Do not expose:

email;

phone;

address.

---

# 96. TRANSFER DUPLICATE PROTECTION

Double-tapping Confirm must not double-send.

Frontend:

disable confirmation during submission.

Backend:

mandatory idempotency.

---

# 97. TRANSFER INTENT ID

Create a stable transfer ID/reference before financial execution.

Use it for:

idempotency;

status recovery;

audit;

hold linkage;

ledger linkage.

---

# 98. TRANSFER DRAFT PERSISTENCE

A user may leave an unfinished transfer.

Decide a simple policy.

Possible:

save DRAFT server-side for a limited period

or

keep form state temporarily.

Do not save sensitive financial instructions indefinitely without need.

---

# 99. EXPIRED DRAFT

If server-side drafts are used:

support expiration/archive.

Do not clutter transfer history with every abandoned keystroke.

---

# 100. CONFIRMED TRANSFER CANNOT BE EDITED

After confirmation:

do not allow changing amount or beneficiary.

If not yet processed and cancellation is allowed:

cancel and create a new transfer.

---

# 101. LIMIT ENGINE FOUNDATION

Prepare a server-controlled transfer-limit service.

Potential concepts:

per transaction

daily

monthly.

Full sophisticated policy may come later.

---

# 102. TRANSFER LIMIT ENTITY

Avoid hardcoding limits in UI.

Possible config/read model:

```text
max_per_transfer_minor

daily_limit_minor

monthly_limit_minor

currency
```

Rules may depend on:

account;

customer level;

risk/compliance status.

---

# 103. LIMIT VALIDATION

Validate limits server-side before hold creation.

Frontend may show current limits for UX.

---

# 104. DAILY USED AMOUNT

If limit UI is shown:

derive used amount from trusted transfer/posted data.

Do not calculate from incomplete browser lists.

---

# 105. LIMIT ERROR

Customer-friendly:

This transfer exceeds your current transfer limit.

Provide:

View limits

or support path if available.

---

# 106. BENEFICIARY LIMITS

Prepare architecture for future beneficiary-specific restrictions if needed.

Do not overbuild now.

---

# 107. TRANSFER SECURITY EVENTS

Record safe events such as:

transfer_created

transfer_confirmed

funds_reserved

transfer_processing

transfer_completed

transfer_failed

transfer_cancelled.

Do not store secrets.

---

# 108. AUDIT HISTORY

Transfer status changes must be recorded in a status-history/event table.

Conceptual:

```text
transfer_status_history
```

fields:

transfer

from_status

to_status

reason_code

actor_type

actor_reference

created_at.

---

# 109. CUSTOMER VS INTERNAL REASON

Do not expose raw internal failure/review reasons directly.

Map internal codes to customer-safe explanations.

---

# 110. ACTOR TYPES

Prepare:

CUSTOMER

SYSTEM

STAFF

COMPLIANCE

where useful.

Staff workflows come later.

---

# 111. TRANSFER FAILURE CODES

Use structured internal codes.

Examples:

INSUFFICIENT_FUNDS

ACCOUNT_RESTRICTED

DESTINATION_UNAVAILABLE

LIMIT_EXCEEDED

CURRENCY_MISMATCH

SECURITY_CONFIRMATION_FAILED

PROCESSING_ERROR.

Do not make error-code strings the customer message.

---

# 112. GENERIC TECHNICAL FAILURE

If internal processing fails:

display:

We couldn't complete this transfer.

If no money moved:

state that clearly where appropriate.

---

# 113. UNKNOWN FINAL STATE

If processing outcome is temporarily unknown:

do NOT display FAILED automatically.

Use:

Processing

or:

We're confirming the transfer status.

Then recover authoritative status.

---

# 114. NO DUPLICATE LEDGER ENTRY ON RECOVERY

Status recovery must read existing business/ledger state.

Do not re-execute because the UI did not receive the original response.

---

# 115. CONSISTENCY CHECK

A transfer marked COMPLETED must have:

valid ledger transaction reference

and correct accounting impact.

Create a test/integrity check.

---

# 116. COMPLETED TRANSFER BALANCE CHECK

After transfer:

Sender ledger balance decreases by amount.

Recipient ledger balance increases by amount.

Total bank ledger remains balanced.

---

# 117. HOLD CHECK

Before posting:

Sender available balance reduced by hold.

After successful posting:

hold captured/finalized

and ledger balance reflects debit.

Available balance must not be reduced twice.

---

# 118. DOUBLE-DEDUCTION TEST

Explicitly test:

hold = 100

transfer posts 100.

Result must NOT reduce available balance by 200.

The hold must be captured/removed appropriately when booked debit occurs.

---

# 119. FAILURE RELEASE TEST

Hold 100

transfer fails before posting.

Expected:

ledger balance unchanged

available balance restored.

---

# 120. CONCURRENCY TEST

Starting available balance:

100.

Two simultaneous transfers:

80

80.

Expected:

at most one succeeds/reserves if overdraft is not allowed.

Do not permit negative available funds due to race condition.

---

# 121. CROSS-CUSTOMER OWNERSHIP TEST

Customer A cannot create a transfer using Customer B's source account ID/reference.

Server must reject it.

---

# 122. BENEFICIARY OWNERSHIP TEST

Customer A cannot submit Customer B's beneficiary ID.

Server must reject it.

---

# 123. DESTINATION INJECTION TEST

Client cannot override saved beneficiary destination with a different hidden destination account ID.

Server resolves trusted destination.

---

# 124. AMOUNT TAMPERING

Server must use validated amount from confirmed transfer state.

Do not trust display-only hidden fields.

---

# 125. REVIEW INTEGRITY

What the customer confirms must match what the server executes.

Protect against:

beneficiary changed after review

amount changed after confirmation

currency changed after review.

Use immutable/locked confirmed transfer data.

---

# 126. BENEFICIARY CHANGE BETWEEN STEPS

If beneficiary becomes invalid/restricted before execution:

revalidate and fail safely.

Do not execute based only on earlier lookup.

---

# 127. ACCOUNT STATUS CHANGE

If source account becomes restricted between review and confirmation:

reject execution.

---

# 128. BALANCE CHANGE

If available balance decreases between review and confirmation:

server validation wins.

---

# 129. TRANSFER UX — FIRST SCREEN

Recommended:

Send money

Select account

Choose beneficiary

Recent beneficiaries

Add beneficiary.

Keep mobile screen clean.

---

# 130. TRANSFER UX — AMOUNT SCREEN

Display:

Recipient

Source account

Available balance

MoneyInput

Optional reference.

Primary CTA:

Review transfer.

---

# 131. TRANSFER UX — REVIEW SCREEN

Display a receipt-like confirmation card.

From

To

Amount

Fee if real

Total

Reference.

CTA:

Confirm transfer.

---

# 132. TRANSFER UX — PROCESSING

After confirmation:

show persistent processing state.

Do not allow the user to accidentally confirm again.

Example:

Processing your transfer

with clear status.

---

# 133. TRANSFER UX — SUCCESS

Show success state.

Amount

Recipient

Transfer reference

Date/time.

Actions:

View transfer

Done.

---

# 134. TRANSFER UX — FAILURE

Show clear failure.

Explain whether funds were moved/reserved/released in a customer-safe way.

Example:

Transfer not completed

No funds were sent.

Do not use this statement unless server state confirms it.

---

# 135. TRANSFER UX — COMPLIANCE HANDOFF

If the future compliance engine flags the transfer:

route customer to transfer detail/progress experience.

Display:

Additional verification required

rather than a generic failure.

PROMPT 08 will implement this fully.

---

# 136. MOBILE ONE-HAND UX

Critical actions should remain reachable near the lower portion of the mobile interface.

Use safe sticky CTA where appropriate.

Do not sacrifice review visibility.

---

# 137. KEYBOARD BEHAVIOR

Money amount and reference input must work with mobile keyboard.

Sticky confirmation must not overlap input.

---

# 138. MONEY INPUT

Use correct numeric keyboard hints.

Do not strip valid decimal behavior for currencies that support decimals.

---

# 139. ACCESSIBILITY

Transfer flow must meet WCAG 2.2 AA.

Verify:

stepper semantics

form labels

money input

beneficiary selection

review screen

confirmation dialog

processing status announcements

success/failure announcements

focus management.

---

# 140. SCREEN READER CONFIRMATION

On review, screen reader users must hear:

recipient

amount

source account

fee if any

total

before confirmation.

---

# 141. PROCESSING ANNOUNCEMENT

Use appropriate live-region behavior for transfer processing status.

Do not repeatedly spam announcements.

---

# 142. COLOR

Do not rely only on green for completed or red for failed.

Use text/status icon semantics.

---

# 143. PRIVACY MODE

Transfer amounts should obey established privacy mode in transfer lists/details where appropriate.

On the active transfer form itself, the user must still be able to understand the amount they are entering.

Do not hide critical confirmation data unexpectedly.

---

# 144. ACTIVITY INTEGRATION

On successful transfer:

sender transaction history gets outgoing movement.

recipient transaction history gets incoming movement.

Dashboard recent activity should update through existing invalidation/refetch mechanisms.

---

# 145. DASHBOARD BALANCE INTEGRATION

After authoritative completion:

refresh sender balance.

Recipient balance updates independently for recipient session.

Do not manually subtract/add in React state as financial authority.

---

# 146. TRANSFER LIST REFRESH

After creating/completing transfer:

refresh transfer history.

---

# 147. BENEFICIARY LAST USED

On successful transfer:

update `last_used_at` through trusted server logic.

Do not update it merely when the beneficiary is selected.

---

# 148. RECENT BENEFICIARIES

Recent beneficiary ordering should rely on trusted successful-use metadata.

---

# 149. NEW BENEFICIARY + TRANSFER

If user adds beneficiary during transfer:

after successful beneficiary creation

return to transfer flow

with that beneficiary selected.

Do not force the user to restart.

---

# 150. REMOVED BENEFICIARY

Existing completed transfers must retain historical recipient display information via safe snapshot/reference.

Do not break history if beneficiary record is removed.

---

# 151. BENEFICIARY SNAPSHOT

Transfer may store customer-safe immutable recipient snapshot fields needed for historical display.

Examples:

recipient display name at time of transfer

masked destination account.

Do not duplicate excessive personal data.

---

# 152. TRANSFER HISTORICAL STABILITY

Changing a beneficiary nickname later should not rewrite past official recipient identity.

---

# 153. TRANSACTION DESCRIPTION

Generate customer activity descriptions from trusted transfer data.

Sender:

Transfer to Marie D.

Recipient:

Transfer from Alex N.

Do not build from arbitrary raw customer strings.

---

# 154. SEARCH

Transfer history may search by:

transfer reference

recipient display

customer reference/message.

Keep server-side filtering safe.

---

# 155. PAGINATION

Use server-side pagination for large transfer histories.

---

# 156. PERFORMANCE

Do not load:

all beneficiaries

all transfers

all account activity

on `/app/transfers/new`.

Fetch only what is needed.

---

# 157. TRANSFER FORM BUNDLE

Do not import admin/compliance dashboards into customer transfer bundle.

---

# 158. NO CLIENT-SIDE LEDGER IMPORT

Frontend transfer components should not call raw ledger helpers.

They call transfer services.

Server transfer service calls internal ledger engine.

---

# 159. SERVER TRANSFER SERVICE

Conceptual operations:

```text
createTransferDraft()

reviewTransfer()

confirmTransfer()

cancelTransfer()

getTransfer()

getTransfers()
```

Internal operations may include:

```text
reserveTransferFunds()

executeInternalTransfer()
```

Do not expose privileged internals directly.

---

# 160. BENEFICIARY SERVICE

Conceptual:

```text
resolveInternalBeneficiary()

createBeneficiary()

getBeneficiaries()

getBeneficiary()

removeBeneficiary()
```

All ownership checks server-side.

---

# 161. TRANSFER CONFIRMATION COMMAND

A secure server-side command should conceptually:

1. lock/read transfer
2. validate state
3. validate sender/customer
4. validate accounts
5. validate beneficiary
6. validate amount/currency
7. validate limits
8. validate available balance
9. create/reserve hold
10. transition transfer
11. execute or route to compliance
12. return authoritative state.

Do not trust the UI.

---

# 162. SIMPLE INTERNAL EXECUTION

For normal low-risk transfer path:

1. create hold
2. PROCESSING
3. atomically post ledger
4. capture hold
5. update projections
6. COMPLETED.

Keep all financial integrity guarantees from PROMPT 06.

---

# 163. COMPLIANCE HOOK

Before final execution, provide a clean internal boundary:

```text
evaluateTransferRequirements()
```

or equivalent.

For now it may return:

STANDARD_PROCESSING

unless real configured rules exist.

PROMPT 08 will replace/expand this.

Do not invent regulatory thresholds.

---

# 164. DO NOT FAKE RISK SCORING

Do not create fake:

riskScore = 72

or arbitrary amount thresholds pretending to be banking compliance.

Use configuration/dev placeholders only where clearly marked.

---

# 165. LIMIT CONFIGURATION

Similarly, do not invent production financial limits.

Make them configurable.

---

# 166. AUDIT LOG

Record important transfer events.

Do not allow ordinary customer to edit/delete audit history.

---

# 167. RLS — TRANSFER

Customer can read transfers where they are authorized as sender/recipient according to customer-safe policies.

Outgoing transfer creation must go through controlled server command.

Do not give broad direct table mutation permissions.

---

# 168. RLS — BENEFICIARY

Customer may manage only their beneficiary records.

Destination account data should remain protected.

---

# 169. RAW DESTINATION ACCOUNT

Do not expose raw destination internal IDs in normal client payloads if not needed.

---

# 170. LEDGER RLS

Preserve PROMPT 06:

customer cannot write raw ledger.

Transfer implementation must not weaken it.

---

# 171. DATABASE TRANSACTION

Financial execution must happen within appropriate PostgreSQL transactional boundaries.

Do not perform multiple critical RPC calls from frontend hoping all succeed.

---

# 172. DATABASE CONSTRAINTS

Consider:

unique transfer public reference;

idempotency uniqueness;

positive amount;

currency required;

sender != invalid destination according to rules;

valid status;

foreign-key integrity.

---

# 173. STATUS HISTORY CONSTRAINT

Status events must reference a valid transfer.

---

# 174. TRANSFER TIME FIELDS

Use server times for:

created_at

confirmed_at

completed_at

failed_at.

Do not trust browser clock as official banking time.

---

# 175. CUSTOMER REFERENCE LENGTH

Validate reference/message size.

Avoid unlimited text blobs.

---

# 176. SANITIZATION

Treat customer reference as plain text.

Do not render unsanitized HTML.

---

# 177. NO HTML IN TRANSFER MESSAGE

Do not support rich HTML transfer notes.

Plain text is enough.

---

# 178. RECIPIENT NOTIFICATION READINESS

Prepare domain events:

transfer_received

transfer_completed.

PROMPT 10 will create actual notification delivery.

---

# 179. SENDER NOTIFICATION READINESS

Prepare:

transfer_processing

transfer_action_required

transfer_completed

transfer_failed.

Do not build full notification center here.

---

# 180. MESSAGING READINESS

Transfer detail should later be linkable to secure support conversation.

Example future:

Contact bank about this transfer.

PROMPT 10 handles messaging.

---

# 181. STATEMENT READINESS

Completed ledger-backed transfers must appear correctly in future statements.

PROMPT 09 will consume transaction history.

---

# 182. RECEIPT READINESS

Transfer detail should be structured so a future receipt PDF can be generated.

Do not implement official receipt generation yet.

---

# 183. TEST SCENARIO — SUCCESS

Customer A available balance:

100,000 XAF.

Sends:

25,000 XAF

to Customer B.

Expected:

A hold created.

Transfer processed.

Ledger:

A liability DEBIT 25,000

B liability CREDIT 25,000.

A balance decreases.

B balance increases.

Transfer COMPLETED.

Hold captured/finalized.

---

# 184. TEST SCENARIO — INSUFFICIENT FUNDS

A available:

10,000.

Attempts:

20,000.

Expected:

transfer not executed;

no ledger posting;

no active hold;

appropriate error.

---

# 185. TEST SCENARIO — DOUBLE TAP

Customer confirms transfer repeatedly.

Expected:

one transfer execution;

one ledger posting;

one debit;

one credit.

---

# 186. TEST SCENARIO — NETWORK LOSS

Transfer confirmation submitted.

Server completes.

Client loses network before response.

After reconnect:

same transfer reference resolves to COMPLETED.

No duplicate posting.

---

# 187. TEST SCENARIO — CONCURRENT SPENDING

Balance:

100.

Two simultaneous transfer confirmations:

80 + 80.

Expected:

available-funds policy prevents both from spending the same funds.

---

# 188. TEST SCENARIO — BENEFICIARY TAMPER

Customer modifies destination account ID in request.

Expected:

server ignores/rejects unauthorized destination.

No transfer.

---

# 189. TEST SCENARIO — FOREIGN ACCOUNT

Customer tries to use another customer's source account.

Expected:

rejected.

---

# 190. TEST SCENARIO — RESTRICTED ACCOUNT

Source account becomes restricted before confirmation.

Expected:

transfer rejected.

No hold.

No ledger posting.

---

# 191. TEST SCENARIO — FAILED PROCESSING

Funds held.

Financial posting fails before commit.

Expected:

ledger rollback;

hold released or safely recoverable;

transfer FAILED/appropriate recoverable state;

available balance restored.

---

# 192. TEST SCENARIO — ATOMICITY

Force recipient credit failure.

Expected:

sender debit also rolls back.

No half transfer.

---

# 193. TEST SCENARIO — DOUBLE DEDUCTION

Hold 50.

Then post transfer 50.

Expected final sender reduction:

50

NOT 100.

---

# 194. TEST SCENARIO — CANCELLATION

Draft transfer cancelled.

Expected:

no ledger;

no financial impact.

If cancellable hold state exists:

hold released.

---

# 195. TEST SCENARIO — COMPLETED CANCELLATION

Try cancel completed transfer.

Expected:

rejected.

Requires future reversal workflow.

---

# 196. RESPONSIVE TESTING

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

beneficiary list

beneficiary creation

transfer amount entry

review

processing

success

failure

transfer history

transfer detail.

---

# 197. MOBILE BROWSER TESTING

Verify:

Chrome Android

Safari iPhone

Samsung Internet

Safari iPad.

Check:

numeric keyboard

safe-area sticky CTA

focus

bottom sheet

mobile navigation

processing screen.

---

# 198. ACCESSIBILITY TESTING

Verify:

beneficiary lookup accessible;

stepper readable;

money amount announced correctly;

review screen understandable;

status timeline accessible;

success/failure announced;

keyboard navigation works.

---

# 199. SECURITY TESTING

Explicitly verify:

customer cannot alter balance;

customer cannot post ledger;

customer cannot choose another customer's source account;

customer cannot use another customer's beneficiary;

customer cannot tamper destination;

customer cannot bypass limit validation;

customer cannot mark transfer completed;

customer cannot manually release/capture holds;

customer cannot duplicate financial execution.

---

# 200. CURRENT IMPLEMENTATION SCOPE

Implement:

1. Beneficiary domain.
2. Internal beneficiary resolution.
3. Beneficiary list.
4. Add beneficiary.
5. Remove/deactivate beneficiary.
6. Transfer entity.
7. Transfer status machine.
8. Transfer history.
9. New-transfer workflow.
10. Source-account selection.
11. Beneficiary selection.
12. Money input.
13. Transfer review.
14. Secure confirmation.
15. Available-balance validation.
16. Transfer-limit foundation.
17. Fund reservation.
18. Transfer processing.
19. Same-bank ledger execution.
20. Sender debit.
21. Recipient credit.
22. Hold capture/release.
23. Idempotency.
24. Concurrency protection.
25. Transfer detail.
26. Status history.
27. Customer-safe errors.
28. Activity/dashboard integration.
29. Compliance hook foundation.
30. RLS/security.
31. Responsive validation.
32. Accessibility.
33. Financial integrity tests.

---

# 201. DO NOT IMPLEMENT YET

Do NOT fully implement:

0→99 transfer compliance progression;

document requests;

document approval;

100% compliance completion;

admin transfer blocking;

admin transfer approval;

bank statements;

secure messaging;

notification delivery;

customer security center;

admin ledger adjustment UI.

These come later.

---

# 202. PRESERVE PROMPT 06

The ledger remains the financial source of truth.

Do not weaken:

double-entry;

atomicity;

immutability;

reversal;

idempotency;

hold rules.

---

# 203. PRESERVE PROMPT 05

Dashboard/account balance must refresh from ledger-backed projections.

Do not create transfer-local balances.

---

# 204. PRESERVE PROMPT 04

Keep:

customer app shell;

mobile bottom navigation;

desktop sidebar;

network states;

privacy mode.

---

# 205. PRESERVE PROMPT 03

Customer lifecycle and authorization remain authoritative.

---

# 206. PRESERVE PROMPT 02

Public website remains unaffected.

---

# 207. PRESERVE PROMPT 01

Reuse:

MoneyInput

Stepper

StatusBadge

Progress

BottomSheet

Dialog

AlertDialog

Skeleton

ErrorState

TransactionRow

AccountCard.

---

# 208. PRESERVE PROMPT 00

Maintain:

simple modular architecture;

online-only behavior;

server-controlled financial operations;

Supabase security.

---

# 209. FINAL FINANCIAL REVIEW

Before completion confirm:

No direct balance mutation exists.

Sender debit and recipient credit use one balanced ledger operation.

Transfer posting is atomic.

Transfer execution is idempotent.

Funds cannot be double-spent through concurrent requests.

Holds reduce available balance correctly.

Hold capture does not double-deduct funds.

Failed pre-post transfers restore available balance.

Completed transfers have exactly one primary ledger posting.

---

# 210. FINAL TRANSFER REVIEW

Confirm customer can:

add an internal beneficiary;

select beneficiary;

enter amount;

review transfer;

confirm securely;

see processing;

see success/failure;

see transfer history;

open transfer details.

---

# 211. FINAL REPORT

At completion provide:

BENEFICIARY DOMAIN

BENEFICIARY DATA MODEL

BENEFICIARY RESOLUTION

BENEFICIARY PRIVACY

TRANSFER DATA MODEL

TRANSFER STATUS MACHINE

TRANSFER ROUTES

TRANSFER CREATION FLOW

TRANSFER REVIEW FLOW

TRANSFER CONFIRMATION

SECURITY CONFIRMATION

AVAILABLE BALANCE VALIDATION

TRANSFER LIMIT FOUNDATION

FUND RESERVATION

HOLD INTEGRATION

LEDGER EXECUTION

SENDER DEBIT

RECIPIENT CREDIT

IDEMPOTENCY

CONCURRENCY

TRANSFER HISTORY

TRANSFER DETAIL

STATUS HISTORY

ACTIVITY INTEGRATION

DASHBOARD INTEGRATION

RLS POLICIES

DATABASE FUNCTIONS

DATABASE CONSTRAINTS

AUDIT EVENTS

MOBILE UX

ACCESSIBILITY

SECURITY TESTS

FINANCIAL INTEGRITY TESTS

FILES CREATED

FILES MODIFIED

DEPENDENCIES ADDED

KNOWN TODOs

Also explicitly confirm:

- project builds successfully;
- TypeScript passes;
- beneficiaries are ownership-protected;
- beneficiary lookup does not expose a customer directory;
- transfers use server-authoritative validation;
- customers cannot directly mutate balances;
- customers cannot directly write ledger entries;
- transfer confirmation is idempotent;
- same-bank transfers are atomic;
- sender cannot be debited without recipient credit;
- recipient cannot be credited twice;
- available balance is revalidated server-side;
- concurrent transfers cannot spend the same funds twice;
- failed transfers do not leave unintended holds;
- hold capture does not double-deduct money;
- completed transfers link to their ledger transaction;
- transaction/activity history updates from authoritative data;
- no external banking rail was fabricated;
- no fake compliance logic was introduced;
- no offline-first architecture was introduced;
- PROMPT 00–06 remain intact.

Stop after completing beneficiaries and internal transfers.

Do NOT automatically implement the transfer compliance/documentation engine.

The next phase is:

PROMPT 08 — TRANSFER COMPLIANCE PROGRESS 0→100, DOCUMENT REQUESTS & REVIEW WORKFLOW.