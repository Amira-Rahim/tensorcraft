\echo Running analytics consent isolation and revision checks
set role authenticated;
set request.jwt.claim.role = 'authenticated';
set request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';

select test_assert((select count(*)=0 from analytics_consents), 'existing accounts receive no consent backfill');
select test_assert(test_invalid($q$select set_analytics_consent(null,0)$q$), 'null choice rejected');
select test_assert(test_invalid($q$select set_analytics_consent(true,null)$q$), 'null revision rejected');
select test_assert(test_invalid($q$select set_analytics_consent(false,-1)$q$), 'negative revision rejected');
select test_assert((select not granted and revision=0 and updated_at is null and not applied from set_analytics_consent(true,7)), 'stale first grant fails closed');
select test_assert((select count(*)=0 from analytics_consents), 'invalid or stale first grants create no row');
select test_assert((select granted and revision=1 and updated_at is not null and applied from set_analytics_consent(true,0)), 'first explicit grant persists');
select test_assert((select not granted and revision=2 and applied from set_analytics_consent(false,0)), 'withdrawal accepts an old revision');
select test_assert((select not granted and revision=2 and not applied from set_analytics_consent(true,1)), 'grant from before withdrawal cannot reenable');
select test_assert((select revision=2 and not granted from analytics_consents), 'stale grant leaves record unchanged');
select test_assert((select granted and revision=3 and applied from set_analytics_consent(true,2)), 'fresh grant can reenable');
select test_assert((select not granted and revision=4 and applied from set_analytics_consent(false,2)), 'later withdrawal defeats a stale revision');
select test_assert((select not granted and revision=5 and applied from set_analytics_consent(false,4)), 'repeated withdrawal still advances revision');
select test_assert(test_denied($q$update analytics_consents set granted=true$q$), 'direct update cannot bypass comparison');
select test_assert(test_denied($q$insert into analytics_consents(user_id,granted) values(auth.uid(),true)$q$), 'direct insert denied');
select test_assert(test_denied($q$delete from analytics_consents$q$), 'direct deletion cannot reset revision');

set request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
select test_assert((select count(*)=0 from analytics_consents), 'other account consent hidden');
select test_assert((select granted and revision=1 and applied from set_analytics_consent(true,0)), 'second account has independent revision');
select test_assert((select count(*)=1 and bool_and(user_id=auth.uid()) from analytics_consents), 'RPC can only change token account');
set request.jwt.claim.sub = '';
select test_assert(test_invalid($q$select set_analytics_consent(true,0)$q$), 'missing identity rejected');
reset role;

select test_assert(not has_table_privilege('anon','public.analytics_consents','SELECT'), 'anonymous table reads denied');
select test_assert(not has_table_privilege('authenticated','public.analytics_consents','INSERT,UPDATE,DELETE'), 'authenticated direct writes revoked');
select test_assert(not has_function_privilege('anon','public.set_analytics_consent(boolean,integer)','EXECUTE'), 'anonymous RPC access revoked');
select test_assert(not has_function_privilege('service_role','public.set_analytics_consent(boolean,integer)','EXECUTE'), 'unscoped service RPC access revoked');
select test_assert((select revision=5 and not granted from analytics_consents where user_id='11111111-1111-4111-8111-111111111111'), 'other account writes preserve withdrawal');

insert into auth.users(id,email) values('33333333-3333-4333-8333-333333333333','erase-consent@example.test');
set role authenticated;
set request.jwt.claim.sub = '33333333-3333-4333-8333-333333333333';
select test_assert((select not granted and revision=1 and applied from set_analytics_consent(false,9)), 'withdrawal of unknown consent persists');
reset role;
delete from auth.users where id='33333333-3333-4333-8333-333333333333';
select test_assert((select count(*)=0 from analytics_consents where user_id='33333333-3333-4333-8333-333333333333'), 'account erasure removes consent');
