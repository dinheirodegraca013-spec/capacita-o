begin;
select plan(9);
select has_table('public', 'certificates', 'certificates table should exist');
select has_function('public', 'evaluate_completion', array['uuid'], 'completion evaluator should exist');
select has_function('public', 'complete_enrollment', array['uuid'], 'certificate issuance should be transactional');
select ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'certificates' and policyname = 'certificates_select_member'), 'certificate access is tenant scoped');

insert into auth.users(id) values ('00000000-0000-0000-0000-000000000121');
insert into public.profiles(auth_user_id, display_name) values ('00000000-0000-0000-0000-000000000121', 'Aluno Teste');
insert into public.organizations(id, name, slug, kind) values ('00000000-0000-0000-0000-000000000121', 'Completion Org', 'completion-org', 'company');
insert into public.memberships(id, user_id, organization_id, status) values ('00000000-0000-0000-0000-000000000121', '00000000-0000-0000-0000-000000000121', '00000000-0000-0000-0000-000000000121', 'active');
insert into public.membership_roles(membership_id, role) values ('00000000-0000-0000-0000-000000000121', 'student');
insert into public.courses(id, organization_id, owner_type, title, slug, status) values ('00000000-0000-0000-0000-000000000121', '00000000-0000-0000-0000-000000000121', 'organization', 'Completion Course', 'completion-course', 'published');
insert into public.course_versions(id, course_id, version_no, title, learning_mode, status) values ('00000000-0000-0000-0000-000000000121', '00000000-0000-0000-0000-000000000121', 1, 'Completion v1', 'self_paced', 'published');
insert into public.course_grants(organization_id, course_version_id, granted_by) values ('00000000-0000-0000-0000-000000000121', '00000000-0000-0000-0000-000000000121', '00000000-0000-0000-0000-000000000121');
insert into public.offerings(id, organization_id, course_version_id, title, enrollment_policy, status) values ('00000000-0000-0000-0000-000000000121', '00000000-0000-0000-0000-000000000121', '00000000-0000-0000-0000-000000000121', 'Completion Offer', 'self_enroll', 'published');
insert into public.enrollments(id, organization_id, offering_id, membership_id, course_version_id, mandatory_snapshot, enrollment_policy_snapshot) values ('00000000-0000-0000-0000-000000000121', '00000000-0000-0000-0000-000000000121', '00000000-0000-0000-0000-000000000121', '00000000-0000-0000-0000-000000000121', '00000000-0000-0000-0000-000000000121', false, 'self_enroll');
insert into public.course_modules(id, course_version_id, position, title) values ('00000000-0000-0000-0000-000000000121', '00000000-0000-0000-0000-000000000121', 0, 'Module');
insert into public.course_lessons(id, module_id, position, title, duration_seconds) values ('00000000-0000-0000-0000-000000000121', '00000000-0000-0000-0000-000000000121', 0, 'Lesson', 60);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000121', true);
select is((public.evaluate_completion('00000000-0000-0000-0000-000000000121')->>'eligible')::boolean, false, 'incomplete enrollment is not eligible');
select public.record_lesson_progress('00000000-0000-0000-0000-000000000121', '00000000-0000-0000-0000-000000000121', 60, true, false);
select is((public.evaluate_completion('00000000-0000-0000-0000-000000000121')->>'eligible')::boolean, true, 'completed lessons make EAD eligible');
select public.complete_enrollment('00000000-0000-0000-0000-000000000121') as certificate_id \gset
select is((select status from public.enrollments where id = '00000000-0000-0000-0000-000000000121'), 'completed', 'enrollment becomes completed');
select lives_ok($$select public.complete_enrollment('00000000-0000-0000-0000-000000000121')$$, 'repeat completion is idempotent');
select is((select count(*)::int from public.certificates where enrollment_id = '00000000-0000-0000-0000-000000000121'), 1, 'one certificate per enrollment');
select * from finish();
rollback;
