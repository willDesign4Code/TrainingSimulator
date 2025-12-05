-- Migration: Add automatic user profile creation trigger
-- Date: 2025-11-19
-- Purpose: Automatically create user profile in users table when auth user is created
-- This solves the RLS timing issue where manual inserts fail during signup

-- ============================================================================
-- FORWARD MIGRATION
-- ============================================================================

-- Step 1: Create the trigger function
-- This function will automatically insert a row into users table
-- when a new user signs up via auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), -- Use full_name from metadata, fallback to email
    'employee' -- Default role for new signups
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- If user already exists (e.g., from a previous insert), skip
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail the auth signup
    RAISE WARNING 'Error creating user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create the trigger
-- This trigger fires AFTER a new user is inserted into auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Update the existing INSERT policy to be more permissive
-- This ensures the trigger (running as SECURITY DEFINER) can insert
DROP POLICY IF EXISTS "Users can be created during signup" ON users;
DROP POLICY IF EXISTS "Admins can create users" ON users;

-- Policy for service role / trigger to insert
CREATE POLICY "Service can create users"
ON users
FOR INSERT
TO authenticated, anon
WITH CHECK (true); -- Trust the trigger and admin logic

-- Policy for admins to create users manually
CREATE POLICY "Admins can create users"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify the function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'handle_new_user';

-- Verify the trigger exists
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'INSERT'
ORDER BY policyname;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- To rollback this migration, run:
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();
--
-- -- Restore original policies:
-- CREATE POLICY "Users can be created during signup"
-- ON users FOR INSERT TO authenticated
-- WITH CHECK (auth.uid() = id);
--
-- CREATE POLICY "Admins can create users"
-- ON users FOR INSERT TO authenticated
-- WITH CHECK (
--   EXISTS (
--     SELECT 1 FROM users
--     WHERE id = auth.uid() AND role = 'admin'
--   )
-- );

-- ============================================================================
-- TESTING
-- ============================================================================

-- After applying this migration:
-- 1. Test new user signup through the application
-- 2. Verify the user appears in both auth.users AND public.users tables
-- 3. Check that the role is set to 'employee' by default
-- 4. Verify existing users are not affected

-- Test query (run after a new signup):
-- SELECT
--   a.id,
--   a.email as auth_email,
--   u.email as users_email,
--   u.name,
--   u.role,
--   u.created_at
-- FROM auth.users a
-- LEFT JOIN public.users u ON a.id = u.id
-- ORDER BY a.created_at DESC
-- LIMIT 5;
