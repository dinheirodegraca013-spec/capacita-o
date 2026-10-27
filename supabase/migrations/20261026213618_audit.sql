create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_membership_id uuid references public.memberships(id) on delete set null,
  action text not null check (action ~ '^[a-z][a-z0-9_.-]{2,120}$'),
  resource_type text not null check (resource_type ~ '^[a-z][a-z0-9_.-]{1,80}$'),
  resource_id uuid,
  outcome text not null check (outcome in ('success', 'failure', 'denied')),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  request_id text check (request_id is null or length(request_id) between 8 and 160),
  created_at timestamptz not null default timezone('utc', now())
);

create index audit_events_org_created_idx on public.audit_events (organization_id, created_at desc);
alter table public.audit_events enable row level security;
create policy audit_events_select_member on public.audit_events for select using (public.is_active_member(organization_id));
revoke all on public.audit_events from anon, authenticated;
grant select on public.audit_events to authenticated;
