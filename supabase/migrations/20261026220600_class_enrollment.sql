alter table public.enrollments add column if not exists class_group_id uuid references public.class_groups(id) on delete set null;
create index if not exists enrollments_class_group_idx on public.enrollments(class_group_id);

create or replace function public.assign_enrollment_to_class(p_enrollment_id uuid, p_class_group_id uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_enrollment public.enrollments%rowtype; v_class public.class_groups%rowtype;
begin
  select * into v_enrollment from public.enrollments where id = p_enrollment_id for update;
  select * into v_class from public.class_groups where id = p_class_group_id;
  if v_enrollment.id is null or v_class.id is null or v_enrollment.organization_id <> v_class.organization_id or v_enrollment.offering_id <> v_class.offering_id then raise exception 'CLASS_SCOPE_INVALID'; end if;
  if not public.is_org_manager(v_enrollment.organization_id) then raise exception 'CLASS_FORBIDDEN'; end if;
  update public.enrollments set class_group_id = p_class_group_id where id = p_enrollment_id;
  return p_enrollment_id;
end; $$;
grant execute on function public.assign_enrollment_to_class(uuid, uuid) to authenticated;

create or replace function public.confirm_attendance(p_meeting_id uuid, p_token text) returns uuid language plpgsql security definer set search_path = public as $$
declare v_meeting public.meetings%rowtype; v_enrollment public.enrollments%rowtype; v_id uuid; begin
  if p_token is null or btrim(p_token) = '' then raise exception 'ATTENDANCE_TOKEN_INVALID'; end if;
  select * into v_meeting from public.meetings where id = p_meeting_id and status <> 'cancelled';
  if not found then raise exception 'MEETING_INVALID'; end if;
  if not exists (select 1 from public.attendance_tokens t where t.meeting_id = p_meeting_id and t.token_hash = encode(digest(p_token, 'sha256'), 'hex') and t.expires_at > now()) then raise exception 'ATTENDANCE_TOKEN_INVALID'; end if;
  if now() < v_meeting.starts_at or now() > v_meeting.ends_at then raise exception 'MEETING_WINDOW_INVALID'; end if;
  select e.* into v_enrollment from public.enrollments e join public.memberships m on m.id = e.membership_id where e.class_group_id = v_meeting.class_group_id and e.status = 'active' and m.user_id = auth.uid();
  if not found then raise exception 'ENROLLMENT_FORBIDDEN'; end if;
  insert into public.attendance_records (organization_id, meeting_id, enrollment_id) values (v_enrollment.organization_id, p_meeting_id, v_enrollment.id) on conflict (meeting_id, enrollment_id) do update set marked_at = public.attendance_records.marked_at returning id into v_id;
  return v_id;
end; $$;
