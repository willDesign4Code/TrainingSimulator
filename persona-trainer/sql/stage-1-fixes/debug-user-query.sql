-- Debug: Check exactly what's in the users table

-- 1. Show ALL users in the table
SELECT * FROM users;

-- 2. Check for your specific user ID (exact match)
SELECT * FROM users WHERE id = 'd1cadd80-d37f-4098-9494-89e45195b214';

-- 3. Check if there's a different ID format (maybe with dashes vs without)
SELECT id, length(id::text), email, name, role FROM users;

-- 4. Check what the auth user ID is
SELECT id, email FROM auth.users;

-- If the users table is empty or your ID doesn't match, run this:
-- INSERT INTO users (id, email, name, role)
-- VALUES ('d1cadd80-d37f-4098-9494-89e45195b214', 'your-actual-email@example.com', 'Your Name', 'admin');
