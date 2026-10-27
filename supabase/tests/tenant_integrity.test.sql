begin;
select plan(7);

select ok(exists (select 1 from pg_constraint where conname = 'class_groups_offering_tenant_fkey'), 'class groups enforce offering tenant');
select ok(exists (select 1 from pg_constraint where conname = 'instructor_assignments_class_tenant_fkey'), 'instructor assignments enforce class tenant');
select ok(exists (select 1 from pg_constraint where conname = 'instructor_assignments_membership_tenant_fkey'), 'instructor assignments enforce membership tenant');
select ok(exists (select 1 from pg_constraint where conname = 'meetings_class_tenant_fkey'), 'meetings enforce class tenant');
select ok(pg_get_functiondef('public.confirm_attendance(uuid,text)'::regprocedure) like '%e.status = ''active''%', 'attendance rejects inactive enrollment');
select ok(pg_get_functiondef('public.can_access_course_version(uuid,uuid)'::regprocedure) like '%course_grants%', 'central access requires an active grant');
select ok(pg_get_functiondef('public.publish_offering(uuid)'::regprocedure) like '%owner_type = ''organization''%', 'own course publication remains tenant scoped');

select * from finish();
rollback;

