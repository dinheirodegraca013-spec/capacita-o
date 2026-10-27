-- Close the remaining central-catalog and own-course authorization gaps.

create or replace function public.can_access_course_version(p_version_id uuid, p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.course_versions v
    join public.courses c on c.id = v.course_id
    where v.id = p_version_id
      and (
        public.is_platform_admin(p_user_id)
        or (
          c.owner_type = 'organization'
          and c.organization_id is not null
          and public.is_active_member(c.organization_id, p_user_id)
        )
        or (
          c.owner_type = 'central'
          and exists (
            select 1
            from public.course_grants g
            join public.memberships m on m.organization_id = g.organization_id
            where g.course_version_id = v.id
              and g.status = 'active'
              and m.user_id = p_user_id
              and m.status = 'active'
          )
        )
      )
  );
$$;

grant execute on function public.can_access_course_version(uuid, uuid) to authenticated;

drop policy if exists versions_select_scoped on public.course_versions;
create policy versions_select_scoped on public.course_versions for select using (
  status = 'published' and public.can_access_course_version(id)
  or public.is_platform_admin()
  or exists (
    select 1 from public.courses c
    where c.id = course_versions.course_id
      and c.owner_type = 'organization'
      and public.is_org_manager(c.organization_id)
  )
);

drop policy if exists modules_select_scoped on public.course_modules;
create policy modules_select_scoped on public.course_modules for select using (
  exists (select 1 from public.course_versions v where v.id = course_modules.course_version_id and public.can_access_course_version(v.id))
);

drop policy if exists lessons_select_scoped on public.course_lessons;
create policy lessons_select_scoped on public.course_lessons for select using (
  exists (
    select 1
    from public.course_modules m
    join public.course_versions v on v.id = m.course_version_id
    where m.id = course_lessons.module_id and public.can_access_course_version(v.id)
  )
);

drop policy if exists offerings_insert_manager on public.offerings;
create policy offerings_insert_manager on public.offerings for insert with check (
  public.is_org_manager(organization_id)
  and exists (
    select 1
    from public.course_versions v
    join public.courses c on c.id = v.course_id
    where v.id = offerings.course_version_id
      and (
        (c.owner_type = 'organization' and c.organization_id = offerings.organization_id)
        or (c.owner_type = 'central' and exists (
          select 1 from public.course_grants g
          where g.organization_id = offerings.organization_id
            and g.course_version_id = offerings.course_version_id
            and g.status = 'active'
        ))
      )
  )
);

create or replace function public.publish_offering(p_offering_id uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare v_offering public.offerings%rowtype; v_version public.course_versions%rowtype; v_course public.courses%rowtype;
begin
  select * into v_offering from public.offerings where id = p_offering_id for update;
  if not found or not public.is_org_manager(v_offering.organization_id) then raise exception 'OFFERING_FORBIDDEN'; end if;
  select * into v_version from public.course_versions where id = v_offering.course_version_id;
  if not found or v_version.status <> 'published' then raise exception 'COURSE_VERSION_UNAVAILABLE'; end if;
  select * into v_course from public.courses where id = v_version.course_id;
  if v_course.owner_type = 'central' and not exists (
    select 1 from public.course_grants g where g.organization_id = v_offering.organization_id and g.course_version_id = v_offering.course_version_id and g.status = 'active'
  ) then raise exception 'COURSE_NOT_GRANTED'; end if;
  if v_course.owner_type = 'organization' and v_course.organization_id <> v_offering.organization_id then raise exception 'OFFERING_SCOPE_INVALID'; end if;
  update public.offerings set status = 'published' where id = p_offering_id;
  return p_offering_id;
end; $$;

create or replace function public.confirm_attendance(p_meeting_id uuid, p_token text) returns uuid language plpgsql security definer set search_path = public as $$
declare v_meeting public.meetings%rowtype; v_enrollment public.enrollments%rowtype; v_id uuid; begin
  if p_token is null or btrim(p_token) = '' then raise exception 'ATTENDANCE_TOKEN_INVALID'; end if;
  select * into v_meeting from public.meetings where id = p_meeting_id and status <> 'cancelled';
  if not found then raise exception 'MEETING_INVALID'; end if;
  if not exists (select 1 from public.attendance_tokens t where t.meeting_id = p_meeting_id and t.token_hash = encode(digest(p_token, 'sha256'), 'hex') and t.expires_at > now()) then raise exception 'ATTENDANCE_TOKEN_INVALID'; end if;
  if now() < v_meeting.starts_at or now() > v_meeting.ends_at then raise exception 'MEETING_WINDOW_INVALID'; end if;
  select e.* into v_enrollment from public.enrollments e join public.memberships m on m.id = e.membership_id where e.class_group_id = v_meeting.class_group_id and e.status = 'active' and m.user_id = auth.uid() and m.status = 'active';
  if not found then raise exception 'ENROLLMENT_FORBIDDEN'; end if;
  insert into public.attendance_records (organization_id, meeting_id, enrollment_id) values (v_enrollment.organization_id, p_meeting_id, v_enrollment.id) on conflict (meeting_id, enrollment_id) do update set marked_at = public.attendance_records.marked_at returning id into v_id;
  return v_id;
end; $$;

grant execute on function public.publish_offering(uuid), public.confirm_attendance(uuid, text) to authenticated;
