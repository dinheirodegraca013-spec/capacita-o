create extension if not exists pgcrypto;
create table public.attendance_tokens (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  token_hash text not null,
  issued_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  unique (meeting_id, token_hash)
);
create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  status text not null default 'present' check (status in ('present', 'absent', 'justified')),
  marked_at timestamptz not null default timezone('utc', now()),
  unique (meeting_id, enrollment_id)
);
alter table public.attendance_tokens enable row level security;
alter table public.attendance_records enable row level security;
create policy attendance_records_select_member on public.attendance_records for select using (exists (select 1 from public.enrollments e join public.memberships m on m.id = e.membership_id where e.id = enrollment_id and m.user_id = auth.uid()) or public.is_org_manager(organization_id));
revoke all on public.attendance_tokens, public.attendance_records from anon, authenticated;
grant select on public.attendance_records to authenticated;

create or replace function public.issue_attendance_token(p_meeting_id uuid) returns text language plpgsql security definer set search_path = public as $$
declare v_meeting public.meetings%rowtype; v_can_issue boolean; v_token text; begin
  select * into v_meeting from public.meetings where id = p_meeting_id;
  if not found or v_meeting.status = 'cancelled' then raise exception 'MEETING_INVALID'; end if;
  select exists (select 1 from public.memberships m left join public.membership_roles mr on mr.membership_id = m.id where m.user_id = auth.uid() and m.organization_id = v_meeting.organization_id and m.status = 'active' and (mr.role = 'manager' or exists (select 1 from public.instructor_assignments ia where ia.class_group_id = v_meeting.class_group_id and ia.membership_id = m.id and ia.status = 'active'))) into v_can_issue;
  if not v_can_issue then raise exception 'ATTENDANCE_FORBIDDEN'; end if;
  v_token := encode(gen_random_bytes(24), 'hex');
  insert into public.attendance_tokens (organization_id, meeting_id, token_hash, expires_at) values (v_meeting.organization_id, p_meeting_id, encode(digest(v_token, 'sha256'), 'hex'), timezone('utc', now()) + interval '5 minutes');
  return v_token;
end; $$;

create or replace function public.confirm_attendance(p_meeting_id uuid, p_token text) returns uuid language plpgsql security definer set search_path = public as $$
declare v_meeting public.meetings%rowtype; v_enrollment public.enrollments%rowtype; v_id uuid; begin
  if p_token is null or btrim(p_token) = '' then raise exception 'ATTENDANCE_TOKEN_INVALID'; end if;
  select * into v_meeting from public.meetings where id = p_meeting_id and status <> 'cancelled';
  if not found then raise exception 'MEETING_INVALID'; end if;
  if not exists (select 1 from public.attendance_tokens t where t.meeting_id = p_meeting_id and t.token_hash = encode(digest(p_token, 'sha256'), 'hex') and t.expires_at > now()) then raise exception 'ATTENDANCE_TOKEN_INVALID'; end if;
  if now() < v_meeting.starts_at or now() > v_meeting.ends_at then raise exception 'MEETING_WINDOW_INVALID'; end if;
  select e.* into v_enrollment from public.enrollments e join public.memberships m on m.id = e.membership_id join public.class_groups cg on cg.offering_id = e.offering_id where cg.id = v_meeting.class_group_id and e.status = 'active' and m.user_id = auth.uid();
  if not found then raise exception 'ENROLLMENT_FORBIDDEN'; end if;
  insert into public.attendance_records (organization_id, meeting_id, enrollment_id) values (v_enrollment.organization_id, p_meeting_id, v_enrollment.id) on conflict (meeting_id, enrollment_id) do update set marked_at = public.attendance_records.marked_at returning id into v_id;
  return v_id;
end; $$;
grant execute on function public.issue_attendance_token(uuid), public.confirm_attendance(uuid, text) to authenticated;
