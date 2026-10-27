alter table public.import_batches add column if not exists idempotency_key text;
create unique index if not exists import_batches_org_idempotency_idx on public.import_batches (organization_id, idempotency_key) where idempotency_key is not null;
create schema if not exists extensions;

create or replace function public.commit_people_import(
  p_organization_id uuid,
  p_payload jsonb,
  p_size_bytes integer,
  p_idempotency_key text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch uuid;
  v_row jsonb;
  v_name text;
  v_email text;
  v_cpf text;
  v_membership uuid;
begin
  if not public.is_org_manager(p_organization_id)
     or jsonb_typeof(p_payload) <> 'array'
     or jsonb_array_length(p_payload) > 500
     or p_size_bytes < 0
     or p_size_bytes > 2097152
     or p_idempotency_key is null
     or p_idempotency_key !~ '^[a-f0-9]{64}$' then
    raise exception 'IMPORT_INVALID';
  end if;

  select id into v_batch from public.import_batches
  where organization_id = p_organization_id and idempotency_key = p_idempotency_key
  for share;
  if v_batch is not null then return v_batch; end if;

  insert into public.import_batches (organization_id, created_by, status, row_count, size_bytes, payload, idempotency_key)
  values (p_organization_id, auth.uid(), 'committed', jsonb_array_length(p_payload), p_size_bytes, p_payload, p_idempotency_key)
  on conflict (organization_id, idempotency_key) do update set idempotency_key = excluded.idempotency_key
  returning id into v_batch;

  for v_row in select value from jsonb_array_elements(p_payload) loop
    v_name := btrim(coalesce(v_row->>'name', ''));
    v_email := lower(btrim(coalesce(v_row->>'email', '')));
    v_cpf := nullif(btrim(coalesce(v_row->>'cpf', '')), '');
    if v_name = '' or v_email !~ '^\S+@\S+\.\S+$' then raise exception 'IMPORT_INVALID'; end if;
    insert into public.people (organization_id, display_name, email, cpf)
    values (p_organization_id, v_name, v_email, v_cpf)
    on conflict (organization_id, email) do update set display_name = excluded.display_name, cpf = excluded.cpf;
  end loop;
  select m.id into v_membership from public.memberships m where m.organization_id = p_organization_id and m.user_id = auth.uid() and m.status = 'active' limit 1;
  insert into public.audit_events (organization_id, actor_user_id, actor_membership_id, action, resource_type, resource_id, outcome, metadata)
  values (p_organization_id, auth.uid(), v_membership, 'people.import.committed', 'import_batch', v_batch, 'success', jsonb_build_object('row_count', jsonb_array_length(p_payload), 'size_bytes', p_size_bytes));
  return v_batch;
end;
$$;

create or replace function public.commit_people_import(p_organization_id uuid, p_payload jsonb, p_size_bytes integer) returns uuid
language sql security definer set search_path = public, extensions as $$
  select public.commit_people_import(p_organization_id, p_payload, p_size_bytes, encode(digest(p_payload::text || ':' || p_size_bytes::text, 'sha256'), 'hex'));
$$;

revoke all on function public.commit_people_import(uuid, jsonb, integer, text) from public, anon;
grant execute on function public.commit_people_import(uuid, jsonb, integer, text) to authenticated;

