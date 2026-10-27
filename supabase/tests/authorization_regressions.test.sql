begin;
select plan(15);

select ok(exists (select 1 from pg_trigger where tgname = 'offerings_scope'), 'offering scope trigger exists');
select ok(pg_get_functiondef('public.enroll_member(uuid,uuid)'::regprocedure) like '%manager_assigned%', 'enrollment policy is enforced inside RPC');
select ok(pg_get_functiondef('public.evaluate_completion(uuid)'::regprocedure) like '%m.status = ''active''%', 'completion requires active membership');
select ok(pg_get_functiondef('public.start_attempt(uuid,uuid)'::regprocedure) like '%m.status = ''active''%', 'assessment start requires active membership');
select ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'course_versions' and policyname = 'versions_select_scoped'), 'course version policy is scoped');
select ok((select qual from pg_policies where schemaname = 'public' and tablename = 'courses' and policyname = 'courses_select_scoped') like '%can_access_course_metadata%', 'central course metadata requires a granted version');
select ok(pg_get_functiondef('public.can_access_course_version(uuid,uuid)'::regprocedure) like '%course_grants%', 'central content requires an active grant');
select ok(pg_get_functiondef('public.publish_offering(uuid)'::regprocedure) like '%owner_type = ''organization''%', 'organization-owned offerings do not require a central grant');
select ok(pg_get_functiondef('public.confirm_attendance(uuid,text)'::regprocedure) like '%m.status = ''active''%', 'attendance requires active membership');
select ok(pg_get_functiondef('public.save_attempt_answer(uuid,uuid,uuid)'::regprocedure) like '%e.status = ''active''%', 'answer saving requires active enrollment');
select ok(pg_get_functiondef('public.finish_attempt(uuid)'::regprocedure) like '%e.status = ''active''%', 'attempt finishing requires active enrollment');
select ok(pg_get_functiondef('public.get_attempt_delivery(uuid)'::regprocedure) like '%e.status = ''active''%', 'attempt delivery requires active enrollment');
select ok(exists (select 1 from pg_trigger where tgname = 'class_group_scope'), 'class group tenant scope trigger exists');
select ok(exists (select 1 from pg_trigger where tgname = 'meetings_scope'), 'meeting tenant scope trigger exists');

insert into auth.users(id) values ('00000000-0000-0000-0000-000000000181'), ('00000000-0000-0000-0000-000000000182');
insert into public.organizations(id, name, slug, kind) values ('00000000-0000-0000-0000-000000000181', 'Regression Org', 'regression-org', 'company');
insert into public.memberships(id, user_id, organization_id, status) values ('00000000-0000-0000-0000-000000000181', '00000000-0000-0000-0000-000000000181', '00000000-0000-0000-0000-000000000181', 'active'), ('00000000-0000-0000-0000-000000000182', '00000000-0000-0000-0000-000000000182', '00000000-0000-0000-0000-000000000181', 'active');
insert into public.membership_roles(membership_id, role) values ('00000000-0000-0000-0000-000000000181', 'manager');
insert into public.courses(id, organization_id, owner_type, title, slug, status) values ('00000000-0000-0000-0000-000000000181', '00000000-0000-0000-0000-000000000181', 'organization', 'Regression', 'regression', 'published');
insert into public.course_versions(id, course_id, version_no, title, learning_mode, status) values ('00000000-0000-0000-0000-000000000181', '00000000-0000-0000-0000-000000000181', 1, 'Regression', 'self_paced', 'published');
insert into public.offerings(id, organization_id, course_version_id, title, enrollment_policy, status) values ('00000000-0000-0000-0000-000000000181', '00000000-0000-0000-0000-000000000181', '00000000-0000-0000-0000-000000000181', 'Manager only', 'manager_assigned', 'published');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000182', true);
select throws_ok($$select public.enroll_member('00000000-0000-0000-0000-000000000181', '00000000-0000-0000-0000-000000000182')$$, 'MEMBERSHIP_FORBIDDEN', 'student cannot self-enroll in manager-assigned offering');
select * from finish();
rollback;

