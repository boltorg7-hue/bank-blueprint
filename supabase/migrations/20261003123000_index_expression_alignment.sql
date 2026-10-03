-- 5.9.8.6 — align Admin PostgreSQL search expressions with their trigram indexes.
-- The 5.9.8.5 customer paging function normalizes searchable fields with lower().
-- Expression indexes avoid a full scan when that function handles name/phone search.
-- No authorization or business semantics are changed.

create extension if not exists pg_trgm with schema extensions;

create index if not exists idx_profiles_first_name_lower_trgm
  on public.profiles using gin (lower(first_name) extensions.gin_trgm_ops);

create index if not exists idx_profiles_middle_name_lower_trgm
  on public.profiles using gin (lower(middle_name) extensions.gin_trgm_ops);

create index if not exists idx_profiles_last_name_lower_trgm
  on public.profiles using gin (lower(last_name) extensions.gin_trgm_ops);

create index if not exists idx_profiles_phone_lower_trgm
  on public.profiles using gin (lower(phone) extensions.gin_trgm_ops);

-- 5.9.8.6 audit conclusion:
-- * Admin cursor ordering is covered by idx_profiles_created_at_id.
-- * lifecycle filtering/order is covered by idx_profiles_lifecycle_created_at.
-- * account/KYC/document/notification/transfer/funding EXISTS predicates
--   are covered by the composite indexes introduced in 5.9.8.1.
-- * posted-ledger reads are covered by the 5.9.8.2 partial effective_at index.
-- * ledger joins are covered by the existing PK/FK-side indexes.
-- Avoid adding redundant broad indexes without runtime EXPLAIN/ANALYZE evidence.
