begin;
select plan(11);
select has_table('public', 'enrollments', 'enrollments table should exist');
select has_function('public', 'enroll_member', array['uuid','uuid'], 'enroll_member should be transactional');
select ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'enrollments' and policyname = 'enrollments_select_member'), 'member can see own enrollment');
select ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'enrollments' and policyname = 'enrollments_insert_manager'), 'manager policy exists');

insert into auth.users(id) values
  ('00000000-0000-0000-0000-000000000051'),
  ('00000000-0000-0000-0000-000000000052'),
  ('00000000-0000-0000-0000-000000000053');
insert into public.organizations(id, name, slug, kind) values
  ('00000000-0000-0000-0000-000000000051', 'Enrollment Org', 'enrollment-org', 'company');
insert into public.memberships(id, user_id, organization_id, status) values
  ('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000051', 'active'),
  ('00000000-0000-0000-0000-000000000052', '00000000-0000-0000-0000-000000000052', '00000000-0000-0000-0000-000000000051', 'active'),
  ('00000000-0000-0000-0000-000000000053', '00000000-0000-0000-0000-000000000053', '00000000-0000-0000-0000-000000000051', 'active');
insert into public.membership_roles(membership_id, role) values
  ('00000000-0000-0000-0000-000000000053', 'manager');
insert into public.courses(id, organization_id, owner_type, title, slug, status) values
  ('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000051', 'organization', 'Enrollment Course', 'enrollment-course', 'published');
insert into public.course_versions(id, course_id, version_no, title, learning_mode, status) values
  ('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000051', 1, 'Enrollment Course v1', 'self_paced', 'published');
insert into public.course_grants(organization_id, course_version_id, granted_by)
values ('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000053');
insert into public.offerings(id, organization_id, course_version_id, title, capacity, enrollment_policy, status)
values ('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000051', 'Limited', 1, 'self_enroll', 'published');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000051', true);
select lives_ok($$select public.enroll_member('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000051')$$, 'first student can enroll');
select is((select count(*)::int from public.enrollments), 1, 'one enrollment created');
select lives_ok($$select public.enroll_member('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000051')$$, 'retry is idempotent');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000052', true);
select throws_ok($$select public.enroll_member('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000052')$$, 'OFFERING_FULL', 'capacity blocks second student');
select is((select count(*)::int from public.enrollments), 1, 'capacity was not exceeded');
update public.offerings set mandatory = true where id = '00000000-0000-0000-0000-000000000051';
select is((select mandatory_snapshot from public.enrollments limit 1), false, 'enrollment keeps the original rule snapshot');
update public.offerings set status = 'retired' where id = '00000000-0000-0000-0000-000000000051';
select throws_ok($$select public.enroll_member('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000051')$$, 'OFFERING_UNAVAILABLE', 'retired offering blocks new enrollment');
select * from finish();
rollback;

