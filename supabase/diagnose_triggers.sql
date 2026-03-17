-- 1. Check for triggers on the profiles/users tables
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles' OR event_object_table = 'users';

-- 2. Check for trigger functions containing 'subjects' or 'topics'
SELECT proname, prosrc 
FROM pg_proc 
WHERE prosrc ILIKE '%subjects%' OR prosrc ILIKE '%topics%';

-- 3. To DELETE all current user subjects immediately via SQL (similar to Reset Button):
-- DELETE FROM public.subjects WHERE user_id = 'YOUR_USER_ID_HERE';
