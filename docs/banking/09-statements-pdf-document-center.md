# PROMPT 09 — STATEMENTS, PDF DOCUMENTS, PRINTING & CUSTOMER DOCUMENT CENTER

Continue from PROMPT 00 through PROMPT 08.

Do NOT rebuild the architecture.

Do NOT replace the ledger.

Do NOT recreate account or transfer engines.

Do NOT introduce offline-first behavior.

This phase implements the complete CUSTOMER DOCUMENT EXPERIENCE for the digital bank.

The objective is to create:

- official bank statements;
- account statement generation;
- statement history;
- downloadable PDFs;
- printable statements;
- transaction receipts;
- transfer receipts;
- secure banking documents;
- customer document center;
- document metadata;
- secure document access;
- PDF generation architecture;
- immutable statement snapshots;
- statement numbering;
- document versioning;
- auditability;
- responsive document UX.

The critical principle is:

OFFICIAL BANKING DOCUMENTS MUST BE GENERATED FROM AUTHORITATIVE SERVER-SIDE BANKING DATA.

Never generate official statements from incomplete browser state.

---

# 1. DOCUMENT DOMAIN

Create or complete:

```text
src/features/statements/
```

and:

```text
src/features/documents/
```

Possible organization:

```text
statements/
├── components/
├── services/
├── schemas/
├── types/
├── pages/
├── server/
└── templates/
```

```text
documents/
├── components/
├── services/
├── schemas/
├── types/
├── pages/
└── server/
```

Keep responsibilities separated.

---

# 2. STATEMENTS VS DOCUMENT CENTER

Do not confuse these domains.

## STATEMENTS

Official financial account documents generated from account/ledger history.

## DOCUMENT CENTER

Customer-facing repository for banking documents.

The Document Center may contain:

statements;

transfer receipts;

transaction receipts;

bank letters;

compliance-related customer-safe documents;

future account certificates.

---

# 3. IDENTITY DOCUMENTS ARE DIFFERENT

KYC identity documents uploaded during onboarding must remain in the compliance/onboarding domain.

Do NOT automatically expose raw identity-verification files inside the ordinary customer Document Center.

Keep:

verification documents

separate from:

bank-generated customer documents.

---

# 4. STATEMENT ROUTE

Fully implement:

```text
/app/statements
```

and:

```text
/app/statements/:statementRef
```

Potential generation route or action:

```text
/app/statements/new
```

only if a dedicated page improves UX.

---

# 5. DOCUMENT ROUTES

Implement:

```text
/app/documents
```

and:

```text
/app/documents/:documentRef
```

Do not expose raw storage paths in URLs.

---

# 6. STATEMENT PURPOSE

A bank statement must summarize account activity for a defined period.

Typical content:

bank identity;

statement reference;

customer identity;

account identification;

statement period;

opening balance;

credits;

debits;

closing balance;

transaction list;

generation date;

page numbering;

legal/footer information where configured.

---

# 7. AUTHORITATIVE DATA SOURCE

Statements must use:

ledger-backed account activity

+

authoritative account metadata.

Do NOT build a statement from:

cached frontend transactions;

currently visible table rows;

client-side filters;

localStorage;

browser memory alone.

---

# 8. STATEMENT FINANCIAL SOURCE

Use the financial architecture from PROMPT 06.

Conceptually:

LEDGER

→ CUSTOMER TRANSACTION READ MODEL

→ STATEMENT SNAPSHOT

→ PDF.

The ledger remains the source of truth.

---

# 9. OPENING BALANCE

Opening balance must represent the authoritative posted account balance immediately before the statement period begins.

Do not derive it by simply taking the current balance and subtracting visible transactions in JavaScript.

---

# 10. CLOSING BALANCE

Closing balance must represent the authoritative posted balance at the end of the statement period.

---

# 11. BALANCE EQUATION

For a simple deposit account statement:

conceptually:

```text
opening balance
+ posted incoming movements
- posted outgoing movements
=
closing balance
```

subject to the product's ledger/accounting rules.

Validate the statement before issuance.

---

# 12. STATEMENT INTEGRITY CHECK

Before creating an official statement verify:

opening balance;

included transactions;

closing balance;

currency;

account;

period.

If the figures do not reconcile:

do NOT generate an official statement.

Create an internal integrity error.

---

# 13. STATEMENT PERIODS

Support at minimum:

Monthly

Custom date range

Potential future:

Quarterly

Annual.

Do not overcomplicate V1.

---

# 14. MONTHLY STATEMENT

Allow customer to select:

month

year.

Example:

August 2026.

Use proper account/customer timezone rules.

---

# 15. CUSTOM PERIOD

Allow:

From

To.

Validate:

start <= end;

supported maximum range;

account existed during relevant dates.

Do not allow invalid time ranges.

---

# 16. STATEMENT CURRENCY

Each statement must correspond to one account and one account currency.

Do not combine multiple currencies into one fake total.

---

# 17. MULTIPLE ACCOUNTS

If customer has multiple accounts:

allow account selection before statement generation.

Do not merge accounts automatically.

---

# 18. STATEMENT ENTITY

Create a statement record.

Conceptual fields:

```text
id

public_reference

account_id

customer_id

period_start

period_end

currency

opening_balance_minor

closing_balance_minor

total_credit_minor

total_debit_minor

transaction_count

status

generated_at

generated_by

document_id

version

created_at
```

Adapt to project conventions.

---

# 19. STATEMENT STATUS

Use simple states such as:

```text
GENERATING

READY

FAILED

SUPERSEDED
```

Do not expose raw technical states unnecessarily.

---

# 20. STATEMENT PUBLIC REFERENCE

Generate a server-side public reference.

Example:

```text
STM-2026-00004821
```

Do not use raw database IDs in customer URLs.

---

# 21. STATEMENT NUMBER

Statement reference must be stable after issuance.

Do not regenerate a different reference every time the same issued statement is downloaded.

---

# 22. STATEMENT SNAPSHOT

Once an official statement is issued:

store a durable snapshot of the financial data used to generate it.

The document must remain reproducible.

Do not regenerate historical statements from mutable current display labels alone.

---

# 23. IMMUTABLE FINANCIAL SNAPSHOT

The snapshot should preserve necessary official data such as:

customer legal name at issuance;

account identifier at issuance;

statement period;

opening balance;

closing balance;

transaction lines;

official descriptions;

statement reference.

Do not copy unnecessary sensitive data.

---

# 24. TRANSACTION SNAPSHOT

Each statement line may contain:

transaction reference;

date;

description;

direction;

amount;

running balance where supported.

Do not store raw internal ledger-entry details in the PDF.

---

# 25. RUNNING BALANCE

If running balance is displayed:

calculate it server-side from authoritative statement data.

Validate that the final running balance equals the closing balance.

---

# 26. STATEMENT IMMUTABILITY

Once issued:

do not edit financial amounts inside the original statement.

If a corrected statement is required:

issue a new version.

Link it to the prior statement.

---

# 27. STATEMENT VERSIONING

Support conceptually:

version 1

version 2

etc.

If corrected:

mark old statement:

SUPERSEDED

while preserving it according to policy.

Do not silently replace the historical document.

---

# 28. PDF GENERATION MUST BE SERVER-SIDE

Official PDF generation must happen in a trusted server environment.

Do not trust the browser to construct the official banking PDF from arbitrary client-provided JSON.

The browser may request:

Generate statement

The server determines:

account;

authorized customer;

period;

financial data;

document contents.

---

# 29. PDF GENERATION PIPELINE

Conceptually:

Customer request

→ authentication

→ ownership validation

→ statement-period validation

→ authoritative transaction query

→ financial reconciliation

→ statement snapshot

→ PDF rendering

→ secure document storage

→ document metadata

→ customer response.

---

# 30. PDF TEMPLATE

Create a reusable official statement template.

Use a professional banking layout.

Header:

Bank logo

Bank legal/configured identity

Document title:

Account Statement

Statement reference.

Customer section:

Account holder

Masked/full official account number as policy allows

Account type

Currency.

Period:

From

To.

---

# 31. STATEMENT SUMMARY

Include:

Opening balance

Total money in / credits

Total money out / debits

Closing balance.

Do not label cash flow as:

profit

or:

loss.

---

# 32. TRANSACTION TABLE

Statement PDF should support columns such as:

Date

Reference

Description

Money out

Money in

Balance.

Adapt based on page width.

Do not place an unreadable 10-column table in portrait PDF.

---

# 33. LONG STATEMENTS

Support multi-page statements.

Header/footer behavior should remain coherent across pages.

Do not truncate transactions.

---

# 34. PAGE NUMBERING

Use:

Page X of Y

where supported.

---

# 35. PDF FOOTER

Footer may contain configured:

bank legal name;

registered office;

regulatory information;

support contact;

statement reference.

Do NOT invent regulatory information.

---

# 36. NO FAKE LEGAL DATA

If the bank's:

license number;

registration;

address;

regulator

has not been configured:

do not invent values.

Use centralized brand/legal configuration.

---

# 37. PDF BRANDING

Reuse the bank identity from PROMPT 01.

The PDF should visually align with the website but remain formal.

Avoid:

excessive gradients;

glassmorphism;

dark backgrounds;

decorative mobile-app effects.

Official documents should print cleanly.

---

# 38. PRINT-FIRST DOCUMENT STYLE

PDF design should optimize for:

A4

and potentially Letter

depending on target jurisdiction.

Use high contrast.

Prefer white background.

Avoid unnecessary background graphics that consume ink.

---

# 39. PRINT CSS

For browser-rendered document previews:

create print styles.

Hide:

navigation;

mobile bottom bar;

sidebars;

buttons;

interactive controls.

Print only the relevant document.

---

# 40. BROWSER PRINT

Allow customer action:

Print.

Use a clean print representation.

Do not print the entire banking application shell.

---

# 41. PDF DOWNLOAD

Provide:

Download PDF.

The customer should receive the authoritative generated PDF.

Do not recreate a separate unofficial client PDF.

---

# 42. STATEMENT PREVIEW

Create an HTML statement preview.

It should visually correspond to the PDF.

Possible actions:

Download PDF

Print

Back to statements.

---

# 43. STATEMENT LIST

`/app/statements` should show:

statement period;

account;

reference;

generation date;

status.

Actions:

View

Download.

---

# 44. STATEMENT GROUPING

Group statements logically.

Example:

2026

August

July

June.

Do not create unnecessary complexity if only a few exist.

---

# 45. GENERATE STATEMENT

Provide CTA:

Generate statement.

Flow:

Select account

Select period

Review selection

Generate.

Do not ask the customer to manually select transactions.

---

# 46. DUPLICATE STATEMENT REQUEST

If an identical official statement already exists for:

same account

same period

same current statement version,

prefer returning/reusing it instead of creating endless duplicates.

Use appropriate uniqueness/idempotency policy.

---

# 47. STATEMENT GENERATION IDEMPOTENCY

Double-tapping Generate must not create duplicate official statements.

---

# 48. GENERATION LOADING STATE

Show:

Generating your statement

or similar.

Do not display a fake completed PDF before the server confirms generation.

---

# 49. GENERATION FAILURE

If generation fails:

show:

We couldn't generate this statement.

Retry.

Do not create an incomplete official document.

---

# 50. STATEMENT WITH NO ACTIVITY

A valid period with no transactions may still produce a statement.

It should show:

opening balance

no account activity

closing balance.

Do not treat zero transactions as an error.

---

# 51. EMPTY ACCOUNT HISTORY

If the account did not yet exist during the selected period:

prevent invalid statement generation or explain clearly.

---

# 52. FUTURE PERIOD

Do not allow an official historical statement for future dates.

---

# 53. CURRENT PERIOD

Decide whether current-month statements are:

provisional

or official up to the selected date.

Do not call a partial current month a complete monthly statement without clear wording.

Recommended:

allow custom date-range statement

and reserve monthly statements for completed periods where policy requires.

---

# 54. AUTOMATIC MONTHLY STATEMENTS

Prepare architecture for future automatic monthly statement generation.

Do not require it if V1 uses on-demand generation.

Possible future scheduled generation:

month close

→ statement creation

→ notification.

PROMPT 10 may later notify customers.

---

# 55. DOCUMENT ENTITY

Create a general customer document model.

Conceptual:

```text
id

public_reference

customer_id

account_id nullable

document_type

title

status

source_type

source_reference

storage_reference

mime_type

generated_at

created_at

version
```

---

# 56. DOCUMENT TYPES

Support:

```text
ACCOUNT_STATEMENT

TRANSFER_RECEIPT

TRANSACTION_RECEIPT

BANK_LETTER

ACCOUNT_CERTIFICATE
```

Future types may be added.

Do not create unsupported functionality merely because the enum exists.

---

# 57. CUSTOMER DOCUMENT REFERENCE

Example:

```text
DOC-2026-00018492
```

Server-generated.

---

# 58. DOCUMENT CENTER

Implement `/app/documents`.

The page should answer:

What documents are available?

Which account/operation do they belong to?

When were they generated?

What can I do with them?

---

# 59. DOCUMENT CENTER FILTERS

Useful filters:

All

Statements

Receipts

Letters

Account.

Do not overload V1.

---

# 60. MOBILE DOCUMENT CENTER

Use document rows/cards.

Display:

document type;

title;

date;

account/context;

status.

Actions:

View

Download.

Do not use a wide table.

---

# 61. DESKTOP DOCUMENT CENTER

Desktop may use a table or structured list.

Columns:

Document

Type

Account

Date

Status

Actions.

---

# 62. DOCUMENT DETAIL

`/app/documents/:documentRef`

may show:

document metadata;

preview where possible;

download;

print where applicable;

related transaction/transfer/account.

---

# 63. SECURE DOCUMENT STORAGE

Use private storage.

Official customer documents must not live in a public bucket.

---

# 64. DOCUMENT ACCESS

Customer must only access documents they are authorized to view.

Customer A must never access Customer B's PDF by changing:

URL;

document reference;

storage key.

---

# 65. STORAGE PATH SECURITY

Do not use predictable public storage paths as authorization.

Authorization must happen separately.

---

# 66. SIGNED ACCESS

Where Supabase signed URLs are appropriate:

use short-lived authorized access.

Do not expose permanent public URLs.

---

# 67. DOCUMENT DOWNLOAD SERVICE

Prefer a controlled method such as:

```text
getDocumentDownloadUrl(documentRef)
```

or a server response/stream.

Validate authorization before issuing access.

---

# 68. FILE NAMES

Use professional downloadable filenames.

Example:

```text
statement-2026-08-ACC-4821.pdf
```

Avoid filenames containing unnecessary full customer PII.

---

# 69. PDF MIME TYPE

Use:

```text
application/pdf
```

and safe content-disposition behavior.

---

# 70. STORAGE METADATA

Store:

checksum where useful;

file size;

mime type;

generation timestamp;

document version.

---

# 71. DOCUMENT CHECKSUM

Consider a cryptographic checksum for generated official documents.

This can assist internal integrity verification.

Do not market it as a legal digital signature unless a real signing system exists.

---

# 72. DIGITAL SIGNATURE READINESS

Prepare architecture for future cryptographic signing/sealing of official PDFs if required.

Do NOT invent a fake signature.

---

# 73. QR VERIFICATION READINESS

Future official documents could contain a verification code/QR.

Do not implement a public verification endpoint unless the privacy/security model is explicitly defined.

---

# 74. TRANSACTION RECEIPT

Allow a customer to generate/view a receipt for an eligible completed transaction.

Receipt must use authoritative transaction data.

---

# 75. TRANSACTION RECEIPT CONTENT

Possible:

Bank identity

Receipt title

Transaction reference

Date/time

Account

Direction

Amount

Currency

Description

Counterparty safe details

Status.

Do not expose raw ledger IDs.

---

# 76. RECEIPT ELIGIBILITY

Generate official receipt primarily for:

COMPLETED

or other policy-approved finalized transactions.

Do not create a "successful payment receipt" for FAILED operations.

---

# 77. PENDING RECEIPT

If pending-operation confirmation is useful:

label it clearly as:

Pending transaction details

not:

Final receipt.

---

# 78. TRANSFER RECEIPT

For completed internal transfers:

provide a transfer receipt.

For external transfers:

only issue a completed transfer receipt after authoritative completion reaches 100%.

---

# 79. INTERNAL TRANSFER RECEIPT

Include:

sender account safe details;

recipient safe details;

amount;

currency;

transfer reference;

date;

status COMPLETED.

---

# 80. EXTERNAL TRANSFER RECEIPT

Only after:

progress = 100

and:

COMPLETED.

May include:

recipient

external bank

destination masked details

amount

bank transfer reference

completion date.

Do not falsely state external delivery before authoritative confirmation.

---

# 81. 99% TRANSFER DOCUMENT

At 99%, do not produce a final completed-transfer receipt.

If needed, provide:

Transfer status confirmation

clearly labeled as pending.

---

# 82. RECEIPT ROUTES

Receipts may be accessible from:

transaction detail;

transfer detail;

Document Center.

Avoid unnecessary separate navigation clutter.

---

# 83. RECEIPT IDEMPOTENCY

Repeated download should return the same issued receipt/version unless data legitimately requires a new version.

---

# 84. RECEIPT SNAPSHOT

Preserve official values used at issuance.

Do not let later beneficiary nickname changes alter historical receipt identity.

---

# 85. DOCUMENT RELATION

General document entity should support:

source_type

source_reference.

Examples:

ACCOUNT_STATEMENT

linked to statement.

TRANSFER_RECEIPT

linked to transfer.

TRANSACTION_RECEIPT

linked to transaction.

---

# 86. SOURCE IMMUTABILITY

Do not allow arbitrary client reassignment of a document from one transfer/account to another.

---

# 87. CUSTOMER LEGAL NAME

Official financial documents should use the appropriate verified legal account-holder name.

Do not use a casual profile nickname as the official statement holder identity.

---

# 88. CUSTOMER ADDRESS

Only include customer address if required by the configured document template/policy.

Do not expose unnecessary PII.

---

# 89. ACCOUNT IDENTIFIERS IN PDF

Official documents may require fuller bank-account details than the app default view.

Apply configured masking/policy.

Do not expose more than necessary.

---

# 90. DOCUMENT LANGUAGE

Prepare templates so documents can later support multiple languages.

Do not hardcode layout assumptions based only on English labels.

---

# 91. NUMBER FORMATTING

Reuse centralized currency formatting.

Ensure PDF generation uses the same monetary rules.

Do not format money differently between UI and PDF.

---

# 92. DATE FORMATTING

Use consistent banking date format.

PDF templates may use a formal style.

Example:

25 August 2026

or localized equivalent.

Do not mix multiple date formats randomly.

---

# 93. TIMEZONE

Official transaction timestamps should use deliberate configured bank/customer timezone policy.

Do not use the browser clock for official document timestamps.

---

# 94. PDF GENERATION LIBRARY

Before adding a new PDF library:

inspect existing dependencies.

Choose one appropriate server-compatible solution.

Do not install multiple PDF generation libraries.

The library must support:

multi-page documents;

fonts;

tables;

headers/footers;

server-side generation.

---

# 95. FONT HANDLING

Use properly licensed application fonts already available to the application, or safe standard document fonts.

Do not depend on downloading a font at PDF-generation time.

---

# 96. PDF SECURITY

Do not inject raw unsanitized HTML into PDF rendering.

Escape customer-entered references/messages.

---

# 97. CUSTOMER MESSAGE IN RECEIPT

Transfer reference/message is plain text.

It must not execute HTML/scripts inside document generation.

---

# 98. PDF RESOURCE LIMITS

Protect PDF generation from abuse.

Use server-side validation for:

maximum date range;

maximum transactions;

file-generation limits;

authorization.

Do not let arbitrary user parameters trigger enormous unbounded reports.

---

# 99. LARGE STATEMENT HANDLING

If a valid period contains many transactions:

paginate into multiple PDF pages.

Do not silently omit older transactions.

---

# 100. VERY LARGE REPORTS

For unusually large ranges:

use appropriate server processing within platform limits.

If necessary:

restrict on-demand range size

and guide customer toward monthly statements.

Do not introduce background-job architecture unless genuinely necessary.

---

# 101. ONLINE-ONLY RULE

Statement generation/download requires network access.

Do not create offline statement queues.

Previously downloaded files may naturally exist on the user's device outside the app, but the banking app itself remains online-first.

---

# 102. NETWORK FAILURE

If network fails during generation:

show:

Connection lost

Statement was not confirmed as generated.

Retry safely.

Use idempotency to avoid duplicates.

---

# 103. DOWNLOAD FAILURE

If PDF exists but download fails:

allow retry.

Do not regenerate the financial document unnecessarily.

---

# 104. DOCUMENT DELETION

Ordinary customers should generally not delete official bank statements from the bank's system.

They may remove local downloads on their own device, but server records remain according to retention policy.

---

# 105. DOCUMENT ARCHIVE

Older documents remain accessible according to retention rules.

Do not use ordinary UI delete as archive.

---

# 106. RETENTION

Do not hardcode a legal retention period unless target jurisdiction has been specified.

Prepare configurable retention policies.

---

# 107. STATEMENT SEARCH

Allow simple search/filter by:

period

account

document reference.

Do not overbuild full-text search.

---

# 108. DOCUMENT SEARCH

May support:

document title

reference

type

date.

Server-side as needed.

---

# 109. DASHBOARD INTEGRATION

Dashboard may expose shortcut:

Statements

or:

Latest statement.

Do not load the entire document repository on dashboard.

---

# 110. ACCOUNT DETAIL INTEGRATION

Account detail page should provide:

View statements.

Default statement screen may preselect that account.

---

# 111. TRANSACTION DETAIL INTEGRATION

Completed transaction detail may provide:

View receipt

or:

Download receipt.

---

# 112. TRANSFER DETAIL INTEGRATION

Completed transfer detail may provide:

Download receipt.

External transfer at 99% must not show:

Final completed receipt.

---

# 113. DOCUMENT CENTER BADGE

If a newly generated document is available:

the future notification system may flag it.

Do not fabricate unread-document counts.

---

# 114. NOTIFICATION EVENTS

Prepare events for PROMPT 10:

statement_ready

statement_generation_failed

receipt_ready

document_available.

Do not implement full delivery here.

---

# 115. AUDIT EVENTS

Record relevant actions:

statement_requested

statement_generated

statement_failed

statement_downloaded if policy requires

receipt_generated

document_created.

Do not over-audit every preview render unnecessarily.

---

# 116. DOCUMENT ACCESS AUDIT

For highly sensitive document access, prepare optional audit tracking.

Do not collect unnecessary telemetry.

---

# 117. RLS — STATEMENTS

Customer can read only statements for accounts they are authorized to access.

Do not give:

SELECT all statements

to all authenticated users.

---

# 118. RLS — DOCUMENTS

Customer can read only customer-safe documents they own/are authorized for.

---

# 119. STORAGE RLS

Protect storage objects consistently with document ownership.

Database authorization alone is insufficient if storage bucket policies are public.

---

# 120. GENERATION SECURITY

Customer cannot pass:

customer_id

opening_balance

closing_balance

transaction list

as authoritative PDF-generation input.

Server derives them.

---

# 121. PERIOD TAMPERING

Customer can request a period.

Server validates it.

Customer cannot force another account's history by changing accountRef.

---

# 122. STATEMENT TAMPERING TEST

Attempt:

Customer A requests statement for Customer B account.

Expected:

rejected safely.

---

# 123. DOCUMENT URL TAMPERING TEST

Customer changes documentRef.

Expected:

cannot access another customer's file.

---

# 124. STORAGE URL TEST

Previously signed document URL must expire according to configuration.

Do not rely on secrecy of URL alone.

---

# 125. FINANCIAL RECONCILIATION TEST

For generated statement:

opening

+

inflows

-

outflows

=

closing

according to the account's financial rules.

Expected exact reconciliation.

---

# 126. STATEMENT TRANSACTION COUNT TEST

Every qualifying posted transaction within period appears exactly once.

No duplicates.

No missing rows.

---

# 127. BOUNDARY DATE TEST

Test transactions exactly at:

period start

period end.

Use consistent inclusive/exclusive time boundaries.

Document the rule.

---

# 128. REVERSAL TEST

If transaction was reversed:

statement must represent the original and reversal according to posted accounting history.

Do not erase original transaction.

---

# 129. PENDING TRANSACTION TEST

Pending unposted business operation should not appear as a finalized posted statement line unless product policy explicitly supports a separate pending section.

---

# 130. FAILED TRANSACTION TEST

Failed, never-posted operation must not affect balances or official posted-transaction totals.

---

# 131. INTERNAL TRANSFER STATEMENT TEST

A sends 10,000 XAF to B.

Sender statement:

outgoing 10,000.

Recipient statement:

incoming 10,000.

Both derived from same authoritative ledger posting.

---

# 132. EXTERNAL TRANSFER AT 99% TEST

Transfer is 99%, settlement pending.

Do not produce final completed receipt.

Posted/held representation on statement follows actual accounting state, not UI progress alone.

---

# 133. EXTERNAL TRANSFER AT 100% TEST

After authoritative completion:

transaction/statement representation reflects actual ledger posting.

Final receipt becomes available.

---

# 134. ZERO-ACTIVITY STATEMENT TEST

Opening:

50,000

No transactions

Closing:

50,000.

Statement must generate correctly.

---

# 135. MULTI-PAGE TEST

Generate statement with enough transactions for multiple pages.

Verify:

all rows present;

page numbers;

headers/footers;

no overlap;

no clipped values.

---

# 136. LONG DESCRIPTION TEST

Transaction descriptions must wrap safely.

Do not break table layout.

---

# 137. LARGE AMOUNT TEST

Large financial values must fit PDF columns without precision loss.

---

# 138. ZERO-DECIMAL CURRENCY TEST

Verify XAF or another zero-decimal currency format according to currency metadata.

Do not blindly show `.00` if formatting policy does not require it.

---

# 139. DECIMAL CURRENCY TEST

Verify EUR/USD-style minor units correctly.

---

# 140. PRIVACY MODE

Privacy mode affects interactive screens.

Official statements should contain the official configured account/financial values required by the document.

Do not hide balances inside official PDF merely because the UI privacy toggle is enabled.

---

# 141. PRINT PREVIEW

Privacy mode should not accidentally blank official document content during print/download.

Document generation follows official template policy, not transient UI masking preference.

---

# 142. ACCESSIBILITY

HTML statement/document screens must meet WCAG 2.2 AA.

Verify:

semantic headings;

table semantics;

download button labels;

print action labels;

filter labels;

focus;

screen-reader document metadata.

---

# 143. PDF ACCESSIBILITY READINESS

Where PDF library capabilities permit:

use logical reading order;

real text rather than flattened screenshots;

meaningful document title.

Do not generate statements as giant images.

---

# 144. MOBILE STATEMENT UX

At 320–430px:

statement list easy to scan;

filters usable;

Generate button accessible;

preview responsive;

PDF download obvious.

Do not attempt to show a full A4 sheet at unreadably tiny scale as the only mobile preview.

---

# 145. MOBILE PREVIEW

Use a responsive HTML summary/preview.

Customer can open/download the actual PDF separately.

---

# 146. DESKTOP PREVIEW

Desktop may show a document-like centered sheet preview.

Keep actions outside printable content.

---

# 147. TABLET

Tablet should support comfortable document preview without horizontal application overflow.

---

# 148. PRINT TEST

Verify browser Print:

does not include sidebar;

does not include bottom navigation;

does not include header action buttons;

prints all relevant pages/content.

---

# 149. PDF DOWNLOAD TEST

Verify:

valid file;

correct MIME;

professional filename;

opens in standard PDF viewers.

---

# 150. CUSTOMER-SAFE PDF METADATA

Document metadata should not include unnecessary sensitive internal identifiers.

---

# 151. FILE SIZE

Keep generated PDFs reasonably optimized.

Do not embed huge raster images.

---

# 152. LOGO ASSET

Use optimized bank logo.

Do not fetch it from an unreliable remote URL during every PDF generation request.

---

# 153. SERVER ERROR HANDLING

PDF renderer failures must not leave statement:

READY

without a valid file.

Use consistent state transaction.

---

# 154. DOCUMENT CREATION ATOMICITY

Statement snapshot

+

PDF metadata

+

storage reference

+

READY state

should be coordinated safely.

Do not create orphan READY documents.

---

# 155. ORPHAN FILE CLEANUP

If PDF storage succeeds but database finalization fails:

prepare a safe cleanup/reconciliation strategy.

Keep it simple.

---

# 156. RETRY GENERATION

Retry should not create duplicate official statement references when recovering the same generation request.

---

# 157. DOCUMENT CHECKSUM VALIDATION

If checksum implemented:

verify stored file integrity during controlled internal checks.

---

# 158. NO CLIENT-PROVIDED HTML TEMPLATE

Do not allow customers to submit arbitrary HTML/CSS to PDF generator.

Templates are server-controlled.

---

# 159. TEMPLATE VERSION

Store document template version where useful.

Example:

statement_template_version = 1.

This supports future redesign while preserving document traceability.

---

# 160. BRAND CONFIGURATION

Template pulls from centralized:

bank name

logo

legal footer

support details

configured banking identifiers.

Do not duplicate brand config.

---

# 161. CUSTOMER DOCUMENT STATUS

Use:

READY

GENERATING

FAILED

SUPERSEDED

where appropriate.

Avoid generic statuses unrelated to document lifecycle.

---

# 162. DOWNLOAD CTA

Use explicit wording:

Download PDF

not only:

Download.

---

# 163. PRINT CTA

Use:

Print statement

or:

Print document.

---

# 164. STATEMENT CTA

Use:

Generate statement

rather than ambiguous:

Create.

---

# 165. EMPTY STATEMENTS PAGE

If no statements:

show:

No statements yet.

Provide:

Generate statement.

---

# 166. EMPTY DOCUMENT CENTER

If no documents:

show appropriate message.

Do not generate fake samples for real users.

---

# 167. LOADING STATES

Use skeletons for lists.

Use persistent generation state for PDF processing.

Do not show fake rows.

---

# 168. DOCUMENT ERROR

If a document exists but file is temporarily unavailable:

show:

Document unavailable

Retry.

Do not silently remove it from history.

---

# 169. ACCOUNT CLOSED

Closed-account statements should remain accessible according to policy.

Do not delete historical documents when account closes.

---

# 170. CUSTOMER CLOSED

Account/customer lifecycle changes must not erase required historical financial documents.

---

# 171. CURRENT IMPLEMENTATION SCOPE

Implement:

1. Statement domain.
2. Document Center domain.
3. Statement entity.
4. Statement snapshot model.
5. Statement versioning.
6. Statement public references.
7. Monthly statement generation.
8. Custom-range statement generation.
9. Opening/closing balance calculation.
10. Financial reconciliation.
11. Authoritative transaction extraction.
12. Server-side PDF generation.
13. Professional PDF template.
14. Multi-page statement rendering.
15. Secure private PDF storage.
16. Signed/authorized document access.
17. Statement list.
18. Statement preview.
19. Statement download.
20. Statement printing.
21. General customer document entity.
22. Document Center.
23. Document detail.
24. Transaction receipt.
25. Internal-transfer receipt.
26. External completed-transfer receipt.
27. Pending-transfer document distinction.
28. Document checksum/version metadata where justified.
29. Account/detail integrations.
30. Transfer/detail integrations.
31. Transaction/detail integrations.
32. Notification event hooks.
33. Audit events.
34. RLS/storage security.
35. Responsive mobile UX.
36. Print CSS.
37. Accessibility.
38. Financial integrity tests.
39. PDF-generation tests.

---

# 172. DO NOT IMPLEMENT YET

Do NOT fully implement:

secure bank messaging;

notification delivery;

MFA/session-management center;

admin back office;

admin credit/debit controls;

admin transfer blocking UI;

admin compliance-review UI;

advanced analytics.

These come later.

---

# 173. PRESERVE PROMPT 08

Internal transfers completed at 100% may receive final receipts.

External transfers at 99% may NOT receive final-completion receipts.

External transfers receive final receipts only after authoritative 100% completion.

---

# 174. PRESERVE PROMPT 07

Transfer history and transfer references remain authoritative business sources.

---

# 175. PRESERVE PROMPT 06

Ledger remains financial source of truth.

Statements must reconcile to ledger-backed data.

---

# 176. PRESERVE PROMPT 05

Account balances continue to use authoritative projections.

---

# 177. PRESERVE PROMPT 04

Keep BankingAppLayout, navigation and responsive shell.

---

# 178. PRESERVE PROMPT 03

Use verified legal customer identity appropriately for official documents.

---

# 179. PRESERVE PROMPT 02

Public legal/brand content remains separate.

---

# 180. PRESERVE PROMPT 01

Reuse typography, buttons, tables, statuses, spacing and branding.

PDFs may use a formal print-specific visual subset.

---

# 181. PRESERVE PROMPT 00

Maintain simple modular architecture and online-only behavior.

---

# 182. FINAL FINANCIAL REVIEW

Explicitly verify:

Statements come from authoritative ledger-backed data.

Opening balance is correct.

Closing balance is correct.

Statement transactions reconcile exactly.

Failed/unposted transactions do not alter official totals.

Reversals remain visible according to accounting history.

No official financial value comes from editable browser state.

---

# 183. FINAL DOCUMENT SECURITY REVIEW

Explicitly verify:

customer cannot access another customer's statement;

customer cannot access another customer's PDF;

customer cannot forge statement financial data;

customer cannot forge receipt completion status;

storage bucket is private;

download access is authorized;

no permanent public customer-document URLs exist;

no client-side authority generates official PDFs.

---

# 184. FINAL EXTERNAL TRANSFER REVIEW

Explicitly verify:

99% external transfer does not produce a final completed-transfer receipt.

100% externally confirmed transfer may produce a final receipt.

Document wording reflects actual settlement state.

---

# 185. FINAL MOBILE REVIEW

Confirm:

statement list works from 320px;

Generate Statement flow works on mobile;

document preview remains usable;

download button is touch-friendly;

print action is accessible;

Document Center has no horizontal overflow.

---

# 186. FINAL PDF REVIEW

Confirm:

PDF opens correctly;

all pages render;

page numbering works;

transaction rows are not clipped;

currency formatting is correct;

official values reconcile;

branding is consistent;

no fake legal information appears.

---

# 187. FINAL REPORT

At completion provide:

STATEMENT ARCHITECTURE

STATEMENT DATA MODEL

STATEMENT SNAPSHOT

STATEMENT VERSIONING

STATEMENT REFERENCES

PERIOD SELECTION

OPENING BALANCE

CLOSING BALANCE

FINANCIAL RECONCILIATION

TRANSACTION EXTRACTION

PDF GENERATION ENGINE

PDF TEMPLATE

MULTI-PAGE SUPPORT

PRINT STYLES

SECURE DOCUMENT STORAGE

DOCUMENT ACCESS

DOCUMENT CENTER

DOCUMENT DATA MODEL

TRANSACTION RECEIPTS

INTERNAL TRANSFER RECEIPTS

EXTERNAL TRANSFER RECEIPTS

99% PENDING TRANSFER HANDLING

ACCOUNT INTEGRATION

TRANSACTION INTEGRATION

TRANSFER INTEGRATION

RLS

STORAGE SECURITY

AUDIT EVENTS

NOTIFICATION EVENTS

RESPONSIVE UX

ACCESSIBILITY

FINANCIAL INTEGRITY TESTS

PDF TESTS

FILES CREATED

FILES MODIFIED

DATABASE CHANGES

SERVER FUNCTIONS

DEPENDENCIES ADDED

KNOWN TODOs

Also explicitly confirm:

- project builds successfully;
- TypeScript passes;
- official statements are generated server-side;
- statement financial data comes from ledger-backed authoritative data;
- statement opening/closing balances reconcile;
- statement snapshots are immutable after issuance;
- corrected statements use versions rather than silent edits;
- customer documents are stored privately;
- customer cannot access another customer's documents;
- statement generation is idempotent;
- repeated downloads do not create duplicate statements;
- transaction receipts use authoritative transaction state;
- internal completed transfers can generate final receipts;
- external transfers at 99% cannot generate final completed receipts;
- external transfers at 100% can generate final receipts;
- no fake regulatory/legal data is inserted;
- no direct balance mutation was introduced;
- no offline-first architecture was introduced;
- PROMPT 00 through PROMPT 08 remain intact.

Stop after completing statements, receipts, PDF generation, printing and the customer Document Center.

The next phase is:

PROMPT 10 — SECURE BANK MESSAGING, NOTIFICATIONS & CUSTOMER COMMUNICATION CENTER.