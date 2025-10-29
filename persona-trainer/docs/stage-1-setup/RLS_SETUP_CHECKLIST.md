# RLS Setup Checklist

## 🚨 CRITICAL: Your app is public - RLS must be enabled!

Follow this checklist to secure your Supabase database.

---

## Step 1: Backup Your Data (5 minutes)

Before making changes, backup your database:

```bash
# In Supabase Dashboard
# Go to Database → Backups
# Create a manual backup
```

Or export critical tables:

```sql
-- Run in Supabase SQL Editor
COPY (SELECT * FROM users) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM categories) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM personas) TO STDOUT WITH CSV HEADER;
```

**Status**: ⬜ Backup created

---

## Step 2: Prepare Existing Data (10 minutes)

Check for data issues that could cause RLS problems:

### Check for NULL created_by fields:

```sql
-- Run in Supabase SQL Editor
SELECT
  'categories' as table_name,
  COUNT(*) as null_count
FROM categories
WHERE created_by IS NULL

UNION ALL

SELECT
  'topics' as table_name,
  COUNT(*)
FROM topics
WHERE created_by IS NULL

UNION ALL

SELECT
  'scenarios' as table_name,
  COUNT(*)
FROM scenarios
WHERE created_by IS NULL

UNION ALL

SELECT
  'personas' as table_name,
  COUNT(*)
FROM personas
WHERE created_by IS NULL;
```

### Fix NULL values:

If you have NULL created_by values, you need to fix them first:

```sql
-- Get your admin user ID first
SELECT id, email FROM users WHERE role = 'admin' LIMIT 1;

-- Replace 'YOUR_ADMIN_USER_ID' with the actual UUID from above
-- Then run these updates:

UPDATE categories
SET created_by = 'YOUR_ADMIN_USER_ID'
WHERE created_by IS NULL;

UPDATE topics
SET created_by = 'YOUR_ADMIN_USER_ID'
WHERE created_by IS NULL;

UPDATE scenarios
SET created_by = 'YOUR_ADMIN_USER_ID'
WHERE created_by IS NULL;

UPDATE personas
SET created_by = 'YOUR_ADMIN_USER_ID'
WHERE created_by IS NULL;
```

### Check for NULL is_public fields:

```sql
-- Set default visibility for existing content
UPDATE categories SET is_public = true WHERE is_public IS NULL;
UPDATE topics SET is_public = true WHERE is_public IS NULL;
UPDATE scenarios SET is_public = true WHERE is_public IS NULL;
UPDATE personas SET is_public = true WHERE is_public IS NULL;
```

**Status**: ⬜ Data prepared

---

## Step 3: Enable RLS (2 minutes)

### Option A: All at once (RECOMMENDED)

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Open `setup-all-rls-policies.sql`
4. Copy entire file contents
5. Paste into SQL Editor
6. Click "Run"
7. Wait for "Success" message

**Status**: ⬜ RLS enabled

### Option B: One table at a time

If you prefer to go slowly, run these in order:

1. ⬜ `setup-users-rls.sql`
2. ⬜ `setup-topics-rls.sql`
3. ⬜ `setup-scenarios-rls.sql`
4. ⬜ `setup-content-assignments-rls.sql`
5. ⬜ `setup-rubrics-rls.sql`

**Status**: ⬜ All scripts executed

---

## Step 4: Verify RLS is Active (5 minutes)

### Check RLS is enabled:

```sql
SELECT
  tablename,
  rowsecurity,
  CASE
    WHEN rowsecurity THEN '✅ Enabled'
    ELSE '❌ DISABLED'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'users', 'categories', 'topics', 'scenarios',
  'personas', 'content_assignments', 'rubrics', 'training_sessions'
)
ORDER BY tablename;
```

**Expected**: All tables show "✅ Enabled"

**Status**: ⬜ All tables have RLS enabled

### Count policies:

```sql
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

**Expected counts**:
- users: 7 policies
- categories: 5 policies
- topics: 5 policies
- scenarios: 6 policies
- personas: 5 policies
- content_assignments: 6 policies
- rubrics: 10 policies
- training_sessions: 4 policies

**Status**: ⬜ Policy counts verified

---

## Step 5: Test Access Control (15 minutes)

### Test as Employee:

1. Create a test employee account
2. Log in as that employee
3. Verify you can:
   - ✅ See your own profile
   - ✅ See public categories/topics/scenarios/personas
   - ✅ See content assigned to you
   - ✅ Create training sessions
4. Verify you CANNOT:
   - ❌ See other users' profiles
   - ❌ See private content not assigned to you
   - ❌ Access admin/manager pages
   - ❌ Delete other users' content

**Status**: ⬜ Employee access tested

### Test as Manager:

1. Create a test manager account
2. Log in as that manager
3. Verify you can:
   - ✅ See all user profiles
   - ✅ Create assignments
   - ✅ View all training sessions
   - ✅ Create categories/topics/scenarios
4. Verify you can:
   - ✅ Update assignments you created
   - ✅ View manager dashboard

**Status**: ⬜ Manager access tested

### Test as Admin:

1. Log in as admin
2. Verify you can:
   - ✅ See everything
   - ✅ Modify user roles
   - ✅ Delete users
   - ✅ Manage all content
   - ✅ View all assignments

**Status**: ⬜ Admin access tested

---

## Step 6: Monitor for Issues (Ongoing)

### Check Supabase logs:

1. Go to Supabase Dashboard
2. Navigate to Logs → Database
3. Look for errors containing:
   - "permission denied"
   - "row-level security"
   - "policy"

**Status**: ⬜ Logs reviewed

### Monitor application errors:

Check your Vercel logs for:
- 403 Forbidden errors
- Database query failures
- User reports of missing data

**Status**: ⬜ Application monitored

---

## Step 7: Update Production Environment Variables (2 minutes)

Ensure your environment variables are set correctly:

```bash
# In Vercel Dashboard → Your Project → Settings → Environment Variables
# Verify these are set:

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Status**: ⬜ Environment variables verified

---

## Step 8: Redeploy Application (5 minutes)

After enabling RLS, redeploy to ensure everything works:

```bash
# Trigger a new deployment in Vercel
# Or push a commit to trigger auto-deploy

git commit --allow-empty -m "Trigger redeploy after RLS setup"
git push
```

**Status**: ⬜ Application redeployed

---

## Troubleshooting

### If users report "Permission Denied" errors:

1. Check their user role: `SELECT id, email, role FROM users WHERE email = 'user@example.com';`
2. Verify content has proper `created_by`: `SELECT id, name, created_by FROM categories WHERE created_by IS NULL;`
3. Check assignments are correct: `SELECT * FROM content_assignments WHERE assigned_to_id = 'user_id';`

### If admin can't access data:

```sql
-- Ensure admin role is set correctly
UPDATE users SET role = 'admin' WHERE email = 'your-admin@example.com';
```

### If you need to disable RLS temporarily:

```sql
-- EMERGENCY ONLY - Do not leave disabled!
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Remember to re-enable when issue is fixed
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

---

## Final Checklist

Before considering RLS setup complete:

- ⬜ Backup created
- ⬜ Existing data fixed (no NULL created_by or is_public)
- ⬜ All RLS policies installed
- ⬜ RLS verified as enabled on all tables
- ⬜ Policy counts verified
- ⬜ Employee access tested
- ⬜ Manager access tested
- ⬜ Admin access tested
- ⬜ Logs reviewed for errors
- ⬜ Application redeployed
- ⬜ Production monitoring active

---

## Success Criteria

Your RLS setup is successful when:

✅ All tables show `rowsecurity = true`
✅ Test users can only access their authorized data
✅ No "permission denied" errors in logs (except for unauthorized attempts)
✅ Application functions normally for all user roles
✅ Database performance is acceptable

---

## Quick Reference

**Enable all RLS**: Run `setup-all-rls-policies.sql`
**Verify enabled**: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
**View policies**: `SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';`
**Fix NULL created_by**: Update with admin user ID
**Emergency disable**: `ALTER TABLE tablename DISABLE ROW LEVEL SECURITY;` (temporary only!)

---

## Need Help?

Refer to:
- [RLS_SECURITY_DOCUMENTATION.md](RLS_SECURITY_DOCUMENTATION.md) - Detailed documentation
- [setup-all-rls-policies.sql](setup-all-rls-policies.sql) - Master setup script
- Supabase Docs: https://supabase.com/docs/guides/auth/row-level-security

---

**Remember**: RLS is NOT optional for a public application. Your data security depends on it!
