# PROMPT 03 — AUTHENTICATION, REGISTRATION, KYC & CUSTOMER ONBOARDING

Continue from:

PROMPT 00 — Foundation & Modular Architecture  
PROMPT 01 — Design System, Branding & Visual Identity  
PROMPT 02 — Public Website, Landing Page & Customer Acquisition

Do NOT rebuild the project.

Do NOT replace the design system.

Do NOT reorganize the modular architecture without a genuine technical reason.

Do NOT introduce offline-first behavior.

This phase implements the complete customer entry journey:

VISITOR

→ ACCOUNT CREATION

→ CONTACT VERIFICATION

→ SECURE LOGIN

→ PROFILE ONBOARDING

→ IDENTITY VERIFICATION

→ BANKING ELIGIBILITY REVIEW

→ CUSTOMER ACCOUNT ACTIVATION

The objective is to create a modern banking onboarding experience that is:

- mobile-first;
- simple;
- reassuring;
- secure;
- progressive;
- accessible;
- auditable;
- understandable.

Do not create one huge registration form.

---

# 1. CRITICAL CONCEPTUAL SEPARATION

The system must clearly separate four concepts.

## AUTHENTICATION

Proves that the user controls their login credentials.

Examples:

email
password
passkey
OTP
MFA

## PROFILE

Contains customer personal information.

Examples:

name
date of birth
address
occupation

## IDENTITY VERIFICATION

Determines whether required identity checks have been completed.

Examples:

identity document
proof of address
verification review

## BANKING ACCOUNT STATUS

Determines whether the user is permitted to use banking functionality.

These concepts must NOT be collapsed into one field such as:

user.verified = true

Use explicit states.

---

# 2. AUTHENTICATION BACKEND

Use the existing Supabase authentication integration established by the project.

Prefer Supabase Auth for:

- account creation;
- email authentication;
- password authentication;
- session management;
- email verification;
- OTP where appropriate;
- password recovery;
- MFA/passkey readiness where supported.

Do not build a custom password system.

Never store raw passwords.

Never create a custom passwords table.

---

# 3. AUTH MODULE

Keep customer authentication inside:

src/features/auth/

Possible organization:

auth/
├── components/
├── hooks/
├── services/
├── schemas/
├── types/
└── utils/

Onboarding should remain separate:

src/features/onboarding/

Do not put the entire onboarding process inside the generic auth module.

---

# 4. AUTH ROUTES

Implement or complete:

/login

/register

/verify-email

/verify-contact

/forgot-password

/reset-password

/auth/callback

/mfa

/session-expired

Routes may be adapted to the actual routing conventions.

Do not duplicate existing working routes.

---

# 5. ONBOARDING ROUTES

Use a protected onboarding route namespace.

Recommended:

/onboarding

/onboarding/profile

/onboarding/contact

/onboarding/address

/onboarding/identity

/onboarding/documents

/onboarding/review

/onboarding/status

The exact number of URLs may be simplified if the router structure benefits from fewer nested pages.

However, the UX must remain progressive.

---

# 6. CUSTOMER LIFECYCLE

Create explicit customer lifecycle states.

For example:

VISITOR

REGISTERED

EMAIL_VERIFICATION_REQUIRED

CONTACT_VERIFICATION_REQUIRED

PROFILE_INCOMPLETE

IDENTITY_REQUIRED

IDENTITY_SUBMITTED

IDENTITY_UNDER_REVIEW

ADDITIONAL_DOCUMENT_REQUIRED

IDENTITY_VERIFIED

BANKING_REVIEW

ACTIVE

RESTRICTED

SUSPENDED

CLOSED

Do not expose technical enum values directly to customers.

Map them to friendly UI labels.

---

# 7. ONBOARDING STATUS

Create a separate onboarding progression model.

For example:

NOT_STARTED

CONTACT

PERSONAL_DETAILS

ADDRESS

IDENTITY

DOCUMENTS

REVIEW

COMPLETED

The user's authentication status must not be confused with onboarding completion.

---

# 8. REGISTRATION EXPERIENCE

Registration must feel simple.

Initial registration should request only essential information.

Recommended first step:

First name

Last name

Email

Phone number if required by the product

Password

Acceptance of applicable terms

Primary CTA:

Create my account

Do not ask for the entire banking profile at registration.

---

# 9. MOBILE-FIRST REGISTRATION

On smartphones:

use a single-column form.

Keep important actions reachable.

Avoid long pages containing 15 fields.

Use progressive screens.

Support browser autofill appropriately.

Respect mobile safe areas.

Forms must remain usable when the virtual keyboard is open.

---

# 10. PASSWORD EXPERIENCE

Provide clear password requirements.

Example concepts:

minimum length;

resistance to weak passwords;

confirmation when required.

Do not create absurd password rules such as forcing excessive symbol combinations unless required.

Allow:

Show password

using an accessible action.

Do not log password values.

---

# 11. PASSWORD STRENGTH

If displaying password strength:

use useful guidance rather than decorative scoring.

Avoid vague labels without explanation.

Do not reveal password-validation internals unnecessarily.

---

# 12. TERMS ACCEPTANCE

Registration should support acceptance of:

Terms and Conditions

Privacy Policy

where legally required.

Links must open the corresponding public pages created in PROMPT 02.

Do not pre-check consent boxes.

Separate contractual acceptance from optional marketing consent.

---

# 13. MARKETING CONSENT

If marketing consent is included:

make it optional.

Do not bundle it with account terms.

Do not use dark patterns.

---

# 14. EMAIL VERIFICATION

After registration:

if email verification is required, guide the customer clearly.

Screen example:

Check your email

We sent a verification link to:

j••••@example.com

Actions:

Open email instructions

Resend email

Change email

Do not reveal full contact information unnecessarily on shared screens.

---

# 15. RESEND PROTECTION

Prevent abuse of:

Resend email

Resend OTP

using appropriate cooldown and server-side rate-limit behavior.

Show the cooldown clearly.

Example:

You can request another code in 42 seconds.

Do not implement security purely through disabled frontend buttons.

---

# 16. PHONE VERIFICATION

If phone verification is part of the configured onboarding:

use an OTP flow.

Steps:

Enter phone

Send code

Enter code

Verify

Support:

autocomplete="one-time-code"

where appropriate.

Provide:

Resend code

Change phone number

Do not expose OTP values in logs.

---

# 17. OTP INPUT

Create an accessible OTP component.

It must support:

paste;

keyboard navigation;

mobile numeric keyboard when appropriate;

screen readers;

loading state;

error state.

Do not make OTP entry dependent on six inaccessible separate boxes if this harms accessibility.

---

# 18. LOGIN EXPERIENCE

The login screen should be minimal and reassuring.

Fields:

Email

Password

Actions:

Sign in

Forgot password?

Create an account

Support future alternative authentication such as passkeys without cluttering the initial UI.

---

# 19. LOGIN SECURITY

Do not reveal whether a specific account exists unnecessarily.

Use safe authentication error language where appropriate.

Example:

We couldn't sign you in with those details.

Do not expose raw Supabase errors to customers.

---

# 20. REMEMBER ME

Do not invent insecure custom session persistence.

Use the authentication provider's supported secure session mechanisms.

If a Remember me option is not genuinely required, do not add one only for visual completeness.

---

# 21. PASSWORD RECOVERY

Implement:

Forgot password

→ customer provides email

→ recovery communication sent

→ reset-password screen

→ successful update

→ login or controlled session continuation.

Avoid leaking account existence.

---

# 22. RESET PASSWORD

Reset-password UI must include:

New password

Confirm password if appropriate

Password guidance

Submit

After success:

show a persistent success state.

Optionally invalidate other sessions if supported by the chosen security policy later.

Do not silently redirect without confirmation.

---

# 23. SESSION EXPIRED

Create a clear session-expired state.

Example:

Your session has expired for security reasons.

Sign in again to continue.

Preserve safe navigation context where possible.

Do NOT preserve sensitive unsaved transaction actions automatically.

---

# 24. AUTHENTICATED ROUTE GUARD

Protect:

/app/*

and:

/onboarding/*

according to authentication and banking state.

A user who is not authenticated must not access customer banking pages.

A logged-in user who has not completed required onboarding must be routed appropriately.

---

# 25. ADMIN ROUTE SEPARATION

Do not use customer authentication state alone to grant:

/admin/*

access.

Admin authorization requires explicit authorized staff roles and permissions.

Customer account activation must never imply admin access.

---

# 26. POST-LOGIN ROUTING

After authentication, determine the next screen based on trusted backend state.

Possible logic:

Not verified

→ verification

Profile incomplete

→ onboarding

Identity under review

→ onboarding/status

Active

→ /app/dashboard

Restricted

→ appropriate restriction screen

Do not make routing depend only on localStorage values.

---

# 27. ONBOARDING PRINCIPLE

Onboarding should answer:

What do we need?

Why do we need it?

How long is this section?

What happens next?

Use progressive disclosure.

Do not create an intimidating compliance wall.

---

# 28. ONBOARDING PROGRESS

Create a reusable onboarding progress indicator.

Example:

Step 2 of 5

or:

Profile
Contact
Identity
Review

Do not create fake percentages unless they correspond to actual completed steps.

---

# 29. RESUME ONBOARDING

If the customer leaves midway:

store trusted onboarding progression.

When they return:

resume from the correct incomplete step.

Do not force them to start over.

Do not rely only on browser storage.

---

# 30. PROFILE STEP

Collect required personal details progressively.

Possible fields:

First name

Middle name if applicable

Last name

Date of birth

Nationality where required

Country of residence

Occupation

Do not collect unnecessary information.

---

# 31. DATE OF BIRTH

Use an accessible date input experience.

Validate:

valid date;

reasonable format;

eligibility conditions where applicable.

Do not place age eligibility only in frontend validation.

---

# 32. PERSONAL INFORMATION EDITING

Before final verification submission:

allow users to review and correct their details.

After identity verification:

certain sensitive fields may require controlled amendment workflows instead of immediate edits.

Prepare architecture for this distinction.

---

# 33. ADDRESS STEP

Collect appropriate address information.

Possible structure:

Country

Street/address line

City

Region/state where relevant

Postal code where relevant

Do not assume every country uses identical address formats.

---

# 34. ADDRESS MODEL

Use a structured address model rather than one huge free-text field when practical.

However:

allow flexible fields for jurisdictions where standard assumptions do not fit.

Do not force US-centric fields globally.

---

# 35. CONTACT DETAILS

Maintain separate verified states for:

email

phone

Do not assume that signing in automatically means every contact method is verified.

---

# 36. IDENTITY VERIFICATION INTRODUCTION

Before asking for identity documents, explain:

why verification is needed;

what type of information may be requested;

how documents are handled;

what happens after submission.

Use customer-friendly language.

Do not expose internal risk rules.

---

# 37. KYC ARCHITECTURE

Create a dedicated feature:

src/features/onboarding/

and/or:

src/features/compliance/

for identity-verification UI and customer-facing compliance states.

Customer-facing KYC workflow should not contain admin approval permissions.

Admin review will be implemented later.

---

# 38. IDENTITY DATA MODEL

Prepare explicit entities such as:

customer_profile

identity_verification

verification_document

verification_status_history

Do not store every onboarding field inside one giant JSON blob unless there is a clear technical reason.

Use structured tables for important regulated data.

---

# 39. IDENTITY VERIFICATION STATES

Use explicit states such as:

NOT_STARTED

IN_PROGRESS

SUBMITTED

UNDER_REVIEW

ADDITIONAL_INFORMATION_REQUIRED

VERIFIED

REJECTED

EXPIRED

Do not automatically activate the banking account just because files were uploaded.

---

# 40. DOCUMENT TYPES

The system should be able to support configurable document types.

Examples:

Identity card

Passport

Residence permit

Proof of address

Additional supporting document

Do not hardcode one country's documents as universal requirements.

---

# 41. DOCUMENT UPLOAD

Use Supabase Storage or the configured secure storage boundary.

Document upload UI must support:

select file;

mobile camera/file picker where appropriate;

upload progress;

success state;

failure state;

remove before submission;

replace before final review.

Do not store sensitive verification files in public buckets.

---

# 42. DOCUMENT STORAGE SECURITY

Identity documents must use private storage.

Access must be controlled.

Do not generate publicly accessible permanent URLs.

Do not expose service credentials to the browser.

Administrative document access must later be permission-controlled.

---

# 43. FILE VALIDATION

Validate:

supported file types;

file size;

basic integrity.

Perform authoritative validation server-side where necessary.

Do not trust only browser MIME declarations.

---

# 44. DOCUMENT PREVIEW

Allow safe preview where supported.

Never expose document contents on unrelated pages.

Sensitive previews should not persist in public caches unnecessarily.

---

# 45. DOCUMENT METADATA

Store useful metadata such as:

document type;

upload date;

status;

review state;

expiry date if applicable.

Do not use the user's original filename as the primary business identifier.

---

# 46. DOCUMENT STATUS

Customer-facing statuses may include:

Uploaded

Under review

Accepted

Action required

Expired

Rejected

Use neutral, precise wording.

For rejected files, provide a useful safe explanation when appropriate.

---

# 47. SELFIE / LIVENESS READINESS

Prepare the architecture so a future approved identity provider could support:

selfie verification;

liveness checks;

document verification.

Do NOT invent custom biometric verification logic.

Do NOT build your own facial-recognition security mechanism in the browser.

If no identity provider is configured, keep this as a future integration boundary.

---

# 48. THIRD-PARTY KYC PROVIDERS

Keep KYC-provider-specific logic behind a service boundary.

Example concept:

features/onboarding
→ services/identityVerification

This allows future integration with a regulated verification provider.

Do not spread provider-specific API calls across UI components.

---

# 49. REVIEW SCREEN

Before final submission, create a review step showing:

Personal information

Contact details

Address

Uploaded documents

Allow:

Edit

for sections that are still editable.

Primary CTA:

Submit for verification

Clearly explain that some information may become locked during review.

---

# 50. FINAL SUBMISSION

The submission action must be server-controlled.

It should:

validate required profile data;

validate required contact states;

validate required documents;

change verification state;

create an audit/event record where appropriate.

Do not trust a client request such as:

status = "VERIFIED"

---

# 51. SUBMISSION IDEMPOTENCY

Prevent accidental duplicate verification submissions.

Multiple taps on:

Submit for verification

must not create duplicate cases.

Use loading and server-side protection.

---

# 52. UNDER REVIEW SCREEN

After submission, show a dedicated status page.

Example:

Your identity verification is under review.

Show:

current status;

submission date;

what happens next;

whether any action is currently required.

Do not invent a review completion time unless guaranteed.

---

# 53. ADDITIONAL INFORMATION REQUIRED

If additional documents are required:

show a clear persistent task.

Example:

Additional document required

Requested item:
Proof of address

Reason:
The previous document could not be verified.

Action:

Upload document

Do not expose internal risk scoring.

---

# 54. REJECTION EXPERIENCE

A rejected verification must not simply display:

REJECTED

without guidance.

Where policy permits, explain:

what can be corrected;

whether resubmission is allowed;

how to contact support.

Do not reveal fraud-detection internals.

---

# 55. VERIFIED EXPERIENCE

When identity verification succeeds:

show a clear confirmation.

Example:

Identity verified

Then continue to banking activation if additional checks remain.

Do not automatically claim:

Your bank account is active

unless banking status is truly ACTIVE.

---

# 56. BANKING REVIEW

Separate:

IDENTITY_VERIFIED

from:

BANK_ACCOUNT_ACTIVE.

Possible flow:

Identity verified

→ Banking review

→ Account activated.

This supports future compliance controls.

---

# 57. BANK ACCOUNT ACTIVATION

Only trusted server-side logic may set banking status to:

ACTIVE.

The client UI must never directly mutate this status.

After activation:

route customer to:

/app/dashboard

The full dashboard comes in PROMPT 04/05.

---

# 58. ACCOUNT PENDING ACTIVATION

If verification succeeded but the account is still being activated:

show:

Account setup in progress

with clear context.

Do not show fake balances.

Do not display banking operations as available before activation.

---

# 59. RESTRICTED CUSTOMER

Prepare a restricted-state experience.

Possible situations:

additional verification required;

account temporarily restricted;

legal/compliance review;

security issue.

The UI should explain what the customer can do.

Do not expose internal investigation details.

---

# 60. SUSPENDED CUSTOMER

A suspended account must not see normal transactional CTAs as usable.

Show:

status;

available safe actions;

support path.

The exact suspension-management workflow will be implemented in admin prompts later.

---

# 61. CLOSED ACCOUNT

Prepare a safe closed-account state.

Do not allow new banking transactions.

Historical documents/access behavior can be refined later.

---

# 62. ONBOARDING DASHBOARD

During incomplete onboarding, optionally provide a lightweight onboarding home.

Example:

Your setup

✓ Account created

✓ Email verified

○ Complete profile

○ Verify identity

○ Account activation

CTA:

Continue setup

This is useful when users return later.

---

# 63. ONBOARDING TASK MODEL

Create reusable onboarding tasks.

Possible structure:

id

title

description

status

required

route

completed_at

Do not hardcode progression exclusively in component conditions.

---

# 64. AUTOSAVE

Long onboarding forms may save progress after valid sections.

Do not create surprising background writes on every keystroke for sensitive data.

Prefer controlled:

step save

or debounced save where justified.

Always show clear save state where helpful.

---

# 65. FORM VALIDATION

Use the schema-validation foundation established earlier.

Validate:

client-side for immediate UX;

server-side for authority.

Shared schemas can reduce mismatch where appropriate.

Do not expose backend database schemas directly as UI forms.

---

# 66. FORM ERRORS

Errors should be:

specific;

near the relevant field;

easy to correct.

Example:

Enter a valid email address.

Not:

Validation error 422.

---

# 67. SERVER ERRORS

Map server failures into safe messages.

Example:

We couldn't save your information right now.

Try again.

Do not expose:

SQL errors;

Supabase internal identifiers;

stack traces.

---

# 68. NETWORK INTERRUPTION

Because this application is online-only:

if network access is lost during onboarding:

show a clear connectivity message.

Do not pretend data was submitted successfully.

Do not queue identity submissions offline.

Provide:

Retry

when connectivity returns.

---

# 69. UNSAVED CHANGES

For forms where losing significant work matters:

warn the customer before leaving when appropriate.

Do not create excessive confirmation dialogs for minor edits.

---

# 70. AUTHENTICATION LOADING

During session restoration:

show an appropriate application-shell loading state.

Do not flash:

public page

then authenticated page

or vice versa.

Avoid exposing private content before session validation finishes.

---

# 71. SESSION MANAGEMENT FOUNDATION

Prepare the customer security architecture for future:

active sessions;

devices;

session revocation;

MFA.

Full account security management will be implemented in PROMPT 11.

Do not implement fake device detection here.

---

# 72. MFA FOUNDATION

Prepare authentication flows so MFA can later be required for:

login;

sensitive actions;

security changes.

Do not force every customer through an unfinished MFA experience unless configured.

---

# 73. STEP-UP AUTHENTICATION

Prepare the concept of:

recent authentication

or:

step-up authentication

for future sensitive actions.

Examples later:

confirm transfer;

change security settings;

reveal sensitive information.

Do not implement financial-action MFA yet.

---

# 74. PASSKEY READINESS

Keep authentication UI architecture compatible with future passkey support.

Do not build custom WebAuthn logic unless the current backend integration supports it properly.

---

# 75. BOT / ABUSE PROTECTION

Prepare registration and recovery flows for appropriate abuse protection.

Do not implement weak custom CAPTCHA logic.

If rate limiting or challenge systems are needed, keep them server-enforced.

---

# 76. EMAIL ENUMERATION

Avoid obvious account-enumeration behavior.

For recovery, responses may use language similar to:

If an account matches those details, we'll send recovery instructions.

Balance security with good UX.

---

# 77. AUTH RATE LIMITING

Authentication security must not depend only on UI delays.

Use platform/server protections for:

repeated login attempts;

OTP requests;

password-reset requests;

registration abuse.

Do not expose exact internal risk thresholds.

---

# 78. AUDIT EVENTS

Prepare safe event logging for relevant account-security activity.

Examples:

account_created

email_verified

phone_verified

password_changed

identity_submitted

verification_status_changed

banking_account_activated

Do not store secrets inside event payloads.

---

# 79. CUSTOMER-FACING ACTIVITY

Not every audit event must be shown to the customer.

Future security pages may show:

new login;

password changed;

MFA enabled.

Keep internal and customer-visible event streams conceptually separate.

---

# 80. PROFILE DATA SECURITY

Sensitive profile information must be protected through:

RLS;

server authorization;

least-privilege queries.

A customer must only access their own profile unless explicitly authorized otherwise.

---

# 81. PROFILE TABLE

If not already present, create a profile entity linked to the authenticated user's stable auth identifier.

Do not use email as the permanent primary relationship key.

Email can change.

---

# 82. USER IDENTITY

Use immutable internal identifiers.

Do not expose sensitive internal IDs unnecessarily in URLs or UI.

---

# 83. CUSTOMER NUMBER

Prepare for a future customer-facing reference number separate from auth IDs.

Do not use Supabase auth UUID as the visible bank customer number.

---

# 84. ONBOARDING COMPLETION

Do not determine completion by checking one field.

Use trusted status and required-task completion.

The backend remains authoritative.

---

# 85. DATA MINIMIZATION

Collect only information required for legitimate product or regulatory purposes.

Do not collect:

unnecessary personal details;

irrelevant profile questions;

sensitive information for marketing convenience.

---

# 86. PRIVACY COPY

Where sensitive information is requested, use short contextual privacy explanations.

Example:

We use this information to verify your identity.

Link to:

Privacy Policy

where appropriate.

---

# 87. AUTH PAGE DESIGN

Reuse PROMPT 01 design system.

Authentication pages should feel:

clean;

premium;

secure;

focused.

Avoid huge marketing distractions during login.

Desktop may use a split layout.

Mobile should prioritize the form.

---

# 88. AUTH DESKTOP LAYOUT

On larger screens, authentication pages may use:

left:
brand/security/product visual

right:
auth form.

Do not make the visual side essential for completing the task.

---

# 89. AUTH MOBILE LAYOUT

On mobile:

brand mark;

clear title;

short context;

form;

primary action;

secondary links.

Avoid enormous hero illustrations.

Keep the primary form visible quickly.

---

# 90. ONBOARDING LAYOUT

Create a dedicated OnboardingLayout.

Possible desktop behavior:

compact brand header

progress sidebar

main step content.

Mobile:

compact top bar

progress indicator

step content

sticky action area where useful.

Do not reuse PublicLayout navigation during KYC.

---

# 91. MOBILE STICKY ACTION

For long mobile onboarding steps, a safe sticky bottom action area may contain:

Continue

or:

Submit.

It must respect:

safe-area-inset-bottom.

Never cover form fields.

---

# 92. BUTTON LABELS

Use explicit actions.

Examples:

Create my account

Verify email

Verify phone

Save and continue

Review information

Submit for verification

Return to login

Avoid generic:

Next

where clearer wording is possible.

---

# 93. BACK NAVIGATION

Allow safe back navigation between editable onboarding steps.

Do not allow navigating backward to mutate completed security events such as:

email verification

as though they never occurred.

---

# 94. PROGRESSIVE LOCKING

Some data may become non-editable after verification submission.

Architect forms so fields can have states:

editable

read-only

change-request-required.

Do not hardcode all profile data as permanently editable.

---

# 95. SUPPORT DURING ONBOARDING

Provide access to:

Help

or:

Contact support

without forcing the customer to abandon onboarding.

Do not expose admin messaging directly yet.

---

# 96. ACCESSIBILITY

All authentication and onboarding flows must meet the accessibility foundation.

Verify:

labels;

error associations;

keyboard navigation;

focus management;

screen-reader announcements;

OTP accessibility;

document uploader accessibility;

modal accessibility;

progress semantics;

contrast;

reduced motion.

---

# 97. SCREEN READER PROGRESS

Do not rely solely on visual stepper graphics.

Expose meaningful progress text such as:

Step 3 of 5: Identity verification.

---

# 98. DOCUMENT UPLOAD ACCESSIBILITY

Upload controls must have visible labels.

Drag-and-drop may exist on desktop but cannot be the only upload method.

Mobile users must be able to use normal file selection.

---

# 99. RESPONSIVE VALIDATION

Test approximately:

320px

360px

375px

390px

430px

768px

1024px

1280px

Check:

registration;

login;

OTP;

password reset;

profile steps;

address steps;

identity introduction;

document uploads;

review;

status pages.

---

# 100. VIRTUAL KEYBOARD TESTING

Pay special attention to mobile virtual keyboards.

Ensure:

focused fields remain visible;

sticky buttons do not cover inputs;

pages remain scrollable;

OTP remains reachable;

browser chrome does not break height calculations.

---

# 101. SAFE AREA

All full-screen mobile auth/onboarding flows must respect:

safe-area-inset-top

safe-area-inset-bottom.

---

# 102. PERFORMANCE

Authentication pages must load quickly.

Do not load:

customer dashboard charts;

admin dependencies;

large marketing assets

during login/onboarding.

Keep onboarding bundles scoped.

---

# 103. ROUTE LAZY LOADING

Use route/code splitting where supported.

Heavy identity/document features should not inflate the public homepage bundle.

---

# 104. SECURITY HEADERS / SERVER FOUNDATION

Preserve the secure server/runtime configuration established by the project.

Do not weaken security headers simply to make authentication easier.

Do not introduce unsafe inline scripts unnecessarily.

---

# 105. REDIRECT SAFETY

When supporting redirect parameters after login:

validate allowed internal destinations.

Do not create an open redirect vulnerability.

Example:

redirect=/app/accounts

may be valid.

Arbitrary external redirect URLs should not be trusted.

---

# 106. CALLBACK SAFETY

Authentication callback routes must safely process supported auth callbacks.

Do not display secret tokens in UI.

Do not log auth tokens.

Do not leave tokens unnecessarily in the URL.

---

# 107. NO LOCALSTORAGE AUTHORIZATION

Do not use:

localStorage.role

localStorage.isVerified

localStorage.isAdmin

as authoritative security state.

Local UI preferences may use browser storage.

Authorization state must come from trusted backend/session data.

---

# 108. CUSTOMER CONTEXT

Create a clean authenticated customer context/provider only if required by the current architecture.

It may expose safe data such as:

customer ID;

display name;

customer lifecycle state;

onboarding state.

Avoid turning it into a giant global store containing the entire bank.

---

# 109. STATE MANAGEMENT

Use the simplest appropriate state-management approach.

Do not install a heavyweight state library solely for onboarding if existing React/TanStack patterns are sufficient.

Remote server state should remain server/query-managed.

---

# 110. SUPABASE RLS

For onboarding/customer tables:

enable RLS.

Customers may access only their permitted records.

Do not create broad policies such as:

authenticated users can select all profiles.

Admin access will use separate permission rules later.

---

# 111. EXAMPLE DATA BOUNDARIES

Possible entities may include:

customer_profiles

customer_contacts

customer_addresses

onboarding_cases

identity_verifications

verification_documents

customer_status_history

These are conceptual names.

Adapt naming to existing project conventions.

Do not duplicate equivalent tables.

---

# 112. STATUS HISTORY

Important lifecycle transitions should preserve history.

Example:

PROFILE_INCOMPLETE

→ IDENTITY_SUBMITTED

→ IDENTITY_UNDER_REVIEW

→ IDENTITY_VERIFIED

Do not simply overwrite status without any event/history where auditability matters.

---

# 113. SERVER COMMANDS

Sensitive status transitions should be controlled through server-side commands/functions.

Examples:

submitIdentityVerification()

requestAdditionalDocument()

completeCustomerActivation()

Do not allow arbitrary client status updates.

---

# 114. CUSTOMER CANNOT SELF-VERIFY

A customer must never be able to send:

verification_status = VERIFIED

banking_status = ACTIVE

role = ADMIN

from the frontend and have it accepted.

Enforce this at the database/server layer.

---

# 115. ADMIN REVIEW BOUNDARY

Do not implement full admin KYC review in this prompt.

Prepare backend/data boundaries only.

Actual staff workflows will be implemented in the administration prompts.

---

# 116. DEMO / DEVELOPMENT MODE

If real identity-provider integrations are not available yet:

support development-safe verification fixtures.

Clearly separate them from production logic.

Never present demo verification as real regulatory verification.

Do not implement a hidden production bypass.

---

# 117. DEVELOPMENT SEED USERS

If seed accounts are useful:

keep them development-only.

Never expose demo passwords publicly in production screens.

---

# 118. TEST SCENARIOS

Validate at least these flows.

SCENARIO A

New visitor

→ Register

→ Verify contact

→ Complete profile

→ Submit identity

→ Under review.

SCENARIO B

Returning user with incomplete onboarding

→ Login

→ Resume correct step.

SCENARIO C

Identity requires additional document

→ Login

→ Status page

→ Upload requested document

→ Resubmit.

SCENARIO D

Verified + activated customer

→ Login

→ /app/dashboard.

SCENARIO E

Password forgotten

→ Recovery

→ Password reset

→ Login.

SCENARIO F

Unauthenticated visitor manually opens /app/dashboard

→ Redirect to login.

SCENARIO G

Customer attempts /admin

→ Access denied.

---

# 119. ERROR TESTING

Test:

wrong password;

expired reset link;

invalid OTP;

expired OTP;

network failure;

duplicate registration attempt;

upload failure;

oversized document;

unsupported document type;

session expiration;

server validation failure.

Do not leave unhandled blank screens.

---

# 120. SECURITY TESTING

Verify:

customer cannot access another profile;

customer cannot retrieve another customer's verification documents;

customer cannot change protected status fields;

customer cannot activate themselves;

customer cannot set staff roles;

private documents are not public;

auth routes do not leak secrets.

---

# 121. CURRENT IMPLEMENTATION SCOPE

Implement in this prompt:

1. Registration.
2. Login.
3. Email/contact verification foundation.
4. OTP UI where required.
5. Password recovery.
6. Password reset.
7. Auth callbacks.
8. Session-expired state.
9. Auth route protection.
10. Post-login lifecycle routing.
11. Onboarding layout.
12. Progressive onboarding.
13. Personal profile.
14. Address/contact information.
15. Identity-verification introduction.
16. Verification-case architecture.
17. Secure document upload foundation.
18. Review screen.
19. Verification-status screen.
20. Additional-document flow.
21. Banking activation-state routing.
22. Restricted/pending states.
23. Mobile-first validation.
24. Accessibility validation.
25. RLS/security boundaries.
26. Audit/status-history foundation.

---

# 122. DO NOT IMPLEMENT YET

Do NOT implement:

real customer dashboard;

real balances;

ledger;

full transaction engine;

real internal transfers;

beneficiaries;

bank statements;

full customer messaging;

customer notification center;

admin KYC review UI;

admin account adjustments;

transfer compliance engine.

These are future prompts.

---

# 123. PRESERVE PUBLIC WEBSITE

Do not break:

homepage;

features;

accounts;

security;

about;

pricing;

help;

legal pages.

Public:

Open an account

must route correctly into registration.

Public:

Sign in

must route correctly into login.

---

# 124. PRESERVE DESIGN SYSTEM

Reuse existing:

buttons;

forms;

alerts;

cards;

stepper;

progress;

dialogs;

bottom sheets;

loading;

error states;

theme tokens.

Do not build a second auth-specific UI library.

---

# 125. CODE QUALITY

Avoid giant onboarding components.

Prefer focused steps.

Example conceptual organization:

features/
  auth/
    components/
    services/
    schemas/

  onboarding/
    components/
    steps/
    services/
    schemas/
    types/

Do not create empty folders unnecessarily.

---

# 126. FINAL BUILD VALIDATION

Before completion:

run build;

run TypeScript checks;

resolve broken imports;

resolve route conflicts;

resolve obvious accessibility issues;

remove accidental console logging of sensitive values.

---

# 127. FINAL SECURITY REVIEW

Explicitly verify:

No passwords stored outside the auth provider.

No OTP values logged.

No auth tokens printed.

No service-role key exposed.

No public identity-document bucket.

No customer-controlled verification approval.

No customer-controlled account activation.

No localStorage authorization.

No unauthorized admin access.

---

# 128. FINAL MOBILE REVIEW

Confirm:

registration works at 320px;

login works at 320px;

OTP works on mobile;

virtual keyboard does not block controls;

document upload works from mobile browser;

progress indicator remains readable;

sticky buttons respect safe areas;

no horizontal overflow exists.

---

# 129. FINAL REPORT

At completion provide:

AUTH ROUTES CREATED

ONBOARDING ROUTES CREATED

AUTHENTICATION FLOW

REGISTRATION FLOW

CONTACT VERIFICATION

PASSWORD RECOVERY

SESSION HANDLING

CUSTOMER LIFECYCLE STATES

ONBOARDING STATES

PROFILE DATA MODEL

IDENTITY VERIFICATION FOUNDATION

DOCUMENT STORAGE

RLS POLICIES

ROUTE GUARDS

SECURITY CONTROLS

MOBILE IMPROVEMENTS

ACCESSIBILITY

FILES CREATED

FILES MODIFIED

DATABASE CHANGES

STORAGE CHANGES

SERVER FUNCTIONS

DEPENDENCIES ADDED

TEST SCENARIOS VALIDATED

KNOWN TODOs

Also explicitly confirm:

- project builds successfully;
- TypeScript passes;
- registration works;
- login works;
- password recovery works;
- incomplete customers resume onboarding;
- active customers route toward `/app/dashboard`;
- unauthorized users cannot access `/app`;
- ordinary customers cannot access `/admin`;
- identity documents are private;
- customers cannot mark themselves verified;
- customers cannot activate their own banking account;
- no offline-first architecture was introduced;
- PROMPT 00 architecture remains intact;
- PROMPT 01 design system is reused;
- PROMPT 02 public website remains functional.

Stop after completing authentication and onboarding.

Do NOT automatically implement the customer dashboard.

The next phase is:

PROMPT 04 — CUSTOMER BANKING APP SHELL, NAVIGATION & MEMBER EXPERIENCE.