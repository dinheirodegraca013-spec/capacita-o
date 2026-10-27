-- Reforce tenant boundaries and lifecycle checks discovered in independent review.

drop policy if exists versions_select_scoped on public.course_versions;
create policy versions_select_scoped on public.course_versions for select using (
  public.is_platform_admin()
  or exists (
    select 1
    from public.courses c
    where c.id = course_versions.course_id
      and (
        (c.owner_type = 'central' and c.status = 'published' and course_versions.status = 'published')
        or (c.owner_type = 'organization' and public.is_active_member(c.organization_id)
            and (course_versions.status = 'published' or public.is_org_manager(c.organization_id)))
      )
  )
);

drop policy if exists modules_select_scoped on public.course_modules;
create policy modules_select_scoped on public.course_modules for select using (
  exists (select 1 from public.course_versions v where v.id = course_modules.course_version_id)
);

drop policy if exists lessons_select_scoped on public.course_lessons;
create policy lessons_select_scoped on public.course_lessons for select using (
  exists (select 1 from public.course_modules m where m.id = course_lessons.module_id)
);

create or replace function public.validate_offering_scope()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_course public.courses%rowtype; v_version public.course_versions%rowtype;
begin
  select v.* into v_version from public.course_versions v where v.id = new.course_version_id;
  if not found then raise exception 'COURSE_VERSION_UNAVAILABLE'; end if;
  select c.* into v_course from public.courses c where c.id = v_version.course_id;
  if not found or (v_course.owner_type = 'organization' and v_course.organization_id <> new.organization_id) then
    raise exception 'OFFERING_SCOPE_INVALID';
  end if;
  if v_course.owner_type = 'central' and not exists (
    select 1 from public.course_grants g where g.organization_id = new.organization_id
      and g.course_version_id = new.course_version_id and g.status = 'active'
  ) then raise exception 'COURSE_NOT_GRANTED'; end if;
  if new.status = 'published' and v_version.status <> 'published' then
    raise exception 'COURSE_VERSION_UNAVAILABLE';
  end if;
  return new;
end;
$$;
drop trigger if exists offerings_scope on public.offerings;
create trigger offerings_scope before insert or update on public.offerings for each row execute function public.validate_offering_scope();

drop policy if exists offerings_update_manager on public.offerings;
create policy offerings_update_manager on public.offerings for update
  using (public.is_org_manager(organization_id))
  with check (public.is_org_manager(organization_id));

create or replace function public.enroll_member(p_offering_id uuid, p_membership_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_offering public.offerings%rowtype; v_membership public.memberships%rowtype;
  v_course public.courses%rowtype; v_version public.course_versions%rowtype;
  v_existing uuid; v_count integer; v_actor uuid := auth.uid(); v_id uuid;
begin
  select * into v_offering from public.offerings where id = p_offering_id for update;
  if not found or v_offering.status <> 'published' then raise exception 'OFFERING_UNAVAILABLE'; end if;
  if v_offering.starts_at is not null and v_offering.starts_at > timezone('utc', now()) then raise exception 'OFFERING_NOT_STARTED'; end if;
  if v_offering.ends_at is not null and v_offering.ends_at <= timezone('utc', now()) then raise exception 'OFFERING_EXPIRED'; end if;
  select * into v_membership from public.memberships where id = p_membership_id and status = 'active';
  if not found or v_membership.organization_id <> v_offering.organization_id then raise exception 'MEMBERSHIP_FORBIDDEN'; end if;
  if v_membership.user_id <> v_actor and not public.is_org_manager(v_offering.organization_id) then raise exception 'MEMBERSHIP_FORBIDDEN'; end if;
  if v_offering.enrollment_policy = 'manager_assigned' and not public.is_org_manager(v_offering.organization_id) then raise exception 'MEMBERSHIP_FORBIDDEN'; end if;
  select v.* into v_version from public.course_versions v where v.id = v_offering.course_version_id;
  select c.* into v_course from public.courses c where c.id = v_version.course_id;
  if v_course.owner_type = 'central' and not exists (select 1 from public.course_grants g where g.organization_id = v_offering.organization_id and g.course_version_id = v_offering.course_version_id and g.status = 'active') then raise exception 'COURSE_NOT_GRANTED'; end if;
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

create or replace function public.evaluate_completion(p_enrollment_id uuid) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_enrollment public.enrollments%rowtype; lesson_total integer; lesson_done integer; assessment_total integer; assessment_passed integer; meeting_minutes numeric; present_minutes numeric; future_meetings integer; missing jsonb := '[]'::jsonb; eligible boolean := true;
begin
  select en.* into v_enrollment from public.enrollments en join public.memberships m on m.id = en.membership_id where en.id = p_enrollment_id and m.user_id = auth.uid() and m.status = 'active' and en.status = 'active';
  if not found then raise exception 'ENROLLMENT_FORBIDDEN'; end if;
  select count(*) into lesson_total from public.course_lessons l join public.course_modules cm on cm.id = l.module_id where cm.course_version_id = v_enrollment.course_version_id;
  select count(*) into lesson_done from public.lesson_progress lp where lp.enrollment_id = v_enrollment.id and lp.completed;
  if lesson_done < lesson_total then eligible := false; missing := missing || jsonb_build_array('lessons'); end if;
  select count(*), count(*) filter (where exists (select 1 from public.assessment_attempts aa where aa.assessment_id = a.id and aa.enrollment_id = v_enrollment.id and aa.status = 'submitted' and aa.passed)) into assessment_total, assessment_passed from public.assessments a where a.course_version_id = v_enrollment.course_version_id and a.status = 'published';
  if assessment_passed < assessment_total then eligible := false; missing := missing || jsonb_build_array('assessment'); end if;
  select coalesce(sum(extract(epoch from (m.ends_at - m.starts_at)) / 60), 0), coalesce(sum(extract(epoch from (m.ends_at - m.starts_at)) / 60) filter (where ar.status = 'present'), 0), count(*) filter (where m.starts_at > now()) into meeting_minutes, present_minutes, future_meetings from public.meetings m join public.class_groups cg on cg.id = m.class_group_id and cg.offering_id = v_enrollment.offering_id and (v_enrollment.class_group_id is null or cg.id = v_enrollment.class_group_id) left join public.attendance_records ar on ar.meeting_id = m.id and ar.enrollment_id = v_enrollment.id where m.required and m.status <> 'cancelled';
  if future_meetings > 0 or (meeting_minutes > 0 and present_minutes / meeting_minutes < 0.75) or (meeting_minutes = 0 and exists (select 1 from public.meetings m join public.class_groups cg on cg.id = m.class_group_id where cg.offering_id = v_enrollment.offering_id and (v_enrollment.class_group_id is null or cg.id = v_enrollment.class_group_id) and m.required and m.status <> 'cancelled')) then eligible := false; missing := missing || jsonb_build_array('attendance'); end if;
  return jsonb_build_object('eligible', eligible, 'missingRequirements', missing, 'lessonTotal', lesson_total, 'lessonCompleted', lesson_done, 'assessmentTotal', assessment_total, 'assessmentPassed', assessment_passed, 'meetingMinutes', meeting_minutes, 'presentMinutes', present_minutes);
end; $$;

create or replace function public.complete_enrollment(p_enrollment_id uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare v_enrollment public.enrollments%rowtype; decision jsonb; v_id uuid; holder text; course_title text; org_name text; hours numeric; begin
  select en.* into v_enrollment from public.enrollments en join public.memberships m on m.id = en.membership_id where en.id = p_enrollment_id and m.user_id = auth.uid() and m.status = 'active' for update;
  if not found then raise exception 'ENROLLMENT_FORBIDDEN'; end if;
  select id into v_id from public.certificates where enrollment_id = p_enrollment_id; if v_id is not null then return v_id; end if;
  if v_enrollment.status <> 'active' then raise exception 'ENROLLMENT_FORBIDDEN'; end if;
  decision := public.evaluate_completion(p_enrollment_id); if not coalesce((decision->>'eligible')::boolean, false) then raise exception 'COMPLETION_INELIGIBLE'; end if;
  select p.display_name into holder from public.profiles p where p.auth_user_id = (select user_id from public.memberships where id = v_enrollment.membership_id);
  select c.title, o.name into course_title, org_name from public.course_versions v join public.courses c on c.id = v.course_id join public.organizations o on o.id = v_enrollment.organization_id where v.id = v_enrollment.course_version_id;
  select coalesce(sum(l.duration_seconds) / 3600.0, 0) into hours from public.course_lessons l join public.course_modules cm on cm.id = l.module_id where cm.course_version_id = v_enrollment.course_version_id;
  insert into public.certificates (enrollment_id, organization_id, course_version_id, public_code, holder_name_snapshot, course_title_snapshot, organization_name_snapshot, workload_hours, rules_snapshot) values (v_enrollment.id, v_enrollment.organization_id, v_enrollment.course_version_id, encode(gen_random_bytes(16), 'hex'), coalesce(holder, 'Aluno'), coalesce(course_title, 'Curso'), coalesce(org_name, 'Organização'), hours, jsonb_build_object('mandatory', v_enrollment.mandatory_snapshot, 'enrollmentPolicy', v_enrollment.enrollment_policy_snapshot)) returning id into v_id;
  update public.enrollments set status = 'completed' where id = v_enrollment.id;
  return v_id;
end; $$;

-- Every privileged learner operation rechecks the active membership, not only the user id.
create or replace function public.start_attempt(p_enrollment_id uuid, p_assessment_id uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare v_enrollment public.enrollments%rowtype; v_assessment public.assessments%rowtype; v_count integer; v_id uuid; begin
  select e.* into v_enrollment from public.enrollments e join public.memberships m on m.id = e.membership_id where e.id = p_enrollment_id and m.user_id = auth.uid() and m.status = 'active';
  if not found or v_enrollment.status <> 'active' then raise exception 'ENROLLMENT_FORBIDDEN'; end if;
  select a.* into v_assessment from public.assessments a where a.id = p_assessment_id and a.status = 'published' for update;
  if not found or v_assessment.course_version_id <> v_enrollment.course_version_id then raise exception 'ASSESSMENT_FORBIDDEN'; end if;
  select count(*) into v_count from public.assessment_attempts where enrollment_id = p_enrollment_id and assessment_id = p_assessment_id;
  if v_count >= v_assessment.max_attempts then raise exception 'ATTEMPT_LIMIT'; end if;
  insert into public.assessment_attempts (organization_id, enrollment_id, assessment_id, attempt_number, expires_at) values (v_enrollment.organization_id, p_enrollment_id, p_assessment_id, v_count + 1, case when v_assessment.time_limit_seconds is null then null else timezone('utc', now()) + make_interval(secs => v_assessment.time_limit_seconds) end) returning id into v_id;
  return v_id;
end; $$;

create or replace function public.save_attempt_answer(p_attempt_id uuid, p_question_id uuid, p_option_id uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare v_attempt public.assessment_attempts%rowtype; v_id uuid; begin
  select a.* into v_attempt from public.assessment_attempts a join public.enrollments e on e.id = a.enrollment_id join public.memberships m on m.id = e.membership_id where a.id = p_attempt_id and m.user_id = auth.uid() and m.status = 'active' for update;
  if not found or v_attempt.status <> 'started' or (v_attempt.expires_at is not null and v_attempt.expires_at <= timezone('utc', now())) then raise exception 'ATTEMPT_EXPIRED'; end if;
  if not exists (select 1 from public.assessment_questions q where q.id = p_question_id and q.assessment_id = v_attempt.assessment_id) then raise exception 'QUESTION_FORBIDDEN'; end if;
  if not exists (select 1 from public.question_options o where o.id = p_option_id and o.question_id = p_question_id) then raise exception 'OPTION_FORBIDDEN'; end if;
  insert into public.attempt_answers (attempt_id, question_id, option_id) values (p_attempt_id, p_question_id, p_option_id) on conflict (attempt_id, question_id) do update set option_id = excluded.option_id, answered_at = timezone('utc', now()) returning id into v_id;
  return v_id;
end; $$;

create or replace function public.finish_attempt(p_attempt_id uuid) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_attempt public.assessment_attempts%rowtype; v_assessment public.assessments%rowtype; v_total numeric; v_earned numeric; v_score numeric; v_passed boolean; begin
  select a.* into v_attempt from public.assessment_attempts a join public.enrollments e on e.id = a.enrollment_id join public.memberships m on m.id = e.membership_id where a.id = p_attempt_id and m.user_id = auth.uid() and m.status = 'active' for update;
  if not found then raise exception 'ATTEMPT_FORBIDDEN'; end if;
  if v_attempt.status = 'submitted' then return jsonb_build_object('status', v_attempt.status, 'score', v_attempt.score, 'passed', v_attempt.passed); end if;
  if v_attempt.expires_at is not null and v_attempt.expires_at <= timezone('utc', now()) then update public.assessment_attempts set status = 'expired', finished_at = timezone('utc', now()) where id = p_attempt_id; return jsonb_build_object('status', 'expired', 'score', null, 'passed', false); end if;
  select * into v_assessment from public.assessments where id = v_attempt.assessment_id;
  select coalesce(sum(points), 0) into v_total from public.assessment_questions where assessment_id = v_attempt.assessment_id;
  select coalesce(sum(q.points) filter (where o.is_correct), 0) into v_earned from public.attempt_answers aa join public.assessment_questions q on q.id = aa.question_id join public.question_options o on o.id = aa.option_id where aa.attempt_id = p_attempt_id;
  v_score := case when v_total = 0 then 0 else round((v_earned / v_total) * 100, 2) end; v_passed := v_score >= v_assessment.passing_score;
  update public.assessment_attempts set status = 'submitted', score = v_score, passed = v_passed, finished_at = timezone('utc', now()) where id = p_attempt_id;
  return jsonb_build_object('status', 'submitted', 'score', v_score, 'passed', v_passed);
end; $$;

create or replace function public.get_attempt_delivery(p_attempt_id uuid) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_attempt public.assessment_attempts%rowtype; v_payload jsonb; begin
  select a.* into v_attempt from public.assessment_attempts a join public.enrollments e on e.id = a.enrollment_id join public.memberships m on m.id = e.membership_id where a.id = p_attempt_id and m.user_id = auth.uid() and m.status = 'active';
  if not found then raise exception 'ATTEMPT_FORBIDDEN'; end if;
  select jsonb_build_object('id', v_attempt.id, 'status', v_attempt.status, 'started_at', v_attempt.started_at, 'expires_at', v_attempt.expires_at, 'score', v_attempt.score, 'passed', v_attempt.passed, 'assessment', jsonb_build_object('id', a.id, 'title', a.title, 'time_limit_seconds', a.time_limit_seconds), 'questions', coalesce((select jsonb_agg(jsonb_build_object('id', q.id, 'position', q.position, 'prompt', q.prompt, 'options', (select coalesce(jsonb_agg(jsonb_build_object('id', o.id, 'position', o.position, 'label', o.label) order by o.position), '[]'::jsonb) from public.question_options o where o.question_id = q.id)) order by q.position) from public.assessment_questions q where q.assessment_id = a.id), '[]'::jsonb), 'answers', coalesce((select jsonb_agg(jsonb_build_object('question_id', aa.question_id, 'option_id', aa.option_id)) from public.attempt_answers aa where aa.attempt_id = v_attempt.id), '[]'::jsonb)) into v_payload from public.assessments a where a.id = v_attempt.assessment_id;
  return v_payload;
end; $$;

create or replace function public.record_lesson_progress(p_enrollment_id uuid, p_lesson_id uuid, p_position_seconds integer, p_completed boolean, p_confirmed_read boolean) returns uuid language plpgsql security definer set search_path = public as $$
declare v_enrollment public.enrollments%rowtype; v_lesson public.course_lessons%rowtype; v_id uuid; begin
  if p_position_seconds < 0 then raise exception 'POSITION_INVALID'; end if;
  select e.* into v_enrollment from public.enrollments e join public.memberships m on m.id = e.membership_id where e.id = p_enrollment_id and m.user_id = auth.uid() and m.status = 'active';
  if not found or v_enrollment.status <> 'active' then raise exception 'ENROLLMENT_FORBIDDEN'; end if;
  select l.* into v_lesson from public.course_lessons l join public.course_modules cm on cm.id = l.module_id where l.id = p_lesson_id and cm.course_version_id = v_enrollment.course_version_id;
  if not found then raise exception 'LESSON_FORBIDDEN'; end if;
  if v_lesson.duration_seconds is not null and p_position_seconds > v_lesson.duration_seconds then raise exception 'POSITION_INVALID'; end if;
  insert into public.lesson_progress (organization_id, enrollment_id, lesson_id, position_seconds, completed, confirmed_read) values (v_enrollment.organization_id, p_enrollment_id, p_lesson_id, p_position_seconds, p_completed, p_confirmed_read) on conflict (enrollment_id, lesson_id) do update set position_seconds = greatest(public.lesson_progress.position_seconds, excluded.position_seconds), completed = public.lesson_progress.completed or excluded.completed, confirmed_read = public.lesson_progress.confirmed_read or excluded.confirmed_read, updated_at = timezone('utc', now()) returning id into v_id;
  return v_id;
end; $$;

create or replace function public.submit_course_feedback(p_enrollment_id uuid, p_rating integer, p_comment text) returns uuid language plpgsql security definer set search_path = public as $$
declare v_enrollment public.enrollments%rowtype; v_id uuid; begin
  if p_rating < 1 or p_rating > 5 or length(coalesce(p_comment, '')) > 2000 then raise exception 'FEEDBACK_INVALID'; end if;
  select en.* into v_enrollment from public.enrollments en join public.memberships m on m.id = en.membership_id where en.id = p_enrollment_id and m.user_id = auth.uid() and m.status = 'active';
  if not found or v_enrollment.status <> 'completed' then raise exception 'FEEDBACK_FORBIDDEN'; end if;
  if exists (select 1 from public.course_evaluations where enrollment_id = p_enrollment_id) then raise exception 'FEEDBACK_EXISTS'; end if;
  insert into public.course_evaluations(organization_id, enrollment_id, rating, comment) values (v_enrollment.organization_id, p_enrollment_id, p_rating, nullif(btrim(p_comment), '')) returning id into v_id;
  return v_id;
end; $$;
