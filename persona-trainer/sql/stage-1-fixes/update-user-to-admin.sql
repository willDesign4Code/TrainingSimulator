-- Update your existing user to admin role
-- Replace the values below with your actual information

UPDATE users
SET role = 'admin',
    name = 'Your Name Here'  -- Update this to your actual name
WHERE id = 'd1cadd80-d37f-4098-9494-89e45195b214';

-- Verify the update worked:
SELECT id, email, name, role FROM users WHERE id = 'd1cadd80-d37f-4098-9494-89e45195b214';
