-- 5.9.8.5: keep Admin customer filtering inside PostgreSQL.
-- The Admin service already uses the service role, so this function does not
-- widen authorization; it only moves large filter sets/EXISTS work into SQL.

create or replace function public.admin_customer_page(
  p_search text default '',
  p_lifecycle text default 'ALL',
  p_accounts_filter text default 'ALL',
  p_attention_filter text default 'ALL',
  p_cursor_created_at timestamptz default null,
  p_cursor_id uuid default null,
  p_limit integer default 51,
  p_exact_user_id uuid default null
)
returns table (
  id uuid,
  first_name text,
  middle_name text,
  last_name text,
  phone text,
  lifecycle_state text,
  created_at timestamptz
)
language sql
stable
as $$
  with candidates as (
    select
      p.id,
      p.first_name,
      p.middle_name,
      p.last_name,
      p.phone,
      p.lifecycle_state::text as lifecycle_state,
      p.created_at
    from public.profiles p
    where
      (p_lifecycle = 'ALL' or p.lifecycle_state::text = p_lifecycle)
      and (
        p_exact_user_id is not null
        and p.id = p_exact_user_id
        or p_exact_user_id is null
        and (
          p_search = ''
          or lower(p.first_name) like '%' || lower(p_search) || '%'
          or lower(p.middle_name) like '%' || lower(p_search) || '%'
          or lower(p.last_name) like '%' || lower(p_search) || '%'
          or lower(p.phone) like '%' || lower(p_search) || '%'
        )
      )
      and (
        p_accounts_filter = 'ALL'
        or (p_accounts_filter = 'WITH_ACCOUNTS'
            and exists (
              select 1 from public.bank_accounts ba
              where ba.user_id = p.id
            ))
        or (p_accounts_filter = 'WITHOUT_ACCOUNTS'
            and not exists (
              select 1 from public.bank_accounts ba
              where ba.user_id = p.id
            ))
      )
      and (
        p_attention_filter = 'ALL'
        or (
          p_attention_filter = 'NEEDS_ATTENTION'
          and (
            p.lifecycle_state::text <> 'ACTIVE'
            or exists (
              select 1 from public.identity_verifications iv
              where iv.user_id = p.id
                and iv.status in ('UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED', 'REJECTED')
            )
            or exists (
              select 1 from public.verification_documents vd
              where vd.user_id = p.id
                and vd.status in ('ACTION_REQUIRED', 'REJECTED', 'EXPIRED')
            )
            or exists (
              select 1 from public.notifications n
              where n.user_id = p.id
                and n.archived_at is null
                and n.read_at is null
            )
            or exists (
              select 1 from public.transfers t
              where t.sender_user_id = p.id
                and t.status in ('PROCESSING', 'COMPLIANCE_REVIEW', 'DOCUMENT_REQUIRED', 'SETTLEMENT_PENDING')
            )
            or exists (
              select 1
              from public.funding_requests fr
              join public.bank_accounts ba on ba.id = fr.account_id
              where ba.user_id = p.id
                and fr.status = 'PENDING'
            )
          )
        )
        or (
          p_attention_filter = 'CLEAR'
          and not (
            p.lifecycle_state::text <> 'ACTIVE'
            or exists (
              select 1 from public.identity_verifications iv
              where iv.user_id = p.id
                and iv.status in ('UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED', 'REJECTED')
            )
            or exists (
              select 1 from public.verification_documents vd
              where vd.user_id = p.id
                and vd.status in ('ACTION_REQUIRED', 'REJECTED', 'EXPIRED')
            )
            or exists (
              select 1 from public.notifications n
              where n.user_id = p.id
                and n.archived_at is null
                and n.read_at is null
            )
            or exists (
              select 1 from public.transfers t
              where t.sender_user_id = p.id
                and t.status in ('PROCESSING', 'COMPLIANCE_REVIEW', 'DOCUMENT_REQUIRED', 'SETTLEMENT_PENDING')
            )
            or exists (
              select 1
              from public.funding_requests fr
              join public.bank_accounts ba on ba.id = fr.account_id
              where ba.user_id = p.id
                and fr.status = 'PENDING'
            )
          )
        )
      )
      and (
        p_cursor_created_at is null
        or p.created_at < p_cursor_created_at
        or (p.created_at = p_cursor_created_at and p.id < p_cursor_id)
      )
    order by p.created_at desc, p.id desc
    limit greatest(1, least(p_limit, 51))
  )
  select * from candidates;
$$;
