-- Enable Row Level Security on scenarios table
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scenarios_created_by ON scenarios(created_by);
CREATE INDEX IF NOT EXISTS idx_scenarios_is_public ON scenarios(is_public);
CREATE INDEX IF NOT EXISTS idx_scenarios_visibility ON scenarios(is_public, created_by);
CREATE INDEX IF NOT EXISTS idx_scenarios_topic_id ON scenarios(topic_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_persona_id ON scenarios(persona_id);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view public scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can view their own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can view scenarios for assigned topics" ON scenarios;
DROP POLICY IF EXISTS "Users can view scenarios for assigned content" ON scenarios;
DROP POLICY IF EXISTS "Users can create scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can update their own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can delete their own scenarios" ON scenarios;

-- Policy 1: Users can view public scenarios
CREATE POLICY "Users can view public scenarios"
ON scenarios
FOR SELECT
TO authenticated
USING (is_public = true);

-- Policy 2: Users can view their own scenarios (regardless of is_public status)
CREATE POLICY "Users can view their own scenarios"
ON scenarios
FOR SELECT
TO authenticated
USING (created_by = auth.uid());

-- Policy 3: Users can view scenarios for topics/categories assigned to them
-- This allows employees to see scenarios even if private, if they've been assigned
CREATE POLICY "Users can view scenarios for assigned content"
ON scenarios
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM content_assignments
    WHERE (
      -- Assigned to this specific scenario
      (content_type = 'scenario' AND content_id = scenarios.id)
      OR
      -- Assigned to the topic containing this scenario
      (content_type = 'topic' AND content_id = scenarios.topic_id)
      OR
      -- Assigned to the category containing this scenario's topic
      (content_type = 'category' AND content_id = (
        SELECT category_id FROM topics WHERE id = scenarios.topic_id
      ))
    )
    AND (
      -- User is individually assigned
      (assigned_to_type = 'user' AND assigned_to_id::uuid = auth.uid())
      OR
      -- User is in the assigned_users array
      auth.uid() = ANY(assigned_users::uuid[])
    )
  )
);

-- Policy 4: Users can create scenarios (and must set themselves as creator)
CREATE POLICY "Users can create scenarios"
ON scenarios
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Policy 5: Users can update their own scenarios
CREATE POLICY "Users can update their own scenarios"
ON scenarios
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Policy 6: Users can delete their own scenarios
CREATE POLICY "Users can delete their own scenarios"
ON scenarios
FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'scenarios'
ORDER BY policyname;
