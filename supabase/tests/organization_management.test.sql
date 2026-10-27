begin;
select plan(7);
select has_function('public'::name, 'is_org_manager'::name);
select ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'organizations' and policyname = 'organizations_update_manager'), 'organization manager update policy exists');
select ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'org_units' and policyname = 'org_units_insert_manager'), 'unit manager insert policy exists');

insert into auth.users(id) values ('00000000-0000-0000-0000-000000000021'), ('00000000-0000-0000-0000-000000000022');
insert into public.organizations(id, name, slug, kind) values ('10000000-0000-0000-0000-000000000021', 'Managed Org', 'managed-org', 'company'), ('10000000-0000-0000-0000-000000000022', 'Other Org', 'other-org', 'municipality');
insert into public.memberships(id, user_id, organization_id, status) values ('20000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000021', 'active'), ('20000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000022', 'active');
insert into public.membership_roles(membership_id, role) values ('20000000-0000-0000-0000-000000000021', 'manager'), ('20000000-0000-0000-0000-000000000022', 'student');

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000021';
update public.organizations set name = 'Managed Org Updated' where id = '10000000-0000-0000-0000-000000000021';
select is((select name from public.organizations where id = '10000000-0000-0000-0000-000000000021'), 'Managed Org Updated', 'manager can update own organization');
insert into public.org_units(organization_id, name) values ('10000000-0000-0000-0000-000000000021', 'Operations');
select is((select count(*)::integer from public.org_units where organization_id = '10000000-0000-0000-0000-000000000021'), 1, 'manager can create own unit');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000022';
update public.organizations set name = 'Cross tenant' where id = '10000000-0000-0000-0000-000000000021';
select ok((select name from public.organizations where id = '10000000-0000-0000-0000-000000000021') is null, 'student cannot read or update another organization');
select throws_ok($$insert into public.org_units(organization_id, name) values ('10000000-0000-0000-0000-000000000021', 'Forbidden')$$, 42501, null, 'student cannot create another organization unit');
select * from finish();
rollback;
