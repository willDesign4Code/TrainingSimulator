-- Step 1: First, find your user ID by running this query:
SELECT id, email FROM auth.users WHERE email = 'YOUR_EMAIL_HERE';

-- Step 2: Copy the 'id' from the result above, then run this:
-- (Replace 'PASTE_YOUR_USER_ID_HERE' with the id from Step 1)

INSERT INTO users (id, email, name, role)
VALUES (
  'PASTE_YOUR_USER_ID_HERE',
  'YOUR_EMAIL_HERE',
  'YOUR_NAME_HERE',
  'admin'
)
ON CONFLICT (id)
DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = 'admin';

-- After running this, log out and log back in to see the admin menu
