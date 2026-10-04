begin;

create extension if not exists pgtap;

select plan(10);

select has_function(
  'public',
  'admin_customer_page',
  ARRAY[
    'text',
    'text',
    'text',
    'text',
    'timestamp with time zone',
    'uuid',
    'integer',
    'uuid'
  ],
  'admin_customer_page signature exists'
);

select has_column('public', 'profiles', 'id', 'profiles.id exists');
select has_column('public', 'profiles', 'lifecycle_state', 'profiles.lifecycle_state exists');
select has_column('public', 'bank_accounts', 'user_id', 'bank_accounts.user_id exists');
select has_column('public', 'identity_verifications', 'user_id', 'identity_verifications.user_id exists');
select has_column('public', 'verification_documents', 'user_id', 'verification_documents.user_id exists');
select has_column('public', 'notifications', 'user_id', 'notifications.user_id exists');
select has_column('public', 'transfers', 'sender_user_id', 'transfers.sender_user_id exists');
select has_column('public', 'funding_requests', 'account_id', 'funding_requests.account_id exists');

select results_eq(
  $$select count(*)::integer
    from information_schema.parameters
    where specific_schema = 'public'
      and specific_name like 'admin_customer_page%'
      and parameter_name in (
        'p_search',
        'p_lifecycle',
        'p_accounts_filter',
        'p_attention_filter',
        'p_cursor_created_at',
        'p_cursor_id',
        'p_limit',
        'p_exact_user_id'
      )$$,
  $$values (8)$$,
  'admin_customer_page has all 8 input parameters'
);

select * from finish();

rollback;
