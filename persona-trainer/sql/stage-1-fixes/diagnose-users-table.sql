-- Step 1: Check if the user record exists (run as admin)
SELECT id, email, name, role FROM users WHERE id = 'd1cadd80-d37f-4098-9494-89e45195b214';

-- Step 2: Check if RLS is enabled on users table
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';

-- Step 3: Check what RLS policies exist on users table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users';

-- Step 4: Disable RLS on users table (THIS IS THE FIX)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 5: Verify RLS is now disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';
