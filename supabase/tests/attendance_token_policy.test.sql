begin;
select plan(1);
select ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'attendance_tokens' and policyname = 'attendance_tokens_no_direct_access'), 'attendance tokens have an explicit deny policy');
select * from finish();
rollback;
