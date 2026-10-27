begin;
select plan(7);
select has_table('public', 'attendance_tokens', 'attendance tokens table should exist');
select has_table('public', 'attendance_records', 'attendance records table should exist');
select has_function('public', 'issue_attendance_token', array['uuid'], 'token issuance is server controlled');
select has_function('public', 'confirm_attendance', array['uuid','text'], 'attendance confirmation is server controlled');

insert into auth.users(id) values ('00000000-0000-0000-0000-000000000111'), ('00000000-0000-0000-0000-000000000112');
insert into public.organizations(id, name, slug, kind) values ('00000000-0000-0000-0000-000000000111', 'Attendance Org', 'attendance-org', 'company');
insert into public.memberships(id, user_id, organization_id, status) values ('00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000111', 'active'), ('00000000-0000-0000-0000-000000000112', '00000000-0000-0000-0000-000000000112', '00000000-0000-0000-0000-000000000111', 'active');
insert into public.membership_roles(membership_id, role) values ('00000000-0000-0000-0000-000000000111', 'manager'), ('00000000-0000-0000-0000-000000000111', 'instructor'), ('00000000-0000-0000-0000-000000000112', 'student');
insert into public.courses(id, organization_id, owner_type, title, slug, status) values ('00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000111', 'organization', 'Attendance Course', 'attendance-course', 'published');
insert into public.course_versions(id, course_id, version_no, title, learning_mode, status) values ('00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000111', 1, 'Attendance v1', 'instructor_led', 'published');
insert into public.course_grants(organization_id, course_version_id, granted_by) values ('00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000111');
insert into public.offerings(id, organization_id, course_version_id, title, enrollment_policy, status) values ('00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000111', 'Attendance Offer', 'self_enroll', 'published');
insert into public.class_groups(id, organization_id, offering_id, name, status) values ('00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000111', 'Class', 'open');
insert into public.meetings(id, organization_id, class_group_id, title, starts_at, ends_at, timezone, required) values ('00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000111', 'Meeting', now() - interval '1 minute', now() + interval '1 hour', 'UTC', true);
insert into public.enrollments(id, organization_id, offering_id, membership_id, course_version_id, class_group_id, mandatory_snapshot, enrollment_policy_snapshot) values ('00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000112', '00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000111', false, 'self_enroll');
insert into public.instructor_assignments(organization_id, class_group_id, membership_id) values ('00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000111');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000111', true);
select public.issue_attendance_token('00000000-0000-0000-0000-000000000111') as token \gset
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000112', true);
select lives_ok(format($$select public.confirm_attendance('00000000-0000-0000-0000-000000000111', '%s')$$, :'token'), 'student confirms attendance');
select lives_ok(format($$select public.confirm_attendance('00000000-0000-0000-0000-000000000111', '%s')$$, :'token'), 'repeat confirmation is idempotent');
select throws_ok($$select public.confirm_attendance('00000000-0000-0000-0000-000000000111', 'invalid-token')$$, 'ATTENDANCE_TOKEN_INVALID', 'random token is rejected');
select * from finish();
rollback;
