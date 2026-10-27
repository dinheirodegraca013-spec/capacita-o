-- Keep the authorization predicates unchanged while evaluating auth.uid() once per statement.
alter policy profiles_select_self on public.profiles using (auth_user_id = (select auth.uid()));
alter policy profiles_update_self on public.profiles using (auth_user_id = (select auth.uid())) with check (auth_user_id = (select auth.uid()));
alter policy platform_admins_select_self on public.platform_admins using (user_id = (select auth.uid()));
alter policy memberships_select_own_or_same_org on public.memberships using (
  status = 'active' and ((user_id = (select auth.uid())) or is_active_member(organization_id, (select auth.uid())))
);
alter policy membership_roles_select_member on public.membership_roles using (
  exists (
    select 1 from public.memberships m
    where m.id = membership_roles.membership_id
      and (m.user_id = (select auth.uid()) or is_active_member(m.organization_id, (select auth.uid())))
  )
);
alter policy enrollments_select_member on public.enrollments using (
  membership_id in (select m.id from public.memberships m where m.user_id = (select auth.uid()) and m.organization_id = enrollments.organization_id)
  or is_org_manager(organization_id, (select auth.uid()))
);
alter policy lesson_progress_select_member on public.lesson_progress using (
  exists (
    select 1 from public.enrollments e
    join public.memberships m on m.id = e.membership_id
    where e.id = lesson_progress.enrollment_id and m.user_id = (select auth.uid())
  ) or is_org_manager(organization_id, (select auth.uid()))
);
alter policy path_assignments_select_member on public.path_assignments using (
  membership_id in (select m.id from public.memberships m where m.user_id = (select auth.uid()))
  or is_org_manager(organization_id, (select auth.uid()))
);
alter policy attempts_select_member on public.assessment_attempts using (
  exists (
    select 1 from public.enrollments e
    join public.memberships m on m.id = e.membership_id
    where e.id = assessment_attempts.enrollment_id and m.user_id = (select auth.uid())
  )
);
alter policy answers_select_member on public.attempt_answers using (
  exists (
    select 1 from public.assessment_attempts a
    join public.enrollments e on e.id = a.enrollment_id
    join public.memberships m on m.id = e.membership_id
    where a.id = attempt_answers.attempt_id and m.user_id = (select auth.uid())
  )
);
alter policy attendance_records_select_member on public.attendance_records using (
  exists (
    select 1 from public.enrollments e
    join public.memberships m on m.id = e.membership_id
    where e.id = attendance_records.enrollment_id and m.user_id = (select auth.uid())
  ) or is_org_manager(organization_id, (select auth.uid()))
);
alter policy certificates_select_member on public.certificates using (
  exists (
    select 1 from public.enrollments e
    join public.memberships m on m.id = e.membership_id
    where e.id = certificates.enrollment_id and m.user_id = (select auth.uid())
  ) or is_org_manager(organization_id, (select auth.uid()))
);
