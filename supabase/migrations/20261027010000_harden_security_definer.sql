do $$
declare
  v_function record;
begin
  for v_function in
    select p.oid, n.nspname as schema_name, p.proname as function_name, pg_get_function_identity_arguments(p.oid) as arguments
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
  loop
    execute format('revoke execute on function %I.%I(%s) from public, anon, authenticated', v_function.schema_name, v_function.function_name, v_function.arguments);
  end loop;
end;
$$;

grant execute on function public.accept_invitation(text) to authenticated;
grant execute on function public.assessment_org(uuid) to authenticated;
grant execute on function public.assign_enrollment_to_class(uuid, uuid) to authenticated;
grant execute on function public.commit_people_import(uuid, jsonb, integer) to authenticated;
grant execute on function public.complete_enrollment(uuid) to authenticated;
grant execute on function public.confirm_attendance(uuid, text) to authenticated;
grant execute on function public.create_assessment_with_questions(uuid, text, numeric, integer, integer, jsonb) to authenticated;
grant execute on function public.enqueue_notification(text, uuid, text, jsonb) to authenticated;
grant execute on function public.enroll_member(uuid, uuid) to authenticated;
grant execute on function public.evaluate_completion(uuid) to authenticated;
grant execute on function public.finish_attempt(uuid) to authenticated;
grant execute on function public.get_attempt_delivery(uuid) to authenticated;
grant execute on function public.get_course_report(uuid, uuid) to authenticated;
grant execute on function public.get_organization_report(uuid, timestamptz, timestamptz) to authenticated;
grant execute on function public.is_active_member(uuid, uuid) to authenticated;
grant execute on function public.is_org_manager(uuid, uuid) to authenticated;
grant execute on function public.is_platform_admin(uuid) to authenticated;
grant execute on function public.issue_attendance_token(uuid) to authenticated;
grant execute on function public.publish_assessment(uuid) to authenticated;
grant execute on function public.publish_course_version(uuid) to authenticated;
grant execute on function public.publish_offering(uuid) to authenticated;
grant execute on function public.record_lesson_progress(uuid, uuid, integer, boolean, boolean) to authenticated;
grant execute on function public.revoke_certificate(uuid, text) to authenticated;
grant execute on function public.save_attempt_answer(uuid, uuid, uuid) to authenticated;
grant execute on function public.start_attempt(uuid, uuid) to authenticated;
grant execute on function public.submit_course_feedback(uuid, integer, text) to authenticated;
grant execute on function public.validate_instructor_assignment() to authenticated;
grant execute on function public.verify_certificate(text) to anon, authenticated;
