-- Add missing fields to content_assignments table for assignment management

-- Add assignment_name column
ALTER TABLE content_assignments
ADD COLUMN IF NOT EXISTS assignment_name VARCHAR(255);

-- Add is_active column for controlling visibility
ALTER TABLE content_assignments
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;

-- Add assigned_users array column to store multiple user IDs
ALTER TABLE content_assignments
ADD COLUMN IF NOT EXISTS assigned_users UUID[] DEFAULT ARRAY[]::UUID[];

-- Create index on is_active for faster queries
CREATE INDEX IF NOT EXISTS idx_content_assignments_is_active
ON content_assignments(is_active);

-- Create index on assigned_users for user lookups
CREATE INDEX IF NOT EXISTS idx_content_assignments_assigned_users
ON content_assignments USING GIN(assigned_users);

-- Update existing records to have empty arrays if NULL
UPDATE content_assignments
SET assigned_users = ARRAY[]::UUID[]
WHERE assigned_users IS NULL;

-- Note: This migration adds three new columns to support the assignment management feature:
-- 1. assignment_name: A friendly name for the assignment
-- 2. is_active: Controls whether the assignment appears on user dashboards
-- 3. assigned_users: Array of user IDs who are assigned to this content
--
-- The existing columns (assigned_to_type, assigned_to_id) are kept for backward compatibility
-- but the new assigned_users array provides more flexibility for assigning to multiple users
