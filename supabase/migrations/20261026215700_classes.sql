create table public.class_groups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  offering_id uuid not null references public.offerings(id) on delete restrict,
  name text not null check (length(btrim(name)) between 1 and 180),
  capacity integer check (capacity is null or capacity > 0),
  status text not null default 'draft' check (status in ('draft', 'open', 'closed', 'retired')),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.instructor_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  class_group_id uuid not null references public.class_groups(id) on delete cascade,
  membership_id uuid not null references public.memberships(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'ended')),
  assigned_at timestamptz not null default timezone('utc', now()),
  unique (class_group_id, membership_id)
);

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  class_group_id uuid not null references public.class_groups(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 180),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'UTC',
  location text,
  join_url text,
  required boolean not null default true,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  check (ends_at > starts_at)
);

create or replace function public.validate_meeting_time() returns trigger language plpgsql as $$ begin if new.ends_at <= new.starts_at then raise exception 'MEETING_TIME_INVALID'; end if; return new; end; $$;
create trigger meetings_time before insert or update on public.meetings for each row execute function public.validate_meeting_time();
create or replace function public.validate_instructor_assignment() returns trigger language plpgsql security definer set search_path = public as $$ declare v_org uuid; v_role boolean; begin select organization_id into v_org from public.class_groups where id = new.class_group_id; if v_org is null or v_org <> new.organization_id then raise exception 'CLASS_SCOPE_INVALID'; end if; select exists (select 1 from public.memberships m join public.membership_roles mr on mr.membership_id = m.id where m.id = new.membership_id and m.organization_id = new.organization_id and m.status = 'active' and mr.role = 'instructor') into v_role; if not v_role then raise exception 'INSTRUCTOR_INVALID'; end if; return new; end; $$;
create trigger instructor_scope before insert or update on public.instructor_assignments for each row execute function public.validate_instructor_assignment();

alter table public.class_groups enable row level security;
alter table public.instructor_assignments enable row level security;
alter table public.meetings enable row level security;
create policy class_groups_select_member on public.class_groups for select using (public.is_active_member(organization_id));
create policy class_groups_insert_manager on public.class_groups for insert with check (public.is_org_manager(organization_id));
create policy class_groups_update_manager on public.class_groups for update using (public.is_org_manager(organization_id));
create policy instructor_assignments_select_member on public.instructor_assignments for select using (public.is_active_member(organization_id));
create policy instructor_assignments_insert_manager on public.instructor_assignments for insert with check (public.is_org_manager(organization_id));
create policy instructor_assignments_update_manager on public.instructor_assignments for update using (public.is_org_manager(organization_id));
create policy meetings_select_member on public.meetings for select using (public.is_active_member(organization_id));
create policy meetings_insert_manager on public.meetings for insert with check (public.is_org_manager(organization_id));
create policy meetings_update_manager on public.meetings for update using (public.is_org_manager(organization_id));
revoke all on public.class_groups, public.instructor_assignments, public.meetings from anon;
grant select, insert, update, delete on public.class_groups, public.instructor_assignments, public.meetings to authenticated;
