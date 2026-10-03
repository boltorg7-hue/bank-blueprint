-- Performance indexes for admin search/filter workloads.
-- These indexes do not change authorization or business semantics.

create extension if not exists pg_trgm with schema extensions;

create index if not exists idx_profiles_created_at_id
  on public.profiles (created_at desc, id desc);
create index if not exists idx_profiles_lifecycle_created_at
  on public.profiles (lifecycle_state, created_at desc, id desc);
create index if not exists idx_profiles_first_name_trgm
  on public.profiles using gin (first_name extensions.gin_trgm_ops);
create index if not exists idx_profiles_middle_name_trgm
  on public.profiles using gin (middle_name extensions.gin_trgm_ops);
create index if not exists idx_profiles_last_name_trgm
  on public.profiles using gin (last_name extensions.gin_trgm_ops);
create index if not exists idx_profiles_phone_trgm
  on public.profiles using gin (phone extensions.gin_trgm_ops);

create index if not exists idx_bank_accounts_user_created
  on public.bank_accounts (user_id, created_at desc);
create index if not exists idx_bank_accounts_status_created
  on public.bank_accounts (status, created_at desc);

create index if not exists idx_identity_verifications_user_status
  on public.identity_verifications (user_id, status);
create index if not exists idx_identity_verifications_status_submitted
  on public.identity_verifications (status, submitted_at desc);

create index if not exists idx_verification_documents_user_status
  on public.verification_documents (user_id, status);
create index if not exists idx_verification_documents_status_created
  on public.verification_documents (status, created_at desc);

create index if not exists idx_notifications_user_unread
  on public.notifications (user_id, created_at desc)
  where archived_at is null and read_at is null;

create index if not exists idx_transfers_sender_status_created
  on public.transfers (sender_user_id, status, created_at desc);
create index if not exists idx_transfers_status_created
  on public.transfers (status, created_at desc);

create index if not exists idx_funding_requests_account_status_created
  on public.funding_requests (account_id, status, created_at desc);

create index if not exists idx_support_threads_customer_last_message
  on public.support_threads (customer_user_id, last_message_at desc);
create index if not exists idx_support_threads_last_message
  on public.support_threads (last_message_at desc);

create index if not exists idx_customer_documents_user_created
  on public.customer_documents (user_id, created_at desc);

create index if not exists idx_admin_audit_events_created
  on public.admin_audit_events (created_at desc, id desc);
create index if not exists idx_admin_audit_events_resource_created
  on public.admin_audit_events (resource_reference, created_at desc);

create index if not exists idx_account_status_history_account_created
  on public.account_status_history (account_id, created_at desc);
