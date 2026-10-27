create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  template_key text not null check (template_key ~ '^[a-z0-9._-]+$'),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  check (not (payload ?| array['password', 'token', 'cpf', 'email']))
);
revoke all on public.notification_outbox from anon, authenticated;
create or replace function public.enqueue_notification(p_idempotency_key text, p_recipient_user_id uuid, p_template_key text, p_payload jsonb) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; begin
  if p_idempotency_key is null or length(btrim(p_idempotency_key)) < 3 then raise exception 'NOTIFICATION_INVALID'; end if;
  insert into public.notification_outbox(idempotency_key, recipient_user_id, template_key, payload) values (p_idempotency_key, p_recipient_user_id, p_template_key, coalesce(p_payload, '{}'::jsonb)) on conflict (idempotency_key) do update set idempotency_key = excluded.idempotency_key returning id into v_id;
  return v_id;
end; $$;
revoke all on function public.enqueue_notification(text, uuid, text, jsonb) from public;
