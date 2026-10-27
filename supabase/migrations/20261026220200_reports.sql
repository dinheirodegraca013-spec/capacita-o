create or replace function public.get_organization_report(p_organization_id uuid, p_from timestamptz, p_to timestamptz) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_enrolled integer; v_active integer; v_completed integer; v_hours numeric; v_rating numeric; begin
  if not public.is_org_manager(p_organization_id) then raise exception 'REPORT_FORBIDDEN'; end if;
  select count(*) filter (where enrolled_at >= p_from and enrolled_at < p_to), count(*) filter (where status = 'active' and enrolled_at >= p_from and enrolled_at < p_to), count(*) filter (where status = 'completed' and enrolled_at >= p_from and enrolled_at < p_to) into v_enrolled, v_active, v_completed from public.enrollments where organization_id = p_organization_id;
  select coalesce(sum(lp.position_seconds) / 3600.0, 0) into v_hours from public.lesson_progress lp join public.enrollments e on e.id = lp.enrollment_id where e.organization_id = p_organization_id and lp.completed and e.enrolled_at >= p_from and e.enrolled_at < p_to;
  select avg(rating) into v_rating from public.course_evaluations where organization_id = p_organization_id and created_at >= p_from and created_at < p_to;
  return jsonb_build_object('enrolled', coalesce(v_enrolled, 0), 'active', coalesce(v_active, 0), 'completed', coalesce(v_completed, 0), 'hoursCompleted', coalesce(v_hours, 0), 'averageRating', v_rating);
end; $$;
create or replace function public.get_course_report(p_organization_id uuid, p_course_version_id uuid) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_enrolled integer; v_active integer; v_completed integer; v_hours numeric; begin
  if not public.is_org_manager(p_organization_id) then raise exception 'REPORT_FORBIDDEN'; end if;
  select count(*), count(*) filter (where status = 'active'), count(*) filter (where status = 'completed') into v_enrolled, v_active, v_completed from public.enrollments where organization_id = p_organization_id and course_version_id = p_course_version_id;
  select coalesce(sum(lp.position_seconds) / 3600.0, 0) into v_hours from public.lesson_progress lp join public.enrollments e on e.id = lp.enrollment_id where e.organization_id = p_organization_id and e.course_version_id = p_course_version_id and lp.completed;
  return jsonb_build_object('enrolled', coalesce(v_enrolled, 0), 'active', coalesce(v_active, 0), 'completed', coalesce(v_completed, 0), 'hoursCompleted', coalesce(v_hours, 0));
end; $$;
revoke all on function public.get_organization_report(uuid, timestamptz, timestamptz), public.get_course_report(uuid, uuid) from public;
grant execute on function public.get_organization_report(uuid, timestamptz, timestamptz), public.get_course_report(uuid, uuid) to authenticated;
