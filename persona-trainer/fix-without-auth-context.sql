-- ============================================================================
-- FIX MISSING DATA - WITHOUT AUTH CONTEXT
-- ============================================================================
-- Use this script if auth.uid() returns NULL in Supabase SQL Editor
-- This happens when running SQL as service role or without user context
-- ============================================================================

-- ============================================================================
-- STEP 1: Find your user ID
-- ============================================================================

-- Option A: Look at existing created_by values
SELECT DISTINCT
  'Existing User IDs' as source,
  created_by as user_id,
  (SELECT email FROM auth.users WHERE id = created_by) as email
FROM categories
WHERE created_by IS NOT NULL
LIMIT 5;

-- Option B: Look at auth.users table
SELECT
  'Auth Users' as source,
  id as user_id,
  email
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- STEP 2: Set your admin user ID here
-- ============================================================================

-- IMPORTANT: Replace 'YOUR-USER-ID-HERE' with your actual user ID from Step 1
-- Then uncomment and run the rest of the script

/*
DO $$
DECLARE
  admin_user_id uuid := 'YOUR-USER-ID-HERE';  -- CHANGE THIS!
BEGIN

  -- Make sure this user exists in users table with admin role
  INSERT INTO users (id, email, name, role, created_at)
  SELECT
    admin_user_id,
    (SELECT email FROM auth.users WHERE id = admin_user_id),
    (SELECT COALESCE(raw_user_meta_data->>'name', email) FROM auth.users WHERE id = admin_user_id),
    'admin',
    NOW()
  WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = admin_user_id)
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin';

  RAISE NOTICE 'User % set as admin', admin_user_id;

  -- Fix categories: set NULL created_by to admin_user_id
  UPDATE categories
  SET created_by = admin_user_id
  WHERE created_by IS NULL;

  RAISE NOTICE 'Fixed % categories', (SELECT COUNT(*) FROM categories WHERE created_by = admin_user_id);

  -- Fix categories: set NULL is_public to true
  UPDATE categories
  SET is_public = true
  WHERE is_public IS NULL;

  -- Fix topics
  UPDATE topics
  SET created_by = admin_user_id
  WHERE created_by IS NULL;

  UPDATE topics
  SET is_public = true
  WHERE is_public IS NULL;

  RAISE NOTICE 'Fixed % topics', (SELECT COUNT(*) FROM topics WHERE created_by = admin_user_id);

  -- Fix scenarios
  UPDATE scenarios
  SET created_by = admin_user_id
  WHERE created_by IS NULL;

  UPDATE scenarios
  SET is_public = true
  WHERE is_public IS NULL;

  RAISE NOTICE 'Fixed % scenarios', (SELECT COUNT(*) FROM scenarios WHERE created_by = admin_user_id);

  -- Fix personas
  UPDATE personas
  SET created_by = admin_user_id
  WHERE created_by IS NULL;

  UPDATE personas
  SET is_public = true
  WHERE is_public IS NULL;

  RAISE NOTICE 'Fixed % personas', (SELECT COUNT(*) FROM personas WHERE created_by = admin_user_id);

END $$;
*/

-- ============================================================================
-- STEP 3: Verification
-- ============================================================================

-- Check that data is now visible
SELECT
  'Summary' as check,
  (SELECT COUNT(*) FROM categories WHERE created_by IS NOT NULL) as categories_with_owner,
  (SELECT COUNT(*) FROM categories WHERE is_public = true) as public_categories,
  (SELECT COUNT(*) FROM topics WHERE created_by IS NOT NULL) as topics_with_owner,
  (SELECT COUNT(*) FROM scenarios WHERE created_by IS NOT NULL) as scenarios_with_owner,
  (SELECT COUNT(*) FROM personas WHERE created_by IS NOT NULL) as personas_with_owner;

-- Check admin users
SELECT
  'Admin Users' as check,
  id,
  email,
  name,
  role
FROM users
WHERE role = 'admin';

-- ============================================================================
-- ALTERNATIVE: Make ALL existing data public and owned by FIRST admin user
-- ============================================================================

-- If you just want to quickly fix everything without specifying a user ID:
/*
DO $$
DECLARE
  first_admin_id uuid;
BEGIN
  -- Find or create an admin user
  SELECT id INTO first_admin_id FROM users WHERE role = 'admin' LIMIT 1;

  IF first_admin_id IS NULL THEN
    -- Create admin from first auth user
    INSERT INTO users (id, email, name, role, created_at)
    SELECT
      id,
      email,
      COALESCE(raw_user_meta_data->>'name', email),
      'admin',
      NOW()
    FROM auth.users
    ORDER BY created_at
    LIMIT 1
    RETURNING id INTO first_admin_id;
  END IF;

  RAISE NOTICE 'Using admin user: %', first_admin_id;

  -- Fix all content
  UPDATE categories SET created_by = first_admin_id WHERE created_by IS NULL;
  UPDATE categories SET is_public = true WHERE is_public IS NULL;

  UPDATE topics SET created_by = first_admin_id WHERE created_by IS NULL;
  UPDATE topics SET is_public = true WHERE is_public IS NULL;

  UPDATE scenarios SET created_by = first_admin_id WHERE created_by IS NULL;
  UPDATE scenarios SET is_public = true WHERE is_public IS NULL;

  UPDATE personas SET created_by = first_admin_id WHERE created_by IS NULL;
  UPDATE personas SET is_public = true WHERE is_public IS NULL;

  RAISE NOTICE 'All content fixed!';
END $$;
*/

-- ============================================================================
-- Instructions
-- ============================================================================
-- 1. Run STEP 1 to find your user ID
-- 2. Copy your user ID (looks like: 12345678-1234-1234-1234-123456789abc)
-- 3. In STEP 2, replace 'YOUR-USER-ID-HERE' with your actual ID
-- 4. Uncomment the DO $$ block in STEP 2 (remove /* and */)
-- 5. Run the script
-- 6. Check STEP 3 verification results
--
-- OR use the ALTERNATIVE block to automatically use the first admin user
-- ============================================================================
