-- ============================================================================
-- QUICK FIX - Restore Missing Data After Enabling RLS
-- ============================================================================
-- This script fixes the most common issue: NULL created_by and is_public values
--
-- IMPORTANT: Review the diagnostic results first, then run appropriate fixes
-- ============================================================================

BEGIN;

-- ============================================================================
-- Option 1: Make ALL existing content public and owned by you
-- ============================================================================
-- This is the safest option - makes everything visible to everyone

-- Fix categories
UPDATE categories
SET
  created_by = COALESCE(created_by, auth.uid()),
  is_public = COALESCE(is_public, true)
WHERE created_by IS NULL OR is_public IS NULL;

-- Fix topics
UPDATE topics
SET
  created_by = COALESCE(created_by, auth.uid()),
  is_public = COALESCE(is_public, true)
WHERE created_by IS NULL OR is_public IS NULL;

-- Fix scenarios
UPDATE scenarios
SET
  created_by = COALESCE(created_by, auth.uid()),
  is_public = COALESCE(is_public, true)
WHERE created_by IS NULL OR is_public IS NULL;

-- Fix personas
UPDATE personas
SET
  created_by = COALESCE(created_by, auth.uid()),
  is_public = COALESCE(is_public, true)
WHERE created_by IS NULL OR is_public IS NULL;

-- ============================================================================
-- Option 2: Ensure you have admin role
-- ============================================================================

-- First, check if auth.uid() is working
DO $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE NOTICE 'WARNING: auth.uid() is NULL. You need to run Option 2A instead of Option 2.';
  ELSE
    RAISE NOTICE 'Your user ID is: %', auth.uid();
  END IF;
END $$;

-- Option 2A: If auth.uid() works, use this
-- Make sure your user exists and is admin
/*
INSERT INTO users (id, email, name, role, created_at)
VALUES (
  auth.uid(),
  (SELECT email FROM auth.users WHERE id = auth.uid()),
  (SELECT COALESCE(raw_user_meta_data->>'name', email) FROM auth.users WHERE id = auth.uid()),
  'admin',
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin';
*/

-- Option 2B: If auth.uid() returns NULL, use this instead
-- UNCOMMENT and replace 'YOUR-USER-ID-HERE' with your actual user ID
/*
-- First, find your user ID by looking at existing data:
SELECT DISTINCT created_by FROM categories WHERE created_by IS NOT NULL LIMIT 1;
-- Or check auth.users table:
SELECT id, email FROM auth.users;

-- Then update/insert with your actual user ID:
INSERT INTO users (id, email, name, role, created_at)
VALUES (
  'YOUR-USER-ID-HERE',  -- Replace with your actual UUID
  'your-email@example.com',
  'Your Name',
  'admin',
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin';
*/

-- ============================================================================
-- Verification
-- ============================================================================

SELECT
  'Fixed Records' as status,
  (SELECT COUNT(*) FROM categories WHERE created_by IS NOT NULL AND is_public IS NOT NULL) as categories_ok,
  (SELECT COUNT(*) FROM topics WHERE created_by IS NOT NULL AND is_public IS NOT NULL) as topics_ok,
  (SELECT COUNT(*) FROM scenarios WHERE created_by IS NOT NULL AND is_public IS NOT NULL) as scenarios_ok,
  (SELECT COUNT(*) FROM personas WHERE created_by IS NOT NULL AND is_public IS NOT NULL) as personas_ok,
  (SELECT role FROM users WHERE id = auth.uid()) as your_role;

COMMIT;

-- ============================================================================
-- Success! Your data should now be visible.
-- Refresh your application to see the changes.
-- ============================================================================
