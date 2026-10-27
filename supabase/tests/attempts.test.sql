begin;
select plan(14);
select has_table('public', 'assessment_attempts', 'attempts table should exist');
select has_table('public', 'attempt_answers', 'answers table should exist');
select has_function('public', 'start_attempt', array['uuid','uuid'], 'start attempt is server controlled');
select has_function('public', 'save_attempt_answer', array['uuid','uuid','uuid'], 'answer belongs to question');
select has_function('public', 'finish_attempt', array['uuid'], 'finish attempt is atomic');

insert into auth.users(id) values ('00000000-0000-0000-0000-000000000091');
insert into public.organizations(id, name, slug, kind) values ('00000000-0000-0000-0000-000000000091', 'Attempt Org', 'attempt-org', 'company');
insert into public.memberships(id, user_id, organization_id, status) values ('00000000-0000-0000-0000-000000000091', '00000000-0000-0000-0000-000000000091', '00000000-0000-0000-0000-000000000091', 'active');
insert into public.courses(id, organization_id, owner_type, title, slug, status) values ('00000000-0000-0000-0000-000000000091', '00000000-0000-0000-0000-000000000091', 'organization', 'Attempt Course', 'attempt-course', 'published');
insert into public.course_versions(id, course_id, version_no, title, learning_mode, status) values ('00000000-0000-0000-0000-000000000091', '00000000-0000-0000-0000-000000000091', 1, 'Attempt v1', 'self_paced', 'published');
insert into public.course_grants(organization_id, course_version_id, granted_by) values ('00000000-0000-0000-0000-000000000091', '00000000-0000-0000-0000-000000000091', '00000000-0000-0000-0000-000000000091');
insert into public.offerings(id, organization_id, course_version_id, title, enrollment_policy, status) values ('00000000-0000-0000-0000-000000000091', '00000000-0000-0000-0000-000000000091', '00000000-0000-0000-0000-000000000091', 'Attempt Offer', 'self_enroll', 'published');
select public.enroll_member('00000000-0000-0000-0000-000000000091', '00000000-0000-0000-0000-000000000091') as enrollment_id \gset
insert into public.assessments(id, course_version_id, title, passing_score, max_attempts, status) values ('00000000-0000-0000-0000-000000000091', '00000000-0000-0000-0000-000000000091', 'Quiz', 70, 1, 'published');
insert into public.assessment_questions(id, assessment_id, position, prompt, points) values ('00000000-0000-0000-0000-000000000091', '00000000-0000-0000-0000-000000000091', 0, 'Q?', 1);
insert into public.question_options(id, question_id, position, label, is_correct) values ('00000000-0000-0000-0000-000000000091', '00000000-0000-0000-0000-000000000091', 0, 'Correct', true), ('00000000-0000-0000-0000-000000000092', '00000000-0000-0000-0000-000000000091', 1, 'Wrong', false);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000091', true);
select public.start_attempt(:'enrollment_id', '00000000-0000-0000-0000-000000000091') as attempt_id \gset
select lives_ok(format($$select public.save_attempt_answer('%s', '00000000-0000-0000-0000-000000000091', '00000000-0000-0000-0000-000000000091')$$, :'attempt_id'), 'valid answer is saved');
select lives_ok(format($$select public.save_attempt_answer('%s', '00000000-0000-0000-0000-000000000091', '00000000-0000-0000-0000-000000000091')$$, :'attempt_id'), 'repeated answer is idempotent');
select throws_ok(format($$select public.save_attempt_answer('%s', '00000000-0000-0000-0000-000000000092', '00000000-0000-0000-0000-000000000091')$$, :'attempt_id'), 'QUESTION_FORBIDDEN', 'question from another assessment is rejected');
select throws_ok(format($$select public.start_attempt('%s', '00000000-0000-0000-0000-000000000091')$$, :'enrollment_id'), 'ATTEMPT_LIMIT', 'attempt limit is enforced');
select lives_ok(format($$select public.finish_attempt('%s')$$, :'attempt_id'), 'finish is successful');
select is((public.finish_attempt(:'attempt_id')->>'passed')::boolean, true, 'finish retry returns same result');
select throws_ok(format($$select public.save_attempt_answer('%s', '00000000-0000-0000-0000-000000000091', '00000000-0000-0000-0000-000000000092')$$, :'attempt_id'), 'ATTEMPT_EXPIRED', 'submitted attempt cannot accept answers');
select is((select count(*) from public.attempt_answers where attempt_id = :'attempt_id'), 1::bigint, 'repeated answers do not duplicate rows');
select is((public.finish_attempt(:'attempt_id')->>'status'), 'submitted', 'finish remains idempotent after invalid retries');
select * from finish();
rollback;

