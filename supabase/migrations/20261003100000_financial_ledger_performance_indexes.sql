-- 5.9.8.2 — Financial ledger/search performance indexes.
-- These indexes optimize customer activity search and posted-ledger reads.
-- They do not change authorization or financial business semantics.

create extension if not exists pg_trgm with schema extensions;

create index if not exists idx_ledger_transactions_public_reference_trgm
  on public.ledger_transactions using gin (public_reference extensions.gin_trgm_ops);

create index if not exists idx_ledger_transactions_description_trgm
  on public.ledger_transactions using gin (description extensions.gin_trgm_ops);

create index if not exists idx_ledger_entries_description_trgm
  on public.ledger_entries using gin (description extensions.gin_trgm_ops);

create index if not exists idx_ledger_transactions_posted_effective
  on public.ledger_transactions (effective_at desc, id desc)
  where status = 'POSTED';

-- Existing account/transaction indexes remain intentionally unchanged:
-- avoid broad redundant indexes while preserving the current ledger model.
