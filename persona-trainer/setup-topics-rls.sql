-- Enable Row Level Security on topics table
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_topics_created_by ON topics(created_by);
CREATE INDEX IF NOT EXISTS idx_topics_is_public ON topics(is_public);
CREATE INDEX IF NOT EXISTS idx_topics_visibility ON topics(is_public, created_by);
CREATE INDEX IF NOT EXISTS idx_topics_category_id ON topics(category_id);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view public topics" ON topics;
DROP POLICY IF EXISTS "Users can view their own topics" ON topics;
DROP POLICY IF EXISTS "Users can create topics" ON topics;
DROP POLICY IF EXISTS "Users can update their own topics" ON topics;
DROP POLICY IF EXISTS "Users can delete their own topics" ON topics;

-- Policy 1: Users can view public topics
CREATE POLICY "Users can view public topics"
ON topics
FOR SELECT
TO authenticated
USING (is_public = true);

-- Policy 2: Users can view their own topics (regardless of is_public status)
CREATE POLICY "Users can view their own topics"
ON topics
FOR SELECT
TO authenticated
USING (created_by = auth.uid());

-- Policy 3: Users can create topics (and must set themselves as creator)
-- Topics inherit the category's visibility by default, but this is enforced at app level
CREATE POLICY "Users can create topics"
ON topics
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Policy 4: Users can update their own topics
CREATE POLICY "Users can update their own topics"
ON topics
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Policy 5: Users can delete their own topics
CREATE POLICY "Users can delete their own topics"
ON topics
FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'topics'
ORDER BY policyname;
