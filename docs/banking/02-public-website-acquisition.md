# PROMPT 02 — PUBLIC WEBSITE, LANDING PAGE & CUSTOMER ACQUISITION

Continue from PROMPT 00 and PROMPT 01.

The architecture, responsive rules, design system, accessibility rules, security foundations and component boundaries established previously are permanent.

Do NOT rebuild the architecture.

Do NOT replace the design system.

Do NOT introduce offline-first behavior.

This phase is dedicated to the complete PUBLIC WEBSITE of the digital bank.

The objective is to create a premium public experience capable of:

- attracting new visitors;
- explaining the bank;
- presenting innovative services;
- building trust;
- presenting security;
- answering common questions;
- explaining account options;
- communicating transparent pricing;
- introducing the bank's identity;
- guiding visitors toward account creation;
- allowing existing customers to access login.

The result should look and feel like the public website of a serious modern digital bank.

---

# 1. PRODUCT EXPERIENCE

The public website must answer five questions very quickly:

1. What is this bank?
2. What can it do for me?
3. Why should I trust it?
4. How much does it cost?
5. How can I open an account?

The visitor must never feel lost.

The primary conversion goal is:

OPEN AN ACCOUNT

The secondary goal is:

SIGN IN

The website should also encourage discovery before asking visitors to register.

---

# 2. PUBLIC ROUTES

Implement the public routes.

Recommended structure:

/
 /features
 /accounts
 /security
 /about
 /pricing
 /help
 /contact
 /legal
 /privacy
 /terms

Authentication entry points may link to:

/login
/register

but complete authentication workflows will be implemented in PROMPT 03.

If equivalent routes already exist, reuse them instead of creating duplicates.

---

# 3. PUBLIC LAYOUT

Use the PublicLayout established previously.

PublicLayout should contain:

PublicHeader
MainContent
PublicFooter

It must be independent from:

BankingAppLayout
AdminLayout.

The public website should never expose customer or admin navigation.

---

# 4. GLOBAL PUBLIC HEADER

Create a premium responsive public header.

Desktop navigation:

Logo

Personal
Business if supported conceptually
Accounts
Features
Security
Pricing
About
Help

Secondary actions:

Sign in
Open an account

Do not overload the navigation.

Use dropdown or mega-menu behavior only if genuinely useful.

---

# 5. MOBILE HEADER

On smartphones, use:

Logo
+
Sign in where space allows
+
Menu button.

The mobile menu should open as an accessible sheet or full-height navigation panel.

It should include:

Accounts
Features
Security
Pricing
About
Help
Contact

and a highly visible:

Open an account

CTA.

Respect:

safe-area-inset-top
safe-area-inset-bottom.

Do not use tiny menu items.

---

# 6. STICKY HEADER

The public header may become sticky after scrolling.

Use subtle visual transition:

transparent / minimal at page start

→

elevated solid surface while scrolling.

Do not create distracting animations.

Keep mobile browser performance smooth.

---

# 7. HOMEPAGE OBJECTIVE

The homepage must be the strongest marketing page of the platform.

It should combine:

emotion
+
clarity
+
product demonstration
+
trust
+
conversion.

Do not create a generic landing page containing repetitive cards.

The page must tell a structured story.

---

# 8. HOMEPAGE INFORMATION ARCHITECTURE

Create the homepage approximately in this order:

1. Announcement / optional trust strip
2. Hero
3. Trust indicators
4. Core benefits
5. Interactive product preview
6. Accounts / banking services
7. Instant transfers
8. Financial overview
9. Security
10. Document and statement management
11. Digital support
12. Customer journey
13. Innovation section
14. Pricing preview
15. About / mission
16. FAQ
17. Final CTA
18. Footer

Adapt the order when necessary for stronger UX.

Do not mechanically make every section identical.

---

# 9. HERO SECTION

The hero must immediately communicate the bank's value.

Use a strong headline.

Example tone:

Banking built around your life.

or an equivalent professional statement.

Do not hardcode this exact sentence if a stronger brand-specific version is available.

The hero should contain:

- headline;
- short explanation;
- primary CTA;
- secondary CTA;
- visual product demonstration.

Primary CTA:

Open an account

Secondary CTA:

Explore the bank

or:

See how it works.

---

# 10. HERO COPY RULE

The copy should be short.

Avoid huge paragraphs.

Use:

one strong headline;
one supporting paragraph;
one or two actions.

The visitor should understand the offer without scrolling.

---

# 11. HERO VISUAL

Use the design foundation from PROMPT 01.

Create a premium banking-product visualization.

Possible composition:

mobile banking interface
+
account card
+
balance preview
+
recent transaction
+
transfer status.

The interface shown must resemble the real future application.

Do NOT create impossible features purely for decoration.

Do NOT show fake investments, crypto assets or card products unless they are genuinely part of the product.

---

# 12. HERO MOBILE BEHAVIOR

On mobile:

headline first
supporting copy
primary CTA
secondary action
product preview.

Do not place a gigantic mockup before the CTA.

The hero should remain useful around:

320px width.

Avoid hero sections that require several full screens before revealing the next content.

---

# 13. VISUAL MOTION

Use subtle premium animation.

Possible effects:

- gentle card entrance;
- transaction item appearing;
- balance count transition;
- transfer progress movement;
- subtle background movement.

Animations must support storytelling.

Do not create:

excessive parallax;
constant floating;
3D spinning cards;
neon glows;
large particle systems.

Honor:

prefers-reduced-motion.

---

# 14. TRUST STRIP

Create a compact trust section near the hero.

It can communicate concepts such as:

Secure access
Protected personal data
Real-time account visibility
Human support

Do not invent:

banking licenses;
insurance guarantees;
regulatory certifications;
customer counts;
awards;
ratings.

Only real verified legal claims should eventually appear.

For now use neutral product capabilities.

---

# 15. CORE BENEFITS SECTION

Present approximately three to five central benefits.

Examples:

Your money, clearly visible

Move money simply

Stay in control

Secure by design

Support when you need it

Each benefit should contain:

icon;
headline;
short explanation.

Avoid long marketing prose.

---

# 16. PRODUCT EXPERIENCE SECTION

Create a high-quality section demonstrating the authenticated banking experience.

Possible presentation:

left:
content.

right:
interactive UI preview.

Or alternating responsive layout.

Show concepts such as:

Available balance
Recent activity
Quick transfer
Account overview
Notifications

Do not connect this preview to real customer data.

Use development-safe demo data.

---

# 17. ACCOUNT OVERVIEW DEMONSTRATION

Show how simple it is to understand account information.

Example preview:

Current account

Available balance

Recent transactions

Incoming / outgoing activity

The purpose is to communicate simplicity.

Do not expose sensitive information.

---

# 18. TRANSFER FEATURE SECTION

Create a section explaining internal bank transfers.

Focus on:

- simplicity;
- transparency;
- progress tracking;
- clear beneficiary information;
- clear confirmation.

Possible marketing message:

Know where your transfer stands.

Show a visual transfer card with progress.

Example:

Transfer created
Verification
Processing
Completed

Do NOT yet implement transfer business logic.

---

# 19. COMPLIANCE JOURNEY PREVIEW

Introduce the future transfer verification concept carefully.

Explain that certain operations may require additional verification depending on applicable controls.

Do not market document requests as an arbitrary obstacle.

Possible message:

For transfers requiring additional verification, the app clearly shows what is needed and what happens next.

Show visual concepts:

Progress
Action required
Document review
Final validation

Do not expose internal compliance rules publicly.

---

# 20. FINANCIAL CONTROL SECTION

Introduce future personal financial visibility.

Possible features:

income overview;
expenses;
transaction history;
activity filters.

Do not promise advanced budgeting functionality that is not planned.

Use wording such as:

Understand your account activity at a glance.

---

# 21. STATEMENTS SECTION

Present digital statements as a product capability.

Explain that customers will be able to:

- view statements;
- generate statements;
- download PDF;
- print;
- access historical statements.

Use a clean document preview.

Do not implement real statement generation yet.

---

# 22. DOCUMENT CENTER SECTION

Explain the secure document experience.

Possible benefits:

Upload requested documents

Track review status

Keep important banking documents organized

Possible statuses:

Received
Under review
Accepted
Action required

Do not expose sensitive demo documents.

---

# 23. SECURE MESSAGING SECTION

Present integrated bank support.

Explain that customers can contact the bank securely from their account.

Possible concepts:

conversation linked to a transfer;
account support;
document request;
general assistance.

Do not claim 24/7 live human support unless actually configured.

---

# 24. SECURITY SECTION ON HOME

Security deserves a major homepage section.

Highlight concepts such as:

Multi-factor authentication

Secure sessions

Protected banking data

Sensitive action confirmation

Account activity monitoring

Secure document handling

Use concise explanations.

Provide CTA:

Explore security

→ /security

---

# 25. SECURITY VISUAL LANGUAGE

Avoid cliché hacker imagery.

Do not use:

hooded hackers;
matrix code;
giant padlocks everywhere.

Prefer:

device/session cards;
verification flows;
secure login states;
clean abstract protection visuals.

Security should feel calm and credible.

---

# 26. INNOVATION SECTION

Create a dedicated section introducing what makes the bank modern.

Possible features:

Real-time account visibility

Transparent transfer progress

Digital identity journey

Smart document requests

Secure messaging

Digital statements

Multi-device access

Do not claim AI capabilities unless implemented later.

Do not use empty buzzwords.

Explain actual product improvements.

---

# 27. ACCOUNT OPENING JOURNEY

Create a visual section:

Open your account in clear steps.

Possible steps:

1. Create your profile
2. Verify your contact details
3. Provide required information
4. Complete identity verification
5. Access your banking space

Do not promise approval times that are not guaranteed.

Avoid claims such as:

Open in 2 minutes

unless verified.

---

# 28. ACCOUNT TYPES PREVIEW

Create an accounts preview section.

Initially support flexible conceptual account cards.

Possible categories:

Personal Account

Premium Account

Business Account

BUT:

Do not invent actual commercial products if none have been defined.

If the project has not yet established multiple account types, use a neutral:

Personal Banking Account

and create the infrastructure so account products can be expanded later.

---

# 29. ACCOUNT CARD CONTENT

An account product presentation may contain:

name;
short description;
main benefits;
pricing summary;
eligibility;
CTA.

Example CTA:

Explore account

or:

Open an account.

Do not fabricate interest rates or regulated product details.

---

# 30. PRICING PREVIEW

Create a transparent pricing preview on the homepage.

If real pricing has not yet been defined:

do not invent amounts.

Use a structured placeholder-ready design.

Example categories:

Account management
Internal transfers
Statements
Support
Additional services

Provide CTA:

View pricing

→ /pricing.

---

# 31. PRICING PAGE

Build a complete pricing page structure.

The page should support:

account fees;
transfer fees;
service charges;
optional features;
document-related fees if applicable;
business fees if later supported.

Use understandable tables/cards.

Mobile pricing tables must adapt to cards or stacked rows.

Never place critical information in tiny horizontal tables.

---

# 32. NO FAKE PRICING

If commercial pricing has not been defined, use clearly marked development/configuration values or neutral explanatory content.

Do NOT publish invented charges as if they were final.

Centralize pricing content for future modification.

---

# 33. FEATURES PAGE

Create:

/features

This page should provide deeper product discovery.

Organize features by category.

Suggested categories:

Accounts

Transfers

Activity

Statements

Documents

Messaging

Security

Notifications

Profile and account controls

Do not display admin features publicly.

---

# 34. FEATURES HERO

The features page should start with a concise product-level statement.

Then provide:

category navigation
+
feature sections.

Do not create 30 disconnected feature cards.

Use visual hierarchy.

---

# 35. ACCOUNTS PAGE

Create:

/accounts

Purpose:

explain available banking account experiences.

Include:

account overview;
benefits;
common actions;
digital access;
statements;
security;
eligibility placeholder;
pricing CTA;
opening-account CTA.

Do not display actual customer account data.

---

# 36. SECURITY PAGE

Create:

/security

This page should be comprehensive.

Possible sections:

How we protect your account

Authentication

Multi-factor authentication

Device and session protection

Sensitive-operation confirmation

Secure documents

Data privacy

Account alerts

Customer security responsibilities

What to do if you notice suspicious activity

Do not expose internal security architecture in dangerous detail.

---

# 37. SECURITY COMMUNICATION RULE

Explain security at a customer-friendly level.

Do not publish:

internal infrastructure maps;
security keys;
database policies;
fraud thresholds;
internal detection rules;
admin security bypass mechanisms.

Public security content should reassure without exposing attack-relevant information.

---

# 38. ABOUT PAGE

Create a complete:

/about

This should not be a tiny marketing paragraph.

Structure it as a serious banking-company page.

Possible sections:

Our story

Our mission

Our vision

Our values

How we think about banking

Customer commitment

Technology and innovation

Security and responsibility

Governance placeholder

Careers placeholder if relevant

Contact information

---

# 39. OUR MISSION

Use an authentic professional positioning.

Themes may include:

making banking easier to understand;

giving customers better visibility;

reducing unnecessary complexity;

providing modern digital access;

maintaining responsible financial controls.

Avoid exaggerated social-impact claims unless defined by the business.

---

# 40. VALUES

Possible values:

Trust

Clarity

Security

Responsibility

Innovation

Accessibility

Human support

Use a concise description for each.

---

# 41. GOVERNANCE

Prepare a section that can later present:

executive leadership;
board;
regulatory details;
legal entity information.

If this information has not been supplied:

do not invent names or people.

Use content/config placeholders or omit detailed identities until configured.

---

# 42. HELP CENTER

Create:

/help

This should function as a structured public help center.

Initial categories:

Getting started

Opening an account

Login and access

Transfers

Documents

Statements

Security

Profile

Contacting the bank

Use search-ready architecture.

---

# 43. HELP SEARCH

Create a help search UI foundation.

It may initially search configured FAQ/help content.

Do not invent a heavy search backend if unnecessary.

Search results should be easy to use on mobile.

---

# 44. FAQ

Create reusable FAQ sections.

Possible questions:

How do I open an account?

How do I access my account?

How can I make a transfer?

Where can I find my statements?

What happens when verification is required?

How can I contact the bank?

How is my account protected?

Do not answer with claims that are not supported by the actual implementation.

---

# 45. CONTACT PAGE

Create:

/contact

Public contact options may include:

secure banking messaging for customers;
general contact form;
support information;
legal/company contact information.

For authenticated customers, encourage secure messaging rather than exposing sensitive account details in public forms.

---

# 46. PUBLIC CONTACT FORM

If a public contact form is implemented, collect only what is necessary.

Possible fields:

Name
Email
Topic
Message

Never request:

password;
PIN;
OTP;
full card credentials;
complete banking secrets.

Display a visible security warning:

Never share your password, PIN or one-time verification codes.

---

# 47. LEGAL CENTER

Create:

/legal

as a central legal-information hub.

It can link to:

Terms
Privacy
Cookies
Pricing documentation
Regulatory information
Accessibility statement

Only publish real legal content when available.

For now create correct page structures.

Do not invent official legal statements.

---

# 48. TERMS PAGE

Create:

/terms

Use appropriate readable document layout.

Support:

table of contents;
section anchors;
last-updated field;
print/readability.

Use placeholder/configurable content until actual legal terms are provided.

---

# 49. PRIVACY PAGE

Create:

/privacy

Provide a professional structure for future privacy information.

Sections can support:

information collected;
why it is collected;
data usage;
retention;
security;
rights;
contact information.

Do not invent legal compliance claims.

---

# 50. COOKIE FOUNDATION

If tracking technologies are actually introduced, prepare a compliant cookie-consent architecture.

Do not display a fake consent banner if the site currently uses only strictly necessary technologies.

If analytics/marketing cookies are later used, consent must control them appropriately.

Do not implement dark-pattern consent UX.

---

# 51. PUBLIC FOOTER

Create a comprehensive but organized footer.

Potential sections:

Banking

Accounts
Features
Pricing
Security

Company

About
Contact
Careers if applicable

Support

Help
FAQ

Legal

Terms
Privacy
Legal

Account actions:

Open an account
Sign in

Also include appropriate copyright/brand information.

Do not clutter mobile screens.

Use collapsible footer sections where useful.

---

# 52. FINAL CTA SECTION

Near the bottom of key marketing pages, use a strong conversion section.

Example structure:

Ready to get started?

Short explanation.

Open an account

Sign in

The CTA must be visually strong but professional.

---

# 53. EXISTING CUSTOMER PATH

The public experience must always make it easy for an existing customer to find:

Sign in.

Do not hide login inside multiple menus.

On desktop, keep Sign in visible.

On mobile, make it available in the header or primary menu.

---

# 54. NEW CUSTOMER PATH

New visitors should see:

Open an account

as the primary conversion action.

Use consistent wording across the public website.

Avoid changing between:

Register
Join
Create
Open account
Get started

without purpose.

Prefer:

Open an account.

---

# 55. PUBLIC CONTENT MODEL

Avoid scattering marketing copy directly through every component.

Create a sensible content/config organization where useful.

For example:

src/
  features/
    public/
      content/
      components/
      sections/

or equivalent.

Do not overengineer CMS architecture yet.

The goal is easy editing.

---

# 56. SEO FOUNDATION

Public pages must use SSR/metadata capabilities where appropriate.

Create unique:

title;
meta description;
Open Graph metadata.

Prepare canonical metadata architecture if supported.

Use meaningful URLs.

Avoid:

/page1
/page2.

---

# 57. HOMEPAGE SEO

The homepage should clearly describe:

the digital bank;
account access;
online banking features.

Do not keyword-stuff.

Copy must remain human.

---

# 58. HEADING STRUCTURE

Use one logical H1 per page.

Use H2/H3 hierarchy correctly.

Do not choose heading tags based only on visual appearance.

The design system should control appearance independently.

---

# 59. STRUCTURED CONTENT

Where useful, use structured semantic markup.

Examples:

FAQ
organization information
navigation
breadcrumbs where appropriate.

Do not add misleading structured data.

---

# 60. PAGE PERFORMANCE

The public site must load quickly on mobile connections.

Optimize:

hero assets;
images;
fonts;
animations;
marketing illustrations.

Do not load:

banking app modules;
admin modules;
large chart libraries

on the public homepage unnecessarily.

---

# 61. IMAGE STRATEGY

Use optimized responsive images.

Use appropriate:

srcset/sizes
or framework image capabilities if available.

Avoid multi-megabyte hero assets.

Lazy-load below-the-fold visuals.

Prioritize the hero visual carefully.

---

# 62. MOBILE-FIRST MARKETING SECTIONS

Every desktop split section must become a logical mobile sequence.

Usually:

headline
description
visual
actions

or:

headline
visual
description

depending on the story.

Do not preserve left/right layout semantics blindly on mobile.

---

# 63. MOBILE TYPOGRAPHY

Marketing typography can be expressive but must remain practical.

At 320px:

headlines must wrap gracefully;

buttons must fit;

no text should overflow;

cards must remain readable.

Avoid extremely long unbreakable strings.

---

# 64. RESPONSIVE CTA BUTTONS

On small screens:

primary CTA may become full width.

Secondary CTA may appear below.

On larger screens:

actions may appear inline.

Keep touch targets large.

---

# 65. ANIMATION PERFORMANCE

Use CSS transforms and opacity where possible.

Avoid layout-thrashing animations.

Do not create animations that continuously consume resources while the page is idle.

Mobile battery usage matters.

---

# 66. SCROLL REVEAL

If using section-reveal animations:

keep them subtle;

trigger once;

avoid hiding important content for too long;

disable or simplify with reduced-motion preferences.

Content must remain usable if JavaScript animation fails.

---

# 67. PRODUCT MOCKUP RESPONSIVENESS

Product previews must remain legible without being exact full application replicas at every breakpoint.

On mobile:

simplify secondary elements.

On tablet/desktop:

show richer composition.

Do not create tiny unreadable mini dashboards.

---

# 68. ACCESSIBILITY

Continue meeting WCAG 2.2 AA quality.

Public pages must support:

keyboard navigation;
screen readers;
visible focus;
logical heading order;
accessible mobile menus;
accessible accordions;
accessible dialogs;
accessible forms.

Decorative images should have appropriate empty alt behavior.

Informational images require meaningful alternatives.

---

# 69. CONTRAST

Marketing sections must preserve text contrast even over:

gradients;
images;
dark backgrounds;
decorative graphics.

Do not trade readability for appearance.

---

# 70. NO HORIZONTAL OVERFLOW

Verify at:

320px
360px
375px
390px
412px
430px

No broken hero visual.

No overflowing buttons.

No giant tables.

No off-screen menus.

No clipped text.

---

# 71. TABLET EXPERIENCE

Do not treat tablets as oversized phones.

Use available width intelligently.

Possible:

two-column feature layouts;
expanded navigation;
richer product previews.

Ensure touch interactions remain usable.

---

# 72. LARGE DESKTOP

At large viewport widths:

use controlled max-width containers.

Do not stretch paragraphs across the entire screen.

Use more whitespace instead of enlarging everything excessively.

---

# 73. PUBLIC LOADING STATES

Marketing pages should primarily SSR/render quickly.

Interactive product demonstrations may use lightweight skeletons if necessary.

Avoid full-screen loaders.

---

# 74. ERROR HANDLING

Public errors should use human-readable states.

Examples:

Page unavailable
Something went wrong
Please try again

Do not expose raw backend errors.

---

# 75. NETWORK FAILURE

Because the project is online-only:

if a dynamic public operation fails, provide:

clear network message
+
Retry.

Do not introduce offline content synchronization.

---

# 76. LOGIN AND REGISTER LINKS

PROMPT 03 will implement authentication.

For now:

create clean navigation paths to:

/login
/register.

If placeholder screens are necessary for routing, keep them minimal and clearly separate from full implementation.

Do not build the full onboarding flow now.

---

# 77. PUBLIC ANALYTICS READINESS

Prepare semantic event boundaries for future analytics if appropriate.

Potential public conversion events:

open_account_clicked
sign_in_clicked
pricing_viewed
feature_viewed

Do NOT send:

personal data;
account data;
financial data

into public analytics.

Do not integrate unnecessary third-party tracking yet.

---

# 78. TRUST WITHOUT FAKE SOCIAL PROOF

Do NOT invent:

"1 million customers"

"Rated 4.9/5"

"Trusted by 500,000 people"

"Best Bank 2026"

fake partner logos

fake media logos

fake testimonials.

Use product trust and real functionality until actual evidence is available.

---

# 79. TESTIMONIAL INFRASTRUCTURE

You may prepare a testimonial component for future verified testimonials.

Do not populate it with fake customer identities.

If no real testimonials exist, omit the section from production.

---

# 80. REGULATORY CONTENT

Prepare public UI areas that can later hold:

legal entity;
registration number;
banking license;
regulator;
deposit protection information;
registered office.

Do NOT invent these values.

Use configuration placeholders only in development where necessary.

---

# 81. PERSONAL VS BUSINESS

If business banking has not yet been defined in detail:

do not create a fake full business product.

The public architecture may reserve the concept for future use.

Prioritize personal banking in this version.

---

# 82. PUBLIC FEATURES TO EMPHASIZE

The public website should strongly communicate these planned capabilities:

Digital account access

Real-time balance visibility

Internal transfers

Transfer progress tracking

Secure document submission

Account statements

Transaction history

Secure bank messaging

Notifications

Account security

Profile and session controls

Do not expose admin capabilities publicly.

---

# 83. HOME PRODUCT STORY

The homepage should feel like a guided story:

CONTROL

See your finances clearly.

MOVE

Transfer funds simply.

TRACK

Understand what is happening.

VERIFY

Complete additional checks transparently when required.

DOCUMENT

Manage statements and documents.

PROTECT

Control security and account access.

SUPPORT

Communicate with your bank.

This is a conceptual storytelling framework, not mandatory visible labels.

---

# 84. COPY STYLE

Use short, modern, professional copy.

Avoid:

corporate jargon;
excessive exclamation marks;
fake urgency;
fear-based security messaging;
crypto terminology.

Prefer:

simple sentences;
clear benefits;
direct calls to action.

---

# 85. MICROCOPY

Buttons and supporting messages should explain actions precisely.

Examples:

Open an account

View account options

Explore security

See all features

View pricing

Visit Help Center

Sign in

Avoid vague:

Learn more

everywhere.

It may still be used where context is already obvious.

---

# 86. EMPTY MARKETING PLACEHOLDERS

Do not leave:

Lorem ipsum

in production-visible areas.

Where final business content is unavailable:

use carefully written neutral content or centralized TODO/config values.

---

# 87. PUBLIC UI COMPONENTS

Build reusable public-specific components where helpful.

Examples:

Hero
SectionHeader
FeatureCard
FeatureShowcase
ProductPreview
TrustItem
SecurityFeature
AccountProductCard
PricingPreview
FAQSection
CTASection
PublicContactForm
PublicFooter

Keep them inside:

features/public/

when domain-specific.

Do not move them all into global shared UI.

---

# 88. SHARED COMPONENT REUSE

Reuse PROMPT 01 components:

Button
Card
Badge
Accordion
Dialog
Drawer
Sheet
Input
Toast
Navigation primitives

Do not duplicate them under different names.

---

# 89. DARK MODE

The public site should support the theme foundation established in PROMPT 01.

However:

do not design marketing solely around dark mode.

Both themes must look intentional.

Ensure product mockups adapt appropriately.

---

# 90. CONTENT CONSISTENCY

Ensure terminology stays consistent.

Use one term for each concept.

For example:

Transfer

not randomly:

Payment
Send operation
Money movement
Remittance

unless those concepts genuinely differ.

---

# 91. BREADCRUMBS

Use breadcrumbs only on deeper public content pages where useful.

Do not add breadcrumbs unnecessarily to homepage-level pages.

---

# 92. PUBLIC PAGE TRANSITIONS

Use subtle route transitions only if they do not interfere with navigation responsiveness.

Do not create loading animations between every public page.

Navigation should feel instant.

---

# 93. 404 PAGE

Create a branded public 404 experience.

Include:

clear message;
Return home;
Visit Help Center.

Do not expose technical routing information.

---

# 94. PUBLIC ERROR PAGE

Prepare an accessible generic error presentation.

Allow:

Retry
Return home

where relevant.

---

# 95. EXTERNAL LINKS

External links must be visually understandable where appropriate.

For security/legal resources, avoid accidental misleading navigation.

Use proper:

rel
target

behavior where needed.

---

# 96. CURRENT IMPLEMENTATION SCOPE

In this prompt implement:

1. PublicLayout completion.
2. Public responsive header.
3. Mobile public navigation.
4. Public footer.
5. Homepage.
6. Features page.
7. Accounts page.
8. Security page.
9. About page.
10. Pricing page.
11. Help page.
12. Contact page.
13. Legal hub.
14. Terms structure.
15. Privacy structure.
16. Public 404/error foundation.
17. Public reusable marketing sections.
18. Mobile-first behavior.
19. SEO metadata foundation.
20. Responsive visual product previews.
21. Accessibility validation.
22. Public performance optimization.

Do NOT implement:

full authentication;
customer dashboard;
real balances;
real transfers;
ledger;
full KYC;
admin workflows.

These come later.

---

# 97. PRESERVE EXISTING FOUNDATION

Do not break PROMPT 00.

Do not break PROMPT 01.

Preserve:

modular architecture;

feature boundaries;

shared components;

design tokens;

responsive rules;

safe-area support;

online-only architecture;

authentication boundaries.

---

# 98. BUILD VALIDATION

After implementation run appropriate checks.

Verify:

project builds;

TypeScript passes;

no obvious route errors;

no broken imports;

no accidental duplicate components;

no unintended horizontal overflow.

---

# 99. RESPONSIVE VALIDATION

Manually inspect approximately:

320px
375px
390px
430px
768px
1024px
1280px
1440px+

Check:

Hero

Header

Mobile menu

Feature sections

Product previews

Pricing

FAQ

Forms

Footer

CTA sections.

---

# 100. MOBILE BROWSER QUALITY

Pay particular attention to:

Chrome Android;

Safari iPhone;

Samsung Internet;

mobile viewport changes;

safe areas;

sticky header;

mobile menu;

touch targets;

forms.

No desktop-only interactions.

---

# 101. ACCESSIBILITY REVIEW

Verify:

logical tab order;

menu keyboard accessibility;

visible focus;

heading hierarchy;

form labels;

accordion accessibility;

contrast;

reduced motion;

screen-reader-friendly status text.

---

# 102. PERFORMANCE REVIEW

Check for:

oversized hero media;

unnecessary dependencies;

heavy animation;

large initial JavaScript bundles;

unoptimized images.

Keep the public homepage fast.

---

# 103. SECURITY REVIEW

Confirm:

no secret keys in frontend;

no real sensitive customer data in demo content;

no internal admin information publicly exposed;

no security implementation details exposed unnecessarily;

no fake regulatory claims;

no public form requests passwords or OTPs.

---

# 104. FINAL QUALITY STANDARD

The homepage must not look like:

a generic Lovable template.

It should feel like a carefully designed digital banking brand.

Each section must have a specific storytelling purpose.

Avoid repetitive:

card
card
card
card
card

layouts.

Mix:

visual demonstrations;

typographic storytelling;

structured benefits;

security information;

product previews;

clear CTAs.

The design should feel premium without sacrificing usability.

---

# 105. FINAL REPORT

At completion provide a concise implementation report containing:

PUBLIC ROUTES CREATED

HOMEPAGE SECTIONS

PUBLIC COMPONENTS

HEADER / NAVIGATION

MOBILE NAVIGATION

FOOTER

FEATURES PAGE

ACCOUNTS PAGE

SECURITY PAGE

ABOUT PAGE

PRICING PAGE

HELP CENTER

CONTACT

LEGAL PAGES

SEO IMPLEMENTATION

RESPONSIVE IMPROVEMENTS

ACCESSIBILITY

PERFORMANCE

FILES CREATED

FILES MODIFIED

DEPENDENCIES ADDED

KNOWN TODOs

Also explicitly confirm:

- project builds successfully;
- TypeScript passes;
- public pages work from 320px upward;
- no horizontal mobile overflow remains;
- mobile header respects safe areas;
- no offline-first architecture was introduced;
- no fake banking data is presented as real;
- no fake regulatory information was created;
- no customer banking business logic was added to public components;
- architecture from PROMPT 00 remains intact;
- design system from PROMPT 01 is reused rather than duplicated.

Stop after completing the public website.

Do NOT proceed automatically to authentication.

The next phase is:

PROMPT 03 — AUTHENTICATION, REGISTRATION & CUSTOMER ONBOARDING.