-- Set explicit roles for the two known accounts.
--
-- Migration 006 attempted `update profiles set role='admin' where email='amera.salah.89@gmail.com'`
-- but ran before that auth user existed, so it affected 0 rows. Re-asserting
-- here with explicit values for both accounts. Using `update` (not insert)
-- because migration 022 already created the profile rows.

update public.profiles set role = 'admin' where email = 'amera.salah.89@gmail.com';
update public.profiles set role = 'user'  where email = 'amira.salah.rahim@gmail.com';
