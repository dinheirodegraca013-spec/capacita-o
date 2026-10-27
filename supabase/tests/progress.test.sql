begin;
select plan(8);
select has_table('public', 'lesson_progress', 'lesson progress table should exist');
select has_function('public', 'record_lesson_progress', array['uuid','uuid','integer','boolean','boolean'], 'record progress should be transactional');
select ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'lesson_progress' and policyname = 'lesson_progress_select_member'), 'member can read own progress');

insert into auth.users(id) values ('00000000-0000-0000-0000-000000000061'), ('00000000-0000-0000-0000-000000000062');
insert into public.organizations(id, name, slug, kind) values ('00000000-0000-0000-0000-000000000061', 'Progress Org', 'progress-org', 'company');
insert into public.memberships(id, user_id, organization_id, status) values
 ('00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000061', 'active');
insert into public.courses(id, organization_id, owner_type, title, slug, status) values
 ('00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000061', 'organization', 'Progress Course', 'progress-course', 'published');
insert into public.course_versions(id, course_id, version_no, title, learning_mode, status) values
 ('00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000061', 1, 'Progress v1', 'self_paced', 'published');
insert into public.course_modules(id, course_version_id, position, title) values ('00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000061', 0, 'Module');
insert into public.course_lessons(id, module_id, position, title, duration_seconds) values ('00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000061', 0, 'Lesson', 600);
insert into public.course_grants(organization_id, course_version_id, granted_by) values ('00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000061');
insert into public.offerings(id, organization_id, course_version_id, title, enrollment_policy, status) values ('00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000061', 'Progress Offer', 'self_enroll', 'published');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000061', true);
select public.enroll_member('00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000061') as enrollment_id \gset
select lives_ok(format($$select public.record_lesson_progress('%s', '00000000-0000-0000-0000-000000000061', 120, false, false)$$, :'enrollment_id'), 'progress can be recorded');
select is((select position_seconds from public.lesson_progress limit 1), 120, 'position is persisted');
select lives_ok(format($$select public.record_lesson_progress('%s', '00000000-0000-0000-0000-000000000061', 60, true, false)$$, :'enrollment_id'), 'repeat update is idempotent');
select is((select position_seconds from public.lesson_progress limit 1), 120, 'position never regresses');
select throws_ok(format($$select public.record_lesson_progress('%s', '00000000-0000-0000-0000-000000000061', 601, false, false)$$, :'enrollment_id'), 'POSITION_INVALID', 'position beyond duration is rejected');
select * from finish();
rollback;
