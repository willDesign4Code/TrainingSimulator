-- Fix infinite recursion in users table RLS policies
-- The issue: policies were querying the users table to check roles, creating infinite recursion
-- The solution: use a security definer function that bypasses RLS

-- Step 1: Drop all existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admins and managers can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can update user profiles" ON users;
DROP POLICY IF EXISTS "Users can be created during signup" ON users;
DROP POLICY IF EXISTS "Admins can create users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Step 2: Create a security definer function to check user role
-- This function bypasses RLS when checking the role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

-- Step 3: Create new policies using the security definer function

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Admins and managers can view all profiles
CREATE POLICY "Admins and managers can view all profiles"
ON users
FOR SELECT
TO authenticated
USING (public.get_user_role() IN ('admin', 'manager'));

-- Policy 3: Users can update their own profile (but not their role)
CREATE POLICY "Users can update their own profile"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role::TEXT = public.get_user_role() -- Prevent role escalation
);

-- Policy 4: Admins can update any user profile including roles
CREATE POLICY "Admins can update user profiles"
ON users
FOR UPDATE
TO authenticated
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

-- Policy 5: Allow users to create their own profile during signup
CREATE POLICY "Users can be created during signup"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 6: Admins can insert new users
CREATE POLICY "Admins can create users"
ON users
FOR INSERT
TO authenticated
WITH CHECK (public.get_user_role() = 'admin');

-- Policy 7: Admins can delete users
CREATE POLICY "Admins can delete users"
ON users
FOR DELETE
TO authenticated
USING (public.get_user_role() = 'admin');

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
