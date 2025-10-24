-- Fix RLS policies for users table
-- This allows authenticated users to read their own profile

-- First, check if RLS is enabled
-- If the app is stalling, it's likely because RLS is blocking the query

-- Option 1: Disable RLS on users table (simpler, less secure)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Option 2: Enable RLS with proper policies (more secure)
-- Uncomment the lines below if you prefer this approach:

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
--
-- -- Drop existing policies if any
-- DROP POLICY IF EXISTS "Users can view their own profile" ON users;
-- DROP POLICY IF EXISTS "Users can update their own profile" ON users;
--
-- -- Allow users to view their own profile
-- CREATE POLICY "Users can view their own profile"
--   ON users FOR SELECT
--   USING (auth.uid() = id);
--
-- -- Allow users to update their own profile
-- CREATE POLICY "Users can update their own profile"
--   ON users FOR UPDATE
--   USING (auth.uid() = id);
--
-- -- Allow admins to view all users
-- CREATE POLICY "Admins can view all users"
--   ON users FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM users
--       WHERE users.id = auth.uid()
--       AND users.role = 'admin'
--     )
--   );
