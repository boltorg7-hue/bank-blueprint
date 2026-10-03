-- 5.9.8.7 — pagination and deterministic ordering at scale.
-- Keep keyset/cursor pagination; add only composite indexes matching the
-- actual WHERE + ORDER BY shapes found during the audit.
-- No OFFSET pagination is used by the audited customer/admin collections.

create index if not exists idx_transfers_sender_created_id
  on public.transfers (sender_user_id, created_at desc, id desc);

create index if not exists idx_notifications_user_active_created_id
  on public.notifications (user_id, created_at desc, id desc)
  where archived_at is null;

-- Admin external-transfer queue orders globally by created_at/id and filters
-- completed terminal statuses. The leading order columns let PostgreSQL avoid
-- a broad sort before applying the bounded LIMIT.
create index if not exists idx_transfers_created_id
  on public.transfers (created_at desc, id desc);

-- Support already has both customer-scoped and global cursor indexes from
-- 5.9.8.1. Funding, bank accounts and audit events likewise have deterministic
-- created_at/id indexes from the preceding performance audit.

-- Do not add OFFSET, COUNT(*) pagination, or unbounded client-side slicing.
-- Runtime EXPLAIN (ANALYZE, BUFFERS) should be the next validation step once
-- a representative database dataset is available.
