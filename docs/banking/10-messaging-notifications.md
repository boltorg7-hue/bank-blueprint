# PROMPT 10 — SECURE BANK MESSAGING, NOTIFICATIONS & CUSTOMER COMMUNICATION CENTER

Continue from PROMPT 00 through PROMPT 09.

Do NOT rebuild the architecture.

Do NOT replace the design system.

Do NOT weaken authentication, authorization, ledger, transfer, compliance, statement or document security.

Do NOT introduce offline-first behavior.

This phase implements the complete CUSTOMER COMMUNICATION LAYER of the banking platform.

The objective is to create:

- secure bank ↔ customer messaging;
- conversation threads;
- transfer-linked support conversations;
- document-linked conversations;
- account-related support;
- customer notification center;
- in-app notifications;
- email notification hooks;
- SMS notification hooks where appropriate;
- push-notification readiness;
- security alerts;
- transfer alerts;
- document alerts;
- statement alerts;
- unread counters;
- notification preferences;
- delivery status;
- communication auditability;
- safe deep-link navigation;
- mobile-first communication UX.

The communication system must remain BANKING-CONTEXT-ORIENTED.

It is NOT a social network.

It is NOT an unrestricted instant-messaging application.

---

# 1. FUNDAMENTAL COMMUNICATION PRINCIPLE

Banking communication must be:

SECURE

CONTEXTUAL

TRACEABLE

ACTIONABLE

PRIVACY-AWARE.

A customer should be able to understand:

What happened?

Does it require action?

Which account, transfer or document does it concern?

What can I do next?

---

# 2. TWO DISTINCT COMMUNICATION DOMAINS

Keep these concepts separate:

## SECURE MESSAGING

Persistent customer ↔ bank conversations.

Examples:

question about transfer;

document request discussion;

account issue;

security concern.

## NOTIFICATIONS

Event-driven alerts informing the customer about something that happened.

Examples:

transfer completed;

document required;

statement ready;

new secure message;

security alert.

Do not merge both into one generic table without clear boundaries.

---

# 3. MESSAGING MODULE

Create or complete:

```text
src/features/messages/
```

Possible organization:

```text
messages/
├── components/
├── hooks/
├── services/
├── schemas/
├── types/
├── pages/
└── server/
```

---

# 4. NOTIFICATION MODULE

Create or complete:

```text
src/features/notifications/
```

Possible organization:

```text
notifications/
├── components/
├── hooks/
├── services/
├── schemas/
├── types/
├── pages/
└── server/
```

Keep notification delivery and secure conversations separate.

---

# 5. CUSTOMER MESSAGE ROUTES

Fully implement:

```text
/app/messages
```

```text
/app/messages/:conversationRef
```

Optional route:

```text
/app/messages/new
```

only where a dedicated page improves UX.

---

# 6. NOTIFICATION ROUTES

Fully implement:

```text
/app/notifications
```

Potential preference route:

```text
/app/settings/notifications
```

or equivalent.

---

# 7. MESSAGING SCOPE

Customers may initiate secure conversations for supported banking topics.

Recommended categories:

ACCOUNT

TRANSFER

DOCUMENT

STATEMENT

SECURITY

COMPLAINT

GENERAL_SUPPORT.

Do not allow arbitrary public user-to-user chat.

---

# 8. NO CUSTOMER-TO-CUSTOMER CHAT

This platform is a bank.

Customer A must not be able to send unrestricted messages to Customer B simply because they transferred money.

The bank communication system is:

CUSTOMER ↔ BANK.

---

# 9. CONTEXTUAL CONVERSATION

A conversation may be linked to a banking object.

Examples:

transfer

transaction

account

statement

document

security event.

This gives bank staff immediate operational context.

---

# 10. CONVERSATION ENTITY

Create a secure conversation model.

Conceptual fields:

```text
id

public_reference

customer_id

category

subject

status

priority

linked_resource_type nullable

linked_resource_reference nullable

created_at

updated_at

last_message_at

closed_at nullable
```

Adapt naming to the current project.

---

# 11. CONVERSATION PUBLIC REFERENCE

Generate a server-side safe reference.

Example:

```text
MSG-2026-0004821
```

Do not expose internal database IDs unnecessarily.

---

# 12. CONVERSATION STATUS

Support clear states:

```text
OPEN

WAITING_FOR_BANK

WAITING_FOR_CUSTOMER

RESOLVED

CLOSED
```

Do not expose raw internal ticket-system terminology if customer-friendly wording is better.

---

# 13. CUSTOMER-FACING STATUS LABELS

Possible labels:

Open

Bank reviewing

Your response needed

Resolved

Closed.

---

# 14. MESSAGE ENTITY

Create a separate message entity.

Conceptual:

```text
id

conversation_id

sender_type

sender_reference

body

message_type

created_at

edited_at nullable
```

Do not use one giant conversation JSON blob.

---

# 15. MESSAGE SENDER TYPES

Support:

```text
CUSTOMER

STAFF

SYSTEM
```

Do not expose internal staff identifiers unnecessarily to customers.

---

# 16. CUSTOMER-SAFE STAFF IDENTITY

Customer-facing staff messages may display:

Support Team

Verification Team

Security Team

or configured staff display identity.

Do not expose internal employee IDs.

---

# 17. MESSAGE TYPES

Support:

```text
TEXT

SYSTEM_EVENT

DOCUMENT_REQUEST

DOCUMENT_UPDATE

TRANSFER_UPDATE
```

Do not overbuild rich-media messaging.

---

# 18. MESSAGE BODY

Customer-entered messages should be plain text or safely sanitized rich text if absolutely necessary.

Prefer plain text for V1.

Do not allow arbitrary HTML execution.

---

# 19. MESSAGE LENGTH

Set a reasonable configurable maximum.

Do not allow unlimited giant payloads.

---

# 20. ATTACHMENTS

If messaging attachments are supported:

reuse secure private document-storage principles.

Allowed use cases:

supporting document

screenshot

bank-requested file.

Do not allow arbitrary executable uploads.

---

# 21. ATTACHMENT SECURITY

Validate:

file type

file size

ownership

malware/scanning integration readiness if required.

Do not trust browser MIME type alone.

---

# 22. ATTACHMENT STORAGE

Use private storage.

No public permanent URLs.

Short-lived authorized access only.

---

# 23. LINKED TRANSFER CONVERSATION

On transfer detail, provide:

Contact bank about this transfer

when support interaction is allowed.

Creating the conversation should automatically link:

transfer reference

customer

relevant category.

Do not ask the user to manually copy the transfer reference.

---

# 24. LINKED DOCUMENT CONVERSATION

On document requirement/status pages, allow:

Ask about this document

with context automatically attached.

---

# 25. LINKED STATEMENT CONVERSATION

A customer may request help about a statement.

Link the conversation to the statement reference.

---

# 26. LINKED ACCOUNT CONVERSATION

Account detail may provide:

Get help with this account.

Context should include only customer-safe identifiers.

---

# 27. SECURITY CONVERSATION

Security-related conversations should use a distinct category and higher operational visibility.

Do not expose internal fraud/security workflows.

---

# 28. NEW CONVERSATION FLOW

Recommended customer flow:

1. Select topic
2. Select related item if applicable
3. Enter subject
4. Write message
5. Review
6. Send.

Keep it simple.

---

# 29. MOBILE COMPOSE

On mobile:

single-column

large textarea

clear context card

sticky Send action when appropriate.

Respect safe areas.

---

# 30. DUPLICATE SUPPORT REQUESTS

If an open conversation already exists for the same transfer/document and same issue category:

consider guiding the user to continue that conversation.

Do not force it if a separate topic is legitimate.

---

# 31. MESSAGE SENDING

Sending a message must be server-authorized.

Validate:

authenticated customer

conversation ownership

conversation state

message length

attachment ownership.

---

# 32. CLOSED CONVERSATIONS

If conversation is CLOSED:

do not silently append new messages.

Provide:

Start a new conversation

if needed.

---

# 33. RESOLVED CONVERSATIONS

A RESOLVED conversation may optionally allow customer reply within policy.

Define this centrally.

Do not scatter logic across UI.

---

# 34. MESSAGE IMMUTABILITY

Avoid allowing customers to silently rewrite historical messages.

If editing is supported at all:

restrict it to a very short safe window

and preserve audit history.

Simpler V1:

no message editing after send.

---

# 35. MESSAGE DELETION

Do not allow customers to delete official support history from the bank system.

UI may support archival/hiding from primary view later.

Do not physically erase communication history through ordinary flows.

---

# 36. CONVERSATION LIST

`/app/messages` should display:

subject

category

linked context

last message preview

last activity

status

unread indicator.

---

# 37. MESSAGE THREAD

Conversation detail should show:

conversation context

message timeline

bank/customer sender differentiation

timestamps

attachments

status

reply composer.

---

# 38. CONTEXT HEADER

For linked conversations:

show a contextual card.

Example:

Transfer TRF-2026-000481

50,000 XAF

External transfer

99% — Action required.

CTA:

View transfer.

---

# 39. DO NOT DUPLICATE FINANCIAL DATA

Conversation context should query current customer-safe resource data.

Do not store mutable financial amounts inside message body as the only source.

---

# 40. SYSTEM MESSAGES

System-generated conversation entries may explain events.

Examples:

Document requested

Document received

Transfer completed.

These should be clearly visually distinct from staff/customer messages.

---

# 41. CUSTOMER MESSAGE READ STATE

Track whether customer has read new staff/system messages.

Do not use only localStorage.

Read state should be server-backed where appropriate.

---

# 42. STAFF READ STATE

Prepare architecture for staff-side read state.

Full admin support console comes later.

---

# 43. UNREAD MESSAGE COUNT

The customer app header may display unread conversation count.

Only use trusted server-backed count.

Do not fabricate notification badges.

---

# 44. NOTIFICATION SYSTEM

Create an event-driven notification model.

Notifications should be created from trusted domain events.

Example:

TRANSFER_COMPLETED

→ customer notification.

Do not create financial notification state directly from frontend actions.

---

# 45. NOTIFICATION ENTITY

Conceptual:

```text
id

public_reference

customer_id

type

category

title

body

severity

status

linked_resource_type nullable

linked_resource_reference nullable

created_at

read_at nullable

archived_at nullable
```

---

# 46. NOTIFICATION STATUS

Simple states:

```text
UNREAD

READ

ARCHIVED
```

Delivery-channel statuses belong separately.

---

# 47. NOTIFICATION CATEGORIES

Support:

TRANSFERS

ACCOUNTS

DOCUMENTS

STATEMENTS

MESSAGES

SECURITY

SYSTEM.

---

# 48. NOTIFICATION SEVERITY

Use semantic levels:

INFO

SUCCESS

WARNING

CRITICAL.

Do not mark normal transaction success as critical.

---

# 49. CRITICAL NOTIFICATIONS

Reserve CRITICAL for truly important security/account events.

Examples:

suspicious login

account frozen

urgent security action required.

Do not create alert fatigue.

---

# 50. TRANSFER NOTIFICATIONS

Create notification events for:

transfer_created

transfer_processing

transfer_document_required

transfer_document_received

transfer_document_accepted

transfer_document_rejected

transfer_approved

transfer_blocked

transfer_settlement_pending

transfer_completed

transfer_failed

transfer_cancelled

transfer_reversed.

---

# 51. INTERNAL TRANSFER NOTIFICATIONS

Sender:

Transfer completed.

Recipient:

Money received.

Both notifications must derive from the same authoritative successful ledger-backed transfer.

---

# 52. INTERNAL RECEIPT NOTIFICATION

Optionally notify sender when final receipt becomes available.

Do not generate duplicate noise if completion notification already provides receipt access.

---

# 53. EXTERNAL 99% NOTIFICATION

When external transfer reaches 99%:

notification must reflect actual state.

Examples:

Final confirmation pending

or:

Action required.

Do not say:

Transfer completed.

---

# 54. DOCUMENT REQUIRED NOTIFICATION

Example:

Document required for transfer TRF-....

CTA:

Upload document.

Deep link to the correct transfer/document workflow.

---

# 55. EXTERNAL 100% NOTIFICATION

Only after authoritative settlement completion:

Transfer completed.

Receipt available where applicable.

---

# 56. DOCUMENT NOTIFICATIONS

Support:

document_required

document_uploaded

document_under_review if useful

document_accepted

document_rejected

replacement_required.

---

# 57. STATEMENT NOTIFICATIONS

Support:

statement_ready

statement_generation_failed.

Example:

Your August 2026 statement is ready.

CTA:

View statement.

---

# 58. MESSAGE NOTIFICATION

When bank staff responds:

New secure message.

Deep link to conversation.

Do not include sensitive full message content in channels where privacy cannot be assured.

---

# 59. ACCOUNT NOTIFICATIONS

Potential:

account_activated

account_restricted

account_suspended

account_reopened if applicable

account_closed.

Use precise language.

---

# 60. SECURITY NOTIFICATIONS

Prepare events such as:

new_login

password_changed

mfa_enabled

mfa_disabled

security_settings_changed

new_device_detected

session_revoked.

PROMPT 11 will implement the full security center.

---

# 61. NOTIFICATION CENTER PAGE

`/app/notifications`

should show:

All

Unread

Transfer

Security

Documents

Messages

where useful.

Do not overload initial navigation.

---

# 62. MOBILE NOTIFICATION CARD

Display:

icon

title

short body

time

unread state

linked action.

Use touch-friendly rows.

---

# 63. DESKTOP NOTIFICATION LIST

Desktop may use a structured list.

Avoid admin-like dense tables.

---

# 64. NOTIFICATION DEEP LINKS

Notifications should route safely to:

transfer

document

statement

conversation

security page.

Validate resource ownership on destination.

---

# 65. BROKEN RESOURCE LINK

If linked resource is unavailable:

show safe fallback.

Do not expose another customer's object.

---

# 66. MARK AS READ

Provide:

mark read

and potentially:

mark all as read.

Server-backed.

Do not rely only on visual state.

---

# 67. MARK ALL AS READ

This operation must only affect the authenticated customer's notifications.

---

# 68. ARCHIVE

Allow optional archive behavior.

Do not delete bank notification history through ordinary UI unless retention policy explicitly allows it.

---

# 69. NOTIFICATION BELL

Integrate header bell from PROMPT 04 with real notification data.

Show unread badge only when count > 0.

---

# 70. BADGE CAP

For large counts:

use customer-friendly display such as:

9+

99+

if desired.

Do not clutter header.

---

# 71. REALTIME IN-APP UPDATES

If Supabase Realtime is already appropriate:

use it for new in-app notification refresh.

However:

realtime must not be required for correctness.

Normal secure refetch must work.

---

# 72. REALTIME SECURITY

Subscribe only to notifications/conversations belonging to the authenticated customer.

Never subscribe customers to global communication channels.

---

# 73. EMAIL NOTIFICATION CHANNEL

Prepare email notification delivery integration.

Use it for appropriate events such as:

security alerts

document requests

statement ready

important transfer updates.

Do not send every minor in-app event by email.

---

# 74. SMS CHANNEL

SMS may be used for high-value security/verification events where configured.

Do not send sensitive financial details unnecessarily.

Never include:

password

OTP beyond its intended authentication message

full account number

full sensitive document details.

---

# 75. PUSH READINESS

Prepare push-notification architecture for browsers where appropriate.

However:

the project remains ONLINE-FIRST.

Push support does NOT mean offline-first.

---

# 76. PUSH CONTENT PRIVACY

Lock-screen notifications may be visible to other people.

Default push body should avoid sensitive details.

Prefer:

Your transfer status has changed.

instead of:

You sent 450,000 XAF to John Doe

unless the customer has explicitly opted into detailed previews.

---

# 77. EMAIL PRIVACY

Email should similarly minimize sensitive banking information.

Use secure deep links back to authenticated app.

---

# 78. SMS PRIVACY

Keep SMS minimal.

Example:

A security change was made to your account. Sign in to review.

---

# 79. DELIVERY MODEL

Create a notification-delivery entity.

Conceptual:

```text
notification_id

channel

status

provider_reference nullable

attempt_count

last_attempt_at

delivered_at nullable

failed_at nullable
```

---

# 80. DELIVERY CHANNELS

Support:

IN_APP

EMAIL

SMS

PUSH.

Only activate channels that have real configured providers.

---

# 81. NO FAKE DELIVERY

If email/SMS/push provider is not configured:

do not pretend delivery succeeded.

In-app notifications can still work.

---

# 82. DELIVERY STATUS

Use:

PENDING

SENT

DELIVERED where provider supports it

FAILED

SKIPPED.

Do not invent delivery confirmation if provider does not provide it.

---

# 83. DELIVERY RETRY

Retry transient failures safely.

Do not create duplicate messages repeatedly.

Use idempotency/provider keys.

---

# 84. NOTIFICATION IDEMPOTENCY

One domain event should not create five identical in-app notifications because it was processed repeatedly.

Use event/reference uniqueness where appropriate.

---

# 85. DOMAIN EVENT ID

Every important originating event should have a stable ID/reference.

Notification service can use it for deduplication.

---

# 86. NOTIFICATION TEMPLATE SYSTEM

Create reusable notification templates.

Conceptually:

type

channel

title

body

action label

linked route.

Do not scatter customer-facing strings through server functions.

---

# 87. CHANNEL-SPECIFIC TEMPLATES

In-app can contain more detail.

Push should be concise.

Email may contain structured explanation.

SMS must remain brief.

Do not force one exact body into all channels.

---

# 88. CUSTOMER NOTIFICATION PREFERENCES

Create a preference model.

Possible categories:

Transfers

Statements

Documents

Messages

Product information

Security.

---

# 89. SECURITY NOTIFICATIONS CANNOT ALWAYS BE DISABLED

Critical security communications may be mandatory.

Do not allow customers to disable essential:

password change alerts

security warnings

account restriction notices

where banking policy requires delivery.

---

# 90. OPTIONAL COMMUNICATIONS

Marketing/product communications must remain separate from transactional banking notifications.

Do not bundle them.

---

# 91. PREFERENCE CHANNELS

For eligible notification categories, customer may choose:

Email

Push

SMS if supported.

In-app may remain always available for transactional history.

---

# 92. DEFAULT PREFERENCES

Use sensible security-first defaults.

Do not automatically subscribe customers to marketing.

---

# 93. NOTIFICATION SETTINGS UI

Under settings:

Notifications

Sections:

Security alerts

Transfers

Documents

Statements

Messages

Optional updates.

Use switches carefully.

Explain mandatory notifications.

---

# 94. MOBILE PREFERENCE UX

Use grouped list rows.

Do not create huge preference matrices.

---

# 95. QUIET HOURS READINESS

Prepare architecture for future quiet hours for noncritical push/SMS.

Do not delay critical security alerts.

Do not overbuild this now unless needed.

---

# 96. EMAIL ADDRESS SOURCE

Transactional email must use the verified customer contact stored in customer profile/contact domain.

Do not accept arbitrary destination email from event payload.

---

# 97. PHONE SOURCE

SMS must use trusted verified phone information.

---

# 98. CONTACT CHANGE

If customer changes verified contact:

future notification delivery must use the current trusted contact according to policy.

---

# 99. FAILED CONTACT

If email/SMS repeatedly fails:

record operational status.

Do not expose provider internals to customer.

---

# 100. SECURITY OF MESSAGE CONTENT

Never include:

password

OTP

secret token

service credentials

full card credentials

raw KYC document contents

inside secure messages or notification metadata.

---

# 101. ENCRYPTION

Use HTTPS/TLS through the deployed platform.

Protect stored communication data through database/storage security.

Do not invent custom client-side cryptography without a clear threat model.

---

# 102. MESSAGE RLS

Customer may read only conversations they own/are authorized for.

Customer cannot access another customer's conversation by changing URL.

---

# 103. MESSAGE WRITE RLS

Prefer controlled server mutations.

Customer may send messages only within permitted own conversations.

They cannot impersonate STAFF or SYSTEM.

---

# 104. NOTIFICATION RLS

Customer may read/update read/archive state only for their own notifications.

They cannot create fake banking notifications for themselves or others.

---

# 105. CUSTOMER CANNOT MARK DOMAIN EVENT COMPLETE

Marking notification read must not alter:

transfer status

document status

security event

statement status.

Notifications are informational projections.

---

# 106. CUSTOMER CANNOT FAKE STAFF MESSAGE

`sender_type = STAFF`

must never be accepted from customer request.

---

# 107. CUSTOMER CANNOT CHANGE PRIORITY

If support conversation priority is internal:

customer must not be able to set:

CRITICAL

to jump the queue.

Customer-visible urgency options may be handled separately if needed.

---

# 108. SUPPORT PRIORITY

Prepare:

NORMAL

HIGH

URGENT

for trusted bank workflows if useful.

Do not expose internal triage logic.

---

# 109. STAFF ASSIGNMENT READINESS

Prepare conversation entity for future:

assigned_team

assigned_staff

without implementing the full admin support desk.

---

# 110. ADMIN HANDOFF

PROMPT 12 will implement staff-facing communication management.

This prompt only prepares compatible models and customer experience.

---

# 111. SUPPORT TEAM TYPES

Potential teams:

General Support

Transfers

Compliance

Security

Accounts.

Do not expose internal organizational complexity unnecessarily.

---

# 112. AUTOMATIC CONVERSATION ROUTING

A transfer-related conversation may route conceptually to Transfers/Compliance.

Security issue may route to Security.

Keep routing server-controlled.

---

# 113. SYSTEM MESSAGE ON DOCUMENT REQUEST

When compliance requests a transfer document:

the system may create:

notification

and optionally a system entry in the linked conversation.

Do not duplicate confusing messages unnecessarily.

---

# 114. SYSTEM MESSAGE ON DOCUMENT ACCEPTANCE

Example:

Your document was accepted.

Keep it customer-safe.

---

# 115. SYSTEM MESSAGE ON TRANSFER COMPLETION

A linked transfer conversation may display:

Transfer completed.

This is informational.

Do not create a conversation automatically for every transfer if none exists.

---

# 116. CREATE CONVERSATION ONLY WHEN NEEDED

Avoid creating empty support threads for routine successful transactions.

Notifications are sufficient.

---

# 117. MESSAGE TIMESTAMPS

Use authoritative server timestamps.

Render using customer/bank locale rules.

---

# 118. MESSAGE ORDERING

Oldest → newest inside a conversation.

Use deterministic ordering.

---

# 119. PAGINATION

For very long conversations:

load older messages progressively.

Do not load thousands of messages unnecessarily.

---

# 120. CONVERSATION LIST PAGINATION

Use server-side pagination when scale requires it.

---

# 121. NOTIFICATION PAGINATION

Use server-side pagination.

Newest first.

---

# 122. FILTERING

Notifications may filter by:

Unread

Transfers

Security

Documents

Messages.

Conversations may filter:

Open

Resolved.

---

# 123. SEARCH

Secure messaging search may support:

subject

conversation reference

customer-safe linked-resource reference.

Do not expose internal staff fields.

---

# 124. MESSAGE ATTACHMENT PREVIEW

Provide safe preview/download.

Do not automatically render unknown files inline.

---

# 125. ATTACHMENT FILE NAME

Use safe display name.

Avoid exposing internal storage path.

---

# 126. VIRUS/MALWARE READINESS

Prepare an integration boundary for future file scanning.

Do not pretend uploads are malware-scanned if no scanner exists.

---

# 127. SUPPORT MESSAGE NETWORK FAILURE

Because the application is online-only:

if send fails:

do not silently queue the message offline.

Keep unsent text in current UI state where practical.

Show:

Message not sent

Retry.

---

# 128. NO OFFLINE OUTBOX

Do not create IndexedDB message queues.

The system remains online-first.

---

# 129. DOUBLE SEND

Double-tapping Send must not create duplicate messages.

Use client loading state and server idempotency where appropriate.

---

# 130. NOTIFICATION NETWORK FAILURE

If notification list cannot refresh:

show local error/retry.

Previously loaded data may remain with freshness context.

---

# 131. MOBILE MESSAGING UX

At 320–430px:

conversation list must remain readable;

thread must not overflow;

composer must remain above keyboard;

attachments must remain accessible;

safe-area bottom padding must work.

---

# 132. MOBILE KEYBOARD

Composer must adapt when virtual keyboard opens.

Do not leave Send button behind browser UI.

---

# 133. MOBILE MESSAGE COMPOSER

Use a compact but comfortable composer.

Do not mimic social-chat emoji-heavy UI.

This is a banking communication channel.

---

# 134. DESKTOP MESSAGE UX

Desktop may use:

conversation list

+

selected conversation pane

if routing/state remains accessible.

Alternatively use dedicated pages.

Choose simple maintainable UX.

---

# 135. TABLET

Tablet split-pane may be useful.

Do not force split pane if width is insufficient.

---

# 136. ACCESSIBILITY

Messaging and notifications must meet WCAG 2.2 AA.

Verify:

conversation list semantics;

message author identification;

timestamps;

unread states;

composer label;

attachment controls;

notification status;

deep links;

focus management;

screen-reader announcements.

---

# 137. NEW MESSAGE ANNOUNCEMENT

When a new message arrives while thread is open:

announce appropriately without excessive interruption.

---

# 138. UNREAD STATUS

Do not communicate unread state only with a colored dot.

Use accessible text/state.

---

# 139. NOTIFICATION SEVERITY

Provide text/icon semantics.

Do not use color alone.

---

# 140. PUSH PERMISSION

If browser push is implemented:

ask permission only after meaningful user context.

Do not immediately show permission prompt on first public page visit.

---

# 141. PUSH OPT-IN

Prefer a customer-controlled setting:

Enable browser notifications.

Explain the benefit.

---

# 142. DENIED PUSH

If browser permission is denied:

do not repeatedly harass the customer.

Provide instructions/settings state if useful.

---

# 143. SERVICE WORKER CAUTION

If browser push technically requires a service worker:

use the minimum service-worker capability required for push.

Do NOT turn the application into offline-first architecture.

Do NOT cache sensitive banking data for offline access.

---

# 144. NO FINANCIAL OFFLINE CACHE

Push support must not introduce:

offline balances

offline transactions

offline transfer queue

offline messaging outbox.

---

# 145. DEEP-LINK AUTHENTICATION

Email/push notification deep links to private resources must require authentication.

If not signed in:

login

→ validated return destination.

---

# 146. NO SENSITIVE TOKENS IN LINKS

Do not place account secrets or document credentials in long-lived notification URLs.

---

# 147. SECURITY ALERT EXAMPLE

Example:

New sign-in detected

Device: browser/device summary where trusted

Time

Action:

Review security.

Do not falsely claim precise location unless reliably available.

---

# 148. TRANSFER ALERT EXAMPLE

Internal:

Transfer completed

Your transfer is complete.

View transfer.

External:

Transfer requires your attention

A requested document is needed to continue.

Upload document.

---

# 149. RECEIVED FUNDS ALERT

Recipient:

Money received

A transfer was credited to your account.

Avoid exposing sender details on lock screen unless configured.

---

# 150. STATEMENT ALERT EXAMPLE

Your statement is ready.

View statement.

---

# 151. MESSAGE ALERT EXAMPLE

New secure message from your bank.

Open message.

Do not include entire support message in push/SMS by default.

---

# 152. NOTIFICATION HISTORY

Notifications should remain a useful event history.

Do not automatically delete them after reading.

---

# 153. AUDIT EVENTS

Record relevant communication events:

conversation_created

customer_message_sent

staff_message_sent

conversation_resolved

notification_created

notification_read

delivery_attempted

delivery_failed

delivery_succeeded.

Do not record full message body redundantly in audit logs.

---

# 154. PRIVACY IN AUDIT

Audit references message/conversation ID.

Do not duplicate sensitive body content.

---

# 155. NOTIFICATION OBSERVABILITY

Prepare internal monitoring for:

delivery failures

provider errors

queue backlog if a delivery queue is later used.

Do not expose these operational metrics to customers.

---

# 156. DELIVERY PROCESSING

Use server-side trusted delivery processing.

Do not let the customer browser send transactional email/SMS directly.

---

# 157. PROVIDER ADAPTERS

Keep external communication providers behind adapters.

Conceptually:

EmailProvider

SmsProvider

PushProvider.

Do not hardcode provider APIs into transfer or statement services.

---

# 158. DOMAIN EVENTS

Transfer/document/security domains should emit canonical application events.

Notification service consumes those events.

Avoid tight coupling:

transfer function → direct email API call.

---

# 159. SIMPLE MODULAR ARCHITECTURE

Keep this inside the modular monolith.

Do NOT create Kafka/microservices/event-bus infrastructure unless the existing project truly requires it.

A simple server-side event dispatcher/outbox pattern is enough.

---

# 160. TRANSACTIONAL OUTBOX READINESS

For important notification events, consider a simple database outbox pattern so financial/domain transaction success is not lost if notification delivery fails.

This is SERVER-SIDE reliability.

It is NOT offline-first client behavior.

---

# 161. FINANCIAL EVENT SEPARATION

Financial transaction success must not depend on notification provider success.

Example:

internal transfer posts successfully

email provider fails.

Transfer remains COMPLETED.

Notification delivery records FAILED and retries later.

Never rollback money because email failed.

---

# 162. NOTIFICATION EVENT ATOMICITY

Where useful:

domain state change

+

notification/outbox event creation

may happen in the same server/database transaction.

Delivery itself occurs separately.

---

# 163. MESSAGE EVENT ATOMICITY

A sent customer message should not be shown as sent unless message record exists successfully.

Notification to staff can fail independently and retry.

---

# 164. CUSTOMER NOTIFICATION COUNT

Provide efficient server query:

getUnreadNotificationCount()

Do not load all notifications just to count them.

---

# 165. CUSTOMER MESSAGE COUNT

Provide:

getUnreadConversationCount()

or equivalent.

---

# 166. APP SHELL INTEGRATION

PROMPT 04 header should now consume real:

unread notification count.

More menu may show:

Messages

Notifications

with appropriate counts.

---

# 167. DASHBOARD INTEGRATION

Dashboard Action Required may link to:

transfer document request

security issue

support reply

document issue.

Avoid duplicating the entire notification center.

---

# 168. TRANSFER INTEGRATION

Transfer detail:

Contact bank

Notification timeline

Action required.

---

# 169. DOCUMENT INTEGRATION

Document Center and compliance documents may expose:

Ask bank about this document

where appropriate.

---

# 170. STATEMENT INTEGRATION

Statement failure/success events should feed notification system.

---

# 171. SECURITY INTEGRATION READINESS

PROMPT 11 security events will feed the same notification infrastructure.

---

# 172. CUSTOMER PROFILE INTEGRATION

Notification preferences read trusted verified contact channels from customer profile.

Do not duplicate email/phone into notification settings as independent unmanaged values.

---

# 173. UNSUBSCRIBE LINKS

For optional marketing emails, future unsubscribe flows should be separate.

Transactional/security messages should follow applicable policy.

Do not add unsubscribe links that disable mandatory security alerts.

---

# 174. DATA MODEL — CONVERSATIONS

Implement appropriate tables/entities for:

conversations

messages

message_attachments

conversation_read_state if needed.

Keep it understandable.

---

# 175. DATA MODEL — NOTIFICATIONS

Implement:

notifications

notification_deliveries

notification_preferences

possibly notification_templates/config

and a simple outbox/domain-event table if used.

---

# 176. DATABASE INDEXES

Add indexes based on actual queries.

Examples:

conversations.customer_id + last_message_at

messages.conversation_id + created_at

notifications.customer_id + created_at

notifications.customer_id + read_at

deliveries.notification_id.

Avoid unnecessary indexes.

---

# 177. MESSAGE RLS TEST

Customer A attempts Conversation B URL.

Expected:

safe denial/not found.

---

# 178. NOTIFICATION RLS TEST

Customer A attempts to fetch Customer B notification.

Expected:

rejected.

---

# 179. STAFF IMPERSONATION TEST

Customer submits:

sender_type = STAFF.

Expected:

rejected/ignored.

---

# 180. NOTIFICATION FORGERY TEST

Customer attempts INSERT:

TRANSFER_COMPLETED.

Expected:

rejected.

Only trusted server event can create transactional notification.

---

# 181. DEEP LINK TEST

Notification links to customer's transfer.

Expected:

opens authorized transfer.

Changing reference to another customer:

rejected.

---

# 182. DOUBLE EVENT TEST

Same transfer-completed event processed twice.

Expected:

one logical notification per configured channel/event.

No duplicate spam.

---

# 183. DELIVERY FAILURE TEST

Email provider fails.

Expected:

in-app notification still exists;

financial operation unaffected;

delivery marked FAILED/retriable.

---

# 184. MESSAGE DOUBLE-TAP TEST

Send pressed twice.

Expected:

one message or safe idempotent behavior.

---

# 185. MESSAGE NETWORK LOSS TEST

Message submission fails due network.

Expected:

not shown as successfully sent;

text can remain available for retry in current session;

no offline queue.

---

# 186. INTERNAL TRANSFER NOTIFICATION TEST

A sends to B.

Expected after ledger success:

A sees transfer-completed notification.

B sees money-received notification.

No notification before authoritative completion unless processing notification is explicitly configured.

---

# 187. EXTERNAL 99% TEST

Transfer reaches 99%.

Expected notification:

pending final confirmation

or action required.

Never "completed".

---

# 188. EXTERNAL DOCUMENT TEST

Document required.

Expected:

in-app notification

deep link to upload

email/push according to preferences/policy.

---

# 189. EXTERNAL 100% TEST

Settlement confirms completion.

Expected:

final completion notification

receipt link if available.

---

# 190. STATEMENT TEST

Statement READY.

Expected:

statement-ready notification

deep link to document.

---

# 191. SECURITY TEST READINESS

New-login domain event can create:

security notification.

PROMPT 11 will fully implement originating event.

---

# 192. RESPONSIVE VALIDATION

Test approximately:

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

message list

conversation detail

composer

attachments

notification list

preferences

deep links

unread badges.

---

# 193. MOBILE KEYBOARD TEST

Verify:

composer visible

Send reachable

thread scroll stable

bottom navigation not overlapping keyboard.

---

# 194. ACCESSIBILITY TEST

Verify:

message authors announced;

unread states announced;

conversation status understandable;

notification categories accessible;

settings labels clear;

focus handled after sending message;

error states accessible.

---

# 195. PERFORMANCE

Do not load all communication history in the app shell.

Header fetches counts only.

Pages fetch paginated content.

---

# 196. SECURITY REVIEW

Explicitly verify:

no cross-customer message access;

no cross-customer notification access;

no customer staff impersonation;

no client-generated transactional notifications;

no sensitive data in push/SMS by default;

no public attachments;

no provider secret exposed to frontend.

---

# 197. CURRENT IMPLEMENTATION SCOPE

Implement:

1. Secure messaging domain.
2. Conversation entity.
3. Message entity.
4. Message attachments.
5. Context-linked conversations.
6. Transfer-linked support.
7. Document-linked support.
8. Account-linked support.
9. Conversation list.
10. Conversation detail.
11. Reply composer.
12. Read/unread state.
13. Notification domain.
14. Notification entity.
15. In-app notification center.
16. Unread counters.
17. Deep links.
18. Notification preferences.
19. Transactional notification templates.
20. Transfer notifications.
21. External 99% notifications.
22. External 100% notifications.
23. Document notifications.
24. Statement notifications.
25. Secure-message notifications.
26. Security-event notification readiness.
27. Email adapter foundation.
28. SMS adapter foundation where configured.
29. Push readiness.
30. Delivery tracking.
31. Idempotency/deduplication.
32. Server-side event/outbox foundation.
33. App shell integration.
34. Dashboard integration.
35. RLS/security.
36. Responsive mobile UX.
37. Accessibility.
38. Delivery/security tests.

---

# 198. DO NOT IMPLEMENT YET

Do NOT fully implement:

customer MFA/session/device center;

admin back office;

admin support console;

admin compliance dashboard;

admin account credit/debit controls;

admin transfer blocking controls;

full staff permission system UI.

These come in later prompts.

---

# 199. PRESERVE PROMPT 09

Statement/document notifications must use real document states.

Do not notify "statement ready" before PDF is actually READY.

---

# 200. PRESERVE PROMPT 08

External transfer notifications must respect:

99% ≠ completed.

100% only after authoritative external completion.

---

# 201. PRESERVE PROMPT 07

Internal transfers notify only from trusted transfer states.

---

# 202. PRESERVE PROMPT 06

Financial completion remains ledger-authoritative.

Notifications never change financial state.

---

# 203. PRESERVE PROMPT 05

Balances remain authoritative projections.

Do not embed editable financial values into communication logic.

---

# 204. PRESERVE PROMPT 04

Reuse BankingAppLayout, header, More, notification entry point and responsive shell.

---

# 205. PRESERVE PROMPT 03

Use trusted verified contact information.

---

# 206. PRESERVE PROMPT 02

Public Contact/Help remains separate from authenticated secure banking messaging.

---

# 207. PRESERVE PROMPT 01

Reuse:

Badge

StatusBadge

Avatar

Drawer

BottomSheet

Toast

Alert

Tabs

Form components

Skeleton

EmptyState.

---

# 208. PRESERVE PROMPT 00

Maintain:

simple modular architecture;

online-first behavior;

server authority;

Supabase security.

---

# 209. FINAL COMMUNICATION REVIEW

Explicitly confirm:

secure messaging is customer ↔ bank;

there is no unrestricted customer-to-customer chat;

conversations can link to banking resources;

notification center is event-driven;

notifications do not mutate financial state;

critical banking notifications are generated only from trusted events.

---

# 210. FINAL PRIVACY REVIEW

Explicitly confirm:

push notifications avoid sensitive content by default;

SMS avoids detailed financial information;

email uses secure deep links;

attachments are private;

customer cannot access another customer's communication.

---

# 211. FINAL RELIABILITY REVIEW

Confirm:

financial success does not depend on notification delivery;

email/SMS failure cannot roll back a transfer;

notification events are deduplicated;

message sends do not duplicate on double tap;

no offline messaging queue exists.

---

# 212. FINAL REPORT

At completion provide:

MESSAGING ARCHITECTURE

CONVERSATION MODEL

MESSAGE MODEL

ATTACHMENT MODEL

CONVERSATION ROUTES

CONTEXTUAL BANKING CONVERSATIONS

TRANSFER SUPPORT INTEGRATION

DOCUMENT SUPPORT INTEGRATION

ACCOUNT SUPPORT INTEGRATION

MESSAGE READ STATES

NOTIFICATION ARCHITECTURE

NOTIFICATION MODEL

NOTIFICATION CATEGORIES

NOTIFICATION SEVERITY

TRANSFER NOTIFICATIONS

99% EXTERNAL TRANSFER NOTIFICATIONS

100% TRANSFER NOTIFICATIONS

DOCUMENT NOTIFICATIONS

STATEMENT NOTIFICATIONS

SECURITY NOTIFICATION READINESS

NOTIFICATION PREFERENCES

IN-APP DELIVERY

EMAIL ADAPTER

SMS ADAPTER

PUSH READINESS

DELIVERY TRACKING

EVENT / OUTBOX ARCHITECTURE

IDEMPOTENCY / DEDUPLICATION

APP SHELL INTEGRATION

DASHBOARD INTEGRATION

RLS

STORAGE SECURITY

MOBILE UX

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
- customers can securely message the bank;
- customers cannot chat directly with other customers;
- conversations can be linked to transfers/documents/accounts;
- attachments are private;
- notifications are server/domain-event driven;
- customers cannot forge transactional notifications;
- internal transfer completion notifications are ledger-backed;
- external 99% transfers are never notified as completed;
- external 100% transfers can generate final completion notifications;
- statement-ready notifications only occur after document generation succeeds;
- email/SMS/push failures do not change financial state;
- notification delivery is deduplicated;
- customer communication data is ownership-protected;
- no sensitive provider credentials are exposed;
- no offline-first architecture was introduced;
- no offline messaging outbox was introduced;
- PROMPT 00 through PROMPT 09 remain intact.

Stop after completing secure messaging, notifications and the customer communication center.

The next phase is:

PROMPT 11 — CUSTOMER SECURITY CENTER, MFA, DEVICES, SESSIONS & SENSITIVE ACTION PROTECTION.