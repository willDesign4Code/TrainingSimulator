-- ============================================================================
-- RLS DIAGNOSTICS - Find and Fix Data Access Issues
-- ============================================================================
-- Run this script to diagnose why data is not appearing after enabling RLS
-- ============================================================================

-- Step 1: Check your current user and role
-- ============================================================================
SELECT
  'Current User Info' as check_type,
  auth.uid() as your_user_id,
  u.email,
  u.name,
  u.role,
  u.department
FROM users u
WHERE u.id = auth.uid();

-- If the above returns NO ROWS, you don't have a user profile!
-- Create one with: INSERT INTO users (id, email, name, role) VALUES (auth.uid(), 'your-email', 'your-name', 'admin');

-- Step 2: Check RLS status on all tables
-- ============================================================================
SELECT
  'RLS Status' as check_type,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'categories', 'topics', 'scenarios', 'personas',
    'content_assignments', 'rubrics', 'training_sessions'
  )
ORDER BY tablename;

-- Step 3: Check categories - looking for NULL created_by
-- ============================================================================
SELECT
  'Categories Missing created_by' as check_type,
  COUNT(*) as count,
  array_agg(id) as category_ids
FROM categories
WHERE created_by IS NULL;

-- Step 4: Check categories - looking for NULL is_public
-- ============================================================================
SELECT
  'Categories Missing is_public' as check_type,
  COUNT(*) as count,
  array_agg(id) as category_ids
FROM categories
WHERE is_public IS NULL;

-- Step 5: Test category visibility with RLS DISABLED
-- ============================================================================
-- Temporarily disable RLS to see all categories
SET LOCAL rls.enabled = false;

SELECT
  'All Categories (RLS OFF)' as check_type,
  id,
  name,
  created_by,
  is_public,
  CASE
    WHEN created_by IS NULL THEN 'MISSING created_by!'
    WHEN is_public IS NULL THEN 'MISSING is_public!'
    ELSE 'OK'
  END as status
FROM categories
ORDER BY created_at DESC
LIMIT 10;

-- Re-enable RLS
SET LOCAL rls.enabled = true;

-- Step 6: Test category visibility with RLS ENABLED (as current user)
-- ============================================================================
SELECT
  'Categories You Can See (RLS ON)' as check_type,
  COUNT(*) as visible_count
FROM categories;

-- Show which ones you can see
SELECT
  'Your Visible Categories' as check_type,
  id,
  name,
  created_by,
  is_public,
  CASE
    WHEN created_by = auth.uid() THEN 'Yours'
    WHEN is_public = true THEN 'Public'
    ELSE 'Unknown reason'
  END as why_visible
FROM categories
LIMIT 10;

-- Step 7: Check content_assignments
-- ============================================================================
SELECT
  'Content Assignments' as check_type,
  COUNT(*) as total_assignments,
  COUNT(CASE WHEN assigned_to_id::uuid = auth.uid() THEN 1 END) as assigned_to_you,
  COUNT(CASE WHEN auth.uid()::text = ANY(assigned_users) THEN 1 END) as in_assigned_users_array,
  COUNT(CASE WHEN assigned_by::uuid = auth.uid() THEN 1 END) as created_by_you
FROM content_assignments;

-- Step 8: Check for type mismatch issues in content_assignments
-- ============================================================================
SELECT
  'Assignment Data Types' as check_type,
  id,
  assigned_to_id,
  assigned_by,
  assigned_users,
  -- Try to cast to UUID to see if they're valid
  CASE
    WHEN assigned_to_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN 'Valid UUID format'
    ELSE 'INVALID UUID format!'
  END as assigned_to_id_check,
  CASE
    WHEN assigned_by ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN 'Valid UUID format'
    ELSE 'INVALID UUID format!'
  END as assigned_by_check
FROM content_assignments
LIMIT 5;

-- ============================================================================
-- COMMON FIXES
-- ============================================================================

-- FIX 1: Set all NULL created_by to your user ID
-- ============================================================================
-- UNCOMMENT AND RUN IF Step 3 showed NULL values:
/*
UPDATE categories
SET created_by = auth.uid()
WHERE created_by IS NULL;

UPDATE topics
SET created_by = auth.uid()
WHERE created_by IS NULL;

UPDATE scenarios
SET created_by = auth.uid()
WHERE created_by IS NULL;

UPDATE personas
SET created_by = auth.uid()
WHERE created_by IS NULL;
*/

-- FIX 2: Set all NULL is_public to true (make everything public)
-- ============================================================================
-- UNCOMMENT AND RUN IF Step 4 showed NULL values:
/*
UPDATE categories SET is_public = true WHERE is_public IS NULL;
UPDATE topics SET is_public = true WHERE is_public IS NULL;
UPDATE scenarios SET is_public = true WHERE is_public IS NULL;
UPDATE personas SET is_public = true WHERE is_public IS NULL;
*/

-- FIX 3: Ensure your user has admin role
-- ============================================================================
-- UNCOMMENT AND RUN IF you should be admin but aren't:
/*
UPDATE users
SET role = 'admin'
WHERE id = auth.uid();
*/

-- FIX 4: Create user profile if missing
-- ============================================================================
-- UNCOMMENT AND RUN IF Step 1 returned no rows:
/*
INSERT INTO users (id, email, name, role, created_at)
VALUES (
  auth.uid(),
  'your-email@example.com',  -- CHANGE THIS
  'Your Name',                -- CHANGE THIS
  'admin',
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin';
*/

-- ============================================================================
-- VERIFICATION - Run after fixes
-- ============================================================================

-- Check if fixes worked
SELECT
  'Verification' as check_type,
  (SELECT COUNT(*) FROM categories WHERE created_by IS NULL) as categories_missing_created_by,
  (SELECT COUNT(*) FROM categories WHERE is_public IS NULL) as categories_missing_is_public,
  (SELECT COUNT(*) FROM categories) as total_categories_visible,
  (SELECT role FROM users WHERE id = auth.uid()) as your_role;
