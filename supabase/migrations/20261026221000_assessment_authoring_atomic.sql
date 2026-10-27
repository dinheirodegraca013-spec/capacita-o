create or replace function public.create_assessment_with_questions(
  p_course_version_id uuid,
  p_title text,
  p_passing_score numeric,
  p_time_limit_seconds integer,
  p_max_attempts integer,
  p_questions jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_assessment uuid;
  v_question jsonb;
  v_option jsonb;
  v_question_id uuid;
  v_membership uuid;
  v_position integer := 0;
  v_option_position integer;
begin
  select c.organization_id into v_org
  from public.course_versions v join public.courses c on c.id = v.course_id
  where v.id = p_course_version_id;
  if v_org is null or not public.is_org_manager(v_org) then raise exception 'ASSESSMENT_FORBIDDEN'; end if;
  if p_title is null or length(btrim(p_title)) = 0 or length(btrim(p_title)) > 180
     or p_passing_score is null or p_passing_score < 0 or p_passing_score > 100
     or p_max_attempts is null or p_max_attempts < 1 or p_max_attempts > 10
     or jsonb_typeof(p_questions) <> 'array' or jsonb_array_length(p_questions) = 0
     or jsonb_array_length(p_questions) > 100 then raise exception 'ASSESSMENT_INVALID'; end if;
  insert into public.assessments (course_version_id, title, passing_score, time_limit_seconds, max_attempts, status)
  values (p_course_version_id, btrim(p_title), p_passing_score, p_time_limit_seconds, p_max_attempts, 'draft')
  returning id into v_assessment;
  for v_question in select value from jsonb_array_elements(p_questions) loop
    if nullif(btrim(v_question->>'prompt'), '') is null
       or length(btrim(v_question->>'prompt')) > 4000
       or coalesce((v_question->>'points')::numeric, 0) <= 0
       or jsonb_typeof(v_question->'options') <> 'array'
       or jsonb_array_length(v_question->'options') = 0
       or jsonb_array_length(v_question->'options') > 20
       or not exists (select 1 from jsonb_array_elements(v_question->'options') option where coalesce((option->>'isCorrect')::boolean, false)) then
      raise exception 'ASSESSMENT_INVALID';
    end if;
    insert into public.assessment_questions (assessment_id, position, prompt, points)
    values (v_assessment, v_position, btrim(v_question->>'prompt'), (v_question->>'points')::numeric)
    returning id into v_question_id;
    v_option_position := 0;
    for v_option in select value from jsonb_array_elements(v_question->'options') loop
      if nullif(btrim(v_option->>'label'), '') is null or length(btrim(v_option->>'label')) > 1000 then raise exception 'ASSESSMENT_INVALID'; end if;
      insert into public.question_options (question_id, position, label, is_correct)
      values (v_question_id, v_option_position, btrim(v_option->>'label'), coalesce((v_option->>'isCorrect')::boolean, false));
      v_option_position := v_option_position + 1;
    end loop;
    v_position := v_position + 1;
  end loop;
  select m.id into v_membership
  from public.memberships m
  where m.organization_id = v_org and m.user_id = auth.uid() and m.status = 'active'
  limit 1;
  insert into public.audit_events (organization_id, actor_user_id, actor_membership_id, action, resource_type, resource_id, outcome, metadata)
  values (v_org, auth.uid(), v_membership, 'assessment.created', 'assessment', v_assessment, 'success', jsonb_build_object('question_count', jsonb_array_length(p_questions)));
  return v_assessment;
end;
$$;

revoke all on function public.create_assessment_with_questions(uuid, text, numeric, integer, integer, jsonb) from public, anon;
grant execute on function public.create_assessment_with_questions(uuid, text, numeric, integer, integer, jsonb) to authenticated;
