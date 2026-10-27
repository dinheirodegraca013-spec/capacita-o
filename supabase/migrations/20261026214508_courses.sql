create table public.courses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  owner_type text not null check (owner_type in ('central', 'organization')),
  title text not null check (length(btrim(title)) between 1 and 180),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '',
  learning_mode text not null default 'self_paced' check (learning_mode in ('self_paced', 'instructor_led')),
  license_confirmed boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'retired')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  check ((owner_type = 'central' and organization_id is null) or (owner_type = 'organization' and organization_id is not null)),
  unique (owner_type, organization_id, slug)
);

create table public.course_versions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  version_no integer not null check (version_no > 0),
  title text not null check (length(btrim(title)) between 1 and 180),
  description text not null default '',
  learning_mode text not null check (learning_mode in ('self_paced', 'instructor_led')),
  license_confirmed boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'retired')),
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (course_id, version_no)
);

create table public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_version_id uuid not null references public.course_versions(id) on delete cascade,
  position integer not null check (position >= 0),
  title text not null check (length(btrim(title)) between 1 and 180),
  unique (course_version_id, position)
);

create table public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules(id) on delete cascade,
  position integer not null check (position >= 0),
  title text not null check (length(btrim(title)) between 1 and 180),
  content text not null default '',
  unique (module_id, position)
);

create or replace function public.is_platform_admin(target_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.platform_admins where user_id = coalesce(target_user, auth.uid()));
$$;

create or replace function public.prevent_published_version_mutation()
returns trigger language plpgsql as $$
begin
  if old.status = 'published' and (old.course_id, old.version_no, old.title, old.description, old.learning_mode, old.license_confirmed) is distinct from (new.course_id, new.version_no, new.title, new.description, new.learning_mode, new.license_confirmed) then
    raise exception using errcode = '55000', message = 'published course versions are immutable';
  end if;
  return new;
end;
$$;
create trigger course_versions_immutable before update on public.course_versions for each row execute function public.prevent_published_version_mutation();

alter table public.courses enable row level security;
alter table public.course_versions enable row level security;
alter table public.course_modules enable row level security;
alter table public.course_lessons enable row level security;
create policy courses_select_scoped on public.courses for select using (public.is_platform_admin() or (owner_type = 'central' and status = 'published') or (organization_id is not null and (public.is_active_member(organization_id) and (status = 'published' or public.is_org_manager(organization_id)))));
create policy courses_insert_manager on public.courses for insert with check ((owner_type = 'organization' and public.is_org_manager(organization_id)) or (owner_type = 'central' and public.is_platform_admin()));
create policy courses_update_manager on public.courses for update using ((owner_type = 'organization' and public.is_org_manager(organization_id)) or (owner_type = 'central' and public.is_platform_admin())) with check ((owner_type = 'organization' and public.is_org_manager(organization_id)) or (owner_type = 'central' and public.is_platform_admin()));
create policy versions_select_scoped on public.course_versions for select using (exists (select 1 from public.courses c where c.id = course_id));
create policy versions_insert_manager on public.course_versions for insert with check (exists (select 1 from public.courses c where c.id = course_id and ((c.owner_type = 'organization' and public.is_org_manager(c.organization_id)) or (c.owner_type = 'central' and public.is_platform_admin()))));
create policy versions_update_manager on public.course_versions for update using (exists (select 1 from public.courses c where c.id = course_id and ((c.owner_type = 'organization' and public.is_org_manager(c.organization_id)) or (c.owner_type = 'central' and public.is_platform_admin()))));
create policy modules_select_scoped on public.course_modules for select using (exists (select 1 from public.course_versions v where v.id = course_version_id));
create policy lessons_select_scoped on public.course_lessons for select using (exists (select 1 from public.course_modules m join public.course_versions v on v.id = m.course_version_id where m.id = module_id));
revoke all on public.courses, public.course_versions, public.course_modules, public.course_lessons from anon;
grant select on public.courses, public.course_versions, public.course_modules, public.course_lessons to authenticated;
grant insert, update on public.courses, public.course_versions to authenticated;
