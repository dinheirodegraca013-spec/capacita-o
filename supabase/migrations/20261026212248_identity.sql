create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null check (length(btrim(display_name)) between 1 and 160),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  kind text not null check (kind in ('company', 'municipality', 'public_agency', 'nonprofit', 'other')),
  timezone text not null default 'America/Sao_Paulo',
  created_at timestamptz not null default timezone('utc', now())
);

create table public.org_units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 160),
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, name)
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended', 'revoked')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, organization_id)
);

create table public.membership_roles (
  membership_id uuid not null references public.memberships(id) on delete cascade,
  role text not null check (role in ('manager', 'instructor', 'student')),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (membership_id, role)
);

create table public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.is_active_member(target_organization uuid, target_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships m
    where m.organization_id = target_organization
      and m.user_id = coalesce(target_user, auth.uid())
      and m.status = 'active'
  );
$$;

create or replace function public.prevent_membership_org_change()
returns trigger language plpgsql as $$
begin
  if old.organization_id is distinct from new.organization_id then
    raise exception using errcode = '42501', message = 'membership organization is immutable';
  end if;
  return new;
end;
$$;

create trigger memberships_organization_immutable
before update on public.memberships
for each row execute function public.prevent_membership_org_change();

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.org_units enable row level security;
alter table public.memberships enable row level security;
alter table public.membership_roles enable row level security;
alter table public.platform_admins enable row level security;

create policy profiles_select_self on public.profiles for select using (auth_user_id = auth.uid());
create policy profiles_update_self on public.profiles for update using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());

create policy organizations_select_member on public.organizations for select using (public.is_active_member(id));
create policy org_units_select_member on public.org_units for select using (public.is_active_member(organization_id));
create policy memberships_select_own_or_same_org on public.memberships for select using (
  status = 'active' and (user_id = auth.uid() or public.is_active_member(organization_id))
);
create policy membership_roles_select_member on public.membership_roles for select using (
  exists (select 1 from public.memberships m where m.id = membership_id and (m.user_id = auth.uid() or public.is_active_member(m.organization_id)))
);
create policy platform_admins_select_self on public.platform_admins for select using (user_id = auth.uid());

revoke all on public.profiles, public.organizations, public.org_units, public.memberships, public.membership_roles, public.platform_admins from anon;
grant select on public.profiles, public.organizations, public.org_units, public.memberships, public.membership_roles, public.platform_admins to authenticated;
