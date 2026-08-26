# PROMPT 04 — CUSTOMER BANKING APP SHELL, NAVIGATION & MEMBER EXPERIENCE

Continue from:

PROMPT 00 — Foundation & Modular Architecture  
PROMPT 01 — Design System, Branding & Visual Identity  
PROMPT 02 — Public Website, Landing Page & Customer Acquisition  
PROMPT 03 — Authentication, Registration, KYC & Customer Onboarding

Do NOT rebuild the project.

Do NOT replace the design system.

Do NOT break authentication, onboarding, public routes or security rules already established.

Do NOT introduce offline-first architecture.

This phase creates the complete AUTHENTICATED CUSTOMER APPLICATION SHELL.

The objective is to transform the authenticated area into a true modern banking application experience before implementing the detailed banking domains.

This prompt must establish:

- customer application layout;
- mobile navigation;
- desktop navigation;
- application header;
- account context;
- privacy controls;
- responsive page containers;
- customer menu;
- profile access;
- notifications entry point;
- contextual actions;
- account-status communication;
- safe loading/error states;
- route structure;
- member experience consistency.

This phase does NOT yet implement the full account, transaction, transfer or ledger engines.

---

# 1. PRODUCT EXPERIENCE

The authenticated banking area must feel substantially different from the public website.

The public site is for:

discovery  
trust  
marketing  
conversion.

The customer banking area is for:

control  
clarity  
speed  
financial actions  
security  
account management.

The customer must immediately understand:

Where am I?

What account am I using?

What can I do?

Is my account healthy?

Is anything requiring my attention?

How do I reach the important banking functions quickly?

---

# 2. AUTHENTICATED ROUTE NAMESPACE

Use the authenticated customer route namespace established previously:

/app

Recommended routes:

/app/dashboard

/app/accounts

/app/accounts/:accountRef

/app/activity

/app/transactions

/app/transactions/:transactionRef

/app/transfers

/app/transfers/new

/app/transfers/:transferRef

/app/beneficiaries

/app/statements

/app/documents

/app/messages

/app/notifications

/app/profile

/app/security

/app/settings

Do not fully implement all domain screens in this prompt.

Create only the route shells necessary to validate navigation and layout.

---

# 3. BANKING APP LAYOUT

Use or complete:

BankingAppLayout

The layout must support:

mobile;

tablet;

desktop;

large desktop.

It should contain:

CustomerAppHeader

CustomerMainNavigation

MainContent

MobileBottomNavigation where applicable

ContextualPageHeader

GlobalFeedbackLayer

Session/Security state handling.

Do not reuse PublicLayout.

Do not reuse AdminLayout.

---

# 4. CUSTOMER APP SHELL PRINCIPLE

The shell should remain persistent between customer routes where practical.

Changing between:

Dashboard

Accounts

Activity

Transfers

Profile

should feel like navigating inside one application.

Avoid complete visual page resets between every route.

---

# 5. PRIMARY CUSTOMER NAVIGATION

Use a limited number of high-priority destinations.

Recommended primary destinations:

Home

Accounts

Transfer

Activity

More

This should be the default conceptual mobile navigation.

Do not place 8–12 destinations directly in the mobile bottom bar.

---

# 6. MOBILE BOTTOM NAVIGATION

Create a premium mobile bottom navigation.

Possible structure:

Home

Accounts

Transfer

Activity

More

Each item must include:

icon;

visible label;

active state;

touch target.

Do not use icon-only navigation.

Do not rely on hover.

---

# 7. TRANSFER PRIMARY ACTION

Transfer may receive slightly stronger visual emphasis because it is a major banking action.

However:

do not create an oversized floating action button that feels like a social-media app.

The design should remain calm and professional.

Possible treatment:

slightly stronger selected icon/container;

central positioning;

brand accent.

Do not sacrifice usability for visual gimmicks.

---

# 8. BOTTOM NAV SAFE AREA

Mobile navigation must respect:

env(safe-area-inset-bottom)

and gesture-navigation areas.

The navigation must never overlap:

browser controls;

iPhone home indicator;

Android gesture area;

page content.

Ensure sufficient bottom content padding.

---

# 9. MOBILE BOTTOM NAV HEIGHT

Keep the navigation compact.

Do not consume excessive vertical space.

Labels should remain readable.

Icons should remain clear.

---

# 10. ACTIVE NAVIGATION STATE

Clearly distinguish the current destination using a combination of:

icon state;

text emphasis;

container/background;

or indicator.

Do not use color alone.

---

# 11. MORE MENU

The mobile:

More

destination should expose secondary features.

Potential items:

Statements

Documents

Messages

Notifications

Profile

Security

Settings

Help

Sign out

Use logical grouping.

Do not create an enormous unstructured menu.

---

# 12. MORE SCREEN VS SHEET

Choose the best UX based on the existing project.

More can be:

a dedicated `/app/more` route

or:

a well-designed bottom sheet/menu.

For scalability, a dedicated screen is acceptable.

If using a sheet:

ensure accessibility;

safe-area behavior;

keyboard usability.

---

# 13. TABLET NAVIGATION

On tablet widths, progressively enhance navigation.

Depending on width:

use compact side navigation

or

expanded navigation.

Do not keep a narrow phone bottom bar unnecessarily if a sidebar clearly improves usability.

---

# 14. DESKTOP NAVIGATION

On desktop, create a customer banking sidebar.

Suggested destinations:

Home

Accounts

Transfer

Activity

Beneficiaries

Statements

Documents

Messages

Then secondary section:

Notifications

Profile

Security

Help.

Do not include admin functions.

---

# 15. DESKTOP SIDEBAR

The sidebar should include:

bank logo;

navigation;

active state;

possibly compact customer/account context;

support/access section.

Keep it calm and visually lighter than the main content.

Do not create an oversized corporate admin sidebar.

---

# 16. COLLAPSIBLE SIDEBAR

If appropriate, allow desktop sidebar collapse.

Collapsed mode may show icons.

However:

labels should remain available through tooltips/accessibility.

Do not prioritize sidebar collapse if it adds unnecessary complexity.

---

# 17. BANKING APP HEADER

Create a responsive authenticated header.

Possible content:

mobile:

page/context title

notifications

profile/avatar.

Desktop:

page context

account selector if required

notifications

customer menu.

Avoid duplicating the full sidebar navigation in the header.

---

# 18. CUSTOMER AVATAR

Use a simple customer avatar.

Fallback:

initials.

Do not require profile photography.

The avatar can open a customer account menu.

---

# 19. CUSTOMER MENU

Profile menu may include:

My profile

Security

Preferences

Help

Sign out

Display customer name and a safe customer reference if useful.

Never display excessive sensitive information in the dropdown.

---

# 20. SIGN OUT

Provide a clear sign-out action.

Signing out must:

invalidate/terminate the appropriate client session;

redirect safely;

clear sensitive client state.

Do not use a fake frontend-only logout.

---

# 21. NOTIFICATION ENTRY POINT

Provide a notification icon/button in the authenticated header.

Show an unread indicator only when trusted notification state exists.

Do not fabricate unread notification counts.

Link to:

/app/notifications

Full notification functionality comes later.

---

# 22. ACCOUNT CONTEXT

Prepare the app shell for customers who may eventually have multiple accounts.

Create an AccountContext concept.

The current selected account may later control:

balance;

activity;

transfers;

statements.

Do not assume permanently that every customer has exactly one account.

---

# 23. ACCOUNT SELECTOR

If multiple accounts exist:

support an accessible account selector.

Possible presentation:

Personal Account

•••• 4821

EUR

Do not display full account numbers unnecessarily.

---

# 24. SINGLE ACCOUNT EXPERIENCE

If the customer currently has only one account:

do not force them to interact with an unnecessary selector.

Display concise account context instead.

Architecture should still support multiple accounts later.

---

# 25. ACCOUNT CONTEXT SECURITY

Never trust account IDs coming only from the client.

Server/data access must verify that the authenticated customer owns or is authorized for the selected account.

Changing a route parameter must not allow access to another customer's account.

---

# 26. PAGE HEADER SYSTEM

Create a reusable authenticated PageHeader.

Support:

title;

description;

back action;

primary action;

secondary actions;

breadcrumbs where appropriate;

account context;

status.

Mobile and desktop rendering may differ.

---

# 27. MOBILE PAGE HEADER

Mobile page headers should be compact.

Avoid giant page titles.

Example:

Accounts

small context

action button.

Do not waste half the screen with decorative header space.

---

# 28. DESKTOP PAGE HEADER

Desktop may provide more room for:

title;

description;

actions;

context.

Keep line lengths controlled.

---

# 29. CONTENT CONTAINER

Create a reusable BankingContentContainer.

It should define appropriate:

max widths;

horizontal padding;

responsive spacing;

bottom padding.

Dashboard pages may use wider grid layouts.

Form/detail pages may use narrower widths.

---

# 30. MOBILE CONTENT PADDING

Ensure comfortable horizontal padding around:

16px–20px conceptual range

depending on current design tokens.

Avoid cramped edges.

At 320px, preserve usable content width.

---

# 31. BANKING PAGE TYPES

Prepare layout variants for:

Dashboard page

List page

Detail page

Form page

Settings page

Full-screen mobile task

Document/statement page

Do not make every banking screen use the same card grid.

---

# 32. DASHBOARD SHELL

Create a lightweight dashboard shell only.

Possible sections:

Greeting/context

Account overview placeholder

Quick actions

Recent activity placeholder

Attention required placeholder

Do NOT implement real balances or transactions yet.

Use trusted development fixtures only if needed.

---

# 33. NO FAKE FINANCIAL DATA

If real banking data does not exist yet:

do not pretend that random balances belong to the logged-in customer.

Use explicit demo/dev placeholders or empty/loading states.

Example:

Account information will appear here once the account service is connected.

Development preview data should remain clearly isolated.

---

# 34. ACCOUNT STATUS BANNER

Create a reusable account-status communication component.

Possible states:

Active

Action required

Verification pending

Restricted

Suspended

Under review.

The message should appear only when relevant.

Do not permanently show banners that create visual noise.

---

# 35. ACTION REQUIRED CENTER

Prepare an area on the dashboard for important customer actions.

Examples:

Complete verification

Upload requested document

Review security alert

Resolve account restriction.

These tasks must come from trusted backend state.

Do not fabricate urgency.

---

# 36. QUICK ACTIONS

Create a reusable QuickActions component.

Possible actions later:

Send money

View account

Add beneficiary

Download statement.

Do not implement all functionality yet.

Actions can route to existing shells/future pages.

---

# 37. QUICK ACTION MOBILE UX

On mobile:

display 2–4 high-priority actions.

Use large touch-friendly controls.

Do not create a horizontal carousel containing dozens of actions.

Secondary actions belong elsewhere.

---

# 38. PRIVACY MODE

Implement or complete the privacy-mode foundation created in PROMPT 01.

Provide a customer control to hide sensitive financial values.

Examples:

balance

transaction amounts

account identifiers where appropriate.

Privacy mode may temporarily transform:

€12,450.80

into:

••••••••

---

# 39. PRIVACY MODE SCOPE

Privacy mode is a presentation feature.

It does NOT alter permissions.

It does NOT secure data from someone with developer access or backend access.

Do not treat it as an authorization mechanism.

---

# 40. PRIVACY CONTROL

The user should be able to toggle privacy mode quickly.

Potential location:

dashboard balance card

or

customer header/menu.

Avoid placing privacy toggles everywhere.

---

# 41. PRIVACY PERSISTENCE

Prefer:

current session

or safe UI preference storage.

Do not store sensitive balance values locally to support privacy mode.

Only store the preference itself if needed.

---

# 42. CUSTOMER GREETING

The dashboard may display a subtle greeting.

Example:

Good afternoon, Alex

However:

do not waste large space with greetings.

Financial information remains more important.

The greeting should be locale/time aware if implemented.

---

# 43. ACCOUNT STATUS CHIP

Prepare a compact status display.

Examples:

Active

Pending

Restricted.

Use semantic status components from PROMPT 01.

---

# 44. GLOBAL NETWORK STATE

Because the application is online-only, provide a global network-awareness component.

When connectivity is lost:

display a clear persistent message.

Example:

You're offline. Banking information may not be current.

or:

Connection lost. Reconnect to continue banking.

Do not enable offline banking actions.

---

# 45. NETWORK RECOVERY

When connectivity returns:

allow data refresh;

remove network warning when trusted connectivity resumes.

Do not automatically submit sensitive banking actions that failed while offline.

---

# 46. DATA REFRESH

Provide reusable data-refresh behavior for screens where current financial state matters.

Possible UI:

pull-to-refresh style behavior is optional

or

explicit Refresh action.

Do not build fake native gestures if they are unreliable in browsers.

---

# 47. LAST UPDATED

For important data, support optional:

Last updated

metadata.

Example:

Updated just now

or

Updated 2 minutes ago.

Do not show a stale balance as current without context after a failed refresh.

---

# 48. GLOBAL LOADING STATE

Create a consistent authenticated shell loading experience.

Avoid full blank pages.

Use:

skeletons;

route-level loading;

content placeholders.

The sidebar/header may remain stable while page content loads.

---

# 49. GLOBAL ERROR STATE

Create consistent banking-app error states.

Possible errors:

failed to load account;

failed to load activity;

service unavailable;

permission denied.

Always provide safe recovery actions.

---

# 50. PERMISSION DENIED

Create a customer-friendly permission denied state.

Example:

You don't have access to this information.

Do not reveal:

database policies;

role internals;

resource ownership rules.

---

# 51. 404 INSIDE APP

Create an authenticated not-found experience.

Actions:

Back to dashboard

View accounts

Do not automatically throw the customer back to the public homepage.

---

# 52. MOBILE FULL-SCREEN TASKS

Some future tasks such as:

new transfer

beneficiary creation

security confirmation

may need immersive mobile screens.

Prepare an AppTaskLayout.

It should support:

back button;

title;

content;

sticky bottom actions;

safe areas.

---

# 53. MOBILE STICKY ACTIONS

For transactional forms later:

allow a sticky bottom action area.

Requirements:

safe-area-aware;

not overlapping keyboard;

not hiding form content;

accessible;

responsive.

---

# 54. RESPONSIVE DETAIL PAGES

Detail pages should adapt.

Mobile:

stacked sections.

Desktop:

main content

+

optional contextual sidebar.

Avoid simply shrinking a desktop two-column layout until it becomes unreadable.

---

# 55. ACTIVITY ROUTE FOUNDATION

Prepare:

/app/activity

as the main customer-facing activity destination.

It may eventually aggregate:

transactions;

transfers;

account movements.

Do not fully implement activity data yet.

---

# 56. TRANSACTIONS ROUTE FOUNDATION

Prepare:

/app/transactions

and detail route.

The detailed transaction engine will come later.

Use empty/loading shells for now.

---

# 57. TRANSFERS ROUTE FOUNDATION

Prepare:

/app/transfers

/app/transfers/new

/app/transfers/:transferRef

Do not implement the complete transfer engine yet.

Ensure navigation paths exist and feel intentional.

---

# 58. BENEFICIARIES ROUTE FOUNDATION

Prepare:

/app/beneficiaries

for future recipient management.

Do not build fake beneficiaries.

---

# 59. STATEMENTS ROUTE FOUNDATION

Prepare:

/app/statements

with the correct customer layout.

Actual statement generation comes later.

---

# 60. DOCUMENTS ROUTE FOUNDATION

Prepare:

/app/documents

for customer banking documents.

Do not confuse this with onboarding KYC uploads.

Architecture should distinguish:

identity verification documents

from

customer banking documents/statements.

---

# 61. MESSAGES ROUTE FOUNDATION

Prepare:

/app/messages

for future secure bank messaging.

Do not create generic social chat behavior.

Messaging will remain bank-context-oriented.

---

# 62. PROFILE ROUTE

Create a basic profile shell.

Possible sections:

Personal details

Contact information

Address

Account status.

Do not allow unrestricted editing of previously verified sensitive identity data.

Full profile behavior will come later.

---

# 63. SECURITY ROUTE

Prepare:

/app/security

with placeholders for future:

password/security status;

MFA;

sessions;

devices;

login activity.

PROMPT 11 will implement these fully.

---

# 64. SETTINGS ROUTE

Prepare settings for non-security preferences.

Examples:

theme;

language readiness;

communication preferences;

display preferences.

Do not place financial permissions here.

---

# 65. CUSTOMER HELP

Provide easy access to Help from the customer shell.

Authenticated Help may route to:

public Help Center

or

secure support/messaging where appropriate.

Do not force customers to log out to find help.

---

# 66. MOBILE HOME DESTINATION

The Home item should route to:

/app/dashboard

Use the user-facing label:

Home

while the technical route may remain:

dashboard.

---

# 67. ACTIVITY VS TRANSACTIONS

Use Activity as the simplified primary navigation concept.

The detailed Transaction pages may remain deeper routes.

This avoids showing too many technical banking concepts in primary navigation.

---

# 68. NAVIGATION BADGES

Navigation items may later support badges.

Examples:

Notifications 3

Documents 1 action required.

Do not fabricate badge counts.

Only display trusted counts.

---

# 69. DEEP LINKING

Authenticated routes should support safe direct navigation.

Example:

customer receives link to a statement

→ login if required

→ return to authorized statement after authentication.

Redirect destinations must be validated.

---

# 70. SESSION RESTORATION

When opening a direct authenticated link:

validate session first.

Do not flash sensitive content before authorization completes.

---

# 71. ROUTE ACCESS MATRIX

Create a centralized route-access approach.

Possible categories:

public

authenticated customer

onboarding-only

active banking customer

restricted customer

staff/admin.

Do not sprinkle contradictory checks across dozens of route components.

---

# 72. ACTIVE CUSTOMER ROUTES

Some routes such as:

transfer creation

may later require:

banking_status = ACTIVE.

Prepare architecture for this.

A verified-but-not-activated customer must not automatically gain transactional access.

---

# 73. RESTRICTED CUSTOMER NAVIGATION

If a customer is restricted:

navigation may remain partially available for:

account information;

documents;

messages;

support;

security;

statements.

Transactional actions may be disabled/hidden according to trusted policy.

Do not hardcode the final restriction matrix yet.

Prepare it centrally.

---

# 74. SUSPENDED ACCOUNT EXPERIENCE

Suspended users may require a special shell state.

Do not show:

Send money

as a normal active CTA.

Present:

account status;

safe available actions;

support route.

---

# 75. PAGE TRANSITIONS

Use subtle transitions.

Navigation should feel responsive.

Avoid page-transition animations that delay financial access.

Respect reduced motion.

---

# 76. SCROLL BEHAVIOR

When moving between routes:

restore logical scroll behavior.

New screens should usually begin at the top.

Preserve scroll only when UX clearly benefits.

---

# 77. MOBILE NAVIGATION SCROLL

Bottom navigation must remain stable during page scroll.

Avoid layout shifts caused by browser toolbar changes.

Use modern viewport handling.

---

# 78. MOBILE HEADER BEHAVIOR

The mobile authenticated header can be:

sticky

or context-sensitive.

Do not consume excessive vertical space.

Maintain access to:

notifications;

profile;

back navigation

when relevant.

---

# 79. RESPONSIVE SIDEBAR STATE

Desktop sidebar state should not create content layout jumps.

Use stable sizing.

Do not push content unpredictably when menus open.

---

# 80. CUSTOMER APP MAX WIDTH

Dashboard pages may use wider containers.

Profile/forms should use readable constrained widths.

Example conceptual approach:

dashboard: wide

details: medium

forms: narrow-medium.

Use design tokens rather than arbitrary widths.

---

# 81. CARD DENSITY

Mobile:

prefer clear vertical grouping.

Desktop:

allow grids.

Do not place every piece of banking information inside a separate card.

Use sections and surfaces intentionally.

---

# 82. BANKING VISUAL HIERARCHY

Prioritize:

1. critical alerts
2. financial status
3. primary action
4. recent activity
5. supporting data
6. secondary options.

Do not let decorative widgets compete with critical banking information.

---

# 83. RESPONSIVE EMPTY STATES

Empty states on mobile must remain compact.

Avoid giant illustrations that push actions off-screen.

---

# 84. RESPONSIVE ERROR STATES

Network/error screens must work inside the persistent app shell.

Avoid redirecting every data failure to a generic full-screen error route.

---

# 85. THEMING

Reuse light/dark theme foundation.

The authenticated banking application must look intentional in both themes.

Do not introduce customer-specific random colors.

---

# 86. THEME CONTROL

If user theme switching is exposed:

place it under preferences or customer menu.

Do not give it excessive prominence over banking tasks.

---

# 87. CURRENCY DISPLAY READINESS

Account context must support different currencies later.

Do not hardcode EUR or USD throughout the shell.

Use centralized formatting utilities.

---

# 88. LOCALIZATION READINESS

Navigation labels and shell text should remain translation-ready.

Do not build fixed-width controls that break with longer localized strings.

---

# 89. ACCESSIBILITY

The customer shell must meet WCAG 2.2 AA quality.

Verify:

navigation landmarks;

keyboard navigation;

skip links;

focus indicators;

active navigation semantics;

screen reader labels;

drawer/sidebar accessibility;

dialog focus;

mobile bottom-nav semantics.

---

# 90. SKIP LINK

On desktop and keyboard-accessible layouts, provide:

Skip to main content

where appropriate.

---

# 91. NAVIGATION LANDMARKS

Use semantic elements:

nav

main

header

aside

where appropriate.

Do not build the shell from generic clickable divs.

---

# 92. MOBILE SCREEN READER

Ensure bottom navigation announces:

destination;

current state.

Example concept:

Home, current page.

---

# 93. ICON ACCESSIBILITY

Decorative icons should not create duplicate screen-reader noise.

Icon-only actions must have accessible names.

---

# 94. TOUCH TARGETS

Maintain approximately 44px+ important touch targets.

Pay special attention to:

bottom nav;

notification icon;

profile;

back buttons;

quick actions.

---

# 95. KEYBOARD SUPPORT

Desktop sidebar/menu must be fully keyboard usable.

No hover-only submenus.

---

# 96. PERFORMANCE

Do not load all future banking modules in the app shell bundle.

Use route-based splitting.

The persistent shell should remain lightweight.

---

# 97. PRELOAD STRATEGY

Where supported, it is reasonable to preload likely next routes lightly.

Examples:

dashboard → accounts

dashboard → transfer.

Do not preload the entire bank.

---

# 98. ADMIN ISOLATION

Do not import heavy admin modules into customer navigation.

Customer bundle should remain separate where possible.

---

# 99. PUBLIC ISOLATION

The authenticated shell should not load large public marketing sections.

Reuse global primitives only.

---

# 100. DATA QUERY BOUNDARY

The app shell may fetch:

customer summary;

account context;

notification summary;

lifecycle state.

Do not make the shell fetch:

complete transaction history;

all statements;

all messages

on every route.

Each feature should fetch its own domain data.

---

# 101. GLOBAL CUSTOMER SUMMARY

If useful, define a minimal authenticated customer summary.

Example conceptual data:

displayName

customerReference

bankingStatus

selectedAccountSummary

unreadNotificationCount

actionRequiredCount.

Keep it small.

---

# 102. NO GIANT GLOBAL STORE

Do not store every banking entity globally.

Transfers, transactions, documents and messages should remain feature-scoped.

---

# 103. QUERY CACHING

Use the project's existing server/query approach.

Do not introduce an additional caching library without need.

Financial caching must respect freshness and security requirements.

---

# 104. SENSITIVE DATA IN CLIENT MEMORY

Minimize unnecessarily retained sensitive data.

Do not store complete customer financial datasets in persistent browser storage.

---

# 105. ANALYTICS BOUNDARY

Authenticated analytics must never leak sensitive financial information.

Do not send:

balance;

transaction amount;

account number;

document names;

message content

to generic analytics.

If product telemetry exists, use safe event metadata only.

---

# 106. APP TITLE / BROWSER METADATA

Authenticated pages should use safe page titles.

Examples:

Accounts | Bank

Transfer | Bank

Do not put:

customer balance;

full account number;

recipient name;

sensitive transaction references

in document titles.

---

# 107. CLIPBOARD ACTIONS

Future copy actions such as account reference should provide:

clear feedback.

Example:

Account number copied.

Use safe contextual controls.

Do not automatically copy sensitive data.

---

# 108. SCREENSHOT / PRIVACY READINESS

Do not rely on web UI to prevent screenshots.

Privacy mode can reduce accidental exposure, but must not falsely claim screenshot protection.

---

# 109. RESPONSIVE TEST MATRIX

Test approximately:

320px

360px

375px

390px

412px

430px

768px

1024px

1280px

1440px+

Validate:

bottom navigation;

header;

sidebar;

More menu;

page headers;

dashboard shell;

route shells;

privacy mode;

network banner;

status banners;

quick actions.

---

# 110. MOBILE BROWSER TESTS

Pay particular attention to:

Chrome Android

Safari iPhone

Samsung Internet

Safari iPad.

Verify:

safe areas;

browser chrome;

100dvh;

sticky elements;

orientation;

touch interactions.

---

# 111. LANDSCAPE PHONE

The app must remain usable in phone landscape.

Avoid:

giant headers;

bottom navigation covering most of the content.

Adapt spacing/density when viewport height is limited.

---

# 112. TABLET PORTRAIT

Tablet portrait should transition gracefully toward a richer layout.

Do not create huge empty columns.

---

# 113. DESKTOP LARGE SCREENS

Use max-width and layout grids.

Do not stretch:

forms;

paragraphs;

transaction rows

across extremely wide monitors.

---

# 114. DEVELOPMENT FIXTURES

If UI validation requires demo account information:

keep fixtures isolated in development.

Example:

src/features/dashboard/dev-fixtures/

or equivalent.

Never mix fixtures into production service code.

---

# 115. NO BUSINESS LOGIC IN SHARED SHELL

BankingAppLayout must not calculate:

balances;

transfer fees;

ledger entries;

compliance results.

It should only coordinate layout, navigation and global context.

---

# 116. NO ADMIN LOGIC

Customer app components must not include:

credit account;

debit account;

approve transfer;

block customer;

change KYC state.

Those belong to future admin features.

---

# 117. CUSTOMER ROUTE SECURITY TESTS

Test:

unauthenticated → /app/accounts

must redirect safely.

Incomplete onboarding → protected active banking route

must redirect appropriately.

Restricted customer → transactional route

must obey access policy.

Active customer → dashboard

must work.

---

# 118. CROSS-ACCOUNT SECURITY TEST

If account selectors/route refs exist:

Customer A must never access Customer B account by changing:

URL

route reference

request payload.

Server/RLS ownership must remain authoritative.

---

# 119. SESSION EXPIRATION TEST

While inside the authenticated application:

if session expires:

private data should no longer remain interactively accessible;

show safe session-expired handling;

allow sign-in again.

---

# 120. NETWORK FAILURE TEST

Simulate network loss.

Confirm:

network state appears;

banking actions are not queued offline;

stale data is not silently presented as confirmed current data;

retry works.

---

# 121. CURRENT IMPLEMENTATION SCOPE

Implement in this prompt:

1. BankingAppLayout.
2. Authenticated customer route namespace completion.
3. Mobile bottom navigation.
4. Mobile More experience.
5. Tablet navigation behavior.
6. Desktop customer sidebar.
7. Authenticated app header.
8. Profile/customer menu.
9. Notification entry point.
10. Account-context foundation.
11. PageHeader system.
12. Banking content containers.
13. Dashboard shell.
14. QuickActions foundation.
15. Account-status banner.
16. Action-required area.
17. Privacy-mode integration.
18. Global network state.
19. Global loading/error states.
20. Authenticated 404/permission states.
21. Route access matrix foundation.
22. Restricted/suspended shell behavior.
23. Route shells for future banking features.
24. Responsive validation.
25. Accessibility validation.
26. Security validation.

---

# 122. DO NOT IMPLEMENT YET

Do NOT implement full:

account engine;

balance computation;

ledger;

transaction engine;

transfer engine;

beneficiary management;

statements;

documents;

secure messaging;

notifications;

MFA/session management;

admin workflows.

These come in dedicated prompts.

---

# 123. PRESERVE PROMPT 03

Do not bypass onboarding.

An authenticated customer with unfinished required onboarding must not automatically access a fully active banking shell.

Respect customer lifecycle state.

---

# 124. PRESERVE PROMPT 02

Public visitors must still be able to use:

Home

Features

Accounts

Security

About

Pricing

Help

Contact

Legal.

Authenticated application changes must not break public routing.

---

# 125. PRESERVE PROMPT 01

Reuse:

tokens;

components;

typography;

navigation primitives;

status badges;

feedback states;

safe-area utilities;

responsive foundations.

Do not duplicate the design system.

---

# 126. PRESERVE PROMPT 00

Keep:

simple modular architecture;

online-only behavior;

server-controlled privileged operations;

route/feature/service boundaries.

---

# 127. FINAL BUILD VALIDATION

Run:

build;

TypeScript checks;

route validation;

lint/checks if configured.

Fix:

broken imports;

duplicate components;

responsive overflow;

obvious accessibility problems.

---

# 128. FINAL MOBILE VALIDATION

Explicitly confirm:

320px usable;

bottom nav works;

More works;

safe areas work;

content is not hidden under navigation;

profile menu works;

network warning works;

no horizontal overflow;

keyboard/touch navigation works.

---

# 129. FINAL DESKTOP VALIDATION

Explicitly confirm:

sidebar navigation works;

active routes are clear;

content widths are controlled;

keyboard navigation works;

sidebar/header do not duplicate unnecessarily;

large screens remain visually coherent.

---

# 130. FINAL SECURITY VALIDATION

Explicitly confirm:

no admin capabilities appear in customer shell;

route guards remain server/trusted-state aware;

account context cannot bypass ownership;

no sensitive financial data is persisted unnecessarily;

no offline financial queue exists;

no customer can self-activate banking status;

no customer role can grant admin access.

---

# 131. FINAL REPORT

At completion provide:

CUSTOMER ROUTES

BANKING APP LAYOUT

MOBILE NAVIGATION

TABLET NAVIGATION

DESKTOP SIDEBAR

AUTHENTICATED HEADER

CUSTOMER MENU

ACCOUNT CONTEXT

DASHBOARD SHELL

QUICK ACTIONS

ACCOUNT STATUS EXPERIENCE

PRIVACY MODE

NETWORK STATE

LOADING / ERROR STATES

RESTRICTED / SUSPENDED STATES

ROUTE ACCESS MATRIX

RESPONSIVE IMPROVEMENTS

ACCESSIBILITY

SECURITY CHECKS

FILES CREATED

FILES MODIFIED

DEPENDENCIES ADDED

TEST SCENARIOS VALIDATED

KNOWN TODOs

Also explicitly confirm:

- project builds successfully;
- TypeScript passes;
- public website remains functional;
- authentication/onboarding remains functional;
- active customers can enter `/app/dashboard`;
- mobile navigation works from 320px upward;
- desktop customer sidebar works;
- safe areas are respected;
- customer shell remains online-only;
- no offline-first architecture was introduced;
- no fake financial engine was created;
- customer UI contains no admin actions;
- PROMPT 00 architecture remains intact;
- PROMPT 01 design system is reused;
- PROMPT 02 public website remains intact;
- PROMPT 03 authentication and lifecycle rules remain intact.

Stop after completing the customer application shell.

Do NOT automatically implement account balances or transaction engines.

The next phase is:

PROMPT 05 — CUSTOMER DASHBOARD, BANK ACCOUNTS & BALANCE EXPERIENCE.