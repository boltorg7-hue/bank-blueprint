# PROMPT 01 — DESIGN SYSTEM, BRANDING & VISUAL IDENTITY

Continue from the architecture established in PROMPT 00.

Do NOT restructure the project unnecessarily.

The purpose of this prompt is to establish the complete visual identity, reusable design system, interaction language and responsive UI foundation of the digital bank.

Do NOT build the complete banking product yet.

Do NOT implement transfers, ledger logic, KYC workflows, statements or the full administration system in this step.

This prompt must create the visual foundation that all future banking interfaces will use.

---

# 1. OBJECTIVE

Create a premium, modern and trustworthy visual system for a digital banking platform.

The product must immediately communicate:

- trust;
- financial seriousness;
- security;
- clarity;
- innovation;
- accessibility;
- premium quality;
- simplicity;
- technological sophistication.

The interface must feel designed specifically for a modern digital bank.

It must NOT look like:

- a generic SaaS dashboard;
- a crypto exchange;
- a trading platform;
- a casino;
- a fintech template copied from a UI kit;
- a generic Bootstrap admin panel;
- a social network;
- an e-commerce website.

---

# 2. PRODUCT PERSONALITY

The visual personality of the bank must combine:

TRUST

The user must feel that their money and personal information are handled professionally.

SIMPLICITY

Financial information must remain easy to understand.

PREMIUM QUALITY

The experience should look polished, precise and intentional.

INNOVATION

The bank should feel modern and technologically advanced without becoming futuristic for the sake of appearance.

CALM

Financial interfaces should reduce stress instead of creating visual noise.

HUMANITY

The platform should feel approachable and understandable even when presenting complex banking operations.

---

# 3. DESIGN PRINCIPLES

Use the following permanent principles.

## Clarity before decoration

Financial data always has priority over decorative effects.

## Hierarchy before density

Important banking information must be immediately visible.

## Progressive disclosure

Do not show every available action at once.

Display secondary details only when useful.

## Predictability

Buttons, colors, statuses and navigation patterns must behave consistently.

## Mobile-first

The smartphone experience is the primary design reference.

## Accessible by default

Accessibility is part of the design system, not an optional later adjustment.

## Confidence through precision

Spacing, typography, alignment and wording must feel deliberate.

---

# 4. BRAND SYSTEM

Create a reusable brand configuration instead of hardcoding branding everywhere.

Prepare centralized tokens/configuration for:

- bank name;
- logo;
- symbol;
- primary brand color;
- secondary color;
- accent color;
- neutral palette;
- typography;
- gradients if used;
- favicon;
- public metadata;
- legal display name.

Use placeholder naming only if the final bank name has not yet been selected.

Keep branding easy to change later from a central location.

Do not duplicate the bank name across dozens of components.

---

# 5. LOGO FOUNDATION

Prepare the UI to support:

- full horizontal logo;
- symbol-only logo;
- light-background version;
- dark-background version;
- compact mobile version.

The logo must work well in:

- public header;
- banking app navigation;
- administration area;
- authentication pages;
- generated documents;
- favicon/app icon.

Do NOT invent an overly complicated logo.

If no final logo asset exists yet, use a clean temporary brand mark that can later be replaced without rewriting layout components.

---

# 6. COLOR SYSTEM

Create a professional semantic color system.

Do not use arbitrary Tailwind colors directly throughout the application.

Create semantic tokens such as:

--background
--foreground

--surface
--surface-subtle
--surface-elevated
--surface-inverse

--border
--border-strong

--text-primary
--text-secondary
--text-muted
--text-inverse

--brand-primary
--brand-primary-hover
--brand-primary-active
--brand-secondary

--accent

--success
--success-background
--warning
--warning-background
--danger
--danger-background
--info
--info-background

--focus

The actual implementation may use CSS variables integrated with Tailwind.

---

# 7. COLOR DIRECTION

Choose a sophisticated banking palette.

The visual direction should favor:

- deep financial colors;
- elegant neutrals;
- restrained accents;
- excellent contrast;
- subtle premium surfaces.

A dark navy, deep blue, emerald, teal or similar trust-oriented primary direction is appropriate.

However:

Do NOT flood every screen with the primary color.

Use brand color strategically.

Most financial interfaces should rely on clean neutral surfaces so values remain readable.

---

# 8. STATUS COLORS

Financial status colors must have semantic meaning.

SUCCESS

Use for:

- completed;
- verified;
- approved;
- active;
- received.

WARNING

Use for:

- pending;
- additional action required;
- awaiting verification;
- delayed.

DANGER

Use for:

- rejected;
- blocked;
- failed;
- security alert.

INFO

Use for:

- informational processing state;
- neutral guidance.

Never rely only on color.

Always pair important states with:

- label;
- icon where useful;
- accessible text.

---

# 9. LIGHT AND DARK THEMES

Prepare the design system to support both:

LIGHT MODE

and

DARK MODE.

However, LIGHT MODE should be the default banking experience unless the existing product strategy says otherwise.

Dark mode must not simply invert colors.

Create appropriate:

- surfaces;
- borders;
- text hierarchy;
- overlays;
- shadows;
- status colors.

Charts and financial data must remain readable in both modes.

User theme preference may later be stored in profile settings.

---

# 10. TYPOGRAPHY SYSTEM

Use a highly readable modern sans-serif font suitable for financial applications.

The typography system must support:

Display
Heading XL
Heading LG
Heading MD
Heading SM

Body LG
Body
Body SM

Label
Caption
Overline

Financial values need special treatment.

Create a reusable numeric typography style for:

- account balances;
- transaction amounts;
- statistics;
- percentages.

Use tabular numeric alignment where useful for financial data.

Do not use decorative fonts for critical banking information.

---

# 11. TYPOGRAPHIC HIERARCHY

On mobile, avoid oversized hero typography that consumes the entire viewport.

Public marketing pages can use expressive typography.

Authenticated banking screens must prioritize compact clarity.

Example hierarchy:

Page title
→ important financial value
→ supporting explanation
→ actions
→ contextual information

Do not use excessive bold text everywhere.

Use font weight intentionally.

---

# 12. SPACING SYSTEM

Create a consistent spacing scale.

Use predictable increments.

Examples conceptually:

4
8
12
16
20
24
32
40
48
64

Do not use random values unless necessary.

Mobile page horizontal padding should feel comfortable without wasting space.

The design should remain usable around 320px wide.

---

# 13. BORDER RADIUS SYSTEM

Create a small radius scale such as:

small
medium
large
extra-large
full

Do not use completely different border radius values on every component.

Cards should feel modern but not cartoonishly rounded.

Banking components should appear solid and dependable.

---

# 14. SHADOW SYSTEM

Use restrained shadows.

Create:

shadow-sm
shadow-md
shadow-lg

or equivalent semantic elevations.

Avoid giant blurred SaaS shadows.

Use border + surface separation more often than heavy shadows.

---

# 15. ICONOGRAPHY

Use one consistent icon library already compatible with the current Lovable project.

Do not mix multiple icon systems unnecessarily.

Icons should have consistent:

- stroke;
- size;
- visual weight;
- alignment.

Important financial actions should not rely solely on icons without labels unless the meaning is universally obvious.

---

# 16. MOTION SYSTEM

Create motion tokens for:

fast
normal
slow

Use subtle animations for:

- button feedback;
- cards;
- dropdowns;
- modals;
- navigation;
- progress indicators;
- notifications;
- success feedback.

Typical motion should feel quick and polished.

Avoid long cinematic animations in transactional flows.

Respect:

prefers-reduced-motion.

---

# 17. MICRO-INTERACTIONS

Use premium micro-interactions.

Examples:

- subtle button compression on tap;
- smooth navigation state changes;
- animated balance skeleton during loading;
- smooth progress transitions;
- lightweight confirmation animation;
- refined dropdown opening;
- polished focus transitions.

Do not add unnecessary bouncing, spinning or playful effects.

---

# 18. RESPONSIVE DESIGN SYSTEM

Design from mobile upward.

Define practical breakpoints compatible with the project.

Conceptual behavior:

MOBILE
320–639px

TABLET
640–1023px

DESKTOP
1024px+

LARGE DESKTOP
1440px+

Do not blindly depend on these exact numbers if the existing Tailwind configuration already has appropriate breakpoints.

Use content behavior rather than device-specific hacks.

---

# 19. MOBILE PAGE STRUCTURE

Authenticated banking pages on mobile should generally use:

safe-area-aware top section
+
page header
+
main content
+
comfortable bottom spacing
+
mobile navigation where applicable.

Do not let fixed bottom navigation overlap page content.

Allow space for:

env(safe-area-inset-bottom)

where needed.

---

# 20. CONTENT WIDTHS

Define reusable content containers.

Public pages may use wide marketing containers.

Customer banking pages should use more constrained reading widths.

Admin pages can use wider operational workspaces.

Avoid infinitely stretched content on large monitors.

---

# 21. PUBLIC DESIGN LANGUAGE

The public website may be more expressive than the banking application.

It may use:

- large typography;
- carefully controlled gradients;
- premium illustrations;
- device mockups;
- product screenshots;
- animated product previews;
- marketing cards;
- trust indicators;
- storytelling sections.

However, preserve brand consistency.

The public site should convert visitors without looking exaggerated.

---

# 22. BANKING APP DESIGN LANGUAGE

The authenticated customer experience should be calmer.

Prioritize:

- balance;
- financial status;
- actions;
- recent activity;
- alerts;
- account context.

Use fewer decorative effects than on marketing pages.

A customer should immediately know:

Where am I?

How much money is available?

What happened recently?

What action can I perform?

Is anything requiring my attention?

---

# 23. ADMIN DESIGN LANGUAGE

The administration area must prioritize efficiency and information density.

It should use the same brand foundation but may have:

- smaller typography;
- denser tables;
- filters;
- status tags;
- side navigation;
- dashboards;
- operational panels;
- inspection drawers.

Do not make admin look identical to the customer banking interface.

Admin should feel operational.

Customer app should feel personal.

---

# 24. CORE COMPONENT LIBRARY

Create or standardize reusable components for future prompts.

At minimum prepare:

Button
IconButton
LinkButton

Input
Textarea
Select
Checkbox
Radio
Switch

FormField
FormLabel
FormMessage

Card
Panel
Surface

Badge
StatusBadge

Avatar

Divider

Tabs

Accordion

DropdownMenu

Dialog
AlertDialog

Drawer
BottomSheet

Tooltip

Popover

Toast

Skeleton

Spinner

EmptyState

ErrorState

NetworkErrorState

Progress

Stepper

Breadcrumb

Pagination

DataTable foundation

Do not overbuild every possible variant.

Create a clean reusable base.

---

# 25. BUTTON SYSTEM

Create clear button variants.

PRIMARY

Main action.

SECONDARY

Important but non-primary action.

TERTIARY / GHOST

Low-emphasis action.

DANGER

Destructive or risk-related action.

LINK

Inline navigation.

Possible sizes:

small
medium
large.

Buttons must support:

loading;
disabled;
icon;
full-width mobile use.

Loading buttons must prevent duplicate submissions.

---

# 26. BANKING ACTION BUTTONS

Actions such as:

Send money
Add beneficiary
Download statement
Confirm transfer

must use clear labels.

Avoid vague CTAs such as:

Continue

when a more explicit label is possible.

Example:

Instead of:

Continue

prefer:

Review transfer

or:

Confirm €500 transfer

when appropriate.

---

# 27. INPUT SYSTEM

Inputs should support:

default;
focus;
filled;
error;
disabled;
read-only.

Include:

label;
optional helper text;
error message;
leading icon;
trailing action;
character constraints where appropriate.

Financial fields require special handling.

---

# 28. MONEY INPUT

Create a reusable MoneyInput foundation.

It should support:

- currency;
- decimal values;
- localized display;
- mobile-friendly numeric keyboard;
- validation;
- readable formatted preview.

Do not use JavaScript floating-point arithmetic for real financial calculations.

This component is only presentation/input infrastructure.

Actual monetary calculation rules will be handled later.

---

# 29. ACCOUNT NUMBER DISPLAY

Prepare a reusable secure display pattern for account identifiers.

For example:

•••• •••• 4821

with a controlled action:

Show
Copy

Do not expose full sensitive identifiers everywhere by default.

---

# 30. BANK BALANCE COMPONENT

Prepare a reusable balance display component.

Support:

main balance;
currency;
label;
optional hidden/privacy mode;
loading state;
unavailable state.

Example:

Available balance

€12,450.80

Do not display false values when data is unavailable.

---

# 31. PRIVACY MODE

Prepare a UI pattern that allows users to temporarily hide sensitive financial values.

Example:

€12,450.80

becomes:

••••••••

This may later apply to:

- account balance;
- transaction amounts;
- account numbers.

The privacy state can be session-level initially.

---

# 32. STATUS BADGES

Create banking-friendly status badge variants.

Examples:

Active
Pending
Verified
Processing
Completed
Blocked
Failed
Action required
Under review

Status badges must be:

compact;
accessible;
consistent;
semantic.

---

# 33. TRANSACTION ROW

Prepare a reusable TransactionRow visual component.

Mobile structure may contain:

icon/category
merchant or counterpart
date/time
amount
status

Desktop may display more columns.

Use positive/negative values clearly.

Avoid relying only on red/green.

---

# 34. ACCOUNT CARD

Prepare an AccountCard component.

It may display:

account name
masked account identifier
available balance
currency
account status

Optional actions:

View account
Copy account information

Do not make cards visually resemble cryptocurrency wallets.

---

# 35. TRANSFER CARD

Prepare a reusable transfer-summary presentation.

Possible content:

beneficiary
amount
reference
status
progress
date

This will later support the transfer compliance journey.

Do not implement the complete transfer engine yet.

---

# 36. PROGRESS COMPONENT

Create a reusable progress system supporting:

percentage
label
status
milestones

This will later power the transfer workflow from:

0 → 99 → 100%.

The component must support smooth visual progression.

However:

the UI must never fabricate progression.

Percentage values will come from trusted application state later.

---

# 37. STEPPER COMPONENT

Prepare a stepper usable for:

onboarding;
KYC;
transfer review;
document verification.

Mobile:

prefer vertical or compact responsive steps.

Desktop:

horizontal stepper may be appropriate.

The current step, completed steps and remaining steps must be obvious.

---

# 38. FINANCIAL KPI CARD

Prepare a reusable KPI/summary card for:

income;
expenses;
balance;
transfers;
admin metrics.

Support:

label;
value;
trend;
comparison;
secondary information.

Do not overuse charts inside every card.

---

# 39. TABLE SYSTEM

Prepare a professional responsive DataTable foundation.

Desktop may support:

columns;
sorting;
filters;
pagination;
row actions.

Mobile must NOT simply overflow an enormous desktop table.

Provide an alternative:

responsive cards
or
stacked rows

when the information becomes unreadable.

---

# 40. MODAL SYSTEM

Use standard dialogs for:

confirmations;
short forms;
details.

On narrow mobile screens, large dialogs may transform into:

bottom sheets
or
full-height sheets.

Never place critical content outside viewport reach.

---

# 41. BOTTOM SHEETS

Create a reusable mobile BottomSheet.

It can later support:

account actions;
filters;
beneficiary selection;
transaction filters;
mobile menus.

Handle safe-area bottom padding.

Support drag/close behavior only if accessible and stable.

Always provide a visible close mechanism.

---

# 42. TOASTS

Toast notifications should communicate lightweight feedback such as:

Beneficiary added
Settings saved
Statement downloaded

Do not use a temporary toast as the only feedback for major financial operations.

Critical transfers require persistent confirmation screens or states.

---

# 43. ALERT SYSTEM

Prepare reusable alerts:

info
success
warning
danger

Examples:

Your identity verification is pending.

Additional documentation is required.

Your account requires attention.

Avoid unnecessarily alarming language.

---

# 44. EMPTY STATES

Create meaningful empty states.

Examples:

No transactions yet.

No beneficiaries added.

No statements available.

Each empty state should explain:

what the state means;
what the user can do next.

Do not fill empty dashboards with fake data.

---

# 45. ERROR STATES

Create polished error components for:

general error;
network unavailable;
permission denied;
not found;
temporary service issue.

Financial errors should never expose internal technical details.

---

# 46. SKELETONS

Use layout-preserving skeletons for:

balances;
transaction lists;
cards;
tables;
profile sections.

Avoid full-page spinners when structured loading states are possible.

---

# 47. NAVIGATION COMPONENTS

Prepare reusable navigation primitives for:

PublicHeader
PublicMobileMenu

BankingTopBar
BankingMobileBottomNav
BankingDesktopSidebar

AdminTopBar
AdminSidebar

Do not fill all destinations with fake pages yet.

Prepare the component structure and minimal route support.

---

# 48. CUSTOMER MOBILE BOTTOM NAVIGATION

The future customer banking navigation should prioritize approximately four or five main destinations.

Recommended conceptual structure:

Home
Accounts
Transfer
Activity
More

The exact information architecture may be refined later.

Use labels and icons.

Do not use icon-only bottom navigation.

The center action may receive stronger emphasis if appropriate, but avoid gimmicky floating-button patterns unless the usability remains excellent.

---

# 49. APP HEADER

Authenticated screens should support a compact header containing context such as:

page title;
back navigation;
notification access;
profile access;
contextual actions.

Avoid repeating unnecessary large marketing navigation inside banking pages.

---

# 50. RESPONSIVE CARDS

Cards should adapt naturally.

Mobile:

usually one column.

Tablet:

one or two columns.

Desktop:

grid based on content importance.

Do not force equal-height cards when content does not require it.

---

# 51. CHART FOUNDATION

Prepare only a minimal charting visual foundation.

Future financial analytics may include:

spending distribution;
monthly cash flow;
balance trend.

Charts must:

remain readable;
have accessible labels;
support mobile;
avoid excessive animation;
have meaningful empty states.

Do not create fake banking charts in this prompt.

---

# 52. NUMBER FORMATTING

Create centralized formatting utilities for:

currency;
percentages;
dates;
times;
compact numbers.

Do not manually concatenate:

"$" + amount

throughout components.

Prepare localization-friendly formatting using appropriate browser internationalization APIs.

---

# 53. DATE AND TIME DISPLAY

Use consistent date formats.

Support:

relative date where useful;
full date;
date + time.

Example contexts:

Recent activity:
Today, 14:35

Transaction details:
25 Aug 2026, 14:35

Avoid inconsistent formats across screens.

---

# 54. INTERNATIONALIZATION READINESS

Do not hardcode architecture in a way that prevents future translations.

Prepare interface strings so they can later migrate cleanly to an i18n system.

Do not implement a large translation system unless the current project already has one.

Avoid component layout assumptions based on very short English text.

---

# 55. ACCESSIBILITY

All design-system components must support accessibility.

Requirements include:

keyboard navigation;
visible focus rings;
ARIA attributes where necessary;
proper label associations;
semantic buttons;
accessible modal focus management;
screen-reader-friendly status messages;
sufficient contrast.

Interactive elements must not be implemented as clickable generic divs when a semantic button or link is appropriate.

---

# 56. FOCUS STATES

Create a visible and elegant focus system.

Keyboard users must always know where focus is located.

Do not remove browser focus indicators without supplying a better accessible replacement.

---

# 57. TOUCH TARGETS

Important interactive areas should be approximately 44px or larger.

This especially applies to:

navigation;
primary buttons;
icon actions;
menu items;
form controls.

Avoid very small banking actions on mobile.

---

# 58. FEEDBACK STATES

Every interactive component must consider:

hover
pressed
focus
disabled
loading

where applicable.

Touch interfaces must receive immediate tactile-looking visual feedback.

---

# 59. SAFE FINANCIAL UI

Do not make dangerous banking actions visually ambiguous.

Destructive actions such as:

Remove beneficiary
Block account
Cancel operation

must have appropriate warning styling.

Critical confirmations should clearly communicate the consequence.

---

# 60. CONFIRMATION PATTERN

Prepare a reusable confirmation pattern.

For important actions, present:

what is happening;
who/what is affected;
amount if financial;
possible consequence;
primary confirmation action;
safe cancel action.

Avoid generic:

Are you sure?

without context.

---

# 61. SECURITY UI LANGUAGE

Security-related areas should visually communicate seriousness without appearing frightening.

Use calm, precise language.

Examples:

Secure session

Identity verified

Two-factor authentication enabled

New login detected

Avoid excessive lock icons everywhere.

---

# 62. PUBLIC TRUST VISUALS

Prepare reusable public-site trust components such as:

SecurityFeature
TrustBadge
FeatureCard
Metric
Testimonial structure
FAQ item

Do not invent fake regulatory licenses, customer numbers or awards.

No false trust claims.

Actual legal/regulatory claims must later come from verified information.

---

# 63. BRAND IMAGERY

Prepare the design system to support future premium visuals.

Possible direction:

modern everyday banking;
professional lifestyle;
realistic device interfaces;
abstract secure-network patterns;
elegant geometric compositions.

Avoid:

stock-photo overload;
fake cryptocurrency coins;
hacker imagery;
padlock clichés everywhere;
floating banknotes;
excessive 3D gimmicks.

---

# 64. PUBLIC HERO VISUAL SYSTEM

Prepare a reusable hero visual structure capable of showcasing:

account balance;
recent transaction;
transfer status;
banking mobile screen.

The future Home prompt will populate it.

Keep it responsive.

On mobile, hero visuals must not push the primary CTA excessively far down the page.

---

# 65. BRAND VOICE FOUNDATION

The visual identity should be paired with a concise language style.

Communication should be:

clear;
reassuring;
direct;
professional;
human.

Avoid unnecessary financial jargon.

Avoid exaggerated promises such as:

"The safest bank in the world."

Avoid hype such as:

"Revolutionary money experience!!!"

Prefer precise statements.

---

# 66. COMPONENT DOCUMENTATION

For important reusable components, keep naming and usage understandable.

Do not add a heavy Storybook setup unless already present or clearly justified.

The code itself should make variants and intended usage obvious.

---

# 67. COMPONENT OWNERSHIP

Shared visual primitives belong in:

components/ui/

Layout components belong in:

components/layout/

Navigation components belong in:

components/navigation/

Feature-specific components remain inside their feature module.

Example:

A generic Card belongs in shared UI.

A TransferStatusCard belongs in:

features/transfers/components/

Do not pollute the global component library with domain-specific components.

---

# 68. CSS ORGANIZATION

Use the existing Tailwind + CSS variable architecture cleanly.

Avoid giant global CSS files with hundreds of component-specific rules.

Global styles should contain:

design tokens;
base resets;
typography foundations;
shared utility behavior.

Feature styling should remain close to the relevant components where appropriate.

---

# 69. NO RANDOM INLINE STYLING

Avoid repetitive arbitrary inline styles.

Prefer:

design tokens;
Tailwind utilities;
component variants;
shared primitives.

Use arbitrary values only where a real design requirement justifies them.

---

# 70. PERFORMANCE

Do not import large visualization or animation libraries solely for decorative effects.

Prefer CSS transitions and existing lightweight libraries when sufficient.

Do not negatively impact mobile performance for appearance.

---

# 71. REDUCED MOTION

When the operating system requests reduced motion:

- remove nonessential transitions;
- reduce large movements;
- avoid animated loops;
- preserve functionality.

---

# 72. RTL READINESS

Do not create layout assumptions that make future right-to-left support impossible.

This is readiness only.

Do not implement full RTL unless the product currently requires it.

---

# 73. PRINT FOUNDATION

Because future bank statements and transaction receipts may be printed, keep print design separate from interactive UI.

Do not use screen-only effects as the basis for printable financial documents.

The statement prompt will define print styles later.

---

# 74. SECURITY AND DESIGN

Never reveal sensitive information merely for visual aesthetics.

Examples:

Do not show full account identifiers unnecessarily.

Do not expose complete document names containing sensitive data in public UI.

Do not put sensitive personal data in decorative browser-visible metadata.

---

# 75. DEMO DATA RULE

If visual components require temporary content for development:

use clearly generic demo values.

Do not imply they are connected to a real financial institution.

Do not invent regulatory credentials.

Prefer development-safe sample values.

---

# 76. DESIGN SYSTEM FILES

Adapt to the actual project structure, but a clean organization might include:

src/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── navigation/
│   ├── feedback/
│   └── data-display/
│
├── config/
│   └── brand.ts
│
├── lib/
│   ├── format/
│   └── cn.ts
│
└── styles/
    ├── globals.css
    └── tokens.css

Do not create duplicate files if equivalent infrastructure already exists.

---

# 77. VISUAL TEST PAGES

Create only minimal internal examples necessary to validate the design system.

Do NOT turn the project into a public component gallery.

Use the real layouts or a temporary development route if useful.

After validation, avoid leaving unnecessary production-visible test pages.

---

# 78. RESPONSIVE VALIDATION

Before completing this prompt, test the visual foundation at approximately:

320px
375px
390px
430px
768px
1024px
1280px
1440px+

Check:

navigation;
buttons;
forms;
cards;
modals;
sheets;
spacing;
safe areas;
typography.

No horizontal scrolling should appear because of broken layouts.

---

# 79. MOBILE BROWSER VALIDATION

Pay special attention to:

mobile browser dynamic bars;
safe-area spacing;
form keyboard behavior;
sticky/fixed navigation;
bottom sheets;
100dvh behavior;
orientation changes.

Do not assume desktop responsive mode perfectly represents real mobile-browser behavior.

---

# 80. CURRENT IMPLEMENTATION SCOPE

In this prompt, implement:

1. Brand configuration foundation.
2. Color tokens.
3. Typography system.
4. Spacing/radius/shadow tokens.
5. Light/dark theme support.
6. Core shared UI components.
7. Feedback components.
8. Navigation primitives.
9. Responsive utilities.
10. Safe-area utilities.
11. Financial formatting utilities.
12. Account/balance visual primitives.
13. Transaction-row visual foundation.
14. Transfer-progress visual foundation.
15. Mobile bottom-navigation foundation.
16. Desktop navigation foundations.
17. Admin UI visual foundation.
18. Accessibility states.
19. Motion tokens.
20. Responsive validation.

Do not implement the complete public Home page yet.

Do not implement full customer banking pages yet.

Do not implement complete admin workflows yet.

---

# 81. DO NOT CHANGE ARCHITECTURE WITHOUT REASON

PROMPT 00 established the architecture.

Preserve:

routes
→ features
→ services
→ backend.

Do not move everything into a new arbitrary structure just to implement the design system.

Do not introduce:

microservices;
monorepo;
offline-first architecture;
unnecessary state-management libraries;
duplicate component libraries.

---

# 82. DEPENDENCY RULE

Before adding a dependency:

inspect what already exists.

Reuse existing compatible libraries.

Do not install two libraries for:

icons;
forms;
dialogs;
charts;
animation;
date formatting

when one existing solution is sufficient.

Document any new dependency and explain why it was necessary.

---

# 83. QUALITY STANDARD

The final result must feel like a design system that could support a serious production-grade digital banking interface.

Consistency matters more than visual excess.

Every future page should be able to reuse these primitives without redesigning basic components.

---

# 84. FINAL REVIEW

Before finishing, verify:

- Mobile-first behavior works.
- No important element depends on hover.
- Safe areas are supported.
- Light mode is coherent.
- Dark mode is coherent.
- Contrast remains accessible.
- Buttons have complete states.
- Form components have complete states.
- Status colors are semantic.
- Financial values are formatted consistently.
- Shared components remain business-logic-free.
- Feature-specific components remain inside feature modules.
- No offline-first mechanism was introduced.
- No fake banking functionality was introduced.
- Existing architecture from PROMPT 00 was preserved.

---

# 85. FINAL REPORT

At completion, provide a concise report containing:

DESIGN TOKENS CREATED

BRAND FOUNDATION

TYPOGRAPHY

COLOR SYSTEM

LIGHT/DARK THEMES

CORE COMPONENTS

BANKING COMPONENTS

NAVIGATION COMPONENTS

RESPONSIVE BEHAVIOR

MOBILE SAFE-AREA SUPPORT

ACCESSIBILITY

ANIMATION FOUNDATION

FILES CREATED

FILES MODIFIED

DEPENDENCIES ADDED

RESPONSIVE ISSUES FOUND/FIXED

REMAINING TODOs

Also explicitly confirm:

- project builds successfully;
- TypeScript passes;
- there is no unintended horizontal mobile overflow;
- 320px layouts remain usable;
- mobile bottom navigation respects safe areas;
- no offline-first architecture has been introduced;
- no banking business logic was incorrectly placed inside shared UI components.

Stop after completing this design-system foundation.

Do not proceed automatically to the public website.

The next implementation phase will be:

PROMPT 02 — PUBLIC WEBSITE, LANDING PAGE & CUSTOMER ACQUISITION.