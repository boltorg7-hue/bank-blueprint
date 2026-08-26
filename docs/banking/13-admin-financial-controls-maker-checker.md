# PROMPT 13 — ADMIN FINANCIAL CONTROLS, ACCOUNT CREDIT/DEBIT, MANUAL ADJUSTMENTS, REVERSALS & FOUR-EYES APPROVAL

Continue from PROMPT 00 through PROMPT 12.

Do NOT rebuild the architecture.

Do NOT replace the ledger.

Do NOT introduce any direct balance-editing mechanism.

Do NOT allow staff to bypass double-entry accounting.

Do NOT weaken RBAC, RLS, audit logging, idempotency, transfer integrity or customer-security rules.

Do NOT introduce offline-first behavior.

This phase implements the most sensitive ADMINISTRATIVE FINANCIAL CONTROL LAYER of the banking platform.

The objective is to allow properly authorized staff to perform controlled financial operations such as:

- crediting a customer account;
- debiting a customer account;
- manual financial adjustments;
- correcting operational errors;
- controlled reversals;
- releasing or correcting holds;
- approving high-risk financial actions;
- maker-checker / four-eyes approval;
- financial-operation queues;
- dual authorization;
- strict auditability;
- reconciliation;
- financial command idempotency;
- concurrency protection;
- customer notification after authoritative posting.

The critical rule is:

ADMINISTRATORS MUST NEVER EDIT A BALANCE DIRECTLY.

Every change in customer funds must be explained by an auditable, balanced ledger transaction.

---

# 1. ABSOLUTE FINANCIAL CONTROL RULE

Never implement:

```ts id="c7q1l0"
account.balance = newBalance
```

Never implement:

```sql id="6uxxp9"
UPDATE account_balances
SET available_balance = ...
```

as an administrative financial action.

Instead:

ADMIN FINANCIAL COMMAND

→ PERMISSION CHECK

→ MAKER-CHECKER POLICY

→ APPROVAL

→ LEDGER POSTING

→ BALANCE PROJECTION UPDATE

→ AUDIT EVENT

→ CUSTOMER NOTIFICATION.

---

# 2. ADMIN FINANCIAL MODULE

Create or complete:

```text id="9np4hi"
src/features/admin/finance/
```

Possible structure:

```text id="9uovt4"
finance/
├── components/
├── services/
├── schemas/
├── types/
├── pages/
├── server/
└── utils/
```

Do not place financial command logic inside generic admin tables.

---

# 3. FINANCIAL ADMIN ROUTES

Recommended:

```text id="trht36"
/admin/finance
```

```text id="2ku266"
/admin/finance/adjustments
```

```text id="f89i2c"
/admin/finance/adjustments/new
```

```text id="wfj6fr"
/admin/finance/adjustments/:adjustmentRef
```

```text id="wspfcb"
/admin/finance/approvals
```

```text id="fr8h1r"
/admin/finance/reversals
```

```text id="sa3lmj"
/admin/finance/reconciliation
```

Adapt to the existing admin route structure.

---

# 4. FINANCIAL PERMISSIONS

Add or refine granular permissions:

```text id="ns292h"
finance.adjustment.create

finance.adjustment.read

finance.adjustment.approve

finance.adjustment.reject

finance.credit.create

finance.debit.create

finance.reversal.request

finance.reversal.approve

finance.hold.read

finance.hold.release

finance.reconciliation.read

ledger.read

audit.read
```

Do NOT grant all permissions automatically to ADMINISTRATOR.

---

# 5. ROLE RECOMMENDATION

Recommended allocation:

FINANCE_OPERATOR

may:

create adjustments;

prepare credits/debits;

review account financial history.

SUPERVISOR

may:

approve/reject sensitive operations.

AUDITOR

may:

read financial history and audit.

ADMINISTRATOR

may:

manage operational access

but must not automatically bypass four-eyes financial control.

SUPER_ADMINISTRATOR

still must not directly rewrite posted ledger history.

---

# 6. FOUR-EYES PRINCIPLE

For sensitive financial actions:

the person who initiates the operation must not approve the same operation.

This is:

MAKER

+

CHECKER.

Enforce server-side.

---

# 7. MAKER

The MAKER:

creates the financial request.

Example:

Finance Operator requests:

Credit customer account by 250,000 XAF.

The maker does NOT directly cause financial posting when four-eyes is required.

---

# 8. CHECKER

The CHECKER:

reviews:

customer;

account;

amount;

currency;

reason;

supporting evidence;

financial impact.

Then:

APPROVE

or:

REJECT.

---

# 9. SELF-APPROVAL BLOCK

If:

requested_by == approved_by

reject.

Do not allow self-approval through:

API manipulation;

role escalation;

UI bypass.

---

# 10. APPROVAL REQUEST ENTITY

Create a generic controlled financial approval model.

Conceptual:

```text id="i8jvti"
id

public_reference

operation_type

resource_type

resource_reference

requested_by

status

reason_code

justification

requested_at

reviewed_by nullable

reviewed_at nullable

decision_reason nullable

expires_at nullable
```

---

# 11. APPROVAL STATUS

Use:

```text id="buzd77"
DRAFT

PENDING_APPROVAL

APPROVED

REJECTED

CANCELLED

EXPIRED

EXECUTING

COMPLETED

FAILED
```

Do not set COMPLETED before ledger posting succeeds.

---

# 12. FINANCIAL ADJUSTMENT ENTITY

Create:

```text id="stlmtp"
financial_adjustments
```

Conceptual fields:

```text id="eap3jo"
id

public_reference

customer_id

account_id

adjustment_type

amount_minor

currency

reason_code

justification

status

maker_id

checker_id nullable

ledger_transaction_id nullable

created_at

approved_at nullable

executed_at nullable

rejected_at nullable
```

---

# 13. ADJUSTMENT TYPES

Support explicit types:

```text id="wp31bq"
CREDIT_ADJUSTMENT

DEBIT_ADJUSTMENT

CORRECTION

FEE_CORRECTION

REFUND_ADJUSTMENT

OPENING_CORRECTION
```

Only implement types actually needed.

Do not add arbitrary generic mutations.

---

# 14. CREDIT ACCOUNT

The original bank requirement includes:

Admin can credit funds to a customer's account.

Implement this as:

CONTROLLED CREDIT ADJUSTMENT.

Not:

balance += amount.

---

# 15. CREDIT ACCOUNTING

For a customer deposit liability account:

crediting customer balance means increasing the bank liability.

Conceptually:

Customer deposit liability:

CREDIT amount

Counterparty system account:

DEBIT amount.

The exact counterparty account depends on the adjustment reason.

---

# 16. CREDIT COUNTERPARTY

Use configured system ledger accounts.

Examples conceptually:

CASH_SETTLEMENT

ADJUSTMENT_CLEARING

CUSTOMER_REFUND_CLEARING

Do NOT use an unexplained generic counter-account for every financial action if business meaning differs.

---

# 17. CREDIT MUST BALANCE

Example:

Credit customer 100,000 XAF.

Journal:

Adjustment Clearing Asset/Expense/etc:

DEBIT 100,000

Customer Deposit Liability:

CREDIT 100,000.

Exact chart classification depends on the configured accounting model.

Do not post an isolated CREDIT.

---

# 18. DEBIT ACCOUNT

Admin can debit a customer account only through:

CONTROLLED DEBIT ADJUSTMENT.

This may be needed for:

correction;

fee correction;

operational recovery;

reversal-related action.

Do not implement arbitrary punitive debits.

---

# 19. DEBIT ACCOUNTING

For customer deposit liability:

decreasing customer balance means:

DEBIT customer deposit liability.

Balanced against an appropriate system ledger account:

CREDIT counterparty.

---

# 20. DEBIT AVAILABLE BALANCE CHECK

Before a manual debit:

validate whether sufficient available funds are required.

Policy may differ for:

correction

vs

authorized overdraft/recovery.

Do not automatically permit negative balance.

---

# 21. NEGATIVE BALANCE POLICY

Make negative-balance allowance explicit and configurable.

Default:

manual debit must not create unauthorized negative available balance.

If a special account product permits overdraft:

server-side product policy decides.

---

# 22. ADMIN CREDIT FLOW

Recommended:

1. Search/select customer
2. Select eligible account
3. Choose Credit
4. Enter amount
5. Select reason
6. Add justification
7. Review financial impact
8. Submit for approval
9. Checker reviews
10. Approve
11. Ledger posts
12. Balance updates
13. Customer notified.

---

# 23. ADMIN DEBIT FLOW

Same pattern:

1. Select account
2. Choose Debit
3. Enter amount
4. Select reason
5. Review available balance
6. Submit
7. Approval
8. Ledger posting
9. Projection refresh
10. Notification.

---

# 24. NO DIRECT EXECUTE BUTTON FOR MAKER

Where four-eyes is required:

maker sees:

Submit for approval

not:

Credit account now.

---

# 25. PREVIEW FINANCIAL IMPACT

Before submission show:

Current available balance

Adjustment amount

Expected resulting balance

Currency

Reason.

This is a preview only.

Server recalculates everything during execution.

---

# 26. PREVIEW IS NOT AUTHORITY

Do not execute based on client-sent:

expectedBalance.

Server reads fresh account state.

---

# 27. CREDIT REASON CODES

Potential controlled categories:

CUSTOMER_REFUND

ACCOUNT_CORRECTION

OPERATIONAL_CORRECTION

PROMOTIONAL_CREDIT only if legitimate

SETTLEMENT_CORRECTION

OTHER_APPROVED.

Do not allow blank reason.

---

# 28. DEBIT REASON CODES

Potential:

ACCOUNT_CORRECTION

DUPLICATE_CREDIT_CORRECTION

FEE_CORRECTION

SETTLEMENT_CORRECTION

OTHER_APPROVED.

Do not use vague:

ADMIN_DEBIT.

---

# 29. FREE-TEXT JUSTIFICATION

Require meaningful internal explanation.

Use maximum length.

Sanitize.

Never expose internal justification automatically to customer.

---

# 30. CUSTOMER-FACING DESCRIPTION

Generate a separate safe description.

Examples:

Account adjustment

Refund

Correction.

Do not expose internal compliance or staff commentary.

---

# 31. SUPPORTING EVIDENCE

Prepare optional secure supporting-document attachment for sensitive adjustments.

Examples:

case reference

settlement proof

supporting internal document.

Do not force documents for every small operation unless policy requires it.

---

# 32. EVIDENCE STORAGE

Use private storage.

Access restricted to authorized finance/audit roles.

---

# 33. APPROVAL QUEUE

Implement:

```text id="91787b"
/admin/finance/approvals
```

Show pending actions requiring the current staff member's permission.

---

# 34. APPROVAL QUEUE FIELDS

Display:

operation type

customer

account

amount

currency

maker

reason

created time

risk/approval status if appropriate.

Do not overload with raw ledger data.

---

# 35. APPROVAL DETAIL

Checker must see enough information to make an informed decision.

Sections:

Customer

Account

Current balances

Adjustment

Reason

Justification

Related operation

Supporting evidence

Maker identity

Audit history.

---

# 36. APPROVAL CONFIRMATION

Approval must require deliberate action.

CTA:

Approve credit of 250,000 XAF

rather than:

Approve.

---

# 37. REJECTION

Checker may reject.

Require:

reason code

optional explanatory note.

Rejected action must never post ledger entries.

---

# 38. REJECTED REQUEST

Status:

REJECTED.

No balance change.

No ledger transaction.

Preserve history.

---

# 39. MAKER CANCELLATION

Maker may cancel a request before approval where policy permits.

After approval/execution starts:

no cancellation.

---

# 40. APPROVAL EXPIRATION

Prepare optional expiration for stale requests.

Do not leave sensitive financial approvals pending forever.

Make policy configurable.

---

# 41. STALE BALANCE REVALIDATION

Checker may approve based on a view that is minutes old.

At execution:

revalidate account state.

Do not trust the previously rendered balance.

---

# 42. EXECUTION AFTER APPROVAL

Approval must trigger or authorize a narrow server-side financial command.

Conceptually:

executeApprovedAdjustment(adjustmentRef)

It must verify:

APPROVED

correct checker

not already executed

account still valid

currency valid

business constraints

idempotency.

---

# 43. EXECUTION IDEMPOTENCY

Repeated execution attempts must return same financial outcome.

Never double-credit because:

response timed out;

staff refreshed;

button was pressed twice.

---

# 44. ADJUSTMENT IDEMPOTENCY KEY

Tie to:

financial_adjustment.id/reference.

Exactly one primary ledger posting per completed adjustment.

---

# 45. UNIQUE LEDGER LINK

Enforce appropriate uniqueness:

one completed adjustment

→ one primary ledger transaction.

---

# 46. ADJUSTMENT LEDGER SOURCE

Ledger posting:

```text id="m9g9n0"
source_type = ADMIN_FINANCIAL_ADJUSTMENT
```

```text id="2sthl9"
source_reference = adjustmentRef
```

---

# 47. POSTING ATOMICITY

Inside one controlled financial transaction:

validate

→ ledger journal

→ entries

→ balance projection

→ adjustment COMPLETED

→ audit/outbox event.

If failure:

rollback.

---

# 48. NO PARTIAL ADMIN CREDIT

Never allow:

customer balance updated

but adjustment status FAILED.

Financial state must remain atomic.

---

# 49. CREDIT COMPLETION

Only after ledger posting succeeds:

status = COMPLETED.

Customer balance becomes updated through projection.

---

# 50. CUSTOMER NOTIFICATION

After completed credit:

create domain event.

Possible customer notification:

Your account was credited.

Amount details may be shown inside authenticated app according to notification privacy policy.

---

# 51. DEBIT NOTIFICATION

For administrative debit:

notify customer when policy requires.

Customer-facing wording must be clear and safe.

Provide:

View transaction

Contact bank

where appropriate.

---

# 52. ACTIVITY INTEGRATION

Admin adjustments must appear in customer transaction/activity history.

Examples:

Account adjustment

Refund

Correction.

They must come from authoritative ledger posting.

---

# 53. STATEMENT INTEGRATION

Completed adjustments must appear appropriately in future statements.

Do not hide financial movements from statements merely because they were administrative.

---

# 54. RECEIPT READINESS

Where relevant, transaction detail may later provide supporting receipt/document.

Do not invent official adjustment receipt unless product policy requires it.

---

# 55. REVERSAL VS ADJUSTMENT

Keep distinction:

REVERSAL

undoes a specific prior posted ledger transaction.

ADJUSTMENT

creates a new correction not necessarily equal/opposite to one original journal.

---

# 56. CONTROLLED REVERSAL

Implement admin reversal REQUEST workflow.

Do NOT expose raw:

reverseLedgerTransaction()

directly to browser.

---

# 57. REVERSAL REQUEST ENTITY

Conceptual fields:

```text id="paxgci"
id

public_reference

original_transaction_id

original_public_reference

reason_code

justification

requested_by

approved_by nullable

status

reversal_ledger_transaction_id nullable

created_at

completed_at nullable
```

---

# 58. REVERSAL ELIGIBILITY

Only eligible posted transactions may be reversed.

Validate:

original exists;

posted;

not already fully reversed;

allowed operation type;

staff permission;

business policy.

---

# 59. CUSTOMER TRANSFER REVERSAL

Do not allow arbitrary reversal of customer transfer merely because staff wants to.

Different transfer states and external settlement may require specialized workflows.

---

# 60. INTERNAL TRANSFER REVERSAL

For a completed same-bank transfer:

a privileged reversal may conceptually create the opposite journal.

Original:

Sender DEBIT

Recipient CREDIT.

Reversal:

Sender CREDIT

Recipient DEBIT.

But only if business/legal policy permits and funds handling is valid.

---

# 61. RECIPIENT FUNDS AVAILABILITY

Before reversing an internal transfer:

consider whether recipient funds remain available.

Do not casually create unauthorized negative balances.

If reversal cannot safely debit recipient:

route to controlled exception workflow.

---

# 62. EXTERNAL TRANSFER REVERSAL

Do NOT treat external completed transfer like internal reversible journal only.

If funds left the bank:

external return/recall/provider workflow may be required.

Do not mark external money returned without authoritative settlement.

---

# 63. EXTERNAL REVERSAL SAFETY

For external transfer:

internal ledger reversal is NOT proof that external recipient returned funds.

Keep accounting and settlement truth aligned.

---

# 64. REVERSAL APPROVAL

Require four-eyes for financial reversals by default.

Maker cannot checker self-approve.

---

# 65. REVERSAL EXECUTION

Use PROMPT 06 immutable reversal engine.

Never edit original entries.

---

# 66. REVERSAL HISTORY

Original transaction remains.

Reversal transaction remains.

Customer-safe activity may show:

Reversed

and linked corrective movement.

---

# 67. REVERSAL CUSTOMER NOTIFICATION

Notify affected customers as required.

For same-bank transfer reversal:

both sender and recipient may need notification.

---

# 68. REVERSAL AUDIT

Record:

reason

maker

checker

original transaction

reversal transaction

time

result.

---

# 69. HOLD MANAGEMENT

Provide authorized read-only visibility of account holds.

Do not allow generic unrestricted mutation.

---

# 70. HOLD RELEASE

Implement controlled hold-release action for legitimate operational cases.

Permission:

finance.hold.release

or equivalent.

---

# 71. HOLD RELEASE VALIDATION

Before release verify:

hold exists;

ACTIVE;

source operation permits release;

not already captured;

not required by active transfer/compliance workflow.

---

# 72. HOLD RELEASE REASON

Require structured reason.

---

# 73. HOLD RELEASE AUDIT

Record:

hold

account

amount

source

staff actor

reason

time.

---

# 74. HOLD RELEASE CUSTOMER IMPACT

Releasing a hold increases available balance but does not create arbitrary posted money.

Do not create fake credit transaction solely because a hold was released.

---

# 75. HOLD CAPTURE

Do not expose generic manual capture unless operationally required and strongly controlled.

Transfer engine remains primary owner of transfer-hold capture.

---

# 76. TRANSFER BLOCK INTEGRATION

PROMPT 12 prepared block/release.

If a blocked transfer retains a hold:

finance/compliance policy controls it.

Do not allow Finance Operator to release a hold while transfer state still requires reservation unless workflow permits it.

---

# 77. EXTERNAL 99% FUNDS

Admin financial controls must respect external transfer state.

A 99% transfer may still have funds reserved.

Do not manually credit funds back without resolving transfer/hold state properly.

---

# 78. MANUAL TRANSFER COMPLETION

Do NOT create a generic admin action:

Set transfer to 100%.

Completion must come from the correct authoritative transfer/settlement command.

---

# 79. EXTERNAL SETTLEMENT OVERRIDE

If a manual settlement confirmation workflow is ever required:

it must be a specialized, permissioned, audited command with evidence.

Do not implement free-form provider-success override in this prompt unless the project explicitly has no external provider and uses a controlled manual operational settlement model.

---

# 80. FINANCIAL CASE LINKING

Adjustments should optionally link to:

support case

transaction

transfer

compliance case

external settlement reference.

This improves traceability.

---

# 81. FINANCIAL OPERATION REFERENCE

Generate:

```text id="0hq15s"
ADJ-2026-00001284
```

for adjustments.

For reversals:

```text id="bt08tm"
REV-2026-00000420
```

or equivalent.

Server-generated.

---

# 82. FINANCIAL OPERATION SEARCH

Admin search may find:

adjustment reference

reversal reference

ledger transaction reference

customer/account reference.

Use permission-aware results.

---

# 83. FINANCIAL OPERATIONS PAGE

`/admin/finance`

may show:

Pending approvals

Recently completed adjustments

Recent reversals

Accounts with active holds

Integrity alerts.

Do not build speculative metrics.

---

# 84. FINANCIAL STATUS LABELS

Use:

Pending approval

Approved

Executing

Completed

Rejected

Failed

Cancelled.

Do not expose raw internal database codes unnecessarily.

---

# 85. CUSTOMER ACCOUNT VIEW INTEGRATION

On admin account detail:

add controlled actions only when permitted:

Request credit adjustment

Request debit adjustment

View holds

View ledger history.

Do not add editable balance inputs.

---

# 86. CUSTOMER DETAIL INTEGRATION

Customer admin workspace may show:

Recent adjustments

Pending financial requests

Recent reversals.

---

# 87. TRANSACTION ADMIN DETAIL

If a transaction is reversible:

show:

Request reversal

only when:

permission

eligibility

business policy

allow it.

---

# 88. CUSTOMER-SAFE LEDGER DESCRIPTION

Financial adjustment transaction should not show:

DEBIT/CREDIT clearing code

to the customer.

Use customer-friendly label.

---

# 89. RAW LEDGER DETAIL

Finance/Auditor roles with `ledger.read` may inspect:

journal entries

ledger accounts

source reference

balance.

Still no direct edit.

---

# 90. READ-ONLY LEDGER VIEW

Create a safe read-only ledger inspection panel.

Possible:

Journal reference

Posted at

Currency

Entries

Account code/name

Debit

Credit

Source operation.

---

# 91. LEDGER BALANCE CHECK

For every admin-created journal:

debits == credits.

Reject anything else.

---

# 92. JOURNAL IMMUTABILITY

Admin cannot edit posted journal after completion.

Even Super Admin cannot use generic CRUD to mutate it.

---

# 93. DATABASE PERMISSIONS

Deny ordinary direct UPDATE/DELETE on posted ledger entries.

Do not rely only on hidden buttons.

---

# 94. FINANCIAL COMMAND SERVER FUNCTIONS

Create narrow commands conceptually:

```text id="5yjve2"
createCreditAdjustmentRequest()

createDebitAdjustmentRequest()

approveFinancialAdjustment()

rejectFinancialAdjustment()

executeApprovedFinancialAdjustment()

requestTransactionReversal()

approveTransactionReversal()

executeApprovedReversal()

releaseFinancialHold()
```

Adapt naming.

---

# 95. NO GENERIC FINANCE RPC

Do not create:

```text id="y0d6v7"
modifyBalance(account, amount)
```

or:

```text id="ypt5ng"
postCustomLedger(entries)
```

available to admin frontend.

---

# 96. APPROVAL SERVICE

Separate:

request

review

execution.

Avoid one command that lets maker create and auto-approve.

---

# 97. HIGH-RISK STEP-UP AUTH

Use PROMPT 11 step-up authentication for sensitive staff actions where supported.

Examples:

approve large adjustment

approve reversal

release high-value hold.

Do not invent thresholds if not configured.

---

# 98. STAFF MFA REQUIREMENT

High-privilege finance roles should support mandatory strong authentication.

Do not execute privileged finance actions from weak/unverified staff session.

---

# 99. APPROVAL ACTION BINDING

Step-up authorization should be bound to:

staff actor

specific operation

expiry

where appropriate.

---

# 100. PERMISSION REVALIDATION

At execution:

re-check staff permission.

Do not assume permissions remain unchanged since page loaded.

---

# 101. STAFF DISABLED MID-APPROVAL

If checker becomes disabled before execution:

do not execute based on stale authorization.

---

# 102. APPROVAL CONCURRENCY

Two supervisors try to approve same request.

Exactly one valid approval transition.

No duplicate financial posting.

---

# 103. APPROVE VS REJECT RACE

Supervisor A approves.

Supervisor B rejects at same time.

One authoritative transition succeeds.

Other receives state-changed response.

---

# 104. EXECUTION FAILURE

If approved adjustment cannot execute due to temporary technical failure:

status:

FAILED

or controlled retry state.

Do not mark COMPLETED.

Do not create duplicate posting on retry.

---

# 105. RETRY APPROVED EXECUTION

Use same idempotency key/reference.

Never create new financial impact for retry.

---

# 106. FAILED AFTER LEDGER COMMIT

If response fails after ledger commit:

recovery must query existing ledger/source link.

Do not repost.

---

# 107. ACCOUNT STATUS VALIDATION

Before execution:

check account is eligible.

Examples:

CLOSED

may reject adjustment except specialized workflows.

FROZEN may still allow certain bank credits according to policy.

Centralize rules.

---

# 108. CUSTOMER STATUS VALIDATION

Account/customer restrictions may affect financial operations.

Do not bypass them silently.

---

# 109. CURRENCY VALIDATION

Adjustment currency must match account currency.

No hidden FX.

---

# 110. AMOUNT VALIDATION

Require:

amount > 0.

Direction comes from adjustment type.

Do not use negative amount to mean debit.

---

# 111. MAXIMUM AUTHORITY

Prepare configurable approval authorities.

Example:

Finance Operator may initiate up to policy-defined amount.

Supervisor approval required.

Additional senior approval may be required for higher amounts.

Do NOT invent actual monetary thresholds.

---

# 112. APPROVAL LEVELS

Architecture may support:

ONE_CHECKER

TWO_CHECKERS

or:

HIGHER_AUTHORITY

later.

Keep V1 manageable.

---

# 113. TWO-CHECKER READINESS

If future high-value adjustment requires two independent approvers:

data model should support multiple approval decisions.

Do not necessarily implement full multi-level hierarchy unless configured now.

---

# 114. APPROVAL POLICY SERVICE

Create centralized:

getApprovalRequirements(operationContext)

or equivalent.

Do not scatter:

if amount > X

across UI.

---

# 115. DEV POLICY

If real policy is not yet defined:

use explicit development configuration.

Do not present arbitrary limits as real banking policy.

---

# 116. RECONCILIATION

Implement read-only financial reconciliation foundation.

Purpose:

compare:

ledger

balance projection

financial operation sources.

---

# 117. RECONCILIATION CHECKS

Potential checks:

ledger balances equal projections;

completed adjustments have ledger posting;

completed transfers have expected ledger link;

reversals link correctly;

active holds reconcile to available balance.

---

# 118. RECONCILIATION PAGE

`/admin/finance/reconciliation`

available only to authorized roles.

Display:

status

account/resource

difference

last checked

action recommendation.

Do not expose automatic dangerous "fix all" buttons.

---

# 119. MISMATCH HANDLING

If projection mismatch found:

flag integrity incident.

Do NOT modify ledger to match projection.

Ledger remains authoritative.

Projection may be rebuilt through controlled process.

---

# 120. REBUILD PROJECTION

If PROMPT 06 provides controlled rebuild function:

allow authorized maintenance execution with audit.

This must not create new money.

It only rebuilds read model from ledger.

---

# 121. PROJECTION REBUILD PERMISSION

Separate permission:

```text id="sh5mkw"
finance.projection.rebuild
```

if implemented.

---

# 122. PROJECTION REBUILD FOUR-EYES

Depending on policy, rebuild may require approval.

At minimum audit strongly.

---

# 123. FINANCIAL INTEGRITY ALERT

If:

ledger != projection

surface prominent internal operational alert.

Do not expose internal technical details to customer.

---

# 124. ADJUSTMENT REPORTING

Admin finance list may show:

credits

debits

corrections

reversals

pending approvals.

Do not call these customer transfers.

---

# 125. DAILY TOTALS

Optional operational summary:

total approved adjustments today

pending approval count.

Do not add totals unless server-backed.

---

# 126. AUDIT LOG INTEGRATION

Every financial request/action must produce audit events.

Examples:

financial_adjustment_created

financial_adjustment_submitted

financial_adjustment_approved

financial_adjustment_rejected

financial_adjustment_executed

reversal_requested

reversal_approved

reversal_executed

hold_released

projection_rebuilt.

---

# 127. AUDIT EVENT DATA

Include:

actor

resource

action

reason code

amount/currency where audit policy allows

result

time.

Do not include auth secrets.

---

# 128. FINANCIAL AUDIT IMMUTABILITY

Audit log must remain immutable to ordinary admins.

---

# 129. MAKER-CHECKER AUDIT

Audit must clearly show:

Maker: Staff A

Checker: Staff B.

---

# 130. CUSTOMER NOTIFICATION EVENT

Notification delivery uses PROMPT 10.

Finance code emits domain event.

Do not call email provider directly.

---

# 131. CUSTOMER MESSAGE INTEGRATION

Where an adjustment requires explanation/support:

customer may contact bank from transaction/account detail.

Do not automatically expose internal notes.

---

# 132. ACCOUNT ACTIVITY DISPLAY

Credit adjustment:

incoming movement.

Debit adjustment:

outgoing movement.

Reversal:

appropriate corrected history.

Use transaction read model.

---

# 133. MONTHLY SUMMARY

Adjustments must correctly influence Money in/Money out according to transaction classification.

Do not classify every credit as salary/income.

Use neutral category.

---

# 134. STATEMENT DESCRIPTION

Statement should show:

Account adjustment

Refund

Correction

with reference.

Avoid technical ledger codes.

---

# 135. CUSTOMER BALANCE REFRESH

After successful financial posting:

invalidate/refetch:

account summary

dashboard

activity

monthly summary

admin account view.

Do not mutate balances independently.

---

# 136. CUSTOMER SESSION REALTIME

If realtime exists:

may refresh balance sooner.

Correctness still relies on authoritative fetch.

---

# 137. OPERATIONAL CONFIRMATION

After successful adjustment in admin:

show:

Adjustment completed

Reference

Amount

Account

Ledger transaction reference for authorized staff.

---

# 138. NO TOAST-ONLY SUCCESS

High-impact finance action should have persistent result state/detail.

---

# 139. FAILED RESULT

Display:

Adjustment not completed.

No financial change was made

only if server can confirm no ledger posting.

If outcome uncertain:

show:

Execution status is being verified.

---

# 140. UNKNOWN FINANCIAL OUTCOME

Never encourage creating a second adjustment when outcome is uncertain.

Resolve by original reference/idempotency state first.

---

# 141. ADMIN MOBILE FINANCE UX

On mobile:

request forms single-column;

amount large/readable;

reason picker touch-friendly;

review screen clear;

approval cards stacked.

Do not require wide accounting tables.

---

# 142. DESKTOP FINANCE UX

Desktop may use:

left request details

right financial impact/approval panel.

Keep critical fields visible.

---

# 143. FINANCE TABLES

Desktop financial operations list columns may include:

Reference

Type

Customer

Account

Amount

Maker

Status

Created

Checker.

---

# 144. AMOUNT ALIGNMENT

Use tabular numerics.

Currency always explicit.

---

# 145. COLOR ACCESSIBILITY

Credit/debit must not rely only on green/red.

Use:

Credit

Debit

+/- where customer-safe

labels/icons.

---

# 146. ACCESSIBILITY

Meet WCAG 2.2 AA.

Verify:

amount inputs

reason controls

approval review

dialogs

tables

status history

evidence upload

focus.

---

# 147. SCREEN READER APPROVAL

Checker should hear:

Credit adjustment, 250,000 XAF, account ending 4821, requested by Staff A, pending approval.

---

# 148. CRITICAL CONFIRMATION DIALOG

For approval:

clearly state irreversible/financial impact.

Do not use generic:

Are you sure?

---

# 149. REJECTION DIALOG

Require reason.

---

# 150. SECURITY TEST — DIRECT BALANCE UPDATE

Attempt to update balance projection directly with finance staff credentials.

Expected:

rejected.

---

# 151. SECURITY TEST — DIRECT LEDGER INSERT

Finance Operator attempts raw ledger journal insert.

Expected:

rejected unless through trusted internal posting command.

---

# 152. SECURITY TEST — SELF APPROVAL

Maker creates request then attempts approval.

Expected:

rejected.

---

# 153. SECURITY TEST — SUPPORT CREDIT

Support Agent attempts credit.

Expected:

denied.

---

# 154. SECURITY TEST — AUDITOR CREDIT

Auditor attempts credit.

Expected:

denied.

---

# 155. SECURITY TEST — ROLE TAMPER

Client sends forged permission.

Expected:

ignored.

---

# 156. FINANCIAL TEST — CREDIT

Initial customer ledger balance:

100,000 XAF.

Approved credit:

50,000.

Expected:

balanced journal;

new ledger balance:

150,000;

projection:

150,000;

one customer activity entry;

one adjustment record COMPLETED.

---

# 157. FINANCIAL TEST — DEBIT

Initial:

100,000.

Approved debit:

30,000.

Expected:

70,000

if policy permits;

balanced journal;

activity entry.

---

# 158. FINANCIAL TEST — DUPLICATE EXECUTION

Execute same approved adjustment five times.

Expected:

one ledger transaction;

one financial impact.

---

# 159. FINANCIAL TEST — UNBALANCED CONFIGURATION

Counterparty posting would not balance.

Expected:

rejected.

No balance change.

---

# 160. FINANCIAL TEST — CURRENCY MISMATCH

XAF account

adjustment EUR.

Expected:

rejected.

---

# 161. FINANCIAL TEST — CONCURRENT APPROVAL

Two checkers approve same request simultaneously.

Expected:

single execution.

---

# 162. FINANCIAL TEST — CREDIT RESPONSE LOSS

Ledger commits but API response lost.

Retry:

returns existing COMPLETED adjustment.

No second credit.

---

# 163. REVERSAL TEST

Approved internal eligible transaction reversal.

Expected:

new opposite journal;

original immutable;

projection updated;

history preserved.

---

# 164. DOUBLE REVERSAL TEST

Try reversing same transaction again.

Expected:

rejected if already fully reversed.

---

# 165. EXTERNAL TRANSFER REVERSAL TEST

Completed external transfer.

Expected:

generic local reversal not allowed unless external-return workflow supports it.

Do not fake external fund recovery.

---

# 166. HOLD RELEASE TEST

Authorized hold release.

Expected:

available balance increases by released hold amount;

ledger/booked balance unchanged;

hold status RELEASED;

audit event.

---

# 167. INVALID HOLD RELEASE TEST

Captured hold.

Attempt release.

Expected:

rejected.

---

# 168. RECONCILIATION TEST

Ledger:

150,000

projection:

150,000.

Expected:

OK.

---

# 169. PROJECTION MISMATCH TEST

Ledger:

150,000

projection:

145,000.

Expected:

integrity alert.

Controlled rebuild yields:

150,000

without creating ledger transaction.

---

# 170. ACCOUNT CLOSURE TEST

Attempt ordinary debit adjustment against closed account.

Expected:

policy-controlled rejection.

---

# 171. NEGATIVE BALANCE TEST

Available:

10,000.

Debit adjustment:

20,000.

Expected:

reject unless explicit product/operation policy permits negative balance.

---

# 172. APPROVAL STALE STATE TEST

Checker reviews account balance.

Another financial operation changes account.

Checker approves.

Execution revalidates fresh state.

---

# 173. MAKER DISABLED TEST

Maker disabled after request submission.

Policy decides whether pending request remains reviewable.

Document behavior explicitly.

Do not silently auto-execute.

---

# 174. CHECKER PERMISSION REMOVED TEST

Checker loses approval permission before approving.

Expected:

server rejects.

---

# 175. AUDIT TEST

Every financial state transition has a corresponding immutable audit event.

---

# 176. NOTIFICATION TEST

Credit completes.

Expected:

customer event/notification created only after ledger success.

---

# 177. STATEMENT TEST

Credit completed within statement period.

Expected:

appears exactly once.

---

# 178. MOBILE TEST MATRIX

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

finance dashboard

new adjustment

review

approval

rejection

reversal

hold management

reconciliation.

---

# 179. ONLINE-ONLY RULE

Finance operations require live server connectivity.

No offline approval queue.

No offline financial command persistence.

---

# 180. NETWORK LOSS DURING REQUEST

If maker submission fails:

do not show submitted unless server confirms.

Use idempotency.

---

# 181. NETWORK LOSS DURING APPROVAL

If response is lost:

query existing approval/execution state.

Do not approve twice.

---

# 182. NO CLIENT-SIDE FINANCIAL QUEUE

Never queue financial admin commands in IndexedDB.

---

# 183. DATABASE MIGRATIONS

Create controlled migrations for:

financial adjustments

approval requests

reversal requests

supporting evidence relations

indexes

constraints

policies.

---

# 184. DATABASE CONSTRAINTS

Enforce where appropriate:

amount > 0

currency required

maker != checker for approved operation

unique public reference

unique primary ledger posting per adjustment

valid status transitions

foreign-key integrity.

---

# 185. APPROVAL HISTORY

Preserve approval decisions as immutable history.

Do not simply overwrite:

approved_by.

If richer history is useful, use approval_decisions table.

---

# 186. MULTI-APPROVER READINESS

If using approval decisions table:

fields conceptually:

approval_request_id

reviewer_id

decision

reason

created_at.

This supports future multi-checker policy.

---

# 187. SERVER-SAFE DTO

Finance UI should not receive unrelated customer PII.

Return only necessary account/customer context.

---

# 188. PII MINIMIZATION

Approval view needs enough identity to avoid wrong-account operation, but not full KYC dossier by default.

---

# 189. SENSITIVE DOCUMENT ACCESS

Supporting evidence access requires finance-specific permission.

Do not assume every approver can read all KYC documents.

---

# 190. ADMIN SEARCH INTEGRATION

Global search can include:

ADJ reference

REV reference

with permissions.

---

# 191. OPERATION HISTORY

Account admin detail should display a separate:

Financial adjustments

section.

Do not mix requests and posted transactions without status distinction.

---

# 192. PENDING REQUEST ≠ FINANCIAL MOVEMENT

A PENDING_APPROVAL adjustment must NOT appear in customer financial activity.

Only completed ledger posting affects financial history.

---

# 193. APPROVED BUT NOT EXECUTED

If operation is APPROVED but not yet posted:

customer balance unchanged.

Do not expose it as completed transaction.

---

# 194. EXECUTING STATE

Use only when technically useful.

Do not leave operations indefinitely executing.

Provide recovery/reconciliation.

---

# 195. CUSTOMER-FACING ERROR

Internal finance failures should not expose:

clearing account

ledger error

maker/checker names.

---

# 196. CUSTOMER SUPPORT

If customer questions an adjustment:

transaction/account detail should allow:

Contact bank about this transaction.

Reuse PROMPT 10.

---

# 197. CURRENT IMPLEMENTATION SCOPE

Implement:

1. Admin finance module.
2. Finance routes.
3. Financial adjustment entity.
4. Credit adjustment.
5. Debit adjustment.
6. Adjustment reason codes.
7. Maker-checker workflow.
8. Approval request entity.
9. Pending approvals queue.
10. Approval detail.
11. Approval/rejection.
12. Self-approval prevention.
13. Narrow server financial commands.
14. Ledger-backed credit posting.
15. Ledger-backed debit posting.
16. Counterparty system account resolution.
17. Idempotent execution.
18. Concurrency protection.
19. Customer activity integration.
20. Customer notification integration.
21. Statement integration.
22. Controlled reversal request.
23. Four-eyes reversal approval.
24. Ledger reversal execution.
25. Hold inspection.
26. Controlled hold release.
27. Reconciliation foundation.
28. Projection integrity checking.
29. Projection rebuild control where available.
30. Finance audit events.
31. Supporting evidence readiness.
32. Permission-aware finance UI.
33. Responsive finance UX.
34. Accessibility.
35. Financial integrity tests.
36. Security tests.

---

# 198. DO NOT IMPLEMENT YET

Do NOT fully implement:

advanced fraud/risk scoring;

automated AML engine;

external bank reconciliation engine;

general-purpose accounting suite;

multi-entity treasury management;

automated card settlement;

full regulatory reporting.

These are outside this phase.

---

# 199. PRESERVE PROMPT 12

RBAC remains authoritative.

Staff permissions stay separated.

Do not turn Administrator into unrestricted finance superuser.

---

# 200. PRESERVE PROMPT 11

Use strong staff/session authentication and step-up principles where appropriate.

---

# 201. PRESERVE PROMPT 10

Use notification and messaging event infrastructure.

---

# 202. PRESERVE PROMPT 09

Official statements remain ledger-backed and immutable.

---

# 203. PRESERVE PROMPT 08

External transfer 99% and 100% semantics remain unchanged.

Admin adjustment must not be used to fake external-transfer completion.

---

# 204. PRESERVE PROMPT 07

Internal transfer accounting remains atomic.

---

# 205. PRESERVE PROMPT 06

Ledger remains THE financial source of truth.

No posted financial history may be rewritten.

---

# 206. PRESERVE PROMPT 05

Balances remain projections.

---

# 207. PRESERVE PROMPT 04

Customer application continues to consume authoritative read models.

---

# 208. PRESERVE PROMPT 03

Customer lifecycle restrictions remain enforceable.

---

# 209. PRESERVE PROMPT 02

Public website remains unaffected.

---

# 210. PRESERVE PROMPT 01

Reuse:

MoneyInput

StatusBadge

AlertDialog

DataTable

Document uploader

Skeleton

ErrorState

PageHeader.

Use admin-specific variants where needed.

---

# 211. PRESERVE PROMPT 00

Maintain:

simple modular architecture;

online-only operation;

server-controlled privileged actions;

Supabase/PostgreSQL security.

---

# 212. FINAL CREDIT REVIEW

Explicitly confirm:

admin account credit creates a balanced ledger journal;

customer deposit liability is credited appropriately;

counter-entry is posted to configured system ledger account;

balance projection updates from ledger;

customer cannot self-credit;

staff cannot credit through direct balance update;

duplicate execution cannot double-credit.

---

# 213. FINAL DEBIT REVIEW

Explicitly confirm:

admin debit creates a balanced ledger journal;

customer account is debited through ledger;

available-funds policy is revalidated;

unauthorized negative balances are prevented;

duplicate execution cannot double-debit.

---

# 214. FINAL FOUR-EYES REVIEW

Confirm:

maker cannot approve own request;

checker permission is server-validated;

approval and execution are separate controlled states;

concurrent approvals cannot duplicate execution;

every decision is audited.

---

# 215. FINAL REVERSAL REVIEW

Confirm:

original journal remains immutable;

reversal creates new opposite ledger transaction;

double reversal is prevented;

external transfers are not falsely reversed without settlement-aware workflow;

customer history remains complete.

---

# 216. FINAL HOLD REVIEW

Confirm:

hold release does not create money;

captured holds cannot be released;

hold release is permission-controlled;

available balance updates correctly;

ledger/booked balance is unaffected by simple release.

---

# 217. FINAL RECONCILIATION REVIEW

Confirm:

ledger is authoritative;

projection mismatch creates internal alert;

projection rebuild does not create financial entries;

no reconciliation process rewrites the ledger to match projection.

---

# 218. FINAL SECURITY REVIEW

Explicitly confirm:

no editable balance field exists anywhere;

no generic ledger-posting endpoint is exposed to admin browser;

support agents cannot credit/debit accounts;

auditors cannot mutate funds;

finance operators cannot self-approve when four-eyes required;

service-role credentials remain server-side;

all financial commands are audited.

---

# 219. FINAL MOBILE REVIEW

Confirm:

financial admin workflows work from 320px upward;

money inputs are mobile-safe;

approval review remains readable;

critical confirmations respect safe areas;

no financial table requires horizontal overflow to function.

---

# 220. FINAL REPORT

At completion provide:

ADMIN FINANCE ARCHITECTURE

FINANCE ROUTES

FINANCIAL PERMISSIONS

FINANCIAL ADJUSTMENT MODEL

CREDIT WORKFLOW

DEBIT WORKFLOW

ADJUSTMENT REASON MODEL

COUNTERPARTY LEDGER ACCOUNT STRATEGY

MAKER-CHECKER MODEL

APPROVAL REQUEST MODEL

APPROVAL QUEUE

APPROVAL / REJECTION

SELF-APPROVAL PREVENTION

LEDGER POSTING

IDEMPOTENCY

CONCURRENCY CONTROL

CUSTOMER ACTIVITY INTEGRATION

CUSTOMER NOTIFICATIONS

STATEMENT INTEGRATION

REVERSAL REQUEST MODEL

REVERSAL APPROVAL

REVERSAL EXECUTION

HOLD MANAGEMENT

HOLD RELEASE

RECONCILIATION

PROJECTION INTEGRITY

PROJECTION REBUILD

AUDIT EVENTS

SUPPORTING EVIDENCE

RLS / AUTHORIZATION

RESPONSIVE UX

ACCESSIBILITY

FINANCIAL TESTS

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
- all admin credits use the ledger;
- all admin debits use the ledger;
- no balance can be edited directly;
- every financial adjustment is balanced;
- balance projections remain derived from ledger state;
- sensitive adjustments use maker-checker control;
- makers cannot approve their own actions;
- adjustment execution is idempotent;
- network retries cannot duplicate funds;
- staff permissions are enforced server-side;
- posted ledger entries remain immutable;
- reversals create new transactions;
- hold release does not create artificial money;
- customer activity and statements reflect completed adjustments;
- customer notifications occur only after authoritative execution;
- external transfer 99→100 rules are not bypassed;
- no offline-first architecture was introduced;
- no offline financial command queue exists;
- PROMPT 00 through PROMPT 12 remain intact.

Stop after completing admin financial controls, credits/debits, adjustments, reversals, maker-checker and reconciliation foundations.

The next phase is:

PROMPT 14 — SUPABASE DATABASE HARDENING, RLS, SERVER FUNCTIONS, STORAGE SECURITY & BACKEND SECURITY AUDIT.