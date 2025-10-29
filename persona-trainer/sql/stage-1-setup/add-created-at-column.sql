-- Add created_at column to content_assignments table
-- This column tracks when each assignment was created

ALTER TABLE content_assignments
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Add updated_at column as well for tracking modifications
ALTER TABLE content_assignments
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create a trigger to automatically update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop the trigger if it exists, then create it
DROP TRIGGER IF EXISTS update_content_assignments_updated_at ON content_assignments;

CREATE TRIGGER update_content_assignments_updated_at
    BEFORE UPDATE ON content_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'content_assignments'
    AND column_name IN ('created_at', 'updated_at');
