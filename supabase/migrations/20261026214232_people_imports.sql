create table public.people (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  display_name text not null check (length(btrim(display_name)) between 1 and 160),
  email text not null check (email = lower(email) and length(email) between 3 and 320),
  cpf text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, email)
);

create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'preview' check (status in ('preview', 'committed', 'failed')),
  row_count integer not null check (row_count between 0 and 500),
  size_bytes integer not null check (size_bytes between 0 and 2097152),
  payload jsonb not null check (jsonb_typeof(payload) = 'array'),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.people enable row level security;
alter table public.import_batches enable row level security;
create policy people_select_member on public.people for select using (public.is_active_member(organization_id));
create policy people_insert_manager on public.people for insert with check (public.is_org_manager(organization_id));
create policy people_update_manager on public.people for update using (public.is_org_manager(organization_id)) with check (public.is_org_manager(organization_id));
create policy people_delete_manager on public.people for delete using (public.is_org_manager(organization_id));
create policy imports_select_member on public.import_batches for select using (public.is_active_member(organization_id));
revoke all on public.people, public.import_batches from anon, authenticated;
grant select, insert, update, delete on public.people to authenticated;
grant select on public.import_batches to authenticated;
