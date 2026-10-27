alter table public.notification_outbox add column if not exists processing_at timestamptz;

create or replace function public.enqueue_notification(p_idempotency_key text, p_recipient_user_id uuid, p_template_key text, p_payload jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'NOTIFICATION_UNAUTHENTICATED'; end if;
  if p_idempotency_key is null or length(btrim(p_idempotency_key)) < 3 then raise exception 'NOTIFICATION_INVALID'; end if;
  if p_payload ?| array['password', 'token', 'cpf', 'email'] then raise exception 'NOTIFICATION_SENSITIVE_PAYLOAD'; end if;
  if p_recipient_user_id <> auth.uid() and not exists (
    select 1 from public.memberships actor_m
    join public.membership_roles actor_r on actor_r.membership_id = actor_m.id and actor_r.role = 'manager'
    join public.memberships recipient_m on recipient_m.organization_id = actor_m.organization_id and recipient_m.user_id = p_recipient_user_id and recipient_m.status = 'active'
    where actor_m.user_id = auth.uid() and actor_m.status = 'active'
  ) then raise exception 'NOTIFICATION_FORBIDDEN'; end if;
  insert into public.notification_outbox(idempotency_key, recipient_user_id, template_key, payload)
    values (p_idempotency_key, p_recipient_user_id, p_template_key, coalesce(p_payload, '{}'::jsonb))
    on conflict (idempotency_key) do update set idempotency_key = excluded.idempotency_key
    returning id into v_id;
  return v_id;
end; $$;

create or replace function public.claim_pending_notifications(p_limit integer default 50)
returns setof public.notification_outbox language plpgsql security definer set search_path = public as $$
begin
  if p_limit is null or p_limit < 1 or p_limit > 100 then raise exception 'NOTIFICATION_LIMIT_INVALID'; end if;
  return query with claimed as (
    select n.id from public.notification_outbox n
    where (n.status = 'pending' or (n.status = 'processing' and coalesce(n.processing_at, n.created_at) < timezone('utc', now()) - interval '15 minutes'))
      and n.attempts < 5 and n.next_attempt_at <= timezone('utc', now())
    order by n.next_attempt_at, n.created_at limit p_limit for update skip locked
  ) update public.notification_outbox n set status = 'processing', processing_at = timezone('utc', now()) from claimed where n.id = claimed.id returning n.*;
end; $$;

revoke all on function public.enqueue_notification(text, uuid, text, jsonb), public.claim_pending_notifications(integer) from public, anon, authenticated;
grant execute on function public.enqueue_notification(text, uuid, text, jsonb) to authenticated;
grant execute on function public.claim_pending_notifications(integer) to service_role;

