-- Add is_public column to personas table
ALTER TABLE personas ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_personas_created_by ON personas(created_by);
CREATE INDEX IF NOT EXISTS idx_personas_is_public ON personas(is_public);
CREATE INDEX IF NOT EXISTS idx_personas_visibility ON personas(is_public, created_by);

-- Enable Row Level Security on personas table
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view public personas" ON personas;
DROP POLICY IF EXISTS "Users can view their own personas" ON personas;
DROP POLICY IF EXISTS "Users can create personas" ON personas;
DROP POLICY IF EXISTS "Users can update their own personas" ON personas;
DROP POLICY IF EXISTS "Users can delete their own personas" ON personas;

-- Policy 1: Users can view public personas
CREATE POLICY "Users can view public personas"
ON personas
FOR SELECT
TO authenticated
USING (is_public = true);

-- Policy 2: Users can view their own personas (regardless of is_public status)
CREATE POLICY "Users can view their own personas"
ON personas
FOR SELECT
TO authenticated
USING (created_by = auth.uid());

-- Policy 3: Users can create personas (and must set themselves as creator)
CREATE POLICY "Users can create personas"
ON personas
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Policy 4: Users can update their own personas
CREATE POLICY "Users can update their own personas"
ON personas
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Policy 5: Users can delete their own personas
CREATE POLICY "Users can delete their own personas"
ON personas
FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'personas'
ORDER BY policyname;
