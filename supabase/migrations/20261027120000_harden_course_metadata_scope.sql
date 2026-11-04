-- Central course metadata is visible only when the caller has an active grant
-- for at least one published version of that course. This helper deliberately
-- bypasses RLS while evaluating the policy to avoid courses<->versions cycles.
create or replace function public.can_access_course_metadata(p_course_id uuid, p_user_id uuid default auth.uid())
returns boolean language sql stable security definer
set search_path = public
set row_security = off
as $$
  select public.is_platform_admin(p_user_id)
    or exists (
      select 1
      from public.course_versions v
      join public.course_grants g on g.course_version_id = v.id and g.status = 'active'
      join public.memberships m on m.organization_id = g.organization_id
      where v.course_id = p_course_id
        and v.status = 'published'
        and m.user_id = p_user_id
        and m.status = 'active'
    );
$$;
grant execute on function public.can_access_course_metadata(uuid, uuid) to authenticated;

drop policy if exists courses_select_scoped on public.courses;
create policy courses_select_scoped on public.courses for select using (
  public.is_platform_admin()
  or (
    owner_type = 'central'
    and status = 'published'
    and public.can_access_course_metadata(id)
  )
  or (
    owner_type = 'organization'
    and organization_id is not null
    and public.is_active_member(organization_id)
    and (status = 'published' or public.is_org_manager(organization_id))
  )
);

