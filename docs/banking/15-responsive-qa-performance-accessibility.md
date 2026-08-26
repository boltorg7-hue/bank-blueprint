# PROMPT 15 — RESPONSIVE QA, MOBILE BROWSER HARDENING, PERFORMANCE, ACCESSIBILITY & PRODUCTION POLISH

Continue from PROMPT 00 through PROMPT 14.

This is a COMPLETE PRODUCT QUALITY HARDENING PHASE.

Do NOT rebuild the architecture.

Do NOT replace working banking domains.

Do NOT rewrite secure backend logic unnecessarily.

Do NOT weaken RLS, authentication, ledger integrity, maker-checker, transfer state machines, or admin permissions.

Do NOT introduce offline-first behavior.

The application now contains:

- public banking website;
- registration;
- onboarding;
- KYC;
- customer application;
- accounts;
- balances;
- ledger;
- transaction history;
- beneficiaries;
- internal transfers;
- external 0→99→100 transfers;
- compliance;
- documents;
- statements;
- secure messaging;
- notifications;
- customer security;
- admin back office;
- staff permissions;
- financial controls;
- hardened Supabase backend.

The objective of PROMPT 15 is to make the ENTIRE PRODUCT feel coherent, fast, stable, accessible, responsive and production-quality on real devices.

This is NOT merely a CSS cleanup.

Perform a systematic cross-application QA audit.

---

# 1. PRIMARY QUALITY TARGET

The final product should feel like a modern banking application on:

PHONE

TABLET

FOLDABLE

LAPTOP

DESKTOP

LARGE DESKTOP.

The experience must remain coherent across:

PUBLIC

CUSTOMER

ADMIN.

---

# 2. MOBILE-FIRST REMAINS AUTHORITATIVE

Begin QA from small screens.

Do not fix desktop first and shrink afterward.

Validate approximately:

```text
320px
360px
375px
390px
412px
430px
480px
```

Then:

```text
600–768px
```

Then:

```text
768–1024px
```

Then:

```text
1024–1440px
```

Then:

```text
1440px+
```

Do not assume one breakpoint represents all phones.

---

# 3. TARGET BROWSERS

Perform practical compatibility review for modern supported versions of:

Chrome Android

Safari iPhone

Safari iPad

Samsung Internet

Firefox Android where supported by product policy

Chrome desktop

Edge desktop

Safari macOS

Firefox desktop.

Do not introduce browser-specific code without reason.

---

# 4. PROGRESSIVE ENHANCEMENT

Core banking tasks must work without depending on experimental visual features.

If an advanced browser API improves UX:

use feature detection

+

safe fallback.

Do not break banking functionality when optional API is unavailable.

---

# 5. NO USER-AGENT DEPENDENT BANKING LOGIC

Do NOT decide financial functionality based solely on:

```text
navigator.userAgent
```

Device detection may influence presentation where necessary.

Business/security authorization remains independent.

---

# 6. CAPABILITY DETECTION

Prefer checking feature support.

Examples:

WebAuthn

Web Push

Web Share

Clipboard

View Transition API

camera/file capture

rather than assuming support from device brand.

---

# 7. VIEWPORT META

Audit the viewport configuration.

Use an appropriate viewport setup.

Support edge-to-edge/safe-area layouts where intended.

Do NOT disable user zoom.

Forbidden:

```text
user-scalable=no
maximum-scale=1
```

unless an extraordinary accessibility-reviewed requirement exists.

---

# 8. ZOOM

Users must be able to zoom content.

Test at:

200%

and relevant browser text scaling.

The product must remain usable.

---

# 9. DYNAMIC VIEWPORT UNITS

Audit all use of:

```text
100vh
```

especially:

login

onboarding

transfer flows

dialogs

drawers

bottom sheets

messaging.

Where appropriate prefer modern:

```text
100dvh
100svh
```

strategies.

Do not mechanically replace every `vh`.

---

# 10. DVH CAUTION

Dynamic viewport units may resize as browser chrome expands/collapses.

Do not cause unnecessary layout jumping.

Use:

`dvh`

when content should track visible viewport.

Use:

`svh`

when a stable minimum visible area is more appropriate.

Choose deliberately.

---

# 11. SAFE AREA SUPPORT

Audit fixed/sticky mobile UI.

Use:

```text
env(safe-area-inset-top)
env(safe-area-inset-right)
env(safe-area-inset-bottom)
env(safe-area-inset-left)
```

where needed.

---

# 12. SAFE AREA TARGETS

Specifically test:

mobile bottom navigation;

sticky transfer buttons;

onboarding CTA;

message composer;

bottom sheets;

full-screen dialogs;

notification drawers;

security flows.

No action should be hidden behind system gesture areas.

---

# 13. FOLDABLE READINESS

Do not hardcode layouts assuming one uninterrupted rectangle.

Avoid critical controls precisely across possible hinge/fold regions.

Where supported and useful, modern viewport-segment capabilities may be progressively enhanced.

Core UI must work without them.

---

# 14. ORIENTATION

Test:

portrait

landscape.

Particularly:

phone landscape;

tablet landscape.

Do not lock orientation.

---

# 15. SHORT VIEWPORT

Test devices/windows with limited height.

Examples:

landscape phone

mobile browser with keyboard

desktop split-screen.

Avoid layouts requiring 700px vertical height to reach confirmation controls.

---

# 16. OVERFLOW MASTER AUDIT

Find and fix unintended horizontal overflow.

Test every principal route at 320px.

Typical causes:

tables;

long account references;

transaction references;

URLs;

code-like values;

tabs;

buttons;

fixed widths;

dialogs;

large images.

No normal customer screen should require horizontal page scrolling.

---

# 17. LONG IDENTIFIERS

Account/transfer/document references must wrap, truncate or copy safely.

Example:

```text
TRF-2026-000000000048219
```

must not destroy layout.

---

# 18. VERY LONG CUSTOMER NAMES

Test long names.

Do not assume:

John Doe.

UI must tolerate long compound names without breaking navigation.

---

# 19. LOCALIZATION EXPANSION

Simulate longer translated labels.

Buttons must not rely on fixed English-width assumptions.

---

# 20. TEXT SCALING

Test increased OS/browser text size.

Critical actions must remain visible.

Do not use fixed-height containers that clip text.

---

# 21. TOUCH TARGETS

WCAG 2.2 AA minimum requirements must be satisfied.

For important banking touch interactions, continue aiming for approximately:

```text
44 × 44 CSS px
```

or larger practical hit area.

Examples:

back

close

bottom navigation

profile

notification bell

copy buttons

transfer actions

OTP controls

menu items.

---

# 22. TOUCH TARGET SPACING

Avoid tightly packed destructive/confirm actions.

Example:

Cancel

Approve

must not be dangerously adjacent on mobile.

---

# 23. ONE-HAND BANKING UX

Review frequent mobile actions:

send money

choose beneficiary

review transfer

confirm

copy account details

view activity.

Keep important controls reasonably reachable.

Do not compromise review clarity merely to place everything at bottom.

---

# 24. HOVER AUDIT

No essential function may depend on hover.

Hover can enhance desktop experience.

Touch must retain equivalent controls.

---

# 25. POINTER TYPES

Support:

mouse

touch

stylus

keyboard.

Avoid interfaces requiring precision dragging.

---

# 26. DRAGGING ALTERNATIVES

If any functionality uses drag/drop:

provide a non-drag alternative.

Especially document upload.

File picker must always remain available.

---

# 27. VIRTUAL KEYBOARD MASTER AUDIT

Test forms with real mobile keyboard behavior.

Critical routes:

login

register

OTP

onboarding

beneficiary creation

transfer amount

transfer reference

message composer

admin financial forms.

---

# 28. KEYBOARD COVERAGE

Ensure focused field remains visible when keyboard opens.

Sticky bottom CTA must not cover it.

---

# 29. INPUT SCROLL

Do not disable page scroll in a way that traps inputs behind virtual keyboard.

---

# 30. INPUT FONT SIZE

Use readable form font sizes.

Avoid tiny input text that may trigger unwanted mobile-browser zoom behavior.

Approximately 16 CSS px is an appropriate baseline for primary mobile form controls unless design system provides equivalent accessible behavior.

---

# 31. INPUT TYPES

Audit correct semantic input types.

Examples:

```text
email
tel
password
date
text
```

Money entry should use appropriate inputmode without breaking locale-aware values.

---

# 32. INPUTMODE

Use:

```text
inputmode="numeric"
```

for OTP when appropriate.

Use decimal-capable input behavior for decimal currencies.

Do not hardcode numeric-only behavior for all currencies if decimals are valid.

---

# 33. AUTOCOMPLETE

Audit autocomplete values.

Examples:

```text
name
given-name
family-name
email
tel
street-address
current-password
new-password
one-time-code
```

Support password managers.

---

# 34. PASTE

Do not block paste into:

password fields

OTP

account references

other appropriate fields.

Accessible authentication must remain practical.

---

# 35. FORM ENTER KEY

Ensure Enter/submit behavior is predictable.

Do not accidentally submit a transfer from an intermediate field without review.

---

# 36. FORM VALIDATION QA

Test:

empty

invalid

boundary

very long

unexpected characters

server rejection

network error.

Errors must remain near fields and understandable.

---

# 37. FOCUS MANAGEMENT

After form validation failure:

move or guide focus appropriately to first relevant error when helpful.

Do not leave keyboard users guessing.

---

# 38. DIALOG FOCUS

Dialogs must:

receive focus when opened;

trap focus appropriately;

return focus when closed.

---

# 39. BOTTOM SHEET ACCESSIBILITY

Mobile bottom sheets must behave like accessible dialogs where appropriate.

---

# 40. FOCUS NOT OBSCURED

Audit sticky headers, bottom navigation, cookie banners, sheets and fixed CTAs.

Keyboard focus must not become hidden behind application-created UI.

---

# 41. VISIBLE FOCUS

All keyboard-operable controls require obvious focus indication.

Do not remove outlines without a strong replacement.

---

# 42. SKIP LINK

Ensure desktop/customer/admin layouts support:

Skip to main content

where appropriate.

---

# 43. LANDMARKS

Audit semantic landmarks:

header

nav

main

aside

footer.

Avoid nested ambiguous `main` elements.

---

# 44. HEADINGS

Every page requires logical heading hierarchy.

Do not choose heading levels based solely on visual size.

---

# 45. PAGE TITLES

Each route needs an appropriate document title.

Never include:

balance

full account number

sensitive customer data

document contents.

---

# 46. SCREEN READER QA

Test at least representative flows using screen-reader semantics.

Important:

login

dashboard

account details

activity

transfer

document upload

statement

messages

security

admin approval.

---

# 47. MONEY ACCESSIBILITY

Amounts must communicate:

currency

direction when relevant

status when relevant.

Screen reader should not only encounter:

```text
-25000
```

without context.

---

# 48. PRIVACY MODE ACCESSIBILITY

Hidden financial values must also be hidden from assistive-technology accessible text.

Do not visually mask while still exposing amount through `aria-label`.

---

# 49. STATUS ACCESSIBILITY

Statuses must use text.

Examples:

Completed

Processing

Action required

Restricted.

Do not depend only on:

green

yellow

red.

---

# 50. PROGRESS ACCESSIBILITY

For external transfers:

screen readers should hear:

Transfer progress, 99 percent, final confirmation pending.

Not merely:

99.

---

# 51. ERROR ACCESSIBILITY

Errors should use appropriate live-region behavior when dynamically added.

Avoid repeated noisy announcements.

---

# 52. LOADING ACCESSIBILITY

Do not repeatedly announce every skeleton component.

Use meaningful loading state where needed.

---

# 53. REDUCED MOTION

Respect:

```text
prefers-reduced-motion: reduce
```

for production behavior.

Disable/reduce:

large transitions;

parallax;

decorative looping animation;

complex progress movement.

Do not remove meaningful state changes.

---

# 54. EXPERIMENTAL MOTION APIS

Do not depend on experimental browser preference APIs for core behavior.

CSS media-query reduced-motion support remains the reliable baseline.

---

# 55. TRANSFER ANIMATION

Internal transfer success animation should be brief.

External progress animations must represent real state.

Reduced-motion users receive simplified transitions.

---

# 56. NO FAKE DELAYS

Never delay successful transaction UI simply to make animation appear impressive.

Authoritative result comes first.

---

# 57. COLOR CONTRAST

Audit:

light mode

dark mode

hover

disabled

focus

success

warning

danger

info.

Meet WCAG 2.2 AA contrast requirements.

---

# 58. DISABLED CONTROLS

Disabled state must remain understandable.

Do not reduce opacity until label becomes unreadable.

---

# 59. DARK MODE QA

Test every major route in dark mode.

Especially:

tables;

PDF preview chrome;

dialogs;

inputs;

status badges;

admin forms.

Official printable PDFs remain print-oriented, not dark-mode documents.

---

# 60. HIGH-CONTRAST READINESS

Avoid design assumptions that disappear when user/system alters color behavior.

Use borders/text/icons in addition to subtle backgrounds.

---

# 61. LIGHT/DARK FLASH

Prevent significant theme flash during initial load when possible.

Do not reveal private content before authentication merely to solve theme flash.

Security remains higher priority.

---

# 62. PUBLIC WEBSITE QA

Audit:

Home

Features

Accounts

Security

About

Pricing

Help

Contact

Legal

Privacy

Terms.

---

# 63. PUBLIC MOBILE HERO

At 320px:

hero content must remain readable;

CTA visible;

visual preview not overpower content;

no horizontal clipping.

---

# 64. PUBLIC HEADER

Test:

long logo/name

mobile menu

scroll

sticky behavior

theme

safe area.

---

# 65. PUBLIC SEO QA

Check:

titles;

meta descriptions;

canonical strategy if configured;

robots behavior;

social metadata.

No private routes indexed.

---

# 66. LOGIN QA

Test:

portrait

landscape

keyboard

password manager

invalid password

loading

network error

dark mode.

---

# 67. REGISTRATION QA

Ensure progression remains manageable.

No mobile step should become an excessive form wall.

---

# 68. OTP QA

Test:

manual entry

paste

autofill

invalid code

expired code

resend

keyboard.

---

# 69. ONBOARDING QA

Test:

leave and resume;

back navigation;

validation;

document upload;

status review;

320px.

---

# 70. KYC UPLOAD MOBILE QA

Test:

camera selection

file browser

large file rejection

unsupported format

upload progress

retry.

Do not assume camera permission.

---

# 71. CUSTOMER APP SHELL QA

Test:

bottom nav

More

top bar

profile menu

notification badge

network banner

privacy mode.

---

# 72. BOTTOM NAV

Check:

active state;

safe-area padding;

labels;

rotation;

screen readers;

browser toolbars.

---

# 73. DESKTOP SIDEBAR

Check:

keyboard navigation;

collapsed state if present;

selected route;

long labels;

small laptop width.

---

# 74. DASHBOARD QA

At 320px, prioritized order must remain:

critical alert if needed

balance

quick actions

activity

summary.

Avoid decorative sections before primary banking data.

---

# 75. BALANCE STATES

Test:

loading

zero

positive

negative where allowed

unavailable

stale

privacy mode.

Never confuse unavailable with zero.

---

# 76. ACCOUNTS QA

Test:

one account

multiple accounts

long name

different currencies

restricted

closed.

---

# 77. ACCOUNT SELECTOR

Must work with:

touch

keyboard

screen reader.

Changing selected account should not create confusing full-page layout shifts.

---

# 78. ACCOUNT DETAILS

Long IBAN/account identifiers must not overflow.

Copy actions accessible.

---

# 79. ACTIVITY QA

Test:

no transactions

one transaction

hundreds

filters

pagination

long descriptions

large amounts.

---

# 80. ACTIVITY MOBILE FILTERS

Bottom-sheet filters must remain usable with short-height viewport.

---

# 81. TRANSACTION DETAIL

Test long references and descriptions.

Receipt link remains accessible.

---

# 82. BENEFICIARIES QA

Test:

empty list

many beneficiaries

long names

removed beneficiary

new beneficiary.

---

# 83. BENEFICIARY LOOKUP UX

Loading state must not reveal excessive customer information.

Errors must not encourage enumeration.

---

# 84. INTERNAL TRANSFER QA

Test complete customer journey:

source

recipient

amount

review

security

processing

100%.

No unnecessary compliance UI.

---

# 85. INTERNAL TRANSFER SPEED UX

Once authoritative result is returned:

show completion promptly.

Do not hold at fake percentages.

---

# 86. EXTERNAL TRANSFER QA

Test:

creation

security

progress

document request

99%

final confirmation

100%.

---

# 87. 99% UX

99% must clearly look unfinished.

Do not use the same success checkmark/background as 100%.

---

# 88. ACTION REQUIRED

At any width, the required customer action must be obvious.

Example:

Upload document.

---

# 89. TRANSFER TIMELINE MOBILE

Timeline must stack and wrap properly.

Do not create a horizontally overflowing milestone tracker.

---

# 90. FINANCIAL CONFIRMATION UX

Review screens must visibly contain:

source

destination

amount

currency

fees if real

reference.

Do not hide essential confirmation data below collapsed panels.

---

# 91. DOUBLE-TAP UX

Buttons must show:

submitting

processing

completed.

Still preserve server idempotency.

---

# 92. STATEMENTS QA

Test:

no statements

one statement

many statements

generation

failure

download

preview

print.

---

# 93. PDF PREVIEW MOBILE

Do not force users to inspect a tiny scaled A4 sheet.

Offer responsive document summary plus PDF action.

---

# 94. PRINT QA

Print output excludes:

navigation

sidebar

bottom nav

buttons

interactive UI.

---

# 95. DOCUMENT CENTER QA

Test:

different document types

long titles

download errors

permission errors

mobile.

---

# 96. MESSAGES QA

Test:

empty inbox

many conversations

long conversation

attachment

network failure

keyboard.

---

# 97. MESSAGE COMPOSER

Mobile keyboard must not cover:

input

attachment

send.

---

# 98. NOTIFICATION QA

Test:

zero unread

1 unread

many unread

filtering

mark read

deep link.

---

# 99. NOTIFICATION BADGES

Do not cause layout shifts when count changes.

---

# 100. SECURITY CENTER QA

Test:

MFA off

MFA on

sessions

password change

step-up

device list

security events.

---

# 101. MFA MOBILE QA

QR enrollment must offer manual alternative.

Do not force scanning screen with the same phone.

---

# 102. SESSION LIST

Long browser/platform names must wrap.

Revoke action remains visible.

---

# 103. ADMIN SHELL QA

Test:

1024px laptop

tablet

phone

large desktop.

Admin should be denser than customer interface but still usable.

---

# 104. ADMIN SIDEBAR

Collapse to drawer appropriately.

Never permanently occupy half a phone screen.

---

# 105. ADMIN TABLES

Every data table must have a mobile strategy.

Possible:

stacked cards;

priority columns;

details view.

Do not simply apply horizontal scrolling to every table as the only solution.

---

# 106. ADMIN DENSE DATA

Desktop tables should remain readable at 1024px.

Avoid 15 default columns.

---

# 107. ADMIN FILTERS

Desktop toolbar.

Mobile sheet.

Filters must preserve accessible labels.

---

# 108. CUSTOMER ADMIN DETAIL

Tabs/sections must not overflow mobile.

Use scrollable tab treatment only if accessible, or convert to select/menu/stack.

---

# 109. ADMIN KYC QA

Document preview and decisions must work on tablet.

Avoid tiny side-by-side document review on small screens.

---

# 110. ADMIN COMPLIANCE QA

99% queues and status information must be easily distinguishable.

---

# 111. ADMIN MESSAGE QA

Internal notes and customer-visible replies must look clearly different.

Prevent accidental customer exposure through visual ambiguity.

---

# 112. ADMIN FINANCE QA

Credit/debit adjustment flow must remain extremely clear.

Amount

direction

account

maker/checker

status

must never be visually ambiguous.

---

# 113. APPROVAL MOBILE UX

Checker must see complete financial impact before Approve.

Do not hide critical details behind multiple accordions.

---

# 114. DANGEROUS ACTION POSITIONING

Do not place:

Approve

Reject

or:

Freeze

Delete/Close

too close on touch screens without sufficient separation.

---

# 115. PERFORMANCE TARGETS

Measure Core Web Vitals.

Aim for "good" thresholds at 75th percentile:

```text
LCP <= 2.5s
INP <= 200ms
CLS <= 0.1
```

Measure mobile and desktop separately.

---

# 116. PERFORMANCE REALISM

Do not claim these targets are achieved solely because local Lighthouse passes.

Use:

lab testing

+

real-user monitoring readiness

where appropriate.

---

# 117. PUBLIC LCP

Optimize homepage above-the-fold content.

Audit:

hero image;

logo;

font;

critical CSS;

render blocking;

large JS.

---

# 118. CUSTOMER LCP

Authenticated pages should not wait for unrelated modules before showing shell/important content.

---

# 119. ADMIN LCP

Admin dashboard should load shell quickly and then independent data panels.

---

# 120. INP

Reduce long main-thread tasks.

Audit:

large React renders;

huge tables;

heavy charts;

JSON parsing;

unnecessary state updates.

---

# 121. REACT RENDER AUDIT

Use profiling where necessary.

Avoid premature memoization everywhere.

Fix actual excessive render paths.

---

# 122. CLS

Reserve layout space for:

images;

avatars;

skeletons;

notification badges;

async account data.

Avoid content jumping after load.

---

# 123. BALANCE CLS

Balance skeleton should roughly preserve final card geometry.

Do not cause dashboard to jump substantially when balance arrives.

---

# 124. FONT LOADING

Optimize fonts.

Prefer limited families/weights.

Use appropriate fallback.

Avoid blocking app on many font files.

---

# 125. ICONS

Use one established icon system.

Ensure tree shaking or efficient imports.

Do not bundle whole libraries unnecessarily.

---

# 126. IMAGES

Optimize public images.

Use correct dimensions.

Lazy load below fold.

Do not lazy load critical LCP image blindly.

---

# 127. AVATARS

Avoid huge source images for small avatars.

---

# 128. JS BUNDLE AUDIT

Inspect bundle composition.

Find:

duplicate packages;

large unused dependencies;

admin code in public bundle;

PDF libraries in homepage bundle;

large charting libraries.

---

# 129. ROUTE CODE SPLITTING

Ensure:

public

customer

admin

heavy PDF

document

security

domains remain appropriately split.

---

# 130. ADMIN BUNDLE ISOLATION

Public visitors should not download admin modules.

---

# 131. PDF LIBRARY ISOLATION

Do not load heavy PDF-generation dependencies into customer browser if generation is server-side.

---

# 132. DATA FETCHING

Audit duplicate requests.

Avoid multiple components independently fetching the same account summary unnecessarily.

---

# 133. WATERFALLS

Reduce avoidable sequential fetch chains.

But do not compromise security by exposing too much data in one giant endpoint.

---

# 134. PARALLEL FETCHING

Independent dashboard sections may load in parallel.

---

# 135. PAYLOAD SIZE

Audit customer-safe DTO sizes.

Do not return full database rows.

---

# 136. PAGINATION

Confirm all potentially large domains paginate:

transactions

transfers

messages

notifications

documents

customers

audit.

---

# 137. ADMIN VIRTUALIZATION

If tables become genuinely large, consider virtualization only where useful.

Do not add complexity prematurely.

---

# 138. QUERY LIMITS

Ensure frontend cannot request absurd page sizes.

Backend remains authoritative.

---

# 139. CACHE REVIEW

Use existing server/query caching intelligently.

Do not cache sensitive data in persistent browser storage.

---

# 140. STALE DATA

Financial information must clearly distinguish current vs stale when refresh fails.

---

# 141. NETWORK THROTTLING QA

Test under:

fast connection

average mobile

slow network

high latency

temporary disconnect.

---

# 142. ONLINE-ONLY EXPERIENCE

On connectivity loss:

show immediate clear state.

Do NOT pretend transaction succeeded.

Do NOT queue financial operations offline.

---

# 143. NETWORK BANNER

Ensure banner:

does not cover content;

is accessible;

works with safe area;

does not shift layout excessively.

---

# 144. CONNECTION RECOVERY

On reconnect:

allow safe refetch.

Never automatically repeat uncertain financial commands with a new idempotency key.

---

# 145. SERVER ERROR QA

Test:

400-style validation

401/session expiry

403 permission denied

404 private resource

409 state conflict

429 rate limit

5xx service failure.

Customer messages should remain safe and useful.

---

# 146. NO RAW ERROR LEAKS

Search UI for raw:

Postgres

Supabase

stack traces

internal error codes

storage paths.

Map them to safe messages.

---

# 147. SESSION EXPIRY QA

Expire session while:

viewing dashboard;

editing profile;

preparing transfer;

admin reviewing case.

Ensure secure behavior.

---

# 148. SESSION EXPIRY DURING TRANSFER

If expiry occurs before financial submission:

reauthenticate safely.

Do not execute silently.

---

# 149. SESSION EXPIRY AFTER SUBMISSION

If server operation may have executed:

recover status using original operation reference.

Do not prompt user to blindly resubmit.

---

# 150. PERMISSION CHANGE QA

Staff permissions changed while admin app open.

Next protected action must respect fresh server state.

---

# 151. ERROR BOUNDARIES

Use route/feature error boundaries where appropriate.

One failing optional widget must not destroy entire application.

---

# 152. EMPTY STATES

Audit every major feature for legitimate empty state.

No fake demo content in production.

---

# 153. SKELETON CONSISTENCY

Skeletons should match content structure.

Avoid excessive shimmering.

Respect reduced motion.

---

# 154. TOAST POLICY

Use toasts for transient confirmation.

Do not rely exclusively on toast for:

financial success;

critical errors;

security state.

Persistent important state should exist on page.

---

# 155. CONFIRMATION DIALOG POLICY

Reserve confirmation dialogs for meaningful actions.

Avoid confirmation fatigue.

---

# 156. DESTRUCTIVE ACTION COPY

Use precise wording.

Example:

Freeze this account

not:

Confirm action.

---

# 157. BANKING COPY QA

Review all visible language.

Remove:

technical jargon;

placeholder copy;

developer codes;

inconsistent terminology.

---

# 158. TERMINOLOGY

Standardize key customer terms.

Examples:

Available balance

Account activity

Transfer

Beneficiary

Statement

Document

Security

Action required.

---

# 159. INTERNAL VS EXTERNAL TRANSFER COPY

Use understandable customer language.

For example:

Transfer within our bank

Transfer to another bank

rather than exposing implementation jargon unnecessarily.

---

# 160. 99% COPY

Standardize:

99% — Final confirmation pending

or:

99% — Action required

depending on actual state.

Never:

Almost done!

if system has no known next completion path.

---

# 161. 100% COPY

100%:

Completed.

For internal:

recipient account credited.

For external:

authoritative external completion confirmed.

---

# 162. LEGAL COPY QA

Search for invented:

licenses

regulators

addresses

customer counts

awards

certifications.

Remove placeholders that might appear as real claims.

---

# 163. SECURITY CLAIMS

Do not claim:

unhackable

100% secure

military-grade security

unless precise and legitimately supported.

Prefer:

security controls

protected access

multi-factor authentication

where accurate.

---

# 164. PLACEHOLDER AUDIT

Search production UI for:

Lorem ipsum

TODO

Coming soon

Sample Bank

John Doe

demo balances

fake transaction data.

Remove or intentionally gate development-only content.

---

# 165. DEVELOPMENT FIXTURES

Ensure fixtures cannot leak into production mode.

---

# 166. CONSOLE AUDIT

Remove unnecessary:

console.log

debug prints.

Absolutely no financial/auth secrets.

---

# 167. DEVTOOLS WARNINGS

Resolve avoidable React:

key warnings

hydration mismatches

controlled/uncontrolled input warnings

accessibility warnings.

---

# 168. SSR HYDRATION

Audit public/authenticated SSR for mismatches related to:

time;

locale;

theme;

session;

viewport-dependent rendering.

---

# 169. DEVICE-DEPENDENT SSR

Avoid rendering radically different server HTML based on unreliable device guesses.

Prefer CSS responsive behavior.

---

# 170. LOCAL TIME HYDRATION

Do not cause hydration errors by rendering `new Date()` inconsistently server/client without deliberate strategy.

---

# 171. RESPONSIVE IMAGES

Use appropriate responsive image sizing where supported by stack.

---

# 172. SCROLL LOCK QA

Dialogs/drawers should prevent background scroll appropriately.

On close, restore body state correctly.

---

# 173. IOS SCROLL QA

Pay attention to nested fixed elements and scrolling sheets.

Avoid unnecessary fixed full-screen layouts.

---

# 174. OVERSCROLL

Do not implement aggressive custom overscroll behavior that breaks browser navigation unless strongly justified.

---

# 175. PULL-TO-REFRESH

Do not fake custom pull-to-refresh unless thoroughly tested.

Standard refresh is acceptable.

---

# 176. BACK GESTURE

Do not interfere unnecessarily with browser/system back gestures.

---

# 177. HISTORY

Multi-step flows must have understandable browser Back behavior.

Avoid accidentally resubmitting completed financial commands.

---

# 178. POST-REDIRECT-GET STYLE SAFETY

After successful financial operations, navigate to stable result/details state.

Browser refresh should not resubmit mutation.

---

# 179. DEEP LINKS

Test direct links to:

transaction

transfer

statement

message

notification

security

admin resource.

Authentication and authorization must recover correctly.

---

# 180. 404 QA

Public 404

customer 404

admin 404

should match context.

Do not leak private resource existence.

---

# 181. PERMISSION DENIED QA

Staff/customer permission screens need:

clear explanation

safe navigation.

---

# 182. PRINT QA

Test official document printing across:

Chrome

Safari

Firefox where possible.

---

# 183. DOWNLOAD QA

PDF filenames and download behavior should work on:

Android

iOS

desktop.

Do not require unsupported file-system APIs.

---

# 184. CLIPBOARD QA

Copy account reference/transaction reference:

works when Clipboard API supported.

Provide fallback or safe error where unavailable.

---

# 185. SHARE API

If Web Share is used:

progressive enhancement only.

Core banking information must remain copyable without it.

---

# 186. CAMERA CAPTURE

Document upload may hint camera capture where supported.

File picker remains fallback.

---

# 187. PUSH QA

If push is implemented:

permission handling must be contextual.

Denied permission must not break Notification Center.

---

# 188. SERVICE WORKER QA

If service worker exists solely for push:

verify it does not introduce offline banking data caching.

No:

balance cache

transaction cache

financial mutation queue.

---

# 189. SECURITY REGRESSION

Re-run key PROMPT 14 security tests after UI changes.

Responsive cleanup must not weaken authorization.

---

# 190. CUSTOMER CROSS-ACCESS QA

Repeat IDOR tests through real UI/API routes.

Customer A never sees Customer B resource.

---

# 191. ADMIN PERMISSION QA

Repeat staff role matrix through actual UI and direct server commands.

---

# 192. FINANCIAL REGRESSION

Re-run:

balanced ledger

idempotency

hold behavior

maker-checker

reversal

projection reconciliation.

UI polish must not alter them.

---

# 193. INTERNAL TRANSFER REGRESSION

Confirm:

same-bank transfer

→ atomic ledger

→ sender decreases

→ recipient increases

→ 100%.

---

# 194. EXTERNAL TRANSFER REGRESSION

Confirm:

external transfer

→ can stop at 99%

→ 100 only after authoritative completion.

---

# 195. STATEMENT REGRESSION

Official statements still reconcile.

---

# 196. NOTIFICATION REGRESSION

99% external transfer is never announced as completed.

---

# 197. MFA REGRESSION

Step-up cannot be bypassed through new responsive controls.

---

# 198. ADMIN FINANCE REGRESSION

Mobile admin must not expose a simplified path that bypasses maker-checker.

---

# 199. ACCESSIBILITY AUTOMATION

Use configured automated accessibility tooling where available.

Examples:

axe-compatible testing

Lighthouse accessibility

framework lint rules.

Do not consider automated scans sufficient alone.

---

# 200. MANUAL ACCESSIBILITY

Manually review:

keyboard only;

screen-reader semantics;

zoom;

text scaling;

focus;

touch targets;

error recovery.

---

# 201. WCAG 2.2 TARGET

Target:

WCAG 2.2 AA.

Pay special attention to:

Focus Not Obscured

Dragging Movements

Target Size Minimum

Consistent Help

Redundant Entry

Accessible Authentication.

---

# 202. REDUNDANT ENTRY

Avoid forcing customer to re-enter information already provided in the same process unless required for security or correctness.

Example:

transfer recipient should not require retyping after review.

---

# 203. CONSISTENT HELP

Help/security-support access should remain reasonably consistent across relevant customer screens.

---

# 204. ACCESSIBLE AUTHENTICATION

Do not introduce memory/cognitive puzzles as authentication requirements.

Support password managers, paste and appropriate assistive mechanisms.

---

# 205. PERFORMANCE TOOLING

Run appropriate tooling available in current project/environment.

Examples:

Lighthouse

browser performance profiling

bundle analysis

React profiling

Core Web Vitals instrumentation readiness.

Do not install redundant tools without need.

---

# 206. TEST MODE

Run performance tests against production-like build.

Development mode measurements are not representative.

---

# 207. MOBILE CPU

Test on realistic lower/mid-range mobile performance assumptions.

Do not optimize only for flagship hardware.

---

# 208. ADMIN LARGE DATA

Test tables with representative volume.

Example:

100+ records across paginated results.

Do not render fake tens of thousands client-side.

---

# 209. TRANSACTION DATA VOLUME

Test pagination with enough data to expose:

sorting

duplicate cursor

missing-row

scroll issues.

---

# 210. NETWORK REQUEST AUDIT

Inspect route loads.

Identify unnecessary requests.

Do not expose secrets in request URLs/query strings.

---

# 211. SENSITIVE URL AUDIT

Search URLs for:

account numbers

balances

full customer names

KYC info

message content.

Move sensitive values out of URL where unnecessary.

---

# 212. BROWSER STORAGE AUDIT

Inspect:

localStorage

sessionStorage

IndexedDB

Cache Storage.

Ensure no unintended persistent:

balance

transaction history

KYC documents

auth secrets

financial commands.

---

# 213. CACHE CONTROL

Review caching headers for:

public assets

public pages

authenticated HTML/API

sensitive documents.

Do not allow shared/public caches to retain private financial responses improperly.

---

# 214. AUTOFILL PRIVACY

Use autocomplete deliberately.

Do not disable useful password-manager behavior.

For sensitive noncredential fields, choose semantics carefully.

---

# 215. SCREENSHOT CLAIMS

Do not claim screenshots are technically prevented in web browsers unless actual supported platform controls exist.

Privacy mode is only visual protection.

---

# 216. COPY PRIVACY

Do not automatically place sensitive data onto clipboard.

Require explicit action.

---

# 217. IDLE STATE

If product has inactivity/session policy:

show clear reauthentication behavior.

Do not implement annoying arbitrary timers solely in UI.

---

# 218. MODAL STACKING

Audit z-index.

Prevent:

dialog beneath header

toast beneath sheet

dropdown behind modal.

Create intentional layering scale if not already defined.

---

# 219. Z-INDEX TOKENS

Avoid random:

```text
z-index: 999999
```

throughout app.

Use controlled layering tokens.

---

# 220. RESPONSIVE TYPOGRAPHY

Ensure typography scales naturally.

Do not use oversized marketing typography inside banking operation screens.

---

# 221. NUMBER TYPOGRAPHY

Use tabular numerics where established.

Balance values should not visibly jump width between refreshes.

---

# 222. ANIMATION PERFORMANCE

Animate:

transform

opacity

where appropriate.

Avoid expensive layout-triggering animations.

---

# 223. BLUR/GLASS EFFECTS

Use backdrop blur sparingly.

Do not harm performance on mobile.

Banking clarity > visual novelty.

---

# 224. SHADOWS

Avoid excessive large shadows that hurt low-end rendering.

---

# 225. ADMIN VISUAL POLISH

Admin is operational.

Use:

density

hierarchy

clear status

not flashy marketing animation.

---

# 226. CUSTOMER VISUAL POLISH

Customer area should feel calm, premium and reliable.

Do not add unnecessary crypto-like glow, trading-dashboard density or gaming effects.

---

# 227. PUBLIC VISUAL POLISH

Public website may be more expressive.

Keep bank credibility.

---

# 228. EMPTY WHITESPACE

Audit very wide desktop layouts.

Use max widths.

Avoid huge empty expanses or stretched forms.

---

# 229. 4K/LARGE DISPLAY

At 1920px+:

center or constrain content appropriately.

Admin may use more width than customer forms.

---

# 230. PRINTABLE COLORS

PDF/print pages must remain readable in grayscale.

---

# 231. FINAL ROUTE CRAWL

Visit EVERY registered public/customer/admin route.

Look for:

crash

blank state

placeholder

broken back button

wrong layout

wrong permission.

---

# 232. BROKEN LINKS

Audit internal navigation.

No CTA should point to nonexistent route.

---

# 233. DEAD BUTTONS

Find buttons with no real behavior.

Remove/disable with explanation or implement expected behavior.

No fake banking buttons.

---

# 234. DEAD MENU ITEMS

Same rule.

---

# 235. PLACEHOLDER FEATURES

If feature is intentionally not implemented:

do not show it as fully operational.

---

# 236. LOADING FOREVER

Search for states that can remain indefinitely loading after error.

Every async flow needs:

success

failure

retry

or terminal handling.

---

# 237. PROGRESS FOREVER

External transfer at 99% may legitimately wait.

But UI must explain why and what happens next.

Do not show an unexplained spinner forever.

---

# 238. TIMEOUT UX

Long server operations need controlled status.

Do not use arbitrary client timeout to label financial operation failed.

---

# 239. MOBILE MEMORY

Avoid keeping huge datasets/components mounted unnecessarily.

---

# 240. FINAL QUALITY GATE

Before declaring PROMPT 15 complete:

NO critical responsive issue.

NO critical accessibility issue.

NO broken primary route.

NO fake financial state.

NO unintended horizontal mobile overflow.

NO known customer/admin permission regression.

NO known critical security regression.

NO critical build/type error.

---

# 241. IMPLEMENTATION SCOPE

Perform and implement:

1. Full responsive route audit.
2. Mobile viewport hardening.
3. Dynamic viewport review.
4. Safe-area review.
5. Foldable/landscape readiness.
6. Mobile keyboard hardening.
7. Touch-target review.
8. Overflow elimination.
9. Typography scaling.
10. Zoom/text scaling.
11. Focus management.
12. Screen-reader semantics.
13. WCAG 2.2 AA audit.
14. Reduced-motion audit.
15. Light/dark mode QA.
16. Public-site QA.
17. Authentication QA.
18. Onboarding/KYC QA.
19. Customer-shell QA.
20. Dashboard/account QA.
21. Transaction QA.
22. Beneficiary QA.
23. Internal transfer QA.
24. External 0→99→100 QA.
25. Statement/PDF QA.
26. Document Center QA.
27. Messaging QA.
28. Notification QA.
29. Security Center QA.
30. Admin dashboard QA.
31. Admin customer/account QA.
32. KYC/compliance admin QA.
33. Admin finance QA.
34. Core Web Vitals optimization.
35. Bundle review.
36. Route code-splitting review.
37. Image/font optimization.
38. Data-fetch optimization.
39. Error-state audit.
40. Empty/loading-state audit.
41. Network-loss QA.
42. Session-expiry QA.
43. Deep-link QA.
44. Browser-storage audit.
45. Sensitive-URL audit.
46. Print/download QA.
47. Security regression tests.
48. Financial regression tests.
49. Cross-browser testing.
50. Final production polish.

---

# 242. DO NOT

Do NOT:

redesign the entire bank unnecessarily;

introduce a new framework;

replace TanStack Start;

replace Supabase;

convert to microservices;

introduce offline-first banking;

add experimental browser dependencies for core functionality;

add flashy animation that reduces clarity;

weaken security for performance;

remove RLS because queries are slow;

fake transaction progress;

fake balances;

fake data.

---

# 243. PRESERVE PROMPT 14

All backend hardening remains mandatory.

UI fixes must never reintroduce insecure direct access.

---

# 244. PRESERVE PROMPT 13

Admin financial operations remain:

ledger-backed;

maker-checker;

idempotent;

audited.

---

# 245. PRESERVE PROMPT 12

Staff RBAC remains authoritative.

---

# 246. PRESERVE PROMPT 11

MFA, sessions and step-up remain authoritative.

---

# 247. PRESERVE PROMPT 10

Communication remains event-driven and privacy-aware.

---

# 248. PRESERVE PROMPT 09

Statements remain authoritative and server-generated.

---

# 249. PRESERVE PROMPT 08

External 99% and 100% semantics remain unchanged.

---

# 250. PRESERVE PROMPT 07

Internal transfers remain atomic and complete at 100%.

---

# 251. PRESERVE PROMPT 06

Ledger remains the financial source of truth.

---

# 252. PRESERVE PROMPT 05

Balances remain authoritative projections.

---

# 253. PRESERVE PROMPT 04

BankingAppLayout remains the customer application foundation.

---

# 254. PRESERVE PROMPT 03

Authentication/onboarding lifecycle remains authoritative.

---

# 255. PRESERVE PROMPT 02

Public website remains the public acquisition experience.

---

# 256. PRESERVE PROMPT 01

Reuse design system rather than creating inconsistent fixes.

---

# 257. PRESERVE PROMPT 00

Maintain:

simple modular architecture;

online-only operation;

clear domain boundaries.

---

# 258. FINAL MOBILE TEST

Explicitly validate at 320px:

Login

Registration

Dashboard

Accounts

Transaction activity

Internal transfer

External transfer

Documents

Messages

Security

Admin main workflows.

Confirm:

no horizontal overflow;

no hidden CTA;

no safe-area collision;

no keyboard-blocked input;

no unusable touch target.

---

# 259. FINAL BROWSER TEST

Report status for:

Chrome Android

Safari iPhone

Samsung Internet

Safari iPad

Chrome desktop

Edge desktop

Safari macOS

Firefox desktop.

Use:

PASS

PASS WITH MINOR ISSUE

FAIL

NOT TESTABLE IN CURRENT ENVIRONMENT.

Do not claim testing a browser/device that was not actually tested.

---

# 260. FINAL ACCESSIBILITY REPORT

Report:

Keyboard navigation

Focus management

Screen-reader semantics

Touch targets

Zoom

Text scaling

Contrast

Reduced motion

Form errors

Accessible authentication.

List remaining issues by severity.

---

# 261. FINAL PERFORMANCE REPORT

Provide available measurements for:

LCP

INP or appropriate lab proxy when field INP unavailable

CLS

JS bundle sizes

largest route chunks

largest assets.

Clearly distinguish:

LAB

from:

REAL USER FIELD DATA.

---

# 262. CORE WEB VITAL TARGETS

Use production target:

```text
LCP <= 2.5 seconds

INP <= 200 milliseconds

CLS <= 0.1
```

at approximately the 75th percentile for real-user evaluation.

Do not falsify field data when none exists.

---

# 263. FINAL SECURITY REGRESSION

Explicitly confirm:

no client secret leakage;

no customer cross-account access;

no staff permission bypass;

no direct ledger/balance mutation;

no maker-checker bypass;

no external transfer fake completion;

no sensitive offline cache.

---

# 264. FINAL FINANCIAL REGRESSION

Explicitly confirm:

internal transfer sender decreases and recipient increases atomically;

internal successful transfer reaches 100%;

external transfer may stop at 99%;

external transfer reaches 100 only after authoritative completion;

ledger journals remain balanced;

admin credit/debit remains ledger-backed;

statements reconcile.

---

# 265. FINAL QA FINDINGS FORMAT

For every unresolved issue report:

Severity:

CRITICAL / HIGH / MEDIUM / LOW

Area:

Route/component

Problem:

Observed behavior

Impact:

User/business/security impact

Fix:

Implemented or recommended

Status:

RESOLVED / OPEN.

---

# 266. FINAL REPORT

At completion provide:

RESPONSIVE QA SUMMARY

MOBILE 320PX RESULTS

PHONE PORTRAIT RESULTS

PHONE LANDSCAPE RESULTS

TABLET RESULTS

FOLDABLE READINESS

DESKTOP RESULTS

LARGE DESKTOP RESULTS

CHROME ANDROID RESULTS

SAFARI IOS RESULTS

SAMSUNG INTERNET RESULTS

SAFARI IPAD RESULTS

DESKTOP BROWSER RESULTS

SAFE AREA REVIEW

DYNAMIC VIEWPORT REVIEW

VIRTUAL KEYBOARD REVIEW

TOUCH TARGET REVIEW

OVERFLOW REVIEW

PUBLIC WEBSITE QA

AUTHENTICATION QA

ONBOARDING / KYC QA

CUSTOMER APP QA

ACCOUNTS QA

TRANSACTIONS QA

INTERNAL TRANSFER QA

EXTERNAL 0→99→100 QA

STATEMENTS / PDF QA

DOCUMENT CENTER QA

MESSAGING QA

NOTIFICATIONS QA

SECURITY CENTER QA

ADMIN QA

ADMIN FINANCE QA

ACCESSIBILITY AUDIT

WCAG 2.2 STATUS

PERFORMANCE AUDIT

CORE WEB VITALS

BUNDLE AUDIT

DATA FETCHING AUDIT

NETWORK QA

ERROR / LOADING / EMPTY STATES

SESSION QA

DARK MODE QA

PRINT QA

DOWNLOAD QA

SECURITY REGRESSION

FINANCIAL REGRESSION

FILES CREATED

FILES MODIFIED

DEPENDENCIES REMOVED

DEPENDENCIES ADDED

OPEN ISSUES

---

# 267. FINAL REQUIRED CONFIRMATIONS

Explicitly confirm:

- project builds successfully;
- TypeScript passes;
- no known critical runtime error exists;
- main customer journeys work from 320px upward;
- admin remains usable from 320px upward;
- mobile safe areas are respected;
- dynamic browser viewport behavior is handled deliberately;
- virtual keyboard does not hide essential banking actions;
- important touch targets are appropriately sized;
- user zoom remains enabled;
- primary workflows remain keyboard accessible;
- WCAG 2.2 AA is the accessibility target;
- reduced-motion preferences are respected;
- light and dark modes remain usable;
- no major unintended horizontal overflow remains;
- public, customer and admin bundles remain appropriately separated;
- no fake financial data was introduced;
- no fake transfer progression was introduced;
- unavailable balance never appears as zero;
- internal transfers still reach 100% after authoritative completion;
- external transfers still cannot reach 100% without authoritative completion;
- official statements remain ledger-backed;
- customer security controls remain server-authoritative;
- staff RBAC remains server-authoritative;
- admin credits/debits remain ledger-backed;
- maker-checker remains enforced;
- PROMPT 14 backend security is not weakened;
- no sensitive banking data is persisted for offline usage;
- no offline financial/admin/security queue was introduced;
- PROMPT 00 through PROMPT 14 remain intact.

Stop after completing responsive QA, accessibility, performance and production polish.

Do NOT automatically make unrelated architectural changes.

The next and FINAL phase is:

PROMPT 16 — FINAL FULL-SYSTEM AUDIT, PRODUCTION READINESS, DOCUMENTATION & RELEASE GATE.