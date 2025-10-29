-- =====================================================
-- Category Visibility Row Level Security (RLS) Setup
-- =====================================================
-- This script sets up proper RLS policies for category visibility
--
-- Rules:
-- 1. Public categories (is_public = true): visible to all authenticated users
-- 2. Private categories (is_public = false): only visible to the creator
-- 3. Users can only create/update/delete their own categories
--
-- Run this script in your Supabase SQL Editor
-- =====================================================

-- First, ensure created_by column exists and has proper defaults
-- (This may already exist, but we'll make sure it's set up correctly)
DO $$
BEGIN
    -- Add created_by column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'categories' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE categories
        ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE;

        RAISE NOTICE 'Added created_by column to categories table';
    END IF;
END $$;

-- Update existing categories without created_by to use the first admin user
-- This is a one-time migration for existing data
UPDATE categories
SET created_by = (
    SELECT id FROM users
    WHERE role = 'admin'
    LIMIT 1
)
WHERE created_by IS NULL;

-- Make created_by NOT NULL after migration
ALTER TABLE categories
ALTER COLUMN created_by SET NOT NULL;

RAISE NOTICE 'Updated existing categories with created_by field';

-- =====================================================
-- Enable Row Level Security on categories table
-- =====================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Drop existing policies if they exist
-- (to avoid conflicts when re-running this script)
-- =====================================================

DROP POLICY IF EXISTS "Users can view public categories" ON categories;
DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
DROP POLICY IF EXISTS "Users can create categories" ON categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;

-- =====================================================
-- CREATE RLS POLICIES
-- =====================================================

-- Policy 1: Allow authenticated users to view public categories
CREATE POLICY "Users can view public categories"
ON categories
FOR SELECT
TO authenticated
USING (is_public = true);

-- Policy 2: Allow users to view their own private categories
CREATE POLICY "Users can view their own categories"
ON categories
FOR SELECT
TO authenticated
USING (created_by = auth.uid());

-- Policy 3: Allow authenticated users to create categories
-- The created_by field must match their user ID
CREATE POLICY "Users can create categories"
ON categories
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Policy 4: Allow users to update only their own categories
CREATE POLICY "Users can update their own categories"
ON categories
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Policy 5: Allow users to delete only their own categories
CREATE POLICY "Users can delete their own categories"
ON categories
FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- =====================================================
-- Optional: Create indexes for better query performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_categories_created_by
ON categories(created_by);

CREATE INDEX IF NOT EXISTS idx_categories_is_public
ON categories(is_public);

CREATE INDEX IF NOT EXISTS idx_categories_visibility
ON categories(is_public, created_by);

-- =====================================================
-- Verification Query
-- =====================================================

-- Run this to verify the policies were created:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'categories';

RAISE NOTICE 'Category visibility RLS policies have been successfully set up!';
RAISE NOTICE 'Public categories are now visible to all authenticated users';
RAISE NOTICE 'Private categories are only visible to their creators';
