# PROMPT 11 — CUSTOMER SECURITY CENTER, MFA, DEVICES, SESSIONS & SENSITIVE ACTION PROTECTION

Continue from PROMPT 00 through PROMPT 10.

Do NOT rebuild the architecture.

Do NOT replace the existing authentication system.

Do NOT weaken Supabase Auth, customer lifecycle rules, route authorization, ledger security, transfer integrity, document security or communication security.

Do NOT introduce offline-first behavior.

This phase implements the complete CUSTOMER SECURITY CENTER.

The objective is to create:

- multi-factor authentication;
- stronger authentication for sensitive actions;
- session management;
- active-device visibility;
- session revocation;
- login activity;
- security event history;
- password management;
- contact/security verification;
- passkey readiness;
- trusted-device readiness;
- suspicious-login alerts;
- account-security status;
- security recommendations;
- protection of transfer confirmation;
- protection of sensitive account actions;
- recovery-security flows;
- mobile-first security UX.

The security center must be understandable by ordinary customers while remaining technically strict.

---

# 1. SECURITY PRINCIPLE

Security must use multiple independent layers.

Conceptually:

IDENTITY

+

AUTHENTICATION

+

SESSION

+

DEVICE CONTEXT

+

AUTHORIZATION

+

STEP-UP AUTHENTICATION

+

AUDIT

+

NOTIFICATION.

Do not treat a simple successful login as permanent authorization for every sensitive banking operation.

---

# 2. SECURITY MODULE

Create or complete:

```text
src/features/security/
```

Possible structure:

```text
security/
├── components/
├── hooks/
├── services/
├── schemas/
├── types/
├── pages/
├── server/
└── utils/
```

Do not duplicate auth logic from:

```text
features/auth/
```

The auth domain proves identity/login.

The security domain manages the authenticated customer's security controls.

---

# 3. CUSTOMER SECURITY ROUTE

Fully implement:

```text
/app/security
```

Potential supporting routes:

```text
/app/security/password
/app/security/mfa
/app/security/sessions
/app/security/devices
/app/security/activity
/app/security/passkeys
```

Only create dedicated routes where they improve usability.

---

# 4. SECURITY CENTER HOME

The main Security page should answer:

Is my account protected?

What security methods are enabled?

Which devices/sessions are active?

Was there any unusual activity?

What can I improve?

Recommended sections:

Security status

MFA

Password

Passkeys if supported

Devices & sessions

Recent security activity

Recovery/contact information

Security notifications.

---

# 5. SECURITY SCORE CAUTION

Do NOT create a fake gamified security score such as:

87/100

unless it maps to meaningful configured security controls.

Prefer clear states:

Strong protection

Action recommended

Security action required.

---

# 6. SECURITY STATUS

Create a reusable SecurityStatus component.

Possible overall states:

PROTECTED

RECOMMENDATION_AVAILABLE

ACTION_REQUIRED

RESTRICTED.

This is customer-facing presentation.

It must not replace real internal security/risk state.

---

# 7. AUTHENTICATION METHODS

Prepare explicit supported methods.

Examples:

PASSWORD

EMAIL_OTP

SMS_OTP where configured

TOTP

PASSKEY

RECOVERY_CODE where applicable.

Do not invent proprietary cryptography.

---

# 8. SUPABASE AUTH

Use supported Supabase Auth security functionality whenever appropriate.

Do not create:

custom password hashing;

custom password database;

custom authentication-token format.

Keep privileged authentication logic server/platform-controlled.

---

# 9. MFA

Implement a proper Multi-Factor Authentication foundation.

Prefer supported mechanisms such as:

TOTP

and other provider-supported MFA methods.

Do not create fake MFA that only asks the customer's normal password twice.

---

# 10. MFA STATUS

Customer Security Center should clearly display:

Multi-factor authentication

Enabled

or:

Not enabled.

If mandatory due to policy:

Required.

---

# 11. MFA ENROLLMENT

Recommended flow:

1. Security introduction
2. Recent-authentication verification
3. Generate/enroll authenticator secret using provider-supported mechanism
4. Customer scans QR / enters setup key
5. Customer enters verification code
6. Server/provider verifies
7. MFA becomes active
8. Recovery options shown if applicable.

---

# 12. MFA SECRET

Never store or expose MFA secrets in arbitrary frontend logs.

Do not persist enrollment secret in localStorage.

Use provider-supported secure enrollment flow.

---

# 13. TOTP

If TOTP is supported:

provide QR-code enrollment

+

manual setup key fallback.

The setup key must only be visible during secure enrollment as required.

Do not display it permanently after enrollment.

---

# 14. MFA CONFIRMATION

MFA must not become enabled until the customer has successfully completed the verification challenge.

---

# 15. MFA FAILURE

If code is invalid:

display:

The verification code is incorrect or expired.

Do not expose internal provider errors.

---

# 16. MFA DISABLE

Disabling MFA is a sensitive operation.

Require:

recent authentication

+

step-up verification

according to security policy.

Do not allow disabling MFA with one casual button tap.

---

# 17. MFA DISABLE CONFIRMATION

Clearly communicate:

Turning off multi-factor authentication reduces account protection.

Use a confirmation dialog.

Do not use frightening or manipulative wording.

---

# 18. MFA DISABLE EVENT

Successful MFA disablement must create:

security audit event

+

customer notification.

---

# 19. MFA ENABLE EVENT

Create:

mfa_enabled

security event

and appropriate customer notification.

---

# 20. RECOVERY CODES

If the selected authentication system supports recovery codes safely:

allow generation/display once.

Provide:

Download

Copy

Print

only where appropriate.

Never persist plaintext recovery codes in browser storage.

If unavailable through the provider, do not fake them.

---

# 21. RECOVERY CODE WARNING

Explain that recovery codes should be stored safely.

Do not encourage storing them inside public/shared notes.

---

# 22. PASSKEY READINESS

Implement passkey support only if the current authentication stack supports it reliably.

If actual provider support is incomplete:

create an integration-ready architecture

without pretending passkeys are enabled.

---

# 23. PASSKEY UX

If supported:

Security → Passkeys

Actions:

Add passkey

View registered passkeys

Remove passkey.

Use customer-friendly device labels.

---

# 24. PASSKEY CREATION

Use proper WebAuthn/provider APIs.

Do not implement your own cryptographic challenge logic unless required by supported backend integration.

---

# 25. PASSKEY REMOVAL

Require recent or step-up authentication before removing the final strong authentication method when policy requires it.

---

# 26. PASSKEY LABEL

Allow a customer-safe label such as:

Pixel 8 Pro

Personal laptop

Work computer.

Do not treat user-entered label as verified hardware identity.

---

# 27. PASSWORD MANAGEMENT

Implement:

Change password.

Flow:

verify current/recent authentication where required

→ new password

→ confirmation

→ update via Supabase Auth

→ success confirmation.

---

# 28. PASSWORD CHANGE

Do not directly modify auth provider tables.

Use supported password update APIs.

---

# 29. PASSWORD VALIDATION

Use strong but reasonable password requirements.

Do not impose arbitrary complexity that reduces usability.

Prevent obviously weak/common passwords when supported.

---

# 30. PASSWORD AUTOCOMPLETE

Use appropriate autocomplete values:

current-password

new-password.

Support password managers.

Do not prevent copy/paste into password fields.

---

# 31. PASSWORD SUCCESS

After password change:

show persistent confirmation.

Create:

password_changed

security event.

---

# 32. PASSWORD NOTIFICATION

Send an in-app and configured security notification.

Example:

Your password was changed.

If this wasn't you, review your account security.

---

# 33. SESSION MODEL

Create a customer-facing session model.

Conceptually:

```text
session_id
customer_id
started_at
last_seen_at
device_summary
browser_summary
platform_summary
ip_context
approximate_location nullable
current_session
status
```

Do not store more device data than required.

---

# 34. SESSION SOURCE

Use real session/authentication data where available.

Do not fabricate device sessions from browser UI alone.

If some metadata is not available from Supabase directly:

create controlled server-side session metadata at authentication time.

---

# 35. ACTIVE SESSIONS PAGE

Implement:

```text
/app/security/sessions
```

or equivalent section.

Show:

Current session

Other active sessions

Last activity

Browser/device summary

Approximate location only when reliably available.

---

# 36. CURRENT SESSION

Clearly label:

This device

or:

Current session.

Do not let customer accidentally revoke it without explicit confirmation.

---

# 37. OTHER SESSION

Example:

Chrome on Windows

Last active: 2 hours ago.

Use only trusted information.

---

# 38. DEVICE FINGERPRINTING CAUTION

Do NOT build invasive browser fingerprinting.

Use normal session/device metadata.

Security must not rely on covert tracking.

---

# 39. LOCATION CAUTION

IP-derived location is approximate.

If shown, communicate approximation.

Do not claim:

Exact location

unless truly available and appropriate.

---

# 40. SESSION REVOCATION

Allow:

Sign out this session

for other active sessions.

Server must actually invalidate/revoke session authorization where supported.

Do not merely hide session from UI.

---

# 41. SIGN OUT OTHER SESSIONS

Provide:

Sign out all other sessions.

This is a sensitive action.

Require recent authentication/step-up where appropriate.

---

# 42. SIGN OUT ALL

Potential option:

Sign out all sessions

including current session.

After success:

redirect safely to login.

---

# 43. SESSION REVOCATION EVENT

Create:

session_revoked

or:

all_other_sessions_revoked

security event.

---

# 44. SESSION REVOCATION NOTIFICATION

Notify customer where appropriate.

Do not create excessive duplicate alerts.

---

# 45. SESSION EXPIRATION

Respect existing authentication expiration rules.

Do not invent client-only session duration.

---

# 46. SESSION ID SECURITY

Never expose raw sensitive session tokens.

Customer-facing session references should be safe opaque IDs.

---

# 47. NO TOKEN DISPLAY

Do not show:

access token

refresh token

JWT

session secret

in security screens.

---

# 48. DEVICE MODEL

Prepare a customer-safe registered-device/session-device concept.

Possible fields:

public_reference

device_label

device_family

browser

platform

first_seen

last_seen

trusted_status

last_login_at.

Do not claim hardware identity beyond available data.

---

# 49. DEVICES VS SESSIONS

Keep these concepts separate.

DEVICE:

recognized usage context.

SESSION:

active authentication authorization.

One device may have multiple sessions over time.

---

# 50. TRUSTED DEVICE

Prepare architecture for a future:

Trusted device

policy.

Do not automatically trust a device simply because the customer logged in once.

---

# 51. TRUSTED DEVICE SECURITY

If trusted-device behavior is implemented:

use server-side policy and secure token mechanism.

Do not set:

localStorage.trustedDevice = true

as authority.

---

# 52. REMOVE DEVICE

Removing a recognized/trusted device should revoke relevant trust/session state where applicable.

---

# 53. NEW DEVICE EVENT

When authentication occurs from a new recognized device context:

create:

new_device_detected

security event.

---

# 54. NEW LOGIN EVENT

Every meaningful new authenticated session should create:

new_login

with safe metadata.

---

# 55. NEW LOGIN NOTIFICATION

Use PROMPT 10 notification system.

In-app:

New sign-in detected.

Configured email/push:

New sign-in to your account.

Avoid sending full sensitive IP/device details in lock-screen notification body.

---

# 56. LOGIN ACTIVITY

Implement customer-facing:

Recent security activity.

Examples:

Signed in

Password changed

MFA enabled

MFA disabled

Session revoked

Passkey added

Passkey removed

Security contact changed.

---

# 57. SECURITY EVENT ENTITY

Create an immutable customer-security event model.

Conceptual:

```text
id
public_reference
customer_id
event_type
severity
created_at
session_reference nullable
device_reference nullable
safe_metadata
```

Do not store raw authentication secrets.

---

# 58. SECURITY EVENT TYPES

Support:

LOGIN_SUCCESS

LOGIN_FAILURE_SUMMARY if appropriate

NEW_DEVICE

PASSWORD_CHANGED

MFA_ENABLED

MFA_DISABLED

PASSKEY_ADDED

PASSKEY_REMOVED

SESSION_REVOKED

SECURITY_CONTACT_CHANGED

RECOVERY_ACTION

SENSITIVE_ACTION_CHALLENGE

SECURITY_RESTRICTION.

---

# 59. CUSTOMER-SAFE EVENT DETAILS

Example:

Sign-in

Chrome on Android

25 Aug 2026, 14:30

Approx. Yaoundé

only when reliable.

Do not expose internal risk engine signals.

---

# 60. SECURITY EVENT IMMUTABILITY

Customers cannot edit or delete security history.

---

# 61. FAILED LOGIN HISTORY

Be careful with failed-login display.

Do not expose attack-sensitive information or create unlimited noisy entries.

A summarized customer warning may be appropriate.

---

# 62. SUSPICIOUS LOGIN

Prepare architecture for an internal security decision such as:

SUSPICIOUS_LOGIN_DETECTED.

Do not create arbitrary fake risk scoring.

---

# 63. SUSPICIOUS LOGIN CUSTOMER UX

Possible notification:

We noticed a sign-in that may be unfamiliar.

Actions:

Review activity

Secure my account.

Do not claim an attack definitely occurred unless verified.

---

# 64. SECURE MY ACCOUNT FLOW

Create a guided security-recovery action.

Potential actions:

Change password

Enable MFA

Review sessions

Sign out other sessions

Review recent activity.

Do not create one dangerous "reset everything" action without clarity.

---

# 65. SECURITY CONTACTS

Display verified contact channels used for security:

verified email

verified phone where applicable.

Do not make these editable directly from security display if a controlled profile/contact verification flow already exists.

---

# 66. CONTACT CHANGE

Changing a verified security email/phone must use a controlled re-verification flow.

Do not allow:

email = new value

and instantly trust it.

---

# 67. CONTACT CHANGE SECURITY

Require:

recent authentication

and potentially MFA

before changing trusted contact details.

---

# 68. CONTACT CHANGE NOTIFICATION

Notify both:

old verified contact where appropriate

and new verified contact after verification

according to security policy.

---

# 69. SECURITY ALERT PREFERENCES

Critical security alerts must not be fully disabled where policy requires them.

Reuse notification-preferences foundation from PROMPT 10.

---

# 70. STEP-UP AUTHENTICATION

Implement a reusable step-up authentication service.

Purpose:

require stronger/recent proof before sensitive actions.

---

# 71. STEP-UP USE CASES

Potential sensitive actions:

confirming certain transfers

changing password

disabling MFA

adding/removing passkey

changing security contact

revealing particularly sensitive information

revoking all sessions

future admin-like customer security changes.

---

# 72. STEP-UP IS NOT A UI MODAL ONLY

It must be server-authoritative.

Do not consider a sensitive action approved simply because the frontend displayed an MFA dialog.

---

# 73. AUTHENTICATION ASSURANCE LEVEL

Prepare a simple concept of authentication assurance.

Example:

BASE_AUTH

MFA_VERIFIED

RECENT_MFA_VERIFIED.

Do not overbuild an enterprise IAM system.

---

# 74. RECENT AUTHENTICATION

Sensitive actions may require authentication within a recent trusted window.

Do not hardcode arbitrary durations throughout the code.

Centralize policy.

---

# 75. STEP-UP CHALLENGE

Conceptual flow:

customer initiates sensitive action

→ server says STEP_UP_REQUIRED

→ UI opens authentication challenge

→ customer completes MFA/passkey/password re-auth

→ server records short-lived elevated assurance

→ original action may continue.

---

# 76. STEP-UP TOKEN/STATE

Use provider/server-supported secure state.

Do not create long-lived browser flags such as:

```text
mfaPassed=true
```

---

# 77. STEP-UP EXPIRATION

Elevated authorization should expire.

Do not keep permanent elevated state for the entire login lifetime.

---

# 78. TRANSFER SECURITY INTEGRATION

Integrate with PROMPT 07/08.

Transfer confirmation must support policy such as:

Normal internal transfer

→ standard confirmation or step-up depending on configuration.

Higher-risk / external transfer

→ stronger step-up may be required.

---

# 79. NO HARDCODED RISK THRESHOLDS

Do not invent:

transfer > 5000 requires MFA

unless configured as development policy.

Keep security rules configurable.

---

# 80. TRANSFER SERVER AUTHORITY

The transfer service decides whether step-up is required.

Frontend cannot choose:

skipMfa = true.

---

# 81. STEP-UP FAILURE

If authentication challenge fails:

do not execute the sensitive action.

No ledger posting.

No hold creation unless workflow deliberately reserved before challenge.

Prefer challenge before irreversible financial processing.

---

# 82. STEP-UP TIMEOUT

If challenge expires:

return user to safe review state.

Do not silently submit transfer afterward.

---

# 83. INTERNAL TRANSFER

For internal transfer that completes instantly:

final financial execution only after any required step-up succeeds.

---

# 84. EXTERNAL TRANSFER

For external transfers:

security confirmation is one real milestone in 0→99 progression.

It can move progress only after authoritative success.

---

# 85. SECURITY PROGRESS INTEGRITY

Do not advance transfer progress because customer merely opened the MFA screen.

Advance only after challenge success.

---

# 86. SENSITIVE DATA REVEAL

Prepare reusable protection for revealing:

full account identifier

sensitive document

security recovery code.

Depending on risk:

require explicit user interaction

and optional recent authentication.

---

# 87. ACCOUNT NUMBER REVEAL

Do not necessarily require MFA every time if product policy does not justify it.

Keep policy configurable.

---

# 88. PRIVACY MODE

Privacy mode remains a visual protection feature only.

It is NOT a substitute for:

MFA

authorization

step-up.

---

# 89. ACCOUNT LOCK / SECURITY RESTRICTION

Prepare a security restriction state when necessary.

Examples:

SECURITY_REVIEW

TEMPORARY_RESTRICTION.

Do not let the browser self-set or self-clear security restrictions.

---

# 90. SECURITY RESTRICTION UX

Show:

Your account has temporary security restrictions.

Available actions:

Review security

Contact bank.

Do not expose fraud-detection internals.

---

# 91. EMERGENCY SESSION REVOCATION

Provide a prominent action:

Sign out other devices.

Useful when customer suspects unauthorized access.

Require appropriate verification.

---

# 92. PASSWORD COMPROMISE FLOW

If customer chooses:

I think someone knows my password

guide them through:

Change password

Sign out other sessions

Review MFA

Review activity.

---

# 93. LOST DEVICE FLOW

Provide help pathway:

I lost a device.

Recommended actions:

review active sessions

revoke device/session

review passkeys

change security credentials if necessary.

---

# 94. LOST PHONE WITH MFA

Prepare help/recovery architecture.

Do not create unsafe bypass such as:

"I lost my phone → disable MFA automatically."

Recovery requires secure identity/authentication policy.

---

# 95. ACCOUNT RECOVERY

Keep account recovery separate from normal password reset where stronger controls are needed.

Do not build a weak security-question system.

---

# 96. SECURITY QUESTIONS

Do NOT implement traditional security questions such as:

mother's maiden name

first school

pet name.

These are weak and unnecessary.

---

# 97. RECOVERY SERVICE BOUNDARY

Prepare a secure account-recovery workflow for future/manual bank assistance.

Potential:

recovery case

identity confirmation

staff review.

Do not expose bypass logic.

---

# 98. SUPPORT INTEGRATION

Security Center should allow:

Contact security support.

Use secure messaging from PROMPT 10.

Link conversation category:

SECURITY.

---

# 99. SECURITY NOTIFICATIONS IN CENTER

Show recent critical notifications or a shortcut to:

Notifications → Security.

Do not duplicate the entire notification system.

---

# 100. SECURITY DASHBOARD CARD

Dashboard may show:

Security action required

only when necessary.

Do not permanently show security marketing cards in the banking dashboard.

---

# 101. CUSTOMER SECURITY HEADER

Security page may display:

Account protection

MFA enabled

Active sessions count

Last sign-in.

Keep it compact.

---

# 102. SECURITY RECOMMENDATIONS

Possible recommendations:

Enable MFA

Review an unfamiliar session

Add passkey when supported.

Only show actions that are actually relevant.

---

# 103. NO FAKE RECOMMENDATION

Do not say:

Your password is compromised

unless there is authoritative evidence.

Use:

Consider strengthening your account protection

where appropriate.

---

# 104. SESSION COUNT

Use server query:

getActiveSessionCount()

Do not load all session metadata merely to show count.

---

# 105. SECURITY ACTIVITY PAGINATION

Use server-side pagination for long security history.

---

# 106. SESSION PAGINATION

Most customers will have few active sessions.

Do not overengineer pagination unless necessary.

---

# 107. SECURITY DATA RLS

Customers may read only their own:

security events

device records

session-safe records

MFA/security settings.

---

# 108. SECURITY WRITE RULE

Customers must not directly manipulate raw:

security-event tables

session status

MFA state

trusted-device status

security restriction status.

Use controlled server/provider actions.

---

# 109. SESSION REVOCATION AUTHORIZATION

Server verifies:

session belongs to customer

and action is allowed.

Customer cannot revoke another customer's session.

---

# 110. DEVICE REMOVAL AUTHORIZATION

Same ownership enforcement.

---

# 111. ADMIN BOUNDARY

Staff/admin security controls come later.

Do not add administrative actions to customer Security Center.

---

# 112. SECURITY EVENT CREATION

Events come from trusted server/auth workflows.

Customer cannot create:

LOGIN_SUCCESS

MFA_ENABLED

NEW_DEVICE

manually through frontend.

---

# 113. AUDIT LOG

Security operations should create immutable audit events.

Examples:

mfa_enrollment_started

mfa_enabled

mfa_disabled

password_changed

passkey_added

session_revoked

security_contact_change_started

security_contact_changed.

---

# 114. EVENT METADATA

Use minimal safe metadata.

Do not store:

password

OTP

MFA secret

recovery code

refresh token

raw JWT.

---

# 115. LOGGING

Server logs must avoid authentication secrets.

Never console.log:

OTP

password

access token

refresh token

WebAuthn challenge secrets.

---

# 116. AUTH TOKEN STORAGE

Use supported authentication-client mechanisms.

Do not create custom persistent token stores.

---

# 117. CSRF / ACTION PROTECTION

Follow current framework/auth patterns for state-changing server actions.

Do not create unauthenticated GET endpoints that perform security changes.

---

# 118. REDIRECT SAFETY

After step-up/recovery:

validate return destination.

No open redirects.

---

# 119. SECURITY HEADERS

Preserve strong security headers.

Do not weaken CSP or related protections just to make a third-party auth widget work without evaluation.

---

# 120. CONTENT SECURITY POLICY READINESS

If WebAuthn, QR rendering or security providers require additional origins:

add only necessary sources.

Do not use wildcards unnecessarily.

---

# 121. BRUTE-FORCE PROTECTION

Use auth/provider/server rate limiting for:

login

MFA challenges

password reset

recovery

contact verification.

Frontend cooldown alone is insufficient.

---

# 122. MFA RATE LIMIT

Prevent unlimited rapid MFA attempts.

Do not expose exact internal lockout threshold.

---

# 123. LOCKOUT UX

If temporary rate limit occurs:

show:

Too many attempts. Please try again later.

Do not reveal detailed security-control parameters.

---

# 124. PASSWORD RESET SECURITY

Preserve PROMPT 03 password recovery.

Security Center should not create a second inconsistent reset mechanism.

---

# 125. EMAIL ENUMERATION

Preserve account-enumeration protections.

---

# 126. SECURITY CONTACT MASKING

Show verified contacts safely:

```text
j••••@example.com
```

```text
+237 ••• •• 42
```

where appropriate.

---

# 127. CURRENT SESSION ACTIVITY

Display last active time.

Do not claim exact live activity if backend cannot provide it.

---

# 128. DEVICE ICONS

Use generic device/browser icons.

Do not claim model:

iPhone 17 Pro Max

unless user-agent/device metadata reliably supports it.

Prefer:

iPhone

Android phone

Windows computer.

---

# 129. SESSION LOCATION

If IP intelligence is unavailable:

omit location.

Do not invent city from browser language or timezone.

---

# 130. SECURITY ACTIVITY FILTERS

Possible:

All

Sign-ins

Credentials

Sessions

MFA.

Keep V1 simple.

---

# 131. MOBILE SECURITY UX

At 320–430px:

use stacked security cards;

large touch targets;

no dense tables;

safe dialogs;

sticky CTA only where useful.

---

# 132. MOBILE MFA

QR code enrollment on the same phone can be awkward.

Provide:

manual setup key

and instructions for using another authenticator application where appropriate.

Do not force QR scanning only.

---

# 133. MFA CODE INPUT

Reuse accessible OTP/code component from PROMPT 03.

---

# 134. MOBILE SESSION LIST

Use cards.

Example:

Current device

Chrome on Android

Last active now

[Details]

Other session:

Safari on iPhone

Last active yesterday

[Sign out]

---

# 135. DESKTOP SECURITY UX

Desktop may use:

left navigation/settings categories

+

main content.

Do not make it look like admin security software.

---

# 136. TABLET UX

Use two-column layout where space allows.

---

# 137. MODALS

Sensitive actions may use AlertDialog.

Examples:

Disable MFA

Sign out all sessions

Remove passkey.

Explain consequences clearly.

---

# 138. LOADING STATES

Use section-level skeletons.

Do not block entire Security Center because session history is loading.

---

# 139. ERROR STATES

Local failures should have local retry.

Example:

Could not load active sessions.

Retry.

---

# 140. CRITICAL SECURITY FAILURE

If secure authentication state cannot be verified:

do not display sensitive security controls as active.

Show controlled error and require re-authentication.

---

# 141. NETWORK LOSS

This app remains online-only.

Security mutations require network.

Do not queue:

password changes

MFA enrollment

session revocation

passkey changes

offline.

---

# 142. NO OFFLINE SECURITY QUEUE

Do not introduce IndexedDB security command outbox.

---

# 143. STEP-UP NETWORK FAILURE

If network disappears during challenge:

do not assume success.

Return to safe state after authoritative re-check.

---

# 144. SECURITY REALTIME

Realtime may refresh:

session revoked

security notification

where useful.

Correctness must not depend on realtime.

---

# 145. OTHER SESSION REVOCATION EFFECT

If a session is revoked:

that session should lose access according to authentication provider behavior.

Do not merely mark it "revoked" in custom DB while token remains accepted indefinitely.

---

# 146. GLOBAL SESSION REVOCATION LIMITATIONS

If provider cannot immediately invalidate certain existing tokens:

document limitation accurately.

Do not falsely claim instant revocation.

Use the strongest supported mechanism.

---

# 147. CURRENT SESSION REVOCATION

When current session is revoked:

clear authenticated state

redirect to login

show safe confirmation.

---

# 148. AUTH ASSURANCE SERVICE

Create a clean internal API.

Conceptually:

```text
getSecurityOverview()

getActiveSessions()

revokeSession()

revokeOtherSessions()

getSecurityActivity()

getMfaStatus()

startMfaEnrollment()

verifyMfaEnrollment()

disableMfa()

requestStepUp()

verifyStepUp()
```

Adapt to provider capabilities.

---

# 149. NO GENERIC DANGEROUS SECURITY RPC

Do not create unrestricted:

```text
setSecurityState(...)
```

or:

```text
updateMfaStatus(true)
```

available to the frontend.

Use narrow domain commands.

---

# 150. SECURITY OVERVIEW DTO

Return only customer-safe fields.

Possible:

```text
mfaEnabled
passkeysCount
activeSessionsCount
lastLoginAt
recentSecurityEvent
recommendations[]
```

Do not return internal risk flags.

---

# 151. TRANSFER STEP-UP CONTRACT

Transfer service may call:

```text
requiresStepUp(transferContext)
```

and return a challenge requirement.

Keep security decision server-side.

---

# 152. ACTION AUTHORIZATION TOKEN

If using a short-lived authorization token after step-up:

bind it to:

customer

action type

resource

expiry.

Do not allow one MFA challenge to authorize every unrelated sensitive action indefinitely.

---

# 153. ACTION BINDING EXAMPLE

Successful challenge for:

confirm transfer TRF-123

should not necessarily authorize:

disable MFA

unless policy explicitly allows general recent-authentication scope.

---

# 154. SECURITY POLICY CONFIGURATION

Create centralized policy configuration.

Examples:

MFA required for external transfers

recent authentication required for password change

step-up required to disable MFA.

Do not scatter booleans throughout UI components.

---

# 155. DEVELOPMENT CONFIGURATION

If some security features cannot be fully connected in local development:

use clearly marked development behavior.

Never create hidden production bypasses.

---

# 156. TEST USERS

Development security test accounts must remain development-only.

Do not expose credentials in production.

---

# 157. TEST — MFA ENROLLMENT

Customer enrolls TOTP.

Expected:

enrollment challenge

correct code verified

MFA active

security event

notification.

---

# 158. TEST — WRONG MFA CODE

Expected:

MFA not enabled

safe error

no security-state mutation.

---

# 159. TEST — DISABLE MFA

Without required step-up:

rejected.

With valid step-up:

disabled

event created

notification created.

---

# 160. TEST — PASSWORD CHANGE

Expected:

provider password updated

security event

notification

old password invalid according to provider behavior.

---

# 161. TEST — ACTIVE SESSIONS

Customer sees only own sessions.

---

# 162. TEST — FOREIGN SESSION

Customer attempts to revoke another customer's session.

Expected:

rejected.

---

# 163. TEST — REVOKE OTHER SESSIONS

Expected:

other sessions invalidated as strongly as supported

current session remains active

security event created.

---

# 164. TEST — SIGN OUT ALL

Expected:

all supported sessions revoked

current user redirected to login.

---

# 165. TEST — NEW LOGIN

New authenticated session created.

Expected:

security event

notification.

---

# 166. TEST — NEW DEVICE

New recognized device context.

Expected:

NEW_DEVICE event where supported

customer-safe alert.

---

# 167. TEST — TRANSFER STEP-UP

External transfer requires MFA.

Customer confirms transfer without step-up.

Expected:

no financial execution

challenge required.

After valid challenge:

transfer may continue.

---

# 168. TEST — EXPIRED STEP-UP

Customer completed MFA earlier than allowed assurance window.

Expected:

new challenge required.

---

# 169. TEST — STEP-UP TAMPERING

Client sends:

```text
stepUpComplete = true
```

without valid server assurance.

Expected:

ignored/rejected.

---

# 170. TEST — MFA STATUS TAMPERING

Client attempts:

```text
mfa_enabled = false
```

direct database update.

Expected:

rejected.

---

# 171. TEST — SECURITY EVENT FORGERY

Customer attempts to insert:

PASSWORD_CHANGED

event.

Expected:

rejected.

---

# 172. TEST — PASSWORD LOGGING

Verify passwords are absent from:

server logs

browser console

analytics.

---

# 173. TEST — TOKEN LOGGING

Verify access/refresh tokens are not logged.

---

# 174. TEST — MOBILE MFA

Verify:

QR/manual key

code input

keyboard

safe-area

success/failure

at 320px.

---

# 175. TEST — MOBILE SESSIONS

Verify session list, revoke action and confirmation are usable from 320px.

---

# 176. RESPONSIVE VALIDATION

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

Security overview

MFA enrollment

Password change

Passkeys

Sessions

Devices

Security activity

Dialogs

Recovery actions.

---

# 177. ACCESSIBILITY

Meet WCAG 2.2 AA.

Verify:

MFA labels

code input

QR alternative text/context

session cards

current-session semantics

security-event list

dialogs

password forms

notifications

focus management.

---

# 178. SCREEN READER SECURITY STATUS

Example:

Multi-factor authentication, enabled.

Not merely a green icon.

---

# 179. PASSWORD ERROR ANNOUNCEMENT

Ensure validation errors are associated with fields and announced.

---

# 180. SESSION REVOCATION ANNOUNCEMENT

After successful revoke:

announce:

Session signed out.

---

# 181. SECURITY NOTIFICATION INTEGRATION

Reuse PROMPT 10.

Create notifications from authoritative security events.

Do not duplicate a second security-notification engine.

---

# 182. MESSAGING INTEGRATION

Security support conversations use PROMPT 10 messaging.

---

# 183. PROFILE INTEGRATION

Security contact details reference PROMPT 03/profile verified contacts.

Do not duplicate contact source of truth.

---

# 184. ACCOUNT INTEGRATION

Account restrictions caused by security state must integrate with centralized access policy.

Do not directly hide a button as the only restriction.

---

# 185. TRANSFER INTEGRATION

Transfer security challenges must be wired to PROMPT 07/08 server flow.

---

# 186. LEDGER SAFETY

Security failure must prevent financial command before ledger posting.

Never try to "reverse security failure" after posting unless the transfer had already legitimately completed.

---

# 187. EXTERNAL TRANSFER PROGRESS

If step-up is required:

progress remains at the corresponding security stage until challenge succeeds.

Do not animate to 60/70% without actual confirmation.

---

# 188. INTERNAL TRANSFER

If policy requires step-up:

100% only after security challenge + atomic ledger posting.

---

# 189. ADMIN SEPARATION

Customer Security Center does not expose:

fraud scores

internal risk rules

staff session controls

account override

manual authentication bypass.

These belong to future admin workflows.

---

# 190. DATABASE TABLES

Possible additional entities:

security_events

customer_devices

customer_session_metadata

security_preferences

step_up_challenges

trusted_device_records

only where required.

Do not duplicate provider session/auth tables unnecessarily.

---

# 191. DATABASE INDEXES

Add indexes based on actual queries.

Possible:

security_events.customer_id + created_at

customer_devices.customer_id

session_metadata.customer_id + last_seen_at.

Avoid unnecessary indexes.

---

# 192. RLS

Customers can read their customer-safe security data only.

Privileged state changes occur through controlled server actions.

---

# 193. STORAGE

Security Center should not require new public storage.

MFA QR/setup data should not be persisted as ordinary customer files.

---

# 194. ANALYTICS

Do not send sensitive security information to generic analytics.

Forbidden analytics examples:

MFA secret

session token

full IP

recovery code

password event details.

Safe event examples may include:

security_page_viewed

mfa_setup_started

without sensitive payloads.

---

# 195. SECURITY EVENT RETENTION

Do not automatically delete important security history based on simple UI preferences.

Retention policy should remain configurable.

---

# 196. CURRENT IMPLEMENTATION SCOPE

Implement:

1. Security Center.
2. Security overview.
3. MFA status.
4. MFA enrollment.
5. MFA verification.
6. MFA disable flow.
7. Recovery-code support where provider supports it.
8. Passkey readiness/support where technically available.
9. Password-change flow.
10. Active sessions.
11. Session revocation.
12. Sign out other sessions.
13. Sign out all sessions.
14. Device/session metadata.
15. Security activity.
16. Security events.
17. New-login alerts.
18. New-device alerts.
19. Security-contact presentation/integration.
20. Step-up authentication engine.
21. Sensitive-action policy.
22. Transfer step-up integration.
23. Security restrictions foundation.
24. Secure-my-account flow.
25. Lost-device flow.
26. Notification integration.
27. Messaging/security-support integration.
28. RLS.
29. Audit events.
30. Responsive mobile UX.
31. Accessibility.
32. Security tests.

---

# 197. DO NOT IMPLEMENT YET

Do NOT fully implement:

admin back office

staff security administration

staff user management

manual KYC approval UI

admin account credit/debit controls

admin transfer blocking/approval controls

global operational risk dashboard.

These come in the next prompts.

---

# 198. PRESERVE PROMPT 10

Use its notification and secure messaging infrastructure.

Do not create parallel communication systems.

---

# 199. PRESERVE PROMPT 09

Security changes must not weaken document access.

---

# 200. PRESERVE PROMPT 08

External transfer 0→99→100 progression remains authoritative.

Security confirmation becomes a real milestone, not a cosmetic percentage.

---

# 201. PRESERVE PROMPT 07

Transfer execution remains server-authorized and idempotent.

---

# 202. PRESERVE PROMPT 06

Ledger remains financial source of truth.

Security flows must stop unauthorized commands before accounting posting.

---

# 203. PRESERVE PROMPT 05

Account balances remain projections.

---

# 204. PRESERVE PROMPT 04

Reuse BankingAppLayout and customer navigation.

Security remains accessible from More/Profile/sidebar.

---

# 205. PRESERVE PROMPT 03

Reuse Supabase Auth and existing onboarding/contact-verification foundations.

---

# 206. PRESERVE PROMPT 02

Public Security page remains customer education.

Authenticated Security Center is operational.

Do not merge them.

---

# 207. PRESERVE PROMPT 01

Reuse:

Form components

OTP component

StatusBadge

Alert

AlertDialog

Tabs

Cards

BottomSheet

Skeleton

ErrorState.

---

# 208. PRESERVE PROMPT 00

Maintain:

simple modular architecture

online-only operation

server authority

Supabase security.

---

# 209. FINAL SECURITY REVIEW

Explicitly confirm:

MFA is provider/server-authoritative.

Customers cannot self-set MFA state.

Session revocation is real, not UI-only.

Customers cannot access another customer's sessions.

Security events are immutable to customers.

Step-up state cannot be forged in frontend.

Sensitive banking commands verify step-up server-side.

Passwords, tokens, MFA secrets and recovery codes are never logged.

---

# 210. FINAL TRANSFER SECURITY REVIEW

Explicitly confirm:

internal transfers requiring step-up do not reach 100% before challenge and ledger success;

external transfer progress does not advance past security milestone before challenge completion;

customer cannot bypass step-up through request tampering;

failed/expired challenge causes no unauthorized financial posting.

---

# 211. FINAL MOBILE REVIEW

Confirm:

Security Center works from 320px upward;

MFA enrollment works on smartphones;

manual TOTP setup fallback exists where needed;

session list works on mobile;

password-change form remains keyboard-safe;

dialogs respect safe areas;

no horizontal overflow.

---

# 212. FINAL COMMUNICATION REVIEW

Confirm security events feed PROMPT 10 notifications correctly:

new login

password change

MFA enabled/disabled

session revoked

passkey changes

security restriction.

---

# 213. FINAL REPORT

At completion provide:

SECURITY CENTER ARCHITECTURE

SECURITY OVERVIEW

AUTHENTICATION METHODS

MFA IMPLEMENTATION

MFA ENROLLMENT

MFA DISABLEMENT

RECOVERY CODES

PASSKEY SUPPORT / READINESS

PASSWORD MANAGEMENT

SESSION MODEL

ACTIVE SESSIONS

SESSION REVOCATION

DEVICE MODEL

TRUSTED DEVICE READINESS

SECURITY ACTIVITY

SECURITY EVENT MODEL

NEW LOGIN DETECTION

NEW DEVICE DETECTION

STEP-UP AUTHENTICATION

AUTHENTICATION ASSURANCE

SENSITIVE ACTION POLICY

TRANSFER SECURITY INTEGRATION

SECURITY RESTRICTIONS

SECURE-MY-ACCOUNT FLOW

LOST-DEVICE FLOW

NOTIFICATION INTEGRATION

MESSAGING INTEGRATION

RLS

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
- Supabase Auth remains the authentication authority;
- no custom password storage was introduced;
- MFA cannot be enabled/disabled through arbitrary client updates;
- sensitive actions support server-authoritative step-up authentication;
- customers can review their active sessions;
- customers can revoke authorized sessions;
- session data is ownership-protected;
- security events are customer-read-only;
- security notifications use PROMPT 10 infrastructure;
- transfer security integrates with PROMPT 07/08;
- no ledger rule was weakened;
- no direct balance mutation was introduced;
- no sensitive auth secret is logged;
- no offline-first architecture was introduced;
- no offline security-command queue exists;
- PROMPT 00 through PROMPT 10 remain intact.

Stop after completing the Customer Security Center.

The next phase is:

PROMPT 12 — ADMIN BACK OFFICE, USER MANAGEMENT, CUSTOMER OPERATIONS & STAFF PERMISSIONS.