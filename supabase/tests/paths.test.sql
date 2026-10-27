begin;
select plan(6);
select has_table('public', 'learning_paths', 'learning paths table should exist');
select has_table('public', 'path_items', 'path items table should exist');
select has_function('public', 'prevent_path_item_cycle', array[]::text[], 'path cycle trigger function exists');
select ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'learning_paths' and policyname = 'learning_paths_select_member'), 'path visibility is tenant scoped');

insert into auth.users(id) values ('00000000-0000-0000-0000-000000000071'), ('00000000-0000-0000-0000-000000000072');
insert into public.organizations(id, name, slug, kind) values ('00000000-0000-0000-0000-000000000071', 'Path Org', 'path-org', 'company');
insert into public.memberships(id, user_id, organization_id, status) values ('00000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000071', 'active');
insert into public.membership_roles(membership_id, role) values ('00000000-0000-0000-0000-000000000071', 'manager');
insert into public.learning_paths(id, organization_id, title, status) values ('00000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000071', 'Onboarding', 'draft');
insert into public.path_items(id, path_id, position, title) values ('00000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000071', 0, 'Primeira etapa');
select lives_ok($$insert into public.path_items(id, path_id, position, title, prerequisite_item_id) values ('00000000-0000-0000-0000-000000000072', '00000000-0000-0000-0000-000000000071', 1, 'Segunda etapa', '00000000-0000-0000-0000-000000000071')$$, 'valid prerequisite is accepted');
select throws_ok($$update public.path_items set prerequisite_item_id = id where id = '00000000-0000-0000-0000-000000000071'$$, 'PATH_CYCLE', 'self cycle is rejected');
select * from finish();
rollback;
