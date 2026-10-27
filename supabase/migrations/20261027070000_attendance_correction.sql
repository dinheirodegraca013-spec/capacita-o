create or replace function public.correct_attendance(p_meeting_id uuid, p_enrollment_id uuid, p_status text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_meeting public.meetings%rowtype;
  v_enrollment public.enrollments%rowtype;
  v_id uuid;
  v_actor_membership uuid;
  v_allowed boolean;
begin
  if p_status not in ('present', 'absent', 'justified') then raise exception 'ATTENDANCE_STATUS_INVALID'; end if;
  select * into v_meeting from public.meetings where id = p_meeting_id and status <> 'cancelled';
  if not found then raise exception 'MEETING_INVALID'; end if;
  select e.* into v_enrollment
    from public.enrollments e
    join public.class_groups cg on cg.id = e.class_group_id and cg.organization_id = e.organization_id
    where e.id = p_enrollment_id
      and e.organization_id = v_meeting.organization_id
      and e.class_group_id = v_meeting.class_group_id
      and e.status = 'active';
  if not found then raise exception 'ENROLLMENT_FORBIDDEN'; end if;
  select m.id into v_actor_membership
    from public.memberships m
    where m.user_id = auth.uid() and m.organization_id = v_meeting.organization_id and m.status = 'active';
  if v_actor_membership is null then raise exception 'ATTENDANCE_FORBIDDEN'; end if;
  select exists (
    select 1 from public.membership_roles mr where mr.membership_id = v_actor_membership and mr.role = 'manager'
    union all
    select 1 from public.instructor_assignments ia where ia.class_group_id = v_meeting.class_group_id and ia.membership_id = v_actor_membership and ia.status = 'active'
  ) into v_allowed;
  if not v_allowed then raise exception 'ATTENDANCE_FORBIDDEN'; end if;
  insert into public.attendance_records (organization_id, meeting_id, enrollment_id, status)
    values (v_meeting.organization_id, p_meeting_id, p_enrollment_id, p_status)
    on conflict (meeting_id, enrollment_id) do update set status = excluded.status, marked_at = timezone('utc', now())
    returning id into v_id;
  insert into public.audit_events (organization_id, actor_user_id, actor_membership_id, action, resource_type, resource_id, outcome, metadata)
    values (v_meeting.organization_id, auth.uid(), v_actor_membership, 'attendance.correct', 'attendance', v_id, 'success', jsonb_build_object('meeting_id', p_meeting_id, 'enrollment_id', p_enrollment_id, 'status', p_status));
  return v_id;
end; $$;

revoke all on function public.correct_attendance(uuid, uuid, text) from public, anon;
grant execute on function public.correct_attendance(uuid, uuid, text) to authenticated;

