create table public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  assessment_id uuid not null references public.assessments(id) on delete restrict,
  attempt_number integer not null check (attempt_number > 0),
  status text not null default 'started' check (status in ('started', 'submitted', 'expired')),
  started_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz,
  score numeric(5,2),
  passed boolean,
  finished_at timestamptz,
  unique (enrollment_id, assessment_id, attempt_number)
);

create table public.attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.assessment_attempts(id) on delete cascade,
  question_id uuid not null references public.assessment_questions(id) on delete restrict,
  option_id uuid not null references public.question_options(id) on delete restrict,
  answered_at timestamptz not null default timezone('utc', now()),
  unique (attempt_id, question_id)
);

alter table public.assessment_attempts enable row level security;
alter table public.attempt_answers enable row level security;
create policy attempts_select_member on public.assessment_attempts for select using (exists (select 1 from public.enrollments e join public.memberships m on m.id = e.membership_id where e.id = enrollment_id and m.user_id = auth.uid()));
create policy answers_select_member on public.attempt_answers for select using (exists (select 1 from public.assessment_attempts a join public.enrollments e on e.id = a.enrollment_id join public.memberships m on m.id = e.membership_id where a.id = attempt_id and m.user_id = auth.uid()));
revoke all on public.assessment_attempts, public.attempt_answers from anon, authenticated;
grant select on public.assessment_attempts, public.attempt_answers to authenticated;

create or replace function public.start_attempt(p_enrollment_id uuid, p_assessment_id uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare v_enrollment public.enrollments%rowtype; v_assessment public.assessments%rowtype; v_count integer; v_id uuid; begin
  select e.* into v_enrollment from public.enrollments e join public.memberships m on m.id = e.membership_id where e.id = p_enrollment_id and m.user_id = auth.uid();
  if not found or v_enrollment.status <> 'active' then raise exception 'ENROLLMENT_FORBIDDEN'; end if;
  select a.* into v_assessment from public.assessments a where a.id = p_assessment_id and a.status = 'published' for update;
  if not found or v_assessment.course_version_id <> v_enrollment.course_version_id then raise exception 'ASSESSMENT_FORBIDDEN'; end if;
  select count(*) into v_count from public.assessment_attempts where enrollment_id = p_enrollment_id and assessment_id = p_assessment_id;
  if v_count >= v_assessment.max_attempts then raise exception 'ATTEMPT_LIMIT'; end if;
  insert into public.assessment_attempts (organization_id, enrollment_id, assessment_id, attempt_number, expires_at)
  values (v_enrollment.organization_id, p_enrollment_id, p_assessment_id, v_count + 1, case when v_assessment.time_limit_seconds is null then null else timezone('utc', now()) + make_interval(secs => v_assessment.time_limit_seconds) end)
  returning id into v_id;
  return v_id;
end; $$;

create or replace function public.save_attempt_answer(p_attempt_id uuid, p_question_id uuid, p_option_id uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare v_attempt public.assessment_attempts%rowtype; v_id uuid; begin
  select a.* into v_attempt from public.assessment_attempts a join public.enrollments e on e.id = a.enrollment_id join public.memberships m on m.id = e.membership_id where a.id = p_attempt_id and m.user_id = auth.uid() for update;
  if not found or v_attempt.status <> 'started' or (v_attempt.expires_at is not null and v_attempt.expires_at <= timezone('utc', now())) then raise exception 'ATTEMPT_EXPIRED'; end if;
  if not exists (select 1 from public.assessment_questions q where q.id = p_question_id and q.assessment_id = v_attempt.assessment_id) then raise exception 'QUESTION_FORBIDDEN'; end if;
  if not exists (select 1 from public.question_options o where o.id = p_option_id and o.question_id = p_question_id) then raise exception 'OPTION_FORBIDDEN'; end if;
  insert into public.attempt_answers (attempt_id, question_id, option_id) values (p_attempt_id, p_question_id, p_option_id)
  on conflict (attempt_id, question_id) do update set option_id = excluded.option_id, answered_at = timezone('utc', now()) returning id into v_id;
  return v_id;
end; $$;

create or replace function public.finish_attempt(p_attempt_id uuid) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_attempt public.assessment_attempts%rowtype; v_assessment public.assessments%rowtype; v_total numeric; v_earned numeric; v_score numeric; v_passed boolean; begin
  select a.* into v_attempt from public.assessment_attempts a join public.enrollments e on e.id = a.enrollment_id join public.memberships m on m.id = e.membership_id where a.id = p_attempt_id and m.user_id = auth.uid() for update;
  if not found then raise exception 'ATTEMPT_FORBIDDEN'; end if;
  if v_attempt.status = 'submitted' then return jsonb_build_object('status', v_attempt.status, 'score', v_attempt.score, 'passed', v_attempt.passed); end if;
  if v_attempt.expires_at is not null and v_attempt.expires_at <= timezone('utc', now()) then update public.assessment_attempts set status = 'expired', finished_at = timezone('utc', now()) where id = p_attempt_id; return jsonb_build_object('status', 'expired', 'score', null, 'passed', false); end if;
  select * into v_assessment from public.assessments where id = v_attempt.assessment_id;
  select coalesce(sum(points), 0) into v_total from public.assessment_questions where assessment_id = v_attempt.assessment_id;
  select coalesce(sum(q.points) filter (where o.is_correct), 0) into v_earned from public.attempt_answers aa join public.assessment_questions q on q.id = aa.question_id join public.question_options o on o.id = aa.option_id where aa.attempt_id = p_attempt_id;
  v_score := case when v_total = 0 then 0 else round((v_earned / v_total) * 100, 2) end;
  v_passed := v_score >= v_assessment.passing_score;
  update public.assessment_attempts set status = 'submitted', score = v_score, passed = v_passed, finished_at = timezone('utc', now()) where id = p_attempt_id;
  return jsonb_build_object('status', 'submitted', 'score', v_score, 'passed', v_passed);
end; $$;
grant execute on function public.start_attempt(uuid, uuid), public.save_attempt_answer(uuid, uuid, uuid), public.finish_attempt(uuid) to authenticated;
