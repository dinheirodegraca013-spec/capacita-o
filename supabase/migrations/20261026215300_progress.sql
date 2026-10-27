alter table public.course_lessons add column if not exists duration_seconds integer check (duration_seconds is null or duration_seconds > 0);

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  position_seconds integer not null default 0 check (position_seconds >= 0),
  completed boolean not null default false,
  confirmed_read boolean not null default false,
  updated_at timestamptz not null default timezone('utc', now()),
  unique (enrollment_id, lesson_id)
);

alter table public.lesson_progress enable row level security;
create policy lesson_progress_select_member on public.lesson_progress for select using (
  exists (select 1 from public.enrollments e join public.memberships m on m.id = e.membership_id where e.id = lesson_progress.enrollment_id and m.user_id = auth.uid())
  or public.is_org_manager(organization_id)
);
revoke all on public.lesson_progress from anon, authenticated;
grant select on public.lesson_progress to authenticated;

create or replace function public.record_lesson_progress(p_enrollment_id uuid, p_lesson_id uuid, p_position_seconds integer, p_completed boolean, p_confirmed_read boolean)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_enrollment public.enrollments%rowtype;
  v_lesson public.course_lessons%rowtype;
  v_id uuid;
begin
  if p_position_seconds < 0 then raise exception 'POSITION_INVALID'; end if;
  select e.* into v_enrollment from public.enrollments e join public.memberships m on m.id = e.membership_id where e.id = p_enrollment_id and m.user_id = auth.uid();
  if not found or v_enrollment.status <> 'active' then raise exception 'ENROLLMENT_FORBIDDEN'; end if;
  select l.* into v_lesson from public.course_lessons l join public.course_modules cm on cm.id = l.module_id where l.id = p_lesson_id and cm.course_version_id = v_enrollment.course_version_id;
  if not found then raise exception 'LESSON_FORBIDDEN'; end if;
  if v_lesson.duration_seconds is not null and p_position_seconds > v_lesson.duration_seconds then raise exception 'POSITION_INVALID'; end if;
  insert into public.lesson_progress (organization_id, enrollment_id, lesson_id, position_seconds, completed, confirmed_read)
  values (v_enrollment.organization_id, p_enrollment_id, p_lesson_id, p_position_seconds, p_completed, p_confirmed_read)
  on conflict (enrollment_id, lesson_id) do update set
    position_seconds = greatest(public.lesson_progress.position_seconds, excluded.position_seconds),
    completed = public.lesson_progress.completed or excluded.completed,
    confirmed_read = public.lesson_progress.confirmed_read or excluded.confirmed_read,
    updated_at = timezone('utc', now())
  returning id into v_id;
  return v_id;
end;
$$;
grant execute on function public.record_lesson_progress(uuid, uuid, integer, boolean, boolean) to authenticated;
