create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  invited_by uuid not null references auth.users(id) on delete restrict,
  email text not null check (email = lower(email) and length(email) between 3 and 320),
  roles text[] not null check (cardinality(roles) > 0 and roles <@ array['manager', 'instructor', 'student']::text[]),
  token_hash text not null unique check (length(token_hash) = 64),
  status text not null default 'pending' check (status in ('pending', 'sent', 'accepted', 'failed', 'expired')),
  expires_at timestamptz not null,
  last_sent_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index invitations_pending_email_idx on public.invitations (organization_id, email) where status in ('pending', 'sent');
alter table public.invitations enable row level security;
create policy invitations_select_member on public.invitations for select using (public.is_active_member(organization_id));
revoke all on public.invitations from anon, authenticated;
grant select on public.invitations to authenticated;
