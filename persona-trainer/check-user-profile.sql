-- Check if your user profile exists in the users table
-- Run this to see all users in the users table:

SELECT id, email, name, role FROM users;

-- If you don't see your user, check auth.users:

SELECT id, email FROM auth.users;

-- The 'id' should match between both tables
-- If your user is missing from the 'users' table, that's the problem
