-- A cancelled/revoked enrollment must not keep an assessment attempt usable.

create or replace function public.save_attempt_answer(p_attempt_id uuid, p_question_id uuid, p_option_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_attempt public.assessment_attempts%rowtype; v_id uuid;
begin
  select a.* into v_attempt from public.assessment_attempts a join public.enrollments e on e.id = a.enrollment_id and e.status = 'active' join public.memberships m on m.id = e.membership_id where a.id = p_attempt_id and m.user_id = auth.uid() and m.status = 'active' for update;
  if not found or v_attempt.status <> 'started' or (v_attempt.expires_at is not null and v_attempt.expires_at <= timezone('utc', now())) then raise exception 'ATTEMPT_EXPIRED'; end if;
  if not exists (select 1 from public.assessment_questions q where q.id = p_question_id and q.assessment_id = v_attempt.assessment_id) then raise exception 'QUESTION_FORBIDDEN'; end if;
  if not exists (select 1 from public.question_options o where o.id = p_option_id and o.question_id = p_question_id) then raise exception 'OPTION_FORBIDDEN'; end if;
  insert into public.attempt_answers (attempt_id, question_id, option_id) values (p_attempt_id, p_question_id, p_option_id) on conflict (attempt_id, question_id) do update set option_id = excluded.option_id, answered_at = timezone('utc', now()) returning id into v_id;
  return v_id;
end; $$;

create or replace function public.finish_attempt(p_attempt_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_attempt public.assessment_attempts%rowtype; v_assessment public.assessments%rowtype; v_total numeric; v_earned numeric; v_score numeric; v_passed boolean;
begin
  select a.* into v_attempt from public.assessment_attempts a join public.enrollments e on e.id = a.enrollment_id and e.status = 'active' join public.memberships m on m.id = e.membership_id where a.id = p_attempt_id and m.user_id = auth.uid() and m.status = 'active' for update;
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

create or replace function public.get_attempt_delivery(p_attempt_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_attempt public.assessment_attempts%rowtype; v_payload jsonb;
begin
  select a.* into v_attempt from public.assessment_attempts a join public.enrollments e on e.id = a.enrollment_id and e.status = 'active' join public.memberships m on m.id = e.membership_id where a.id = p_attempt_id and m.user_id = auth.uid() and m.status = 'active';
  if not found then raise exception 'ATTEMPT_FORBIDDEN'; end if;
  select jsonb_build_object('id', v_attempt.id, 'status', v_attempt.status, 'started_at', v_attempt.started_at, 'expires_at', v_attempt.expires_at, 'score', v_attempt.score, 'passed', v_attempt.passed, 'assessment', jsonb_build_object('id', a.id, 'title', a.title, 'time_limit_seconds', a.time_limit_seconds), 'questions', coalesce((select jsonb_agg(jsonb_build_object('id', q.id, 'position', q.position, 'prompt', q.prompt, 'options', (select coalesce(jsonb_agg(jsonb_build_object('id', o.id, 'position', o.position, 'label', o.label) order by o.position), '[]'::jsonb) from public.question_options o where o.question_id = q.id)) order by q.position) from public.assessment_questions q where q.assessment_id = a.id), '[]'::jsonb), 'answers', coalesce((select jsonb_agg(jsonb_build_object('question_id', aa.question_id, 'option_id', aa.option_id)) from public.attempt_answers aa where aa.attempt_id = v_attempt.id), '[]'::jsonb)) into v_payload from public.assessments a where a.id = v_attempt.assessment_id;
  return v_payload;
end; $$;

grant execute on function public.save_attempt_answer(uuid, uuid, uuid), public.finish_attempt(uuid), public.get_attempt_delivery(uuid) to authenticated;

