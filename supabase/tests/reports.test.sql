begin;
select plan(7);
select has_function('public', 'get_organization_report', array['uuid','timestamptz','timestamptz'], 'organization report should exist');
select has_function('public', 'get_course_report', array['uuid','uuid'], 'course report should exist');
select ok(exists (select 1 from pg_proc where proname = 'get_organization_report'), 'report function is present');
insert into auth.users(id) values ('00000000-0000-0000-0000-000000000151');
insert into public.organizations(id, name, slug, kind) values ('00000000-0000-0000-0000-000000000151', 'Report Org', 'report-org', 'company');
insert into public.memberships(id, user_id, organization_id, status) values ('00000000-0000-0000-0000-000000000151', '00000000-0000-0000-0000-000000000151', '00000000-0000-0000-0000-000000000151', 'active');
insert into public.membership_roles(membership_id, role) values ('00000000-0000-0000-0000-000000000151', 'manager');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000151', true);
select is((public.get_organization_report('00000000-0000-0000-0000-000000000151', now() - interval '1 day', now())->>'enrolled')::integer, 0, 'empty report returns zero');
select is(jsonb_array_length(public.get_organization_report('00000000-0000-0000-0000-000000000151', now() - interval '1 day', now())->'byStatus'), 0, 'empty status breakdown returns zero rows');
select is(jsonb_array_length(public.get_organization_report('00000000-0000-0000-0000-000000000151', now() - interval '1 day', now())->'byCourse'), 0, 'empty course breakdown returns zero rows');
select is((public.get_course_report('00000000-0000-0000-0000-000000000151', '00000000-0000-0000-0000-000000000151')->>'enrolled')::integer, 0, 'empty course report returns zero');
select * from finish();
rollback;

