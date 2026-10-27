create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  course_version_id uuid not null references public.course_versions(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 180),
  passing_score numeric(5,2) not null default 70 check (passing_score between 0 and 100),
  time_limit_seconds integer check (time_limit_seconds is null or time_limit_seconds > 0),
  max_attempts integer not null default 1 check (max_attempts between 1 and 10),
  status text not null default 'draft' check (status in ('draft', 'published', 'retired')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (course_version_id)
);

create table public.assessment_questions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  position integer not null check (position >= 0),
  prompt text not null check (length(btrim(prompt)) between 1 and 4000),
  points numeric(6,2) not null default 1 check (points > 0),
  unique (assessment_id, position)
);

create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.assessment_questions(id) on delete cascade,
  position integer not null check (position >= 0),
  label text not null check (length(btrim(label)) between 1 and 1000),
  is_correct boolean not null default false,
  unique (question_id, position)
);

create or replace function public.assessment_org(p_assessment uuid) returns uuid language sql stable security definer set search_path = public as $$
  select c.organization_id from public.assessments a join public.course_versions v on v.id = a.course_version_id join public.courses c on c.id = v.course_id where a.id = p_assessment;
$$;
create or replace function public.prevent_published_assessment_mutation() returns trigger language plpgsql set search_path = public as $$
declare v_assessment uuid;
begin
  v_assessment := case when tg_table_name = 'assessment_questions' then coalesce(new.assessment_id, old.assessment_id) else (select assessment_id from public.assessment_questions where id = coalesce(new.question_id, old.question_id)) end;
  if exists (select 1 from public.assessments where id = v_assessment and status = 'published') then raise exception 'PUBLISHED_ASSESSMENT_IMMUTABLE'; end if;
  return coalesce(new, old);
end;
$$;
create trigger assessment_questions_immutable before update or delete on public.assessment_questions for each row execute function public.prevent_published_assessment_mutation();
create trigger question_options_immutable before update or delete on public.question_options for each row execute function public.prevent_published_assessment_mutation();

create or replace function public.publish_assessment(p_assessment_id uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_questions integer; v_missing integer; begin
  v_org := public.assessment_org(p_assessment_id);
  if v_org is null or not public.is_org_manager(v_org) then raise exception 'ASSESSMENT_FORBIDDEN'; end if;
  select count(*) into v_questions from public.assessment_questions where assessment_id = p_assessment_id;
  select count(*) into v_missing from public.assessment_questions q where q.assessment_id = p_assessment_id and not exists (select 1 from public.question_options o where o.question_id = q.id and o.is_correct);
  if v_questions = 0 or v_missing > 0 then raise exception 'ASSESSMENT_INVALID'; end if;
  update public.assessments set status = 'published' where id = p_assessment_id;
  return p_assessment_id;
end; $$;

alter table public.assessments enable row level security;
alter table public.assessment_questions enable row level security;
alter table public.question_options enable row level security;
create policy assessments_select_member on public.assessments for select using (exists (select 1 from public.course_versions v join public.courses c on c.id = v.course_id where v.id = course_version_id and public.is_active_member(c.organization_id)));
create policy assessments_insert_manager on public.assessments for insert with check (exists (select 1 from public.course_versions v join public.courses c on c.id = v.course_id where v.id = course_version_id and public.is_org_manager(c.organization_id)));
create policy assessments_update_manager on public.assessments for update using (public.is_org_manager(public.assessment_org(id)));
create policy assessment_questions_select_manager on public.assessment_questions for select using (public.is_org_manager(public.assessment_org((select a.id from public.assessments a where a.id = assessment_id))));
create policy assessment_questions_insert_manager on public.assessment_questions for insert with check (public.is_org_manager(public.assessment_org(assessment_id)));
create policy question_options_select_manager on public.question_options for select using (public.is_org_manager(public.assessment_org((select q.assessment_id from public.assessment_questions q where q.id = question_id))));
create policy question_options_insert_manager on public.question_options for insert with check (public.is_org_manager(public.assessment_org((select q.assessment_id from public.assessment_questions q where q.id = question_id))));
revoke all on public.assessments, public.assessment_questions, public.question_options from anon;
grant select, insert, update on public.assessments, public.assessment_questions, public.question_options to authenticated;
grant execute on function public.publish_assessment(uuid) to authenticated;
