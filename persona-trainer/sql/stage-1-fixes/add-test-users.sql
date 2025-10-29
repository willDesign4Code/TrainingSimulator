-- Add test users to the users table
-- These will appear in the assignment dropdown

-- Insert multiple test users
INSERT INTO users (id, email, name, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'john.doe@example.com', 'John Doe', 'employee'),
  ('22222222-2222-2222-2222-222222222222', 'jane.smith@example.com', 'Jane Smith', 'employee'),
  ('33333333-3333-3333-3333-333333333333', 'bob.johnson@example.com', 'Bob Johnson', 'employee'),
  ('44444444-4444-4444-4444-444444444444', 'alice.williams@example.com', 'Alice Williams', 'manager'),
  ('55555555-5555-5555-5555-555555555555', 'charlie.brown@example.com', 'Charlie Brown', 'employee')
ON CONFLICT (id) DO NOTHING;

-- Verify the users were added
SELECT id, email, name, role
FROM users
WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555'
)
ORDER BY name;
