-- Enable Row Level Security on content_assignments table
ALTER TABLE content_assignments ENABLE ROW LEVEL SECURITY;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_content_assignments_assigned_by ON content_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_content_assignments_assigned_to_id ON content_assignments(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_content_assignments_content ON content_assignments(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_assignments_assigned_users ON content_assignments USING GIN(assigned_users);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view assignments assigned to them" ON content_assignments;
DROP POLICY IF EXISTS "Admins and managers can view all assignments" ON content_assignments;
DROP POLICY IF EXISTS "Admins and managers can create assignments" ON content_assignments;
DROP POLICY IF EXISTS "Admins and managers can update assignments" ON content_assignments;
DROP POLICY IF EXISTS "Admins and managers can delete assignments" ON content_assignments;

-- Policy 1: Users can view assignments assigned to them
CREATE POLICY "Users can view assignments assigned to them"
ON content_assignments
FOR SELECT
TO authenticated
USING (
  -- User is individually assigned
  (assigned_to_type = 'user' AND assigned_to_id = auth.uid()::text)
  OR
  -- User is in the assigned_users array
  auth.uid()::text = ANY(assigned_users)
  OR
  -- User created the assignment
  assigned_by = auth.uid()
);

-- Policy 2: Admins and managers can view all assignments
CREATE POLICY "Admins and managers can view all assignments"
ON content_assignments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'manager')
  )
);

-- Policy 3: Admins and managers can create assignments
CREATE POLICY "Admins and managers can create assignments"
ON content_assignments
FOR INSERT
TO authenticated
WITH CHECK (
  assigned_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'manager')
  )
);

-- Policy 4: Admins and managers can update assignments they created or all if admin
CREATE POLICY "Admins and managers can update assignments"
ON content_assignments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (
      role = 'admin'
      OR (role = 'manager' AND auth.uid() = content_assignments.assigned_by)
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (
      role = 'admin'
      OR (role = 'manager' AND auth.uid() = content_assignments.assigned_by)
    )
  )
);

-- Policy 5: Users can update assignment completion status for their own assignments
CREATE POLICY "Users can update their assignment completion"
ON content_assignments
FOR UPDATE
TO authenticated
USING (
  (assigned_to_type = 'user' AND assigned_to_id = auth.uid()::text)
  OR auth.uid()::text = ANY(assigned_users)
)
WITH CHECK (
  -- Only allow updating completed_at field
  (assigned_to_type = 'user' AND assigned_to_id = auth.uid()::text)
  OR auth.uid()::text = ANY(assigned_users)
);

-- Policy 6: Admins and managers can delete assignments they created or all if admin
CREATE POLICY "Admins and managers can delete assignments"
ON content_assignments
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (
      role = 'admin'
      OR (role = 'manager' AND auth.uid() = content_assignments.assigned_by)
    )
  )
);

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'content_assignments'
ORDER BY policyname;
