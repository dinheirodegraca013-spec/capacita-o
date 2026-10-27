begin;
select plan(9);

select has_table('public'::name, 'audit_events'::name);
select has_column('public'::name, 'audit_events'::name, 'organization_id'::name, 'audit organization column');
select has_column('public'::name, 'audit_events'::name, 'outcome'::name, 'audit outcome column');
select has_column('public'::name, 'audit_events'::name, 'metadata'::name, 'audit metadata column');
select ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'audit_events' and policyname = 'audit_events_select_member'), 'audit select policy exists');

insert into auth.users(id) values ('00000000-0000-0000-0000-000000000011');
insert into public.organizations(id, name, slug, kind) values ('10000000-0000-0000-0000-000000000011', 'Audit Org', 'audit-org', 'company');
insert into public.memberships(id, user_id, organization_id, status) values ('20000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000011', 'active');
insert into public.audit_events(id, organization_id, actor_user_id, actor_membership_id, action, resource_type, resource_id, outcome, metadata)
values ('30000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000011', 'organization.updated', 'organization', '10000000-0000-0000-0000-000000000011', 'success', '{}'::jsonb);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000011';
select is((select count(*)::integer from public.audit_events), 1, 'member reads own organization audit');
select throws_ok($$insert into public.audit_events(organization_id, action, resource_type, outcome) values ('10000000-0000-0000-0000-000000000011', 'fake', 'fake', 'success')$$, 42501, null, 'direct audit insert is denied');
select throws_ok($$update public.audit_events set outcome = 'failure'$$, 42501, null, 'direct audit update is denied');
select throws_ok($$delete from public.audit_events$$, 42501, null, 'direct audit delete is denied');

select * from finish();
rollback;
