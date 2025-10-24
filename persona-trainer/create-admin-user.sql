-- Create or update admin user in the users table
-- Replace 'YOUR_USER_ID' with your actual user ID from auth.users
-- Replace 'YOUR_EMAIL' with your actual email
-- Replace 'YOUR_NAME' with your name

-- First, check your user ID in auth.users
-- SELECT id, email FROM auth.users;

-- Then insert or update your user profile
-- Make sure to replace the values below with your actual data

INSERT INTO users (id, email, name, role)
VALUES (
  'YOUR_USER_ID',  -- Replace with your actual user ID from auth.users
  'YOUR_EMAIL',    -- Replace with your email
  'YOUR_NAME',     -- Replace with your name
  'admin'          -- Set role to admin
)
ON CONFLICT (id)
DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = 'admin';

-- Example:
-- INSERT INTO users (id, email, name, role)
-- VALUES (
--   '12345678-1234-1234-1234-123456789012',
--   'admin@example.com',
--   'Admin User',
--   'admin'
-- )
-- ON CONFLICT (id)
-- DO UPDATE SET
--   email = EXCLUDED.email,
--   name = EXCLUDED.name,
--   role = 'admin';
