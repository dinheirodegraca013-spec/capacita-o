create or replace function public.get_organization_report(p_organization_id uuid, p_from timestamptz, p_to timestamptz)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_enrolled integer;
  v_active integer;
  v_completed integer;
  v_hours numeric;
  v_rating numeric;
  v_status jsonb;
  v_courses jsonb;
begin
  if p_from >= p_to or not public.is_org_manager(p_organization_id) then raise exception 'REPORT_FORBIDDEN'; end if;
  select count(*) filter (where enrolled_at >= p_from and enrolled_at < p_to),
    count(*) filter (where status = 'active' and enrolled_at >= p_from and enrolled_at < p_to),
    count(*) filter (where status = 'completed' and enrolled_at >= p_from and enrolled_at < p_to)
    into v_enrolled, v_active, v_completed
    from public.enrollments where organization_id = p_organization_id;
  select coalesce(sum(lp.position_seconds) / 3600.0, 0) into v_hours
    from public.lesson_progress lp join public.enrollments e on e.id = lp.enrollment_id
    where e.organization_id = p_organization_id and lp.completed and e.enrolled_at >= p_from and e.enrolled_at < p_to;
  select avg(rating) into v_rating from public.course_evaluations
    where organization_id = p_organization_id and created_at >= p_from and created_at < p_to;
  select coalesce(jsonb_agg(jsonb_build_object('status', status, 'count', total) order by status), '[]'::jsonb)
    into v_status from (select status, count(*)::integer as total from public.enrollments
      where organization_id = p_organization_id and enrolled_at >= p_from and enrolled_at < p_to group by status) s;
  select coalesce(jsonb_agg(jsonb_build_object('courseVersionId', course_version_id, 'enrolled', enrolled, 'active', active, 'completed', completed) order by course_version_id), '[]'::jsonb)
    into v_courses from (select course_version_id, count(*)::integer as enrolled,
      count(*) filter (where status = 'active')::integer as active,
      count(*) filter (where status = 'completed')::integer as completed
      from public.enrollments where organization_id = p_organization_id and enrolled_at >= p_from and enrolled_at < p_to group by course_version_id) c;
  return jsonb_build_object('enrolled', coalesce(v_enrolled, 0), 'active', coalesce(v_active, 0), 'completed', coalesce(v_completed, 0), 'hoursCompleted', coalesce(v_hours, 0), 'averageRating', v_rating, 'byStatus', v_status, 'byCourse', v_courses);
end; $$;

grant execute on function public.get_organization_report(uuid, timestamptz, timestamptz) to authenticated;

