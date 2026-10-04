-- 5.9.8.6: lock the Admin customer page read-model contract in PostgreSQL.
-- Selection, attention semantics, pagination ordering, and derived attention metadata
-- remain server-side so the Admin service does not rebuild business rules in TypeScript.

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
  created_at timestamptz,
  account_count integer,
  attention_reasons text[],
  attention_count integer,
  oldest_attention_at timestamptz
)
language sql
stable
as $$
  with base as (
    select
      p.id,
      p.first_name,
      p.middle_name,
      p.last_name,
      p.phone,
      p.lifecycle_state::text as lifecycle_state,
      p.created_at,
      (
        select count(*)::integer
        from public.bank_accounts ba
        where ba.user_id = p.id
      ) as account_count
    from public.profiles p
    where
      (p_lifecycle = 'ALL' or p.lifecycle_state::text = p_lifecycle)
      and (
        (
          p_exact_user_id is not null
          and p.id = p_exact_user_id
        )
        or (
          p_exact_user_id is null
          and (
            p_search = ''
            or lower(coalesce(p.first_name, '')) like '%' || lower(p_search) || '%'
            or lower(coalesce(p.middle_name, '')) like '%' || lower(p_search) || '%'
            or lower(coalesce(p.last_name, '')) like '%' || lower(p_search) || '%'
            or lower(coalesce(p.phone, '')) like '%' || lower(p_search) || '%'
          )
        )
      )
      and (
        p_accounts_filter = 'ALL'
        or (
          p_accounts_filter = 'WITH_ACCOUNTS'
          and exists (
            select 1
            from public.bank_accounts ba
            where ba.user_id = p.id
          )
        )
        or (
          p_accounts_filter = 'WITHOUT_ACCOUNTS'
          and not exists (
            select 1
            from public.bank_accounts ba
            where ba.user_id = p.id
          )
        )
      )
      and (
        p_cursor_created_at is null
        or p.created_at < p_cursor_created_at
        or (
          p.created_at = p_cursor_created_at
          and p.id < p_cursor_id
        )
      )
  ),
  signals as (
    select
      b.*,

      exists (
        select 1
        from public.identity_verifications iv
        where iv.user_id = b.id
          and iv.status in (
            'UNDER_REVIEW',
            'ADDITIONAL_INFORMATION_REQUIRED',
            'REJECTED'
          )
      ) as has_kyc_attention,

      (
        select coalesce(
          (
            select h.created_at
            from public.verification_status_history h
            where h.verification_id = iv.id
              and h.new_status = iv.status
            order by h.created_at desc
            limit 1
          ),
          case
            when iv.status in ('UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED')
              then iv.submitted_at
            when iv.status = 'REJECTED'
              then iv.decided_at
            else null
          end
        )
        from public.identity_verifications iv
        where iv.user_id = b.id
          and iv.status in (
            'UNDER_REVIEW',
            'ADDITIONAL_INFORMATION_REQUIRED',
            'REJECTED'
          )
        order by
          coalesce(
            (
              select h.created_at
              from public.verification_status_history h
              where h.verification_id = iv.id
                and h.new_status = iv.status
              order by h.created_at desc
              limit 1
            ),
            case
              when iv.status in ('UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED')
                then iv.submitted_at
              when iv.status = 'REJECTED'
                then iv.decided_at
              else null
            end
          ) asc nulls last
        limit 1
      ) as kyc_attention_at,

      exists (
        select 1
        from public.verification_documents vd
        where vd.user_id = b.id
          and vd.status in ('ACTION_REQUIRED', 'REJECTED', 'EXPIRED')
      ) as has_document_attention,

      (
        select min(
          case
            when vd.status = 'EXPIRED'
              then vd.expires_at
            else coalesce(vd.updated_at, vd.created_at)
          end
        )
        from public.verification_documents vd
        where vd.user_id = b.id
          and vd.status in ('ACTION_REQUIRED', 'REJECTED', 'EXPIRED')
      ) as document_attention_at,

      exists (
        select 1
        from public.notifications n
        where n.user_id = b.id
          and n.archived_at is null
          and n.read_at is null
      ) as has_notification_attention,

      (
        select min(n.created_at)
        from public.notifications n
        where n.user_id = b.id
          and n.archived_at is null
          and n.read_at is null
      ) as notification_attention_at,

      exists (
        select 1
        from public.transfers t
        where t.sender_user_id = b.id
          and t.status in (
            'PROCESSING',
            'COMPLIANCE_REVIEW',
            'DOCUMENT_REQUIRED',
            'SETTLEMENT_PENDING'
          )
      ) as has_transfer_attention,

      (
        select min(
          coalesce(
            case
              when t.status = 'PROCESSING' then t.processing_started_at
              when t.status = 'DOCUMENT_REQUIRED' then t.documents_requested_at
              when t.status = 'SETTLEMENT_PENDING' then t.settlement_submitted_at
              else null
            end,
            (
              select h.created_at
              from public.transfer_status_history h
              where h.transfer_id = t.id
                and h.to_status = t.status
              order by h.created_at desc
              limit 1
            ),
            t.created_at
          )
        )
        from public.transfers t
        where t.sender_user_id = b.id
          and t.status in (
            'PROCESSING',
            'COMPLIANCE_REVIEW',
            'DOCUMENT_REQUIRED',
            'SETTLEMENT_PENDING'
          )
      ) as transfer_attention_at,

      exists (
        select 1
        from public.funding_requests fr
        join public.bank_accounts ba on ba.id = fr.account_id
        where ba.user_id = b.id
          and fr.status = 'PENDING'
      ) as has_funding_attention,

      (
        select min(fr.created_at)
        from public.funding_requests fr
        join public.bank_accounts ba on ba.id = fr.account_id
        where ba.user_id = b.id
          and fr.status = 'PENDING'
      ) as funding_attention_at

    from base b
  ),
  classified as (
    select
      s.*,
      array_remove(
        array[
          case when s.lifecycle_state <> 'ACTIVE' then 'LIFECYCLE' end,
          case when s.has_kyc_attention then 'KYC' end,
          case when s.has_document_attention then 'DOCUMENTS' end,
          case when s.has_notification_attention then 'NOTIFICATIONS' end,
          case when s.has_transfer_attention then 'TRANSFERS' end,
          case when s.has_funding_attention then 'FUNDING' end
        ]::text[],
        null
      ) as computed_attention_reasons
    from signals s
  ),
  filtered as (
    select
      c.*
    from classified c
    where
      p_attention_filter = 'ALL'
      or (
        p_attention_filter = 'NEEDS_ATTENTION'
        and cardinality(c.computed_attention_reasons) > 0
      )
      or (
        p_attention_filter = 'CLEAR'
        and cardinality(c.computed_attention_reasons) = 0
      )
    order by c.created_at desc, c.id desc
    limit greatest(1, least(p_limit, 51))
  )
  select
    f.id,
    f.first_name,
    f.middle_name,
    f.last_name,
    f.phone,
    f.lifecycle_state,
    f.created_at,
    f.account_count,
    f.computed_attention_reasons as attention_reasons,
    cardinality(f.computed_attention_reasons)::integer as attention_count,
    (
      select min(v.attention_at)
      from (
        values
          (
            case
              when f.lifecycle_state <> 'ACTIVE' then null::timestamptz
              else null::timestamptz
            end
          ),
          (f.kyc_attention_at),
          (f.document_attention_at),
          (f.notification_attention_at),
          (f.transfer_attention_at),
          (f.funding_attention_at)
      ) as v(attention_at)
    ) as oldest_attention_at
  from filtered f;
$$;
