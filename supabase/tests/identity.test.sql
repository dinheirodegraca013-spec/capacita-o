begin;
select plan(14);

select has_table('public'::name, 'profiles'::name);
select has_table('public'::name, 'organizations'::name);
select has_table('public'::name, 'memberships'::name);
select has_table('public'::name, 'membership_roles'::name);
select has_table('public'::name, 'platform_admins'::name);
select ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'memberships' and policyname = 'memberships_select_own_or_same_org'), 'memberships select policy exists');
select ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'organizations' and policyname = 'organizations_select_member'), 'organizations select policy exists');
select has_function('public'::name, 'prevent_membership_org_change'::name);

insert into auth.users(id) values
  ('00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002');
insert into public.organizations(id, name, slug, kind) values
  ('10000000-0000-0000-0000-000000000001', 'Org A', 'org-a', 'company'),
  ('10000000-0000-0000-0000-000000000002', 'Org B', 'org-b', 'company');
insert into public.memberships(id, user_id, organization_id, status) values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'active'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'active'),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'revoked');

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
select is((select count(*)::integer from public.organizations), 1, 'user sees only the organization in the active membership');
select is((select count(*)::integer from public.organizations where id = '10000000-0000-0000-0000-000000000002'), 0, 'cross-tenant organization is hidden');
select is((select count(*)::integer from public.memberships where id = '20000000-0000-0000-0000-000000000003'), 0, 'inactive membership is hidden');
select throws_ok($$insert into public.organizations(name, slug, kind) values ('Cross tenant', 'cross-tenant', 'company')$$, 42501, null, 'cross-tenant insert is denied');
select throws_ok($$delete from public.organizations where id = '10000000-0000-0000-0000-000000000001'$$, 42501, null, 'cross-tenant delete is denied');
select throws_ok($$update public.memberships set organization_id = '10000000-0000-0000-0000-000000000002' where id = '20000000-0000-0000-0000-000000000001'$$, 42501, null, 'membership organization update is denied');

select * from finish();
rollback;
