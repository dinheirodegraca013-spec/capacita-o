create table public.course_evaluations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  enrollment_id uuid not null unique references public.enrollments(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text check (comment is null or length(comment) <= 2000),
  created_at timestamptz not null default now()
);
alter table public.course_evaluations enable row level security;
create policy course_evaluations_select_member on public.course_evaluations for select using (public.is_active_member(organization_id));
revoke all on public.course_evaluations from anon, authenticated;
grant select on public.course_evaluations to authenticated;
create or replace function public.submit_course_feedback(p_enrollment_id uuid, p_rating integer, p_comment text) returns uuid language plpgsql security definer set search_path = public as $$
declare v_enrollment public.enrollments%rowtype; v_id uuid; begin
  if p_rating < 1 or p_rating > 5 or length(coalesce(p_comment, '')) > 2000 then raise exception 'FEEDBACK_INVALID'; end if;
  select en.* into v_enrollment from public.enrollments en join public.memberships m on m.id = en.membership_id where en.id = p_enrollment_id and m.user_id = auth.uid();
  if not found or v_enrollment.status <> 'completed' then raise exception 'FEEDBACK_FORBIDDEN'; end if;
  if exists (select 1 from public.course_evaluations where enrollment_id = p_enrollment_id) then raise exception 'FEEDBACK_EXISTS'; end if;
  insert into public.course_evaluations(organization_id, enrollment_id, rating, comment) values (v_enrollment.organization_id, p_enrollment_id, p_rating, nullif(btrim(p_comment), '')) returning id into v_id;
  return v_id;
end; $$;
grant execute on function public.submit_course_feedback(uuid, integer, text) to authenticated;
