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
create function public.test_invalid(statement text) returns boolean language plpgsql as $$
begin
  execute statement;
  return false;
exception when raise_exception or check_violation then return true;
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
update profiles set ml_learning_route = 'challenge' where id = auth.uid();
select test_assert((select ml_learning_route = 'challenge' from profiles), 'own ML preference saves');
with changed as (update profiles set ml_learning_route = 'challenge' where id = '22222222-2222-4222-8222-222222222222' returning *)
  select test_assert(count(*) = 0, 'cannot overwrite another account ML preference') from changed;
do $$ begin
  begin
    update profiles set ml_learning_route = 'expert' where id = auth.uid();
    raise exception 'invalid route was accepted';
  exception when check_violation then null;
  end;
end $$;
update profiles set ml_learning_route = null where id = auth.uid();
select test_assert((select ml_learning_route is null from profiles), 'ML preference can be cleared');
select test_assert((select count(*) = 1 from world_progress), 'route choice adds no lesson credit');
select test_assert((select count(*) = 1 from purchases), 'route choice grants no purchase');
select test_assert(record_boss_beat_choice_versioned('deep-orbit', 'normalization', 'deep-orbit-foundations-7741-first-flag', 0, 'cooperate', 2, 100), 'versioned first choice saved');
select test_assert((select content_version = 2 and choice_index = 0 from get_boss_beat_choice_versioned('deep-orbit-foundations-7741-first-flag')), 'versioned read preserves meaning');
select test_assert((select count(*) = 0 from get_boss_beat_choice('deep-orbit-foundations-7741-first-flag')), 'old renderer cannot reinterpret version 2');
select test_assert(not record_boss_beat_choice('deep-orbit', 'normalization', 'deep-orbit-foundations-7741-first-flag', 3, 'dominant', 1), 'old writer cannot replace new choice');
select test_assert(test_invalid($q$select record_boss_beat_choice_versioned('deep-orbit', 'normalization', 'deep-orbit-foundations-7741-first-flag', 0, 'dominant', 2)$q$), 'choice label and index must match');
select test_assert(test_invalid($q$select record_boss_beat_choice_versioned('deep-orbit', 'normalization', 'deep-orbit-foundations-7741-first-flag', 0, 'cooperate', 99)$q$), 'unknown story version rejected');
select test_assert(test_invalid($q$select record_boss_beat_choice_versioned('deep-orbit', 'normalization', 'invented', 0, 'cooperate', 1)$q$), 'unknown story context rejected');
select test_assert(test_invalid($q$select record_boss_beat_choice_versioned('deep-orbit', 'launch', 'deep-orbit-launch-deploy-call', 0, 'cooperate', 2)$q$), 'unrevised beat cannot use version 2');
select test_assert(test_denied($q$insert into boss_beat_choices(user_id, world_id, lesson_id, beat_id, choice_index, choice_label) values(auth.uid(), 'deep-orbit', 'launch', 'forged', 0, 'cooperate')$q$), 'direct story insert cannot bypass validation');
set request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
select test_assert((select count(*) = 0 from get_boss_beat_choice_versioned('deep-orbit-foundations-7741-first-flag')), 'another account cannot read the story choice');
select test_assert(record_boss_beat_choice('deep-orbit', 'normalization', 'deep-orbit-foundations-7741-first-flag', 3, 'dominant', 20), 'old client can still save an original choice');
select test_assert((select content_version = 1 and choice_index = 3 from get_boss_beat_choice_versioned('deep-orbit-foundations-7741-first-flag')), 'new client can read original version');
set request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
select test_assert((select content_version = 2 and choice_index = 0 from get_boss_beat_choice_versioned('deep-orbit-foundations-7741-first-flag')), 'other account writes do not alter original choice');
do $$ declare item record; begin
  for item in select * from (values
    ('normal-vs-anomalous','deep-orbit-anomaly-7741-training-set',1),
    ('report-generation','deep-orbit-llm-cut-call',1),
    ('caching-strategies','deep-orbit-cache-policy',1),
    ('monitoring','deep-orbit-drift-response',2),
    ('launch','deep-orbit-launch-deploy-call',1)
  ) as catalog(lesson, beat, version) loop
    perform test_assert(record_boss_beat_choice_versioned('deep-orbit',item.lesson,item.beat,3,'dominant',item.version), 'each shipped decision context accepted');
    perform test_assert((select content_version = item.version from get_boss_beat_choice_versioned(item.beat)), 'each decision keeps its version');
  end loop;
end $$;
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
