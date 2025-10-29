-- Enable Row Level Security on rubrics table
ALTER TABLE rubrics ENABLE ROW LEVEL SECURITY;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rubrics_scenario_id ON rubrics(scenario_id);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view rubrics for scenarios they can access" ON rubrics;
DROP POLICY IF EXISTS "Users can view rubrics for assigned scenarios" ON rubrics;
DROP POLICY IF EXISTS "Scenario creators can manage rubrics" ON rubrics;
DROP POLICY IF EXISTS "Admins and managers can view all rubrics" ON rubrics;

-- Policy 1: Users can view rubrics for public scenarios
CREATE POLICY "Users can view rubrics for public scenarios"
ON rubrics
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM scenarios
    WHERE scenarios.id = rubrics.scenario_id
    AND scenarios.is_public = true
  )
);

-- Policy 2: Users can view rubrics for scenarios they created
CREATE POLICY "Users can view rubrics for their own scenarios"
ON rubrics
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM scenarios
    WHERE scenarios.id = rubrics.scenario_id
    AND scenarios.created_by = auth.uid()
  )
);

-- Policy 3: Users can view rubrics for scenarios assigned to them
CREATE POLICY "Users can view rubrics for assigned scenarios"
ON rubrics
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM scenarios
    JOIN content_assignments ON (
      (content_assignments.content_type = 'scenario' AND content_assignments.content_id = scenarios.id)
      OR (content_assignments.content_type = 'topic' AND content_assignments.content_id = scenarios.topic_id)
      OR (content_assignments.content_type = 'category' AND content_assignments.content_id = (
        SELECT category_id FROM topics WHERE id = scenarios.topic_id
      ))
    )
    WHERE scenarios.id = rubrics.scenario_id
    AND (
      (content_assignments.assigned_to_type = 'user' AND content_assignments.assigned_to_id::uuid = auth.uid())
      OR auth.uid() = ANY(content_assignments.assigned_users::uuid[])
    )
  )
);

-- Policy 4: Admins and managers can view all rubrics
CREATE POLICY "Admins and managers can view all rubrics"
ON rubrics
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'manager')
  )
);

-- Policy 5: Scenario creators can create rubrics for their scenarios
CREATE POLICY "Scenario creators can create rubrics"
ON rubrics
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM scenarios
    WHERE scenarios.id = rubrics.scenario_id
    AND scenarios.created_by = auth.uid()
  )
);

-- Policy 6: Admins and managers can create rubrics for any scenario
CREATE POLICY "Admins and managers can create rubrics"
ON rubrics
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'manager')
  )
);

-- Policy 7: Scenario creators can update rubrics for their scenarios
CREATE POLICY "Scenario creators can update rubrics"
ON rubrics
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM scenarios
    WHERE scenarios.id = rubrics.scenario_id
    AND scenarios.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM scenarios
    WHERE scenarios.id = rubrics.scenario_id
    AND scenarios.created_by = auth.uid()
  )
);

-- Policy 8: Admins and managers can update any rubrics
CREATE POLICY "Admins and managers can update rubrics"
ON rubrics
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'manager')
  )
);

-- Policy 9: Scenario creators can delete rubrics for their scenarios
CREATE POLICY "Scenario creators can delete rubrics"
ON rubrics
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM scenarios
    WHERE scenarios.id = rubrics.scenario_id
    AND scenarios.created_by = auth.uid()
  )
);

-- Policy 10: Admins and managers can delete any rubrics
CREATE POLICY "Admins and managers can delete rubrics"
ON rubrics
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'manager')
  )
);

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'rubrics'
ORDER BY policyname;
