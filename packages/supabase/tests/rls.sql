\echo Running row isolation and privileged-write checks
create function public.test_assert(ok boolean, label text) returns void language plpgsql as $$
begin
  if ok is distinct from true then raise exception 'FAILED: %', label; end if;
end $$;
create function public.test_denied(statement text) returns boolean language plpgsql as $$
begin
  execute statement;
  return false;
exception when insufficient_privilege then return true;
end $$;

insert into auth.users(id, email) values
 ('11111111-1111-4111-8111-111111111111', 'alice@example.test'),
 ('22222222-2222-4222-8222-222222222222', 'bob@example.test');
select test_assert((select count(*) = 2 from public.profiles), 'signup creates profiles');
insert into public.world_progress(user_id, world_id, module_id, lesson_id, status) values
 ('11111111-1111-4111-8111-111111111111', 'deep-orbit', 'foundations', 'first', 'completed'),
 ('22222222-2222-4222-8222-222222222222', 'deep-orbit', 'foundations', 'first', 'completed');
insert into public.review_queue(user_id, world_id, module_id, lesson_id, next_review_at) values
 ('11111111-1111-4111-8111-111111111111', 'deep-orbit', 'foundations', 'first', now()),
 ('22222222-2222-4222-8222-222222222222', 'deep-orbit', 'foundations', 'first', now());
insert into public.purchases(user_id, plan_id, world_ids, amount, status) values
 ('11111111-1111-4111-8111-111111111111', 'single', '{deep-orbit}', 50, 'completed'),
 ('22222222-2222-4222-8222-222222222222', 'single', '{deep-orbit}', 50, 'completed');
insert into public.arena_submissions(user_id, challenge_id, score) values
 ('11111111-1111-4111-8111-111111111111', 'test', 100),
 ('22222222-2222-4222-8222-222222222222', 'test', 100);

set role anon;
select test_assert((select count(*) = 0 from profiles), 'anonymous profiles hidden');
select test_assert((select count(*) = 0 from world_progress), 'anonymous progress hidden');
select test_assert((select count(*) = 0 from review_queue), 'anonymous reviews hidden');
select test_assert((select count(*) = 0 from purchases), 'anonymous purchases hidden');
select test_assert(test_denied($q$insert into review_queue(user_id, world_id, module_id, lesson_id, next_review_at) values ('11111111-1111-4111-8111-111111111111', 'deep-orbit', 'foundations', 'forged', now())$q$), 'anonymous review insert denied');
select test_assert(not has_table_privilege('anon', 'dashboard_stats', 'select'), 'dashboard aggregate inaccessible');
reset role;

set role authenticated;
set request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
set request.jwt.claim.role = 'authenticated';
select test_assert((select count(*) = 1 from profiles), 'own profile only');
select test_assert((select count(*) = 1 from world_progress), 'own progress only');
select test_assert((select count(*) = 1 from review_queue), 'own reviews only');
select test_assert((select count(*) = 1 from purchases), 'own purchases only');
select test_assert((select count(*) = 1 from arena_submissions), 'own arena rows only');
select test_assert((select count(*) = 1 from world_progress_summary), 'summary view honors RLS');
update profiles set role = 'admin', stripe_customer_id = 'cus_forged', display_name = 'Alice' where id = auth.uid();
select test_assert((select role = 'user' and stripe_customer_id is null and display_name = 'Alice' from profiles), 'profile editing cannot grant admin or billing ownership');
with changed as (update world_progress set score = 99 where user_id = '22222222-2222-4222-8222-222222222222' returning *) select test_assert(count(*) = 0, 'cannot update another learner progress') from changed;
select test_assert(test_denied($q$insert into review_queue(user_id, world_id, module_id, lesson_id, next_review_at) values ('22222222-2222-4222-8222-222222222222', 'deep-orbit', 'foundations', 'forged', now())$q$), 'cross-user review insert denied');
select test_assert(test_denied($q$update review_queue set user_id = '22222222-2222-4222-8222-222222222222' where user_id = auth.uid()$q$), 'cannot transfer review ownership');
insert into review_queue(user_id, world_id, module_id, lesson_id, prompt_index, next_review_at) values (auth.uid(), 'deep-orbit', 'foundations', 'second', 2, '2030-01-01');
insert into review_queue(user_id, world_id, module_id, lesson_id, prompt_index, next_review_at) values (auth.uid(), 'deep-orbit', 'foundations', 'second', 2, '2040-01-01') on conflict (user_id, world_id, lesson_id, prompt_index) do nothing;
select test_assert((select next_review_at = '2030-01-01'::timestamptz from review_queue where lesson_id = 'second'), 'enqueue preserves schedule on conflict');
update review_queue set pulls = 1, successes = 1 where lesson_id = 'second';
select test_assert((select pulls = 1 from review_queue where lesson_id = 'second'), 'own review update allowed');
select test_assert(test_denied($q$insert into purchases(user_id, plan_id, amount) values (auth.uid(), 'single', 0)$q$), 'cannot forge a purchase');
select test_assert(test_denied($q$insert into arena_submissions(user_id, challenge_id, score) values (auth.uid(), 'forged', 100)$q$), 'cannot forge arena score');
with changed as (update purchases set status = 'completed' returning *) select test_assert(count(*) = 0, 'cannot edit purchase') from changed;
with changed as (delete from review_queue returning *) select test_assert(count(*) = 0, 'client cannot delete reviews') from changed;
reset role;

set role service_role;
set request.jwt.claim.role = 'service_role';
select test_assert((select count(*) = 2 from purchases), 'service role can process all purchases');
update profiles set stripe_customer_id = 'cus_test', role = 'admin' where id = '11111111-1111-4111-8111-111111111111';
select test_assert((select stripe_customer_id = 'cus_test' and role = 'admin' from profiles where id = '11111111-1111-4111-8111-111111111111'), 'server can update protected fields');
reset role;
