-- Freeze published assessments and their question bank.
create or replace function public.prevent_published_assessment_row_mutation()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.status = 'published' then
    raise exception 'PUBLISHED_ASSESSMENT_IMMUTABLE';
  end if;
  return new;
end;
$$;
drop trigger if exists assessment_row_immutable on public.assessments;
create trigger assessment_row_immutable before update on public.assessments for each row execute function public.prevent_published_assessment_row_mutation();
drop trigger if exists assessment_questions_insert_immutable on public.assessment_questions;
create trigger assessment_questions_insert_immutable before insert on public.assessment_questions for each row execute function public.prevent_published_assessment_mutation();
drop trigger if exists question_options_insert_immutable on public.question_options;
create trigger question_options_insert_immutable before insert on public.question_options for each row execute function public.prevent_published_assessment_mutation();
