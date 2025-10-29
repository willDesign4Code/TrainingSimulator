# RLS Troubleshooting Guide

## Common Errors and Solutions

### Error: 42883 - operator does not exist: uuid = text

**Full Error Message:**
```
ERROR: operator does not exist: uuid = text
HINT: No operator matches the given name and argument types. You might need to add explicit type casts.
```

**Cause:**
This error occurs when comparing UUID columns with TEXT columns without proper type casting. In our schema:
- `scenarios.id`, `topics.id`, `categories.id` are **UUID** type
- `content_assignments.content_id` is **TEXT** type

**Solution:**
Cast UUID to TEXT using the `::text` operator:

```sql
-- WRONG - causes error
WHERE content_id = scenarios.id

-- CORRECT - cast UUID to TEXT
WHERE content_id = scenarios.id::text
```

**Files Fixed:**
- ✅ setup-scenarios-rls.sql
- ✅ setup-rubrics-rls.sql
- ✅ setup-all-rls-policies.sql

**Status:** Fixed in commit 66ff16c

---

### Error: permission denied for table [table_name]

**Cause:**
RLS policy is blocking access to data the user should be able to see.

**Debug Steps:**

1. **Check if RLS is enabled:**
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'your_table_name';
```

2. **Check user's role:**
```sql
SELECT id, email, role
FROM users
WHERE email = 'user@example.com';
```

3. **View policies on the table:**
```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'your_table_name';
```

4. **Test policy directly:**
```sql
-- As the user experiencing issues
SELECT * FROM your_table_name LIMIT 1;
```

**Common Fixes:**

- **User has wrong role:** Update user role
  ```sql
  UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
  ```

- **Missing created_by field:** Add the creator
  ```sql
  UPDATE categories SET created_by = 'user-uuid' WHERE created_by IS NULL;
  ```

- **Missing assignment:** Create the assignment
  ```sql
  INSERT INTO content_assignments (content_type, content_id, assigned_to_type, assigned_to_id, assigned_by)
  VALUES ('category', 'category-id', 'user', 'user-id', 'admin-id');
  ```

---

### Error: infinite recursion detected in rules for relation "users"

**Cause:**
Policy is recursively querying the same table it's protecting, creating a loop.

**Example Problem:**
```sql
-- BAD - causes infinite recursion
CREATE POLICY "Admins can view all"
ON users FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);
```

**Solution:**
Use EXISTS with a subquery that's properly scoped:
```sql
-- GOOD - no recursion
CREATE POLICY "Admins can view all"
ON users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

**Status:** Our policies use EXISTS pattern correctly ✅

---

### Error: column "auth.uid()" does not exist

**Cause:**
Trying to use `auth.uid()` in a context where it's not available (like in a regular query, not an RLS policy).

**Solution:**
`auth.uid()` only works within RLS policies. For regular queries, use:
```sql
-- In application code, pass user ID as parameter
SELECT * FROM users WHERE id = $1;  -- Pass auth.uid() from app
```

---

### Error: new row violates row-level security policy for table

**Cause:**
INSERT or UPDATE is blocked because the WITH CHECK clause condition isn't met.

**Example:**
```sql
-- Policy requires created_by = auth.uid()
INSERT INTO categories (name, details) VALUES ('Test', 'Details');
-- ERROR: Missing created_by field
```

**Solution:**
Ensure INSERT includes all required fields:
```sql
INSERT INTO categories (name, details, created_by)
VALUES ('Test', 'Details', auth.uid());
```

**Or in application code:**
```javascript
const { error } = await supabase
  .from('categories')
  .insert([{
    name: 'Test',
    details: 'Details',
    created_by: user.id  // Must be included
  }]);
```

---

### Slow Query Performance After Enabling RLS

**Cause:**
RLS policies add WHERE conditions to every query, which can slow down queries if indexes are missing.

**Check Query Plan:**
```sql
EXPLAIN ANALYZE
SELECT * FROM scenarios WHERE is_public = true;
```

**Solution:**
Ensure indexes exist (our scripts create these automatically):
```sql
-- Check if indexes exist
SELECT tablename, indexname
FROM pg_indexes
WHERE tablename IN ('scenarios', 'users', 'content_assignments');

-- If missing, create them
CREATE INDEX idx_scenarios_visibility ON scenarios(is_public, created_by);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_content_assignments_assigned_users ON content_assignments USING GIN(assigned_users);
```

**Status:** All necessary indexes included in our scripts ✅

---

### Users See Data They Shouldn't

**Cause:**
Overly permissive policy or missing RLS on related table.

**Debug:**
1. **Check policy logic:**
```sql
SELECT policyname, qual
FROM pg_policies
WHERE tablename = 'scenarios';
```

2. **Test as that user:**
```sql
-- Switch to user session
SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claims.sub = 'user-uuid-here';

SELECT * FROM scenarios;
```

3. **Check for missing RLS:**
```sql
-- Find tables without RLS
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false;
```

**Solution:**
- Review policy logic for security holes
- Enable RLS on all tables
- Test with multiple user roles

---

### Cannot Disable RLS (for testing)

**Issue:**
Need to temporarily disable RLS for debugging but getting permission errors.

**Solution:**
```sql
-- Disable RLS (requires superuser or table owner)
ALTER TABLE scenarios DISABLE ROW LEVEL SECURITY;

-- Run tests
SELECT * FROM scenarios;

-- IMPORTANT: Re-enable immediately
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
```

**Better Alternative:**
Create a service role bypass policy for testing:
```sql
CREATE POLICY "Service role bypass"
ON scenarios
TO service_role
USING (true);
```

Then use the service role key for admin operations.

---

## Quick Diagnostics Script

Run this to get a complete RLS status report:

```sql
-- RLS Status Report
SELECT
  t.tablename,
  t.rowsecurity as rls_enabled,
  COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON p.tablename = t.tablename
WHERE t.schemaname = 'public'
AND t.tablename IN (
  'users', 'categories', 'topics', 'scenarios',
  'personas', 'content_assignments', 'rubrics', 'training_sessions'
)
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;

-- Expected Results:
-- All tables: rls_enabled = true
-- users: 7 policies
-- categories: 5 policies
-- topics: 5 policies
-- scenarios: 6 policies
-- personas: 5 policies
-- content_assignments: 6 policies
-- rubrics: 10 policies
-- training_sessions: 4 policies
```

---

## Getting Help

1. **Check logs:** Supabase Dashboard → Logs → Database
2. **Review policies:** Use queries above to inspect RLS configuration
3. **Test with different users:** Create test accounts for each role
4. **Verify data:** Ensure created_by, is_public fields are set correctly
5. **Check indexes:** Ensure performance indexes exist

---

## Emergency: Disable RLS Temporarily

**⚠️ USE ONLY IN EMERGENCY - DO NOT LEAVE DISABLED**

```sql
-- Disable RLS on a table
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Check what you need to fix
SELECT * FROM table_name;

-- Re-enable IMMEDIATELY after fixing
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

**Remember:** With RLS disabled, **all data is accessible to everyone**. Only disable temporarily for debugging, never in production.

---

## Prevention Checklist

Before deploying to production:

- ✅ All tables have RLS enabled
- ✅ Policy counts match documentation
- ✅ Test with employee, manager, and admin accounts
- ✅ Verify users can't see others' private data
- ✅ Check performance with EXPLAIN ANALYZE
- ✅ Monitor logs for permission denied errors
- ✅ All created_by and is_public fields populated
- ✅ Indexes created for RLS policy efficiency

---

## Related Documentation

- [RLS_SECURITY_DOCUMENTATION.md](RLS_SECURITY_DOCUMENTATION.md) - Full security guide
- [RLS_SETUP_CHECKLIST.md](RLS_SETUP_CHECKLIST.md) - Setup instructions
- [setup-all-rls-policies.sql](setup-all-rls-policies.sql) - Master setup script

---

**Last Updated:** After fixing UUID/TEXT casting issue (commit 66ff16c)
