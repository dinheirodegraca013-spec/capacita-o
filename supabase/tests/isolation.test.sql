begin;
select plan(4);
insert into auth.users(id) values ('00000000-0000-0000-0000-000000000161'), ('00000000-0000-0000-0000-000000000162');
insert into public.organizations(id, name, slug, kind) values
 ('00000000-0000-0000-0000-000000000161', 'Tenant A', 'tenant-a', 'company'),
 ('00000000-0000-0000-0000-000000000162', 'Tenant B', 'tenant-b', 'company');
insert into public.memberships(id, user_id, organization_id, status) values
 ('00000000-0000-0000-0000-000000000161', '00000000-0000-0000-0000-000000000161', '00000000-0000-0000-0000-000000000161', 'active'),
 ('00000000-0000-0000-0000-000000000162', '00000000-0000-0000-0000-000000000162', '00000000-0000-0000-0000-000000000162', 'active');
insert into public.courses(id, organization_id, owner_type, title, slug, status) values
 ('00000000-0000-0000-0000-000000000161', '00000000-0000-0000-0000-000000000161', 'organization', 'A Course', 'a-course', 'published'),
 ('00000000-0000-0000-0000-000000000162', '00000000-0000-0000-0000-000000000162', 'organization', 'B Course', 'b-course', 'published');
insert into public.course_versions(id, course_id, version_no, title, learning_mode, status) values
 ('00000000-0000-0000-0000-000000000161', '00000000-0000-0000-0000-000000000161', 1, 'A v1', 'self_paced', 'published'),
 ('00000000-0000-0000-0000-000000000162', '00000000-0000-0000-0000-000000000162', 1, 'B v1', 'self_paced', 'published');
insert into public.offerings(id, organization_id, course_version_id, title, enrollment_policy, status) values
 ('00000000-0000-0000-0000-000000000161', '00000000-0000-0000-0000-000000000161', '00000000-0000-0000-0000-000000000161', 'A Offer', 'self_enroll', 'published'),
 ('00000000-0000-0000-0000-000000000162', '00000000-0000-0000-0000-000000000162', '00000000-0000-0000-0000-000000000162', 'B Offer', 'self_enroll', 'published');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000161', true);
set local role authenticated;
select is((select count(*)::int from public.offerings), 1, 'tenant A cannot see tenant B offering');
select is((select count(*)::int from public.courses), 1, 'tenant A cannot see tenant B course');
select is((select count(*)::int from public.organizations), 1, 'tenant A cannot see tenant B organization');
select is((select count(*)::int from public.enrollments), 0, 'tenant A cannot see tenant B enrollments');
select * from finish();
rollback;
