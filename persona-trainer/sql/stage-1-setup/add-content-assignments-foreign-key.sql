-- Add foreign key constraint from content_assignments.content_id to categories.id
-- This allows Supabase to properly join the tables in queries

-- First, let's make sure content_id column exists and has the right type
-- (it should already exist, but this ensures it matches the categories.id type)
ALTER TABLE content_assignments
ALTER COLUMN content_id TYPE UUID USING content_id::UUID;

-- Add the foreign key constraint
-- This links content_assignments.content_id to categories.id
ALTER TABLE content_assignments
ADD CONSTRAINT fk_content_assignments_category
FOREIGN KEY (content_id)
REFERENCES categories(id)
ON DELETE CASCADE;

-- Create an index on content_id for better query performance
CREATE INDEX IF NOT EXISTS idx_content_assignments_content_id
ON content_assignments(content_id);

-- Verify the constraint was created
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'content_assignments';
