begin;
select plan(6);
select ok(not has_function_privilege('anon', 'public.commit_people_import(uuid, jsonb, integer)', 'execute'), 'anon cannot execute import commit');
select ok(has_function_privilege('authenticated', 'public.commit_people_import(uuid, jsonb, integer)', 'execute'), 'authenticated can execute import commit');
select ok(not has_function_privilege('anon', 'public.commit_people_import(uuid, jsonb, integer, text)', 'execute'), 'anon cannot execute idempotent import commit');
select ok(has_function_privilege('authenticated', 'public.commit_people_import(uuid, jsonb, integer, text)', 'execute'), 'authenticated can execute idempotent import commit');
select ok(not has_function_privilege('anon', 'public.is_org_manager(uuid, uuid)', 'execute'), 'anonymous users cannot execute manager helper');
select ok(has_function_privilege('anon', 'public.verify_certificate(text)', 'execute'), 'public certificate verification remains available');
select * from finish();
rollback;

