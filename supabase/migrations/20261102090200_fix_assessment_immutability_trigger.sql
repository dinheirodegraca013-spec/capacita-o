-- Correct trigger branching for row types with different columns.
create or replace function public.prevent_published_assessment_mutation()
returns trigger language plpgsql set search_path = public as $$
declare v_assessment uuid;
begin
  if tg_table_name = 'assessment_questions' then
    v_assessment := coalesce(new.assessment_id, old.assessment_id);
  else
    v_assessment := (select assessment_id from public.assessment_questions where id = coalesce(new.question_id, old.question_id));
  end if;
  if exists (select 1 from public.assessments where id = v_assessment and status = 'published') then
    raise exception 'PUBLISHED_ASSESSMENT_IMMUTABLE';
  end if;
  return coalesce(new, old);
end;
$$;
