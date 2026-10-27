create or replace function public.get_attempt_delivery(p_attempt_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare v_attempt public.assessment_attempts%rowtype; v_payload jsonb;
begin
  select a.* into v_attempt
  from public.assessment_attempts a
  join public.enrollments e on e.id = a.enrollment_id
  join public.memberships m on m.id = e.membership_id
  where a.id = p_attempt_id and m.user_id = auth.uid();
  if not found then raise exception 'ATTEMPT_FORBIDDEN'; end if;
  select jsonb_build_object(
    'id', v_attempt.id, 'status', v_attempt.status, 'started_at', v_attempt.started_at,
    'expires_at', v_attempt.expires_at, 'score', v_attempt.score, 'passed', v_attempt.passed,
    'assessment', jsonb_build_object('id', a.id, 'title', a.title, 'time_limit_seconds', a.time_limit_seconds),
    'questions', coalesce((select jsonb_agg(jsonb_build_object(
      'id', q.id, 'position', q.position, 'prompt', q.prompt,
      'options', (select coalesce(jsonb_agg(jsonb_build_object('id', o.id, 'position', o.position, 'label', o.label) order by o.position), '[]'::jsonb) from public.question_options o where o.question_id = q.id)
    ) order by q.position) from public.assessment_questions q where q.assessment_id = a.id), '[]'::jsonb),
    'answers', coalesce((select jsonb_agg(jsonb_build_object('question_id', aa.question_id, 'option_id', aa.option_id)) from public.attempt_answers aa where aa.attempt_id = v_attempt.id), '[]'::jsonb)
  ) into v_payload
  from public.assessments a where a.id = v_attempt.assessment_id;
  return v_payload;
end;
$$;
revoke all on function public.get_attempt_delivery(uuid) from public, anon;
grant execute on function public.get_attempt_delivery(uuid) to authenticated;
