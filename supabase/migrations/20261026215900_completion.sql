create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null unique references public.enrollments(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  course_version_id uuid not null references public.course_versions(id) on delete restrict,
  public_code text not null unique,
  holder_name_snapshot text not null,
  course_title_snapshot text not null,
  organization_name_snapshot text not null,
  workload_hours numeric(8,2) not null default 0,
  rules_snapshot jsonb not null default '{}'::jsonb,
  issued_at timestamptz not null default now(),
  status text not null default 'valid' check (status in ('valid', 'revoked')),
  revoked_at timestamptz,
  revocation_reason text
);
alter table public.certificates enable row level security;
create policy certificates_select_member on public.certificates for select using (exists (select 1 from public.enrollments e join public.memberships m on m.id = e.membership_id where e.id = enrollment_id and m.user_id = auth.uid()) or public.is_org_manager(organization_id));
revoke all on public.certificates from anon, authenticated;
grant select on public.certificates to authenticated;

create or replace function public.evaluate_completion(p_enrollment_id uuid) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_enrollment public.enrollments%rowtype; lesson_total integer; lesson_done integer; assessment_total integer; assessment_passed integer; meeting_minutes numeric; present_minutes numeric; future_meetings integer; missing jsonb := '[]'::jsonb; eligible boolean := true; begin
  select en.* into v_enrollment from public.enrollments en join public.memberships m on m.id = en.membership_id where en.id = p_enrollment_id and m.user_id = auth.uid();
  if not found then raise exception 'ENROLLMENT_FORBIDDEN'; end if;
  select count(*) into lesson_total from public.course_lessons l join public.course_modules cm on cm.id = l.module_id where cm.course_version_id = v_enrollment.course_version_id;
  select count(*) into lesson_done from public.lesson_progress lp where lp.enrollment_id = v_enrollment.id and lp.completed;
  if lesson_done < lesson_total then eligible := false; missing := missing || jsonb_build_array('lessons'); end if;
  select count(*), count(*) filter (where exists (select 1 from public.assessment_attempts aa where aa.assessment_id = a.id and aa.enrollment_id = v_enrollment.id and aa.status = 'submitted' and aa.passed)) into assessment_total, assessment_passed from public.assessments a where a.course_version_id = v_enrollment.course_version_id and a.status = 'published';
  if assessment_passed < assessment_total then eligible := false; missing := missing || jsonb_build_array('assessment'); end if;
  select coalesce(sum(extract(epoch from (m.ends_at - m.starts_at)) / 60), 0), coalesce(sum(extract(epoch from (m.ends_at - m.starts_at)) / 60) filter (where ar.status = 'present'), 0), count(*) filter (where m.starts_at > now()) into meeting_minutes, present_minutes, future_meetings from public.meetings m join public.class_groups cg on cg.id = m.class_group_id and cg.offering_id = v_enrollment.offering_id left join public.attendance_records ar on ar.meeting_id = m.id and ar.enrollment_id = v_enrollment.id where m.required and m.status <> 'cancelled';
  if future_meetings > 0 or (meeting_minutes > 0 and present_minutes / meeting_minutes < 0.75) or (meeting_minutes = 0 and exists (select 1 from public.meetings m join public.class_groups cg on cg.id = m.class_group_id where cg.offering_id = v_enrollment.offering_id and m.required and m.status <> 'cancelled')) then eligible := false; missing := missing || jsonb_build_array('attendance'); end if;
  return jsonb_build_object('eligible', eligible, 'missingRequirements', missing, 'lessonTotal', lesson_total, 'lessonCompleted', lesson_done, 'assessmentTotal', assessment_total, 'assessmentPassed', assessment_passed, 'meetingMinutes', meeting_minutes, 'presentMinutes', present_minutes);
end; $$;

create or replace function public.complete_enrollment(p_enrollment_id uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare v_enrollment public.enrollments%rowtype; decision jsonb; v_id uuid; holder text; course_title text; org_name text; hours numeric; begin
  select en.* into v_enrollment from public.enrollments en join public.memberships m on m.id = en.membership_id where en.id = p_enrollment_id and m.user_id = auth.uid() for update;
  if not found then raise exception 'ENROLLMENT_FORBIDDEN'; end if;
  select id into v_id from public.certificates where enrollment_id = p_enrollment_id; if v_id is not null then return v_id; end if;
  decision := public.evaluate_completion(p_enrollment_id); if not coalesce((decision->>'eligible')::boolean, false) then raise exception 'COMPLETION_INELIGIBLE'; end if;
  select p.display_name into holder from public.profiles p where p.auth_user_id = (select user_id from public.memberships where id = v_enrollment.membership_id);
  select c.title, o.name into course_title, org_name from public.course_versions v join public.courses c on c.id = v.course_id join public.organizations o on o.id = v_enrollment.organization_id where v.id = v_enrollment.course_version_id;
  select coalesce(sum(l.duration_seconds) / 3600.0, 0) into hours from public.course_lessons l join public.course_modules cm on cm.id = l.module_id where cm.course_version_id = v_enrollment.course_version_id;
  insert into public.certificates (enrollment_id, organization_id, course_version_id, public_code, holder_name_snapshot, course_title_snapshot, organization_name_snapshot, workload_hours, rules_snapshot) values (v_enrollment.id, v_enrollment.organization_id, v_enrollment.course_version_id, encode(gen_random_bytes(16), 'hex'), coalesce(holder, 'Aluno'), coalesce(course_title, 'Curso'), coalesce(org_name, 'Organização'), hours, jsonb_build_object('mandatory', v_enrollment.mandatory_snapshot, 'enrollmentPolicy', v_enrollment.enrollment_policy_snapshot)) returning id into v_id;
  update public.enrollments set status = 'completed' where id = v_enrollment.id;
  return v_id;
end; $$;
grant execute on function public.evaluate_completion(uuid), public.complete_enrollment(uuid) to authenticated;
