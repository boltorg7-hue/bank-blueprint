# PROMPT 00 — FOUNDATION & MODULAR ARCHITECTURE

We are going to build a complete modern digital banking web platform progressively.

This prompt establishes the permanent technical, architectural, responsive, security, UI and project-organization rules for the entire project.

Do NOT attempt to implement every banking feature in this first step.

Your first responsibility is to establish a clean foundation that all future prompts can extend without restructuring the project repeatedly.

---

# 1. PRODUCT VISION

Build a premium digital banking web platform composed of three clearly separated experiences:

1. PUBLIC BANK WEBSITE
2. CUSTOMER BANKING AREA
3. BANK ADMINISTRATION BACK OFFICE

The platform must feel like a modern digital bank rather than a generic dashboard template.

The public website must attract and reassure new customers.

The authenticated customer experience must feel like a native-quality modern banking application.

The administration area must be a professional operational console for bank staff.

---

# 2. IMPORTANT PRODUCT CONSTRAINT

This is a WEB APPLICATION.

It must be:

- mobile-first;
- responsive;
- online-first;
- always connected to the backend for banking data;
- optimized for modern mobile browsers;
- optimized for desktop browsers;
- accessible;
- secure by architecture;
- modular;
- maintainable.

This application is NOT offline-first.

DO NOT introduce offline banking architecture.

Do NOT create:

- offline transaction queues;
- offline balance mutations;
- IndexedDB banking caches;
- offline transfer creation;
- background synchronization;
- offline write replication;
- service-worker-based banking workflows.

When connectivity is unavailable, show a clear network state and safe retry mechanism instead of pretending banking operations can continue offline.

Never display stale financial information as if it were confirmed current data.

---

# 3. CURRENT LOVABLE STACK

Use the modern stack supported by the current Lovable project.

For a new Lovable project, prefer the current Lovable default architecture based on:

- TanStack Start;
- TypeScript;
- server-side rendering where appropriate;
- React;
- Tailwind CSS;
- reusable UI components;
- Supabase for backend capabilities.

Do not unnecessarily downgrade the project to an older Lovable stack.

Use Supabase for:

- PostgreSQL;
- authentication;
- database;
- Row Level Security;
- file/document storage;
- server-side operations;
- Edge Functions where privileged logic is required.

---

# 4. ARCHITECTURAL PRINCIPLE

Use a SIMPLE MODULAR ARCHITECTURE.

Do not build an unnecessarily complex enterprise architecture.

Do not create dozens of abstraction layers.

Do not create microservices.

Do not create a monorepo.

Do not create separate applications unless technically justified later.

Keep one web application with strongly separated functional modules.

Use this principle:

ROUTES
→ FEATURES
→ SERVICES
→ BACKEND

Routes must remain thin.

Business behavior must live inside the appropriate feature/domain.

Shared components must not contain banking business logic.

Server-sensitive actions must never be implemented only in client-side code.

---

# 5. TARGET PROJECT ORGANIZATION

Organize the source code conceptually around this structure:

src/
├── routes/
│
├── features/
│   ├── public/
│   ├── auth/
│   ├── onboarding/
│   ├── dashboard/
│   ├── accounts/
│   ├── transactions/
│   ├── transfers/
│   ├── beneficiaries/
│   ├── compliance/
│   ├── documents/
│   ├── statements/
│   ├── messages/
│   ├── notifications/
│   ├── profile/
│   ├── security/
│   └── admin/
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── navigation/
│   ├── feedback/
│   └── data-display/
│
├── services/
│   ├── api/
│   ├── auth/
│   ├── banking/
│   └── storage/
│
├── hooks/
├── lib/
├── types/
├── config/
└── styles/

Adapt this structure when required by TanStack Start conventions, but preserve the boundaries.

DO NOT place all components in one giant components directory.

DO NOT put all logic directly inside route files.

DO NOT create giant files handling unrelated features.

---

# 6. FEATURE MODULE RULE

Each important banking feature should own its internal implementation.

For example:

features/transfers/

may contain:

components/
hooks/
services/
types/
schemas/
utils/

Only create subfolders that are actually useful.

Do not generate empty architecture just for appearance.

Each feature should be independently understandable.

For example, transfer-related logic should primarily live in:

features/transfers/

and not be scattered randomly through the project.

---

# 7. THREE MAIN APPLICATION ZONES

Architect the routing so that the product clearly separates:

PUBLIC

Examples:

/
 /features
 /accounts
 /security
 /about
 /pricing
 /help
 /login
 /register

CUSTOMER BANKING

Use a clearly protected route namespace such as:

/app
/app/dashboard
/app/accounts
/app/transactions
/app/transfers
/app/beneficiaries
/app/statements
/app/documents
/app/messages
/app/notifications
/app/profile
/app/security

ADMINISTRATION

Use:

/admin
/admin/dashboard
/admin/customers
/admin/accounts
/admin/transactions
/admin/transfers
/admin/compliance
/admin/kyc
/admin/documents
/admin/messages
/admin/risk
/admin/audit
/admin/reports
/admin/staff
/admin/settings

The exact file-based route implementation may follow TanStack Start conventions.

---

# 8. LAYOUT SEPARATION

Create three independent layout systems.

## PublicLayout

For visitors.

Contains:

- public header;
- marketing navigation;
- footer;
- responsive public menu.

## BankingAppLayout

For authenticated customers.

Contains:

- customer navigation;
- page header;
- notifications access;
- profile access;
- account context;
- mobile navigation.

## AdminLayout

For authorized bank employees.

Contains:

- admin sidebar;
- admin top bar;
- administration navigation;
- operational workspace.

Never reuse an admin layout as a customer layout.

Never expose administrative controls in customer components.

---

# 9. MOBILE-FIRST IS MANDATORY

Design the application starting from smartphone screens.

Do NOT build desktop first and simply shrink everything.

Primary design target:

320px → 480px smartphones.

Then progressively enhance for:

- larger phones;
- foldable devices;
- tablets;
- laptops;
- desktops;
- large desktop screens.

The interface must remain usable in:

portrait orientation
and
landscape orientation.

---

# 10. MOBILE BROWSER REQUIREMENTS

The application must work correctly in modern:

- Chrome on Android;
- Safari on iPhone;
- Safari on iPad;
- Samsung Internet;
- Firefox mobile;
- Edge;
- Chrome desktop;
- Safari desktop;
- Firefox desktop.

Use standards-based CSS and browser APIs.

Avoid browser-specific hacks unless absolutely necessary.

---

# 11. VIEWPORT RULES

Configure the application correctly for mobile browser viewports.

Use an appropriate viewport declaration equivalent to:

width=device-width
initial-scale=1
viewport-fit=cover

Do not disable user zoom.

Do not use:

user-scalable=no

Do not use aggressive maximum-scale restrictions.

Accessibility must remain intact.

---

# 12. SAFE AREA SUPPORT

The interface must properly support modern phones with:

- display cutouts;
- rounded corners;
- iPhone Dynamic Island areas;
- gesture navigation;
- browser bottom bars.

Use CSS safe-area environment variables where required:

env(safe-area-inset-top)
env(safe-area-inset-right)
env(safe-area-inset-bottom)
env(safe-area-inset-left)

Fixed or sticky mobile navigation must never be hidden behind the operating system gesture area.

---

# 13. MOBILE HEIGHT HANDLING

Avoid relying exclusively on legacy:

100vh

for important full-height mobile layouts.

Prefer modern dynamic viewport units where appropriate:

100dvh

with safe fallbacks.

The interface must remain stable when mobile browser address bars expand or collapse.

---

# 14. TOUCH INTERACTIONS

All interactive controls must be comfortable for touch.

Prefer touch targets approximately 44px or larger for important controls.

Avoid tiny icon-only buttons.

Do not depend on hover to reveal essential actions.

Every hover interaction must have a touch-compatible equivalent.

Forms must be easy to operate using one hand.

---

# 15. MOBILE FORMS

Banking forms are critical.

Optimize them for mobile keyboards.

Use appropriate HTML input types and autocomplete attributes.

Examples:

- email;
- tel;
- password;
- numeric input where justified;
- one-time-code autocomplete where supported.

Avoid font sizes that trigger unwanted mobile Safari form zoom.

Inputs should generally use a readable size around 16px or greater.

Validation errors must appear close to the relevant field.

Never erase user input after recoverable validation errors.

---

# 16. RESPONSIVE NAVIGATION

PUBLIC MOBILE

Use:

compact header
+
mobile navigation drawer or sheet.

CUSTOMER MOBILE

Use a banking-app navigation optimized for thumb reach.

A bottom navigation can be used for the most important destinations.

Do not place 10 navigation items in the mobile bottom bar.

Secondary features can live under:

More
or
Profile/Menu.

CUSTOMER DESKTOP

Transform navigation into an appropriate sidebar or expanded navigation system.

ADMIN

Admin mobile access should remain functional, but admin workflows may progressively use a sidebar and wider data layouts on tablet/desktop.

---

# 17. RESPONSIVE INFORMATION DENSITY

Do not simply shrink desktop tables onto phones.

On narrow screens:

convert complex financial tables into structured cards or responsive rows.

For example, a transaction on mobile can display:

merchant/name
amount
date
status

and expand for details.

On desktop, the same data may use a richer table.

The information architecture must adapt to available space.

---

# 18. DESIGN SYSTEM FOUNDATION

Create a reusable design-token layer for:

- typography;
- spacing;
- radii;
- shadows;
- borders;
- surfaces;
- semantic colors;
- states;
- animation timings;
- breakpoints.

Avoid arbitrary styling repeated across components.

Create semantic tokens such as:

background
surface
surface-elevated
text-primary
text-secondary
border
success
warning
danger
info
accent

Do not scatter raw banking colors through unrelated files.

---

# 19. VISUAL DIRECTION

The visual identity will be refined in another prompt.

For now establish a premium digital-banking foundation.

The feeling should be:

- trustworthy;
- modern;
- sophisticated;
- clean;
- calm;
- precise;
- innovative;
- premium;
- human.

Avoid:

- generic admin-template appearance;
- excessive gradients;
- excessive glassmorphism;
- childish illustrations;
- crypto-exchange aesthetics;
- casino-like visual language;
- excessive neon colors.

Animations should enhance clarity, not distract from financial information.

---

# 20. PERFORMANCE

Mobile performance is a priority.

Avoid huge initial JavaScript bundles.

Use route-based loading and code splitting where appropriate.

Lazy-load heavy non-critical functionality.

Optimize:

- images;
- icons;
- fonts;
- charts;
- large data views.

Do not load admin code for ordinary public visitors when avoidable.

Do not load all customer banking modules on the public homepage.

---

# 21. ACCESSIBILITY

Target WCAG 2.2 AA quality.

Use semantic HTML.

Support:

- keyboard navigation;
- visible focus;
- proper labels;
- screen readers;
- sufficient contrast;
- reduced-motion preferences;
- accessible errors;
- accessible dialogs;
- accessible menus.

Do not use color alone to communicate banking status.

For example:

FAILED

must have text/icon semantics, not only a red color.

---

# 22. AUTHENTICATION FOUNDATION

Prepare the project for Supabase authentication.

Expected lifecycle:

Visitor
→ Registered User
→ Verification
→ Authenticated Customer
→ Verified Customer
→ Active Banking Customer

Administrative users are separate authorized roles.

Protect authenticated customer routes.

Protect administrative routes independently.

Never determine authorization only by hiding UI buttons.

Server-side authorization and database policies remain authoritative.

---

# 23. AUTHORIZATION

Prepare a role and permission model.

Initial roles may include:

customer
support_agent
kyc_agent
compliance_officer
finance_operator
supervisor
administrator
super_admin
auditor

Do not hardcode privileged authorization throughout UI components.

Centralize authorization checks.

The backend must remain authoritative.

---

# 24. BANKING DATA SECURITY

Treat the following as sensitive:

- balances;
- transactions;
- transfer data;
- personal information;
- verification documents;
- administrative notes;
- audit events.

Never expose privileged database credentials to the browser.

Never put service-role keys in frontend code.

Never trust client-provided:

- balance;
- account ownership;
- transaction status;
- administrative role;
- transfer approval;
- compliance status.

Critical operations must be validated server-side.

---

# 25. DATABASE SECURITY

When Supabase tables are introduced:

enable Row Level Security.

Use deny-by-default thinking for private banking resources.

Customers should only access data they are explicitly authorized to access.

Administrative access must depend on explicit server-validated permissions.

Do not use insecure broad policies simply to make development easier.

---

# 26. BANK BALANCE RULE

The client-facing application must NEVER directly edit a user's balance.

Do not design banking logic around:

profiles.balance = profiles.balance + amount

Balances must ultimately be derived from a proper financial ledger/accounting model.

The detailed ledger will be introduced in a dedicated future prompt.

For now preserve this architectural rule.

---

# 27. PRIVILEGED FINANCIAL ACTIONS

Operations such as:

- crediting an account;
- debiting an account;
- blocking a transfer;
- approving a transfer;
- releasing a blocked transfer;
- reversing an operation;
- changing compliance state;

must not be implemented as direct arbitrary client-side database updates.

They will use controlled server-side commands and audit trails.

---

# 28. AUDITABILITY

Prepare the system so privileged actions can later create immutable audit events.

Every important administrative operation should eventually answer:

WHO performed the action?

WHAT was changed?

WHEN?

WHICH entity was affected?

WHY?

WHAT was the previous state?

WHAT is the new state?

Do not create a generic editable "logs" table that administrators can freely rewrite.

---

# 29. DATA ACCESS

Create clean services/repositories for backend access.

UI components should not contain complex raw Supabase queries everywhere.

Prefer:

UI
→ feature service/hook
→ backend client/server operation

Simple queries may remain simple.

Do not overengineer with unnecessary repository abstractions for trivial data.

The objective is understandable modularity.

---

# 30. TYPES AND VALIDATION

Use TypeScript strictly.

Avoid `any` unless technically unavoidable.

Use shared schemas for important user inputs and financial operations.

Validate data both:

client-side for user experience
and
server-side for security.

Client-side validation is never sufficient for privileged banking operations.

---

# 31. ERROR HANDLING

Create consistent application states for:

loading
empty
success
warning
error
network unavailable
permission denied
session expired

Never expose raw backend errors directly to customers.

Provide safe user-facing messages.

Keep detailed technical errors available only in appropriate development/server logs.

---

# 32. LOADING STATES

Avoid blank screens.

Use appropriate:

skeletons;
progress states;
button loading states;
route transitions.

For financial actions, prevent accidental duplicate submissions.

A transfer confirmation button must not trigger multiple transfers because a user taps repeatedly.

---

# 33. DATA FRESHNESS

Financial information must clearly distinguish:

confirmed data
from
temporarily loading data.

When the network request fails, do not silently show an old balance as current.

Provide:

last successful refresh context where useful
+
retry action.

---

# 34. PUBLIC SEO

Public pages must be SEO-friendly.

Use SSR capabilities where appropriate.

Prepare:

semantic HTML;
unique page titles;
meta descriptions;
Open Graph metadata;
structured internal navigation;
accessible headings.

Authenticated banking and admin areas do not need public indexing.

Ensure sensitive pages are never accidentally optimized for search indexing.

---

# 35. CUSTOMER PRIVACY

Do not expose sensitive banking information in:

URLs;
page titles;
browser metadata;
analytics event names;
client logs;
public error messages.

Avoid putting complete account numbers or sensitive identifiers in URLs.

Use safe application identifiers where necessary.

---

# 36. ANIMATION FOUNDATION

Create subtle animation utilities.

Support:

page entrance;
card transitions;
modal transitions;
progress transitions;
success states;
navigation transitions.

Honor:

prefers-reduced-motion.

Avoid animation that delays critical banking interactions unnecessarily.

---

# 37. NO FAKE FUNCTIONALITY

Do not present decorative controls as functional if they do nothing.

During progressive development:

either implement an action,
mark it clearly as not yet implemented in development,
or leave it out until the relevant prompt.

Do not fabricate backend responses.

---

# 38. DEMO VS REAL FINANCIAL INFRASTRUCTURE

The initial application may use development/demo financial data.

Keep a clear architectural boundary between:

product UI/business workflow

and

regulated real-money banking infrastructure.

Do not claim that this generated application alone is legally or technically ready to operate as a licensed bank.

Real-money production deployment would require the appropriate licensed banking/payment infrastructure, regulatory controls, compliance and security validation for the target jurisdiction.

---

# 39. CODE QUALITY

Use:

clear names;
small focused components;
feature boundaries;
shared reusable primitives;
consistent imports;
strict TypeScript;
predictable folder organization.

Avoid:

god components;
1,000-line route files;
duplicated components;
duplicated business rules;
unused placeholder files;
unnecessary abstractions;
circular dependencies.

---

# 40. CURRENT TASK — FOUNDATION ONLY

For this prompt, do NOT build the complete bank.

Perform only the foundation work required to safely continue.

You should:

1. Inspect the current project.
2. Preserve any useful existing configuration.
3. Establish the modular source structure.
4. Establish route namespaces.
5. Establish the three layout foundations.
6. Establish global responsive/mobile rules.
7. Establish design tokens.
8. Establish reusable loading/error/empty primitives.
9. Establish Supabase client/server boundaries if Supabase is already connected.
10. Prepare authentication route guards/interfaces without implementing every onboarding feature.
11. Prepare role/permission infrastructure.
12. Remove architectural duplication if present.
13. Ensure the app still builds successfully.

Do NOT create dozens of fake banking pages filled with placeholder content.

A future prompt will implement them one domain at a time.

---

# 41. BEFORE MODIFYING THE PROJECT

First inspect the existing codebase.

Do not blindly replace working configuration.

Identify:

- current Lovable stack;
- routing system;
- existing dependencies;
- existing project structure;
- existing Supabase integration;
- existing styling foundation.

Then adapt the architecture to the actual current project.

If an equivalent dependency already exists, reuse it instead of installing another library that performs the same task.

---

# 42. AFTER IMPLEMENTATION

At the end, provide a concise technical report containing:

ARCHITECTURE CREATED

ROUTES CREATED

LAYOUTS CREATED

SHARED COMPONENTS CREATED

SECURITY FOUNDATIONS

SUPABASE FOUNDATIONS

MOBILE-FIRST RULES

FILES ADDED

FILES MODIFIED

DEPENDENCIES ADDED

KNOWN TODOs FOR NEXT PROMPTS

Also explicitly confirm:

- whether the project builds successfully;
- whether TypeScript passes;
- whether mobile navigation foundation exists;
- whether safe-area handling exists;
- whether no offline-first architecture was introduced;
- whether sensitive banking mutations remain server-controlled.

Do not proceed to build all remaining banking features.

Stop after the foundation is clean and ready for PROMPT 01.