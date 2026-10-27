create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  offering_id uuid not null references public.offerings(id) on delete restrict,
  membership_id uuid not null references public.memberships(id) on delete restrict,
  course_version_id uuid not null references public.course_versions(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'completed', 'expired', 'cancelled')),
  mandatory_snapshot boolean not null,
  enrollment_policy_snapshot text not null check (enrollment_policy_snapshot in ('self_enroll', 'manager_assigned')),
  starts_at_snapshot timestamptz,
  ends_at_snapshot timestamptz,
  enrolled_at timestamptz not null default timezone('utc', now()),
  unique (offering_id, membership_id)
);

alter table public.enrollments enable row level security;
create policy enrollments_select_member on public.enrollments for select using (
  membership_id in (select m.id from public.memberships m where m.user_id = auth.uid() and m.organization_id = enrollments.organization_id)
  or public.is_org_manager(organization_id)
);
create policy enrollments_insert_manager on public.enrollments for insert with check (public.is_org_manager(organization_id));
revoke all on public.enrollments from anon, authenticated;
grant select on public.enrollments to authenticated;

create or replace function public.enroll_member(p_offering_id uuid, p_membership_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offering public.offerings%rowtype;
  v_membership public.memberships%rowtype;
  v_existing uuid;
  v_count integer;
  v_actor uuid := auth.uid();
  v_id uuid;
begin
  select * into v_offering from public.offerings where id = p_offering_id for update;
  if not found or v_offering.status <> 'published' then raise exception 'OFFERING_UNAVAILABLE'; end if;
  if v_offering.starts_at is not null and v_offering.starts_at > timezone('utc', now()) then raise exception 'OFFERING_NOT_STARTED'; end if;
  if v_offering.ends_at is not null and v_offering.ends_at <= timezone('utc', now()) then raise exception 'OFFERING_EXPIRED'; end if;
  select * into v_membership from public.memberships where id = p_membership_id and status = 'active';
  if not found or v_membership.organization_id <> v_offering.organization_id then raise exception 'MEMBERSHIP_FORBIDDEN'; end if;
  if v_membership.user_id <> v_actor and not public.is_org_manager(v_offering.organization_id) then raise exception 'MEMBERSHIP_FORBIDDEN'; end if;
  select id into v_existing from public.enrollments where offering_id = p_offering_id and membership_id = p_membership_id;
  if v_existing is not null then return v_existing; end if;
  if v_offering.capacity is not null then
    select count(*)::integer into v_count from public.enrollments where offering_id = p_offering_id and status = 'active';
    if v_count >= v_offering.capacity then raise exception 'OFFERING_FULL'; end if;
  end if;
  insert into public.enrollments (organization_id, offering_id, membership_id, course_version_id, mandatory_snapshot, enrollment_policy_snapshot, starts_at_snapshot, ends_at_snapshot)
  values (v_offering.organization_id, v_offering.id, p_membership_id, v_offering.course_version_id, v_offering.mandatory, v_offering.enrollment_policy, v_offering.starts_at, v_offering.ends_at)
  returning id into v_id;
  return v_id;
end;
$$;
grant execute on function public.enroll_member(uuid, uuid) to authenticated;
