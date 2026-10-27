create table public.learning_paths (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 180),
  description text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'retired')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.path_items (
  id uuid primary key default gen_random_uuid(),
  path_id uuid not null references public.learning_paths(id) on delete cascade,
  offering_id uuid references public.offerings(id) on delete restrict,
  position integer not null check (position >= 0),
  title text not null check (length(btrim(title)) between 1 and 180),
  prerequisite_item_id uuid references public.path_items(id) on delete restrict,
  unique (path_id, position)
);

create table public.path_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  path_id uuid not null references public.learning_paths(id) on delete cascade,
  membership_id uuid not null references public.memberships(id) on delete cascade,
  due_at timestamptz,
  status text not null default 'assigned' check (status in ('assigned', 'completed', 'cancelled')),
  assigned_at timestamptz not null default timezone('utc', now()),
  unique (path_id, membership_id)
);

create or replace function public.prevent_path_item_cycle()
returns trigger language plpgsql set search_path = public as $$
declare v_path uuid;
begin
  if new.prerequisite_item_id is null then return new; end if;
  if new.prerequisite_item_id = new.id then raise exception 'PATH_CYCLE'; end if;
  select path_id into v_path from public.path_items where id = new.prerequisite_item_id;
  if v_path is null or v_path <> new.path_id then raise exception 'PATH_PREREQUISITE_SCOPE'; end if;
  if exists (
    with recursive chain(id) as (
      select new.prerequisite_item_id
      union all
      select p.prerequisite_item_id from public.path_items p join chain c on c.id = p.id where p.prerequisite_item_id is not null
    ) select 1 from chain where id = new.id
  ) then raise exception 'PATH_CYCLE'; end if;
  return new;
end;
$$;
create trigger path_items_no_cycle before insert or update of prerequisite_item_id, path_id on public.path_items for each row execute function public.prevent_path_item_cycle();

alter table public.learning_paths enable row level security;
alter table public.path_items enable row level security;
alter table public.path_assignments enable row level security;
create policy learning_paths_select_member on public.learning_paths for select using (public.is_active_member(organization_id));
create policy learning_paths_insert_manager on public.learning_paths for insert with check (public.is_org_manager(organization_id));
create policy learning_paths_update_manager on public.learning_paths for update using (public.is_org_manager(organization_id));
create policy path_items_select_member on public.path_items for select using (exists (select 1 from public.learning_paths p where p.id = path_id));
create policy path_items_insert_manager on public.path_items for insert with check (exists (select 1 from public.learning_paths p where p.id = path_id and public.is_org_manager(p.organization_id)));
create policy path_items_update_manager on public.path_items for update using (exists (select 1 from public.learning_paths p where p.id = path_id and public.is_org_manager(p.organization_id)));
create policy path_assignments_select_member on public.path_assignments for select using (membership_id in (select m.id from public.memberships m where m.user_id = auth.uid()) or public.is_org_manager(organization_id));
create policy path_assignments_insert_manager on public.path_assignments for insert with check (public.is_org_manager(organization_id));
revoke all on public.learning_paths, public.path_items, public.path_assignments from anon;
grant select on public.learning_paths, public.path_items, public.path_assignments to authenticated;
grant insert, update, delete on public.learning_paths, public.path_items, public.path_assignments to authenticated;
