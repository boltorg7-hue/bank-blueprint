# PROMPT 08 — TRANSFER ROUTING, 0→100 COMPLIANCE JOURNEY & EXTERNAL TRANSFER VERIFICATION

Continue from PROMPT 00 through PROMPT 07.

Do NOT rebuild the architecture.

Do NOT replace the ledger.

Do NOT directly mutate balances.

Do NOT introduce offline-first behavior.

This phase introduces a critical distinction between TWO TRANSFER FAMILIES:

1. INTERNAL BANK TRANSFER
2. EXTERNAL TRANSFER

These two transfer families must NOT follow the exact same processing workflow.

---

# 1. FUNDAMENTAL BUSINESS RULE

The system must automatically determine whether the destination belongs to the same banking platform.

If:

SOURCE ACCOUNT

and

DESTINATION ACCOUNT

are both valid accounts managed by this banking platform:

classify the operation as:

INTERNAL_TRANSFER

If the destination is outside the platform:

classify it as:

EXTERNAL_TRANSFER.

This classification must be server-authoritative.

The customer must not be able to manipulate the transfer type from the browser.

---

# 2. INTERNAL TRANSFER

Example:

Customer A

has account:

ACC-A

Customer B

has account:

ACC-B

Both ACC-A and ACC-B are accounts inside this bank.

The transfer is:

INTERNAL_TRANSFER.

Expected behavior:

Customer A confirms transfer

→ funds validated

→ sender funds reserved if required

→ ledger transaction posted

→ sender account debited

→ recipient account credited

→ balance projections updated

→ transfer COMPLETED

→ progress = 100%.

No external-settlement workflow is required.

---

# 3. INTERNAL TRANSFER MUST REACH 100%

For a successful internal transfer:

the transaction must finish at:

100%.

The user must not remain at:

99%

when the recipient's internal account has already been successfully credited.

The 99% compliance waiting mechanism primarily applies to EXTERNAL transfers requiring additional validation.

---

# 4. INTERNAL TRANSFER ACCOUNTING

Use the PROMPT 06 ledger.

Example:

Sender deposit-liability ledger account:

DEBIT 50,000 XAF

Recipient deposit-liability ledger account:

CREDIT 50,000 XAF

The journal must balance.

The frontend must NEVER do:

sender.balance -= amount

recipient.balance += amount.

The ledger remains authoritative.

---

# 5. INTERNAL TRANSFER SUCCESS CONDITION

Set:

transfer.status = COMPLETED

and:

transfer.progress = 100

ONLY after:

- sender validation succeeded;
- destination account validation succeeded;
- available funds validation succeeded;
- any required security confirmation succeeded;
- ledger posting succeeded;
- sender balance projection updated;
- recipient balance projection updated;
- active hold was correctly captured/released.

---

# 6. INTERNAL TRANSFER FAILURE

If ledger posting fails:

do NOT set 100%.

Do NOT debit one side only.

Do NOT credit one side only.

Rollback the operation.

Release applicable hold.

Return a safe failure state.

---

# 7. INTERNAL TRANSFER PROGRESS

The UI may visually show real processing progression such as:

0% — Transfer created

20% — Recipient validated

40% — Funds validated

60% — Security confirmed

80% — Transfer processing

100% — Transfer completed

These percentages must map to actual system milestones.

Do not use fake time-based animation as transaction authority.

---

# 8. INTERNAL TRANSFER SHOULD NOT REQUIRE DOCUMENTS BY DEFAULT

For a normal same-platform transfer:

do NOT automatically stop at 99%.

Do NOT automatically request compliance documents.

If a legitimate risk/compliance rule specifically requires review, the system may route that transfer into review.

But the default internal-transfer experience is:

FAST

CLEAR

100% COMPLETED.

---

# 9. EXTERNAL TRANSFER

An external transfer is a transfer where the destination is NOT an account managed by the current banking platform.

Examples conceptually:

another bank account;

external financial institution;

future external payment network.

Classify as:

EXTERNAL_TRANSFER.

---

# 10. EXTERNAL TRANSFER IS A DIFFERENT WORKFLOW

External transfers must not use the same instant internal ledger-credit workflow.

The destination account is outside the bank.

Therefore:

the internal system can debit/reserve the sender's funds,

but it cannot truthfully claim the external recipient has received the money unless a real external settlement mechanism confirms it.

---

# 11. EXTERNAL TRANSFER PROGRESS MODEL

External transfers use the:

0 → 99 → 100

verification journey.

The percentage must represent real workflow progression.

It is NOT a decorative timer.

---

# 12. EXTERNAL TRANSFER PROGRESS EXAMPLE

Recommended conceptual progression:

0%

Transfer created

10%

Sender account validated

20%

Destination details validated

30%

Available funds validated

40%

Transfer limits validated

50%

Security confirmation completed

60%

Compliance pre-check completed

70%

External transfer prepared

80%

Additional verification stage

90%

Final banking review

99%

Awaiting final requirement / document / authorization / external settlement

100%

Transfer successfully completed and confirmed.

Adapt actual percentages based on workflow.

---

# 13. 99% HAS A VERY SPECIFIC MEANING

99% must mean:

THE TRANSFER IS NOT YET COMPLETED.

It may be waiting for:

- customer documentation;
- bank review;
- compliance approval;
- external settlement confirmation;
- another legitimate required validation.

Never show:

Completed

while progress is 99%.

---

# 14. 100% MEANS FINAL COMPLETION

100% is reached only when the transaction is genuinely completed.

For INTERNAL_TRANSFER:

100% means the recipient's internal account has been credited successfully.

For EXTERNAL_TRANSFER:

100% means the external-transfer workflow has received authoritative confirmation that the transfer completed according to the connected settlement infrastructure.

---

# 15. NO FAKE EXTERNAL SETTLEMENT

If no real external banking/payment rail is connected:

do NOT pretend real external money was delivered.

The system may support:

development simulation

or:

manual operational review

only when clearly marked as development/testing.

Production must require a legitimate external-settlement integration.

---

# 16. TRANSFER TYPE ENUM

Create explicit transfer types.

Example:

INTERNAL_TRANSFER

EXTERNAL_TRANSFER

Potential future types may include:

OWN_ACCOUNT_TRANSFER

INTERNATIONAL_TRANSFER

MOBILE_MONEY_TRANSFER

but do not implement them unless required.

---

# 17. TRANSFER ROUTING ENGINE

Create a server-side transfer-routing service.

Conceptually:

determineTransferRoute(destination)

returns:

INTERNAL

or:

EXTERNAL.

Do not trust a frontend field like:

transferType = INTERNAL.

---

# 18. INTERNAL DESTINATION RESOLUTION

When a destination identifier resolves to a valid account belonging to the current banking platform:

route internally.

Do not send it through external infrastructure unnecessarily.

---

# 19. EXTERNAL DESTINATION RESOLUTION

If destination cannot be resolved as an internal bank account but is a valid supported external destination:

route through EXTERNAL_TRANSFER.

External destination support must depend on configured integrations.

---

# 20. UNSUPPORTED DESTINATION

If no supported external integration exists:

display:

This destination is not currently supported.

Do NOT fabricate a transfer workflow.

---

# 21. EXTERNAL BENEFICIARY

Extend beneficiaries to support:

INTERNAL_CUSTOMER

EXTERNAL_ACCOUNT.

External beneficiary may contain:

recipient display name

bank name

account identifier

country where needed

currency

bank routing details appropriate to the configured rail.

Do not collect fields that are not required.

---

# 22. EXTERNAL BENEFICIARY DATA SECURITY

Protect:

account numbers;

routing identifiers;

banking references.

Do not expose them unnecessarily.

Mask where appropriate.

---

# 23. EXTERNAL TRANSFER ENTITY

Extend transfer data model with fields such as:

transfer_type

external_destination_id nullable

external_provider nullable

external_provider_reference nullable

external_status nullable

compliance_case_id nullable

progress_percent

current_requirement nullable

finalized_at nullable.

Do not expose sensitive provider internals to customers.

---

# 24. TRANSFER PROGRESS MUST BE SERVER-CONTROLLED

The frontend must never set:

progress = 99

or:

progress = 100

as financial authority.

Progress is derived from trusted workflow state.

---

# 25. PROGRESS STATE MODEL

Do not store only:

progress_percent.

Also store meaningful state.

Example:

CREATED

VALIDATING

SECURITY_CHECK

COMPLIANCE_CHECK

DOCUMENT_REQUIRED

DOCUMENT_RECEIVED

UNDER_REVIEW

APPROVED

SETTLEMENT_PENDING

COMPLETED.

Percentage is a customer-facing projection of state.

---

# 26. PROGRESS MAPPING

Create one centralized progress mapper.

Example concept:

CREATED → 0

ACCOUNT_VALIDATED → 15

FUNDS_VALIDATED → 30

SECURITY_CONFIRMED → 45

COMPLIANCE_CHECK → 60

DOCUMENT_REVIEW → 75

FINAL_REVIEW → 90

SETTLEMENT_PENDING → 99

COMPLETED → 100.

Do not duplicate progress logic across components.

---

# 27. PROGRESS MAY MOVE BY MILESTONE ONLY

Do not increment:

81, 82, 83, 84...

based only on elapsed time.

Progress changes when a real workflow milestone completes.

UI animation may smoothly animate between trusted values.

---

# 28. DOCUMENT REQUEST ENGINE

Create a dedicated transfer compliance/document requirement model.

Possible entity:

transfer_requirements.

Fields conceptually:

id

transfer_id

requirement_type

title

description

required

status

requested_at

submitted_at

reviewed_at

expires_at nullable.

---

# 29. REQUIREMENT TYPES

Support configurable categories such as:

IDENTITY_DOCUMENT

SOURCE_OF_FUNDS

INVOICE

CONTRACT

PROOF_OF_PAYMENT_PURPOSE

PROOF_OF_ADDRESS

OTHER_SUPPORTING_DOCUMENT.

Do not require all of them for every transaction.

---

# 30. DOCUMENT REQUEST MUST BE JUSTIFIED

Documents must be requested only when an actual configured workflow requires them.

Do not artificially block every external transfer merely to create the 99% experience.

---

# 31. CUSTOMER-FACING DOCUMENT REQUEST

Example:

Additional document required

To continue this transfer, please provide:

Proof of source of funds

Status:

Required.

CTA:

Upload document.

---

# 32. TRANSFER DOCUMENT STORAGE

Use secure private storage.

Transfer compliance documents must not use public URLs.

Access must be authorization-controlled.

---

# 33. TRANSFER DOCUMENT ENTITY

Conceptual:

transfer_documents

fields:

id

transfer_id

requirement_id

document_type

storage_reference

status

uploaded_at

reviewed_at

rejection_reason_code nullable.

---

# 34. DOCUMENT STATUSES

Use:

UPLOADED

UNDER_REVIEW

ACCEPTED

REJECTED

REPLACEMENT_REQUIRED.

Map them to customer-friendly language.

---

# 35. DOCUMENT SUBMISSION

Customer can submit only documents requested for a transfer they own.

Customer cannot modify:

review status;

approval status;

compliance result.

---

# 36. DOCUMENT ACCEPTANCE

Only trusted staff/system workflow may mark:

ACCEPTED.

Customer cannot self-approve.

---

# 37. DOCUMENT REJECTION

If rejected:

show a customer-safe reason.

Examples:

Document unreadable

Document expired

Wrong document type.

Do not expose internal investigation notes.

---

# 38. REPLACEMENT

Allow customer to upload a replacement when policy permits.

Keep historical review trace.

Do not simply overwrite history.

---

# 39. COMPLIANCE CASE

Create a compliance case linked to applicable EXTERNAL transfers.

Conceptual:

transfer_compliance_cases.

Fields:

transfer_id

status

risk_category if internally required

review_required

documents_required

opened_at

reviewed_at

decision_at.

Do not expose internal risk scores publicly.

---

# 40. COMPLIANCE CASE STATES

Possible:

NOT_REQUIRED

OPEN

CUSTOMER_ACTION_REQUIRED

DOCUMENTS_RECEIVED

UNDER_REVIEW

APPROVED

REJECTED

CLOSED.

---

# 41. INTERNAL TRANSFER COMPLIANCE

Internal transfers may still theoretically be routed into compliance when explicitly required by bank policy.

However:

do not force all internal transfers through 99%.

Default internal path remains:

direct → 100%.

---

# 42. EXTERNAL TRANSFER PRE-COMPLIANCE

Before reserving or committing money, evaluate:

customer eligibility

account status

available balance

destination validity

currency

limit

security confirmation.

Then determine whether compliance review is required.

---

# 43. WHEN TO RESERVE FUNDS

External-transfer fund reservation policy should be server-controlled.

A reasonable design:

once the transfer is confirmed and accepted for processing:

create a hold.

The held amount becomes unavailable for other spending.

Do not debit posted ledger balance yet unless external settlement policy requires it.

---

# 44. EXTERNAL HOLD

While an external transfer is under verification:

ledger/booked balance may remain unchanged

while:

available balance decreases through ACTIVE hold.

This prevents double-spending.

---

# 45. 99% WITH ACTIVE HOLD

If the external transfer reaches 99% but still awaits final settlement:

the hold may remain active according to configured policy.

The UI must clearly explain:

Funds reserved

or equivalent.

Do not leave customers uncertain about why available balance changed.

---

# 46. DOCUMENT DELAY

If documentation is requested:

show:

Action required

Progress: e.g. 75–99%

Required document

Upload action.

Do not show an endless animated progress bar.

---

# 47. CUSTOMER ACTION REQUIRED

Use a dedicated transfer state:

CUSTOMER_ACTION_REQUIRED

or DOCUMENT_REQUIRED.

This state must be visually distinct.

---

# 48. ADMIN REVIEW HANDOFF

Prepare the workflow so a future admin/compliance user can:

review transfer;

review documents;

request replacement;

approve;

reject;

block.

The complete admin UI will be implemented later.

Do not expose these actions to customers.

---

# 49. EXTERNAL TRANSFER APPROVAL

After compliance approval:

transition to:

APPROVED

then:

SETTLEMENT_PENDING

if external execution is required.

Do not mark 100% merely because compliance approved the documents.

---

# 50. SETTLEMENT PENDING

At:

SETTLEMENT_PENDING

progress may be:

99%.

Meaning:

all internal requirements are satisfied;

external completion is not yet confirmed.

---

# 51. EXTERNAL SETTLEMENT ADAPTER

Create an interface boundary for external settlement.

Conceptually:

ExternalTransferProvider

methods such as:

submitTransfer()

getTransferStatus()

cancelTransfer() where supported.

Do not hardcode provider-specific logic into customer UI.

---

# 52. PROVIDER ABSTRACTION

Potential future providers may differ.

Keep:

transfer domain

separate from:

provider adapter.

Architecture:

Transfer Service

→ External Settlement Port

→ Provider Adapter.

Keep it simple.

Do not create microservices.

---

# 53. EXTERNAL PROVIDER REFERENCE

Store provider transaction reference separately.

Never expose it unnecessarily as the main customer reference.

---

# 54. EXTERNAL STATUS MAPPING

Provider states must map into internal canonical states.

Example:

provider pending

→ SETTLEMENT_PENDING

provider succeeded

→ COMPLETED

provider rejected

→ FAILED/REJECTED according to semantics.

Do not leak arbitrary provider statuses directly to customer UI.

---

# 55. COMPLETION CALLBACK / POLLING

Prepare safe settlement-status synchronization.

Depending on provider:

webhook

or controlled status query.

Do not rely on the customer's browser staying open.

---

# 56. EXTERNAL TRANSFER AT 100%

Only once external settlement is authoritatively successful:

finalize financial accounting according to the chosen settlement model

and set:

COMPLETED

progress = 100.

---

# 57. EXTERNAL ACCOUNTING MODEL

External transfers need bank-side balancing accounts.

Conceptually, sender debit must be balanced against an internal:

SETTLEMENT_CLEARING

or configured external-settlement account.

Do NOT create an unbalanced debit just because destination is external.

---

# 58. EXTERNAL POSTING EXAMPLE

Conceptually after successful settlement:

Sender customer deposit liability:

DEBIT 50,000

External settlement/clearing liability or asset account:

corresponding CREDIT/DEBIT according to the chart-of-accounts design.

The final accounting pattern must match the configured bank accounting model.

Do not invent simplistic unbalanced postings.

---

# 59. EXTERNAL MONEY DOES NOT CREDIT AN INTERNAL CUSTOMER

For EXTERNAL_TRANSFER:

do not create a fake recipient internal-bank credit.

The destination is outside the platform.

The accounting counter-entry belongs to a system settlement/clearing account.

---

# 60. INTERNAL MONEY DOES CREDIT THE INTERNAL RECIPIENT

For INTERNAL_TRANSFER:

sender debit

+

recipient credit

happen in the same atomic ledger journal.

This is the key distinction.

---

# 61. INTERNAL TRANSFER PERFORMANCE

Internal transfers should feel near-instant when all validations succeed.

Do not artificially delay them to imitate the external 0→99 journey.

---

# 62. INTERNAL TRANSFER UI

Customer sees:

Transfer created

Processing

Completed — 100%.

Use a short clean animation based on real server response.

---

# 63. EXTERNAL TRANSFER UI

Customer sees:

progress card

current stage

requirements

documents

status timeline

estimated next step only if reliable.

Do not promise completion times without evidence.

---

# 64. EXTERNAL TRANSFER DETAIL

Display:

Amount

Destination

Bank

Transfer reference

Progress

Current stage

Action required if any

Submitted documents

Timeline

Current funds state

Support action.

---

# 65. PROGRESS BAR

Reuse PROMPT 01 Progress component.

Must support:

0–100

current label

milestones

action-required state

review state

completed state.

---

# 66. PROGRESS COLOR

Use semantic visual treatment.

Do not treat 99% as success color if not completed.

99% may remain:

processing/warning

depending on state.

100% completed uses success state.

---

# 67. 99% CUSTOMER MESSAGE

Example:

99% — Final confirmation pending

Everything required from you has been completed. We're waiting for final transfer confirmation.

Only show this when true.

---

# 68. DOCUMENT REQUIRED AT 99%

If 99% specifically requires a document:

display:

99% — Action required

Upload the requested document to continue.

The user must understand why the transfer is not 100%.

---

# 69. TRANSFER BLOCKING

Prepare a state:

BLOCKED.

A blocked transfer cannot continue until released or resolved by trusted administrative/compliance workflow.

Do not automatically equate BLOCKED with FAILED.

---

# 70. BLOCKED FUNDS

Whether a blocked external transfer keeps its hold depends on bank policy.

Make this server-configurable.

Do not decide via frontend.

---

# 71. REJECTED EXTERNAL TRANSFER

If rejected before financial settlement:

release active hold.

Set appropriate terminal state.

No external money should be considered sent.

---

# 72. FAILED EXTERNAL SETTLEMENT

If provider confirms failure:

release/resolve hold according to posting state.

Do not mark 100%.

Display clear customer-safe failure.

---

# 73. UNCERTAIN EXTERNAL STATE

If provider result is temporarily unknown:

keep:

SETTLEMENT_PENDING

or equivalent.

Do not automatically fail or complete.

---

# 74. RETRIES

Provider retries must be idempotent.

Do not send external money twice because status callback was delayed.

---

# 75. EXTERNAL IDEMPOTENCY

Use stable internal transfer reference and provider idempotency capabilities where available.

The same external transfer must not be submitted twice accidentally.

---

# 76. CANCELLATION

External cancellation depends on current state/provider capability.

Allowed before submission where possible.

After settlement submission:

do not promise cancellation unless provider supports it.

---

# 77. COMPLETED EXTERNAL TRANSFER

A completed transfer cannot simply be edited or cancelled.

Use future return/reversal workflows where applicable.

---

# 78. INTERNAL TRANSFER CANCELLATION

Before ledger posting:

may be cancelled according to PROMPT 07 rules.

After completion:

not cancellable.

Requires reversal workflow.

---

# 79. STATUS HISTORY

Every transfer status transition must create history.

Store:

from

to

actor

reason

time.

Do not overwrite without trace.

---

# 80. PROGRESS HISTORY

Where useful, record milestone timestamps.

Example:

validated_at

security_confirmed_at

documents_requested_at

approved_at

settlement_submitted_at

completed_at.

Do not store every UI animation frame.

---

# 81. ACTION REQUIRED CENTER

Integrate external transfer tasks into the dashboard Action Required area.

Example:

Transfer TRF-... needs a document.

CTA:

Continue verification.

---

# 82. NOTIFICATION EVENTS

Prepare events for PROMPT 10:

transfer_document_required

transfer_document_accepted

transfer_document_rejected

transfer_approved

transfer_settlement_pending

transfer_completed

transfer_failed

transfer_blocked.

Do not implement full delivery yet.

---

# 83. SECURE MESSAGING READINESS

Transfer detail should be able to open a future support conversation associated with:

transfer_ref.

PROMPT 10 handles messaging.

---

# 84. TRANSFER LIST

Show internal and external transfers together where appropriate.

Provide visible transfer type only when useful.

Examples:

Internal transfer

External transfer.

Do not confuse users with technical language.

Possible customer wording:

To another customer

To another bank.

---

# 85. FILTERS

Transfer list may filter:

All

Internal

External

Completed

Pending

Action required

Failed.

---

# 86. CUSTOMER-SAFE TERMINOLOGY

Use understandable terms:

Internal transfer

External transfer

or:

Transfer within our bank

Transfer to another bank.

Avoid developer terminology in visible UI.

---

# 87. INTERNAL TRANSFER SUCCESS CARD

Show:

Completed — 100%

Recipient credited

Amount

Reference.

Do not show compliance-document UI when none exists.

---

# 88. EXTERNAL TRANSFER PROGRESS CARD

Show:

Progress percentage

Current stage

Next required action

Document count

Status

Last update.

---

# 89. MOBILE UX

On mobile:

progress must remain readable;

document requests must be immediately actionable;

timeline should stack vertically;

sticky CTA may be used for:

Upload document

Review request

Continue.

Respect safe areas.

---

# 90. DESKTOP UX

Desktop may use:

main progress panel

+

right contextual summary.

Do not make it look like an administrator workflow.

---

# 91. ACCESSIBILITY

Progress must have accessible semantics.

Screen reader example:

Transfer progress, 80 percent, document review in progress.

Do not communicate progress only visually.

---

# 92. ACTION-REQUIRED ANNOUNCEMENT

Screen readers should clearly announce:

Action required

and the requested document.

---

# 93. DOCUMENT UPLOAD ACCESSIBILITY

Drag-and-drop cannot be the only method.

Provide accessible file picker.

---

# 94. SECURITY

Customer cannot:

change transfer type;

change progress;

approve own compliance case;

accept own document;

mark settlement complete;

set transfer to 100%;

release BLOCKED transfer;

override external-provider result.

---

# 95. RLS

Customers may read only:

their transfers;

their transfer requirements;

their submitted transfer documents.

They cannot read another customer's compliance case.

---

# 96. ADMIN BOUNDARY

Staff/compliance write access must be separate.

Do not give ordinary authenticated-user policies broad transfer-management permissions.

---

# 97. DOCUMENT SECURITY

Private bucket only.

Signed/authorized short-lived access where needed.

No public permanent document URL.

---

# 98. AUDIT

Record:

requirement created

document uploaded

document reviewed

transfer approved

transfer rejected

transfer blocked

transfer released

settlement submitted

settlement completed.

---

# 99. INTERNAL TRANSFER TEST

A sends 25,000 XAF to B inside same bank.

Expected:

INTERNAL_TRANSFER

No external compliance path by default

Atomic ledger posting

A -25,000

B +25,000

progress 100

status COMPLETED.

---

# 100. INTERNAL DOUBLE-TAP TEST

Confirm twice.

Expected:

one posting only

one debit

one credit

100%.

---

# 101. EXTERNAL TRANSFER TEST

A sends 50,000 XAF to a supported external account.

Expected:

EXTERNAL_TRANSFER

Validation

Hold created

Compliance workflow

Progress evolves based on real states

May stop before 100

External settlement required

100 only after confirmed success.

---

# 102. EXTERNAL DOCUMENT TEST

Transfer requires proof of funds.

Expected:

DOCUMENT_REQUIRED

progress remains below 100

customer uploads file

UNDER_REVIEW

staff/system accepts

APPROVED

SETTLEMENT_PENDING

99%

provider confirms success

100%.

---

# 103. REJECTED DOCUMENT TEST

Document rejected.

Expected:

REPLACEMENT_REQUIRED

progress not 100

customer can replace if permitted.

---

# 104. BLOCKED TRANSFER TEST

Staff/system blocks external transfer.

Expected:

BLOCKED

progress frozen at appropriate trusted value

no 100%

customer sees safe explanation.

---

# 105. EXTERNAL SETTLEMENT FAILURE TEST

Provider returns failed.

Expected:

not 100

hold resolved according to posting state

safe FAILED state

no false completion.

---

# 106. PROVIDER TIMEOUT TEST

Provider status unavailable.

Expected:

SETTLEMENT_PENDING

not FAILED automatically

not COMPLETED.

---

# 107. INTERNAL/EXTERNAL ROUTING TAMPER TEST

Client sends:

transfer_type = INTERNAL

for external destination.

Expected:

server ignores/rejects client classification

routes according to trusted destination resolution.

---

# 108. LEDGER INTEGRITY TEST

For internal transfer:

sender debit == recipient credit.

For external:

posting must remain balanced with configured settlement account.

No unbalanced journal.

---

# 109. HOLD CONSISTENCY TEST

At 99% external pending:

hold state and available balance must be consistent.

At final completion:

hold must not double-reduce balance.

---

# 110. ZERO VS 100 RULE

Do not confuse:

progress 100

with:

simply reaching end of animation.

100 requires actual authoritative completion.

---

# 111. CURRENT IMPLEMENTATION SCOPE

Implement:

1. Transfer-type classification.
2. Internal vs external routing.
3. Internal transfer direct-to-100 flow.
4. External transfer 0→99→100 model.
5. Progress state machine.
6. Progress mapper.
7. Compliance-case foundation.
8. Transfer-requirement engine.
9. Secure document requests.
10. Transfer-document upload.
11. Document review states.
12. Action-required flow.
13. External beneficiary extension.
14. External transfer data model.
15. External settlement provider interface.
16. Settlement-pending state.
17. External provider reference handling.
18. Completion confirmation.
19. Hold integration.
20. Ledger integration.
21. External settlement accounting boundary.
22. Blocked/rejected states.
23. Status/progress history.
24. Dashboard Action Required integration.
25. Transfer-list filters.
26. Mobile progress UX.
27. Accessibility.
28. RLS/security.
29. Integrity tests.
30. Idempotency tests.

---

# 112. DO NOT IMPLEMENT YET

Do NOT fully implement:

admin compliance dashboard;

admin customer management;

admin transfer blocking controls;

admin transfer approval UI;

statement PDF generation;

secure customer messaging;

notification delivery;

full customer security center;

admin account credit/debit workflows.

These come later.

---

# 113. PRESERVE PROMPT 07

Keep beneficiary and internal-transfer architecture.

Extend it.

Do not replace it.

---

# 114. PRESERVE PROMPT 06

Ledger remains the financial source of truth.

No direct balance mutation.

---

# 115. PRESERVE PROMPT 05

Balances remain projections.

Dashboard reflects authoritative state.

---

# 116. PRESERVE PROMPT 04

Keep customer app navigation and layouts.

---

# 117. PRESERVE PROMPT 03

Authentication, lifecycle and onboarding remain authoritative.

---

# 118. PRESERVE PROMPT 02

Public website remains intact.

---

# 119. PRESERVE PROMPT 01

Reuse:

Progress

Stepper

StatusBadge

Alert

BottomSheet

Document upload patterns

Money display.

---

# 120. PRESERVE PROMPT 00

Maintain:

simple modular architecture;

online-only operation;

server authority;

Supabase security.

---

# 121. FINAL BUSINESS RULE REVIEW

Explicitly confirm:

INTERNAL TRANSFER:

same-bank destination

→ ledger sender debit

→ ledger recipient credit

→ both balance projections updated

→ COMPLETED

→ 100%.

EXTERNAL TRANSFER:

outside-platform destination

→ external workflow

→ validation

→ compliance if required

→ documents if required

→ settlement pending

→ maximum 99% until authoritative completion

→ 100% only after confirmed external settlement.

---

# 122. FINAL SECURITY REVIEW

Explicitly confirm:

customer cannot select trusted transfer type manually;

customer cannot set progress;

customer cannot approve their own documents;

customer cannot set 100%;

customer cannot forge provider success;

customer cannot bypass hold;

customer cannot directly alter ledger;

customer cannot alter balances.

---

# 123. FINAL REPORT

At completion provide:

TRANSFER ROUTING ARCHITECTURE

INTERNAL TRANSFER FLOW

EXTERNAL TRANSFER FLOW

TRANSFER TYPE CLASSIFICATION

PROGRESS ENGINE

0→99→100 MAPPING

COMPLIANCE CASE MODEL

REQUIREMENT MODEL

DOCUMENT MODEL

DOCUMENT SECURITY

ACTION REQUIRED WORKFLOW

HOLD BEHAVIOR

INTERNAL LEDGER POSTING

EXTERNAL LEDGER / CLEARING BOUNDARY

SETTLEMENT PROVIDER INTERFACE

SETTLEMENT STATUS MAPPING

BLOCKED / REJECTED STATES

TRANSFER STATUS HISTORY

DASHBOARD INTEGRATION

MOBILE UX

ACCESSIBILITY

RLS

SECURITY TESTS

FINANCIAL INTEGRITY TESTS

FILES CREATED

FILES MODIFIED

DATABASE CHANGES

SERVER FUNCTIONS

DEPENDENCIES ADDED

KNOWN TODOs

Also explicitly confirm:

- project builds successfully;
- TypeScript passes;
- internal transfers reach 100% only after successful ledger posting;
- internal recipient account is actually credited through the ledger;
- sender balance is reduced through authoritative accounting;
- external transfers do not falsely credit an internal recipient;
- external transfers can stop below 100%;
- external transfers use 99% as final-pending state;
- documents are requested only when required;
- 100% is impossible without authoritative completion;
- no fake external settlement is presented as real;
- no direct customer balance mutation exists;
- no offline-first architecture was introduced;
- PROMPT 00–07 remain intact.

Stop after completing transfer routing, compliance progression and external-transfer verification.

The next phase is:

PROMPT 09 — STATEMENTS, PDF DOCUMENTS, PRINTING & CUSTOMER DOCUMENT CENTER.