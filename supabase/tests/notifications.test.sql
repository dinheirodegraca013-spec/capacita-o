begin;
select plan(6);
select has_table('public', 'notification_outbox', 'notification outbox should exist');
select has_function('public', 'enqueue_notification', array['text','uuid','text','jsonb'], 'enqueue notification should be idempotent');
select ok(exists (select 1 from pg_constraint where conrelid = 'public.notification_outbox'::regclass and contype = 'u'), 'outbox has idempotency constraint');
select ok(has_function_privilege('authenticated', 'public.enqueue_notification(text,uuid,text,jsonb)', 'execute'), 'authenticated can enqueue notifications');
insert into auth.users(id) values ('00000000-0000-0000-0000-000000000151');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000151', true);
select lives_ok($$select public.enqueue_notification('welcome-151', '00000000-0000-0000-0000-000000000151', 'welcome', '{"name":"Aluno"}'::jsonb)$$, 'notification can be queued');
select is((select count(*)::int from public.notification_outbox where idempotency_key = 'welcome-151'), 1, 'retry does not duplicate notification');
select * from finish();
rollback;

