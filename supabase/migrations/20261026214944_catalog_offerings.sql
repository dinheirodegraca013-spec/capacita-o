create table public.course_grants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  course_version_id uuid not null references public.course_versions(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'retired')),
  granted_by uuid not null references auth.users(id) on delete restrict,
  granted_at timestamptz not null default timezone('utc', now()),
  retired_at timestamptz,
  unique (organization_id, course_version_id)
);

create table public.offerings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  course_version_id uuid not null references public.course_versions(id) on delete restrict,
  title text not null check (length(btrim(title)) between 1 and 180),
  mandatory boolean not null default false,
  capacity integer check (capacity is null or capacity > 0),
  enrollment_policy text not null check (enrollment_policy in ('self_enroll', 'manager_assigned')),
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'published', 'retired')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

alter table public.course_grants enable row level security;
alter table public.offerings enable row level security;
create policy grants_select_member on public.course_grants for select using (public.is_active_member(organization_id));
create policy grants_insert_platform on public.course_grants for insert with check (public.is_platform_admin());
create policy grants_update_platform on public.course_grants for update using (public.is_platform_admin());
create policy offerings_select_member on public.offerings for select using (public.is_active_member(organization_id));
create policy offerings_insert_manager on public.offerings for insert with check (
  public.is_org_manager(organization_id) and exists (
    select 1 from public.course_grants g where g.organization_id = offerings.organization_id and g.course_version_id = offerings.course_version_id and g.status = 'active'
  )
);
create policy offerings_update_manager on public.offerings for update using (public.is_org_manager(organization_id));
revoke all on public.course_grants, public.offerings from anon;
grant select on public.course_grants, public.offerings to authenticated;
grant insert, update on public.course_grants to authenticated;
grant insert, update on public.offerings to authenticated;
