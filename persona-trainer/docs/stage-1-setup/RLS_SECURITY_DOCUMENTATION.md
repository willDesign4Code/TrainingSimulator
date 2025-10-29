# Row Level Security (RLS) Implementation Guide

## Overview

This document provides comprehensive information about the Row Level Security (RLS) implementation for the Scenario Sim Trainer application deployed on Vercel with Supabase.

**IMPORTANT**: Now that your application is publicly accessible, RLS is **CRITICAL** for data security. Without RLS, any authenticated user could potentially access all data in your database.

## What is Row Level Security?

Row Level Security (RLS) is a PostgreSQL/Supabase feature that enforces access control at the database level. Unlike application-level security (which can be bypassed), RLS policies are enforced by the database itself, ensuring that users can only access data they're authorized to see.

## Security Model

### Role Hierarchy
1. **Admin** - Full access to all data and users
2. **Manager** - Can manage assignments, view team data, create content
3. **Employee** - Can view assigned content and their own training data

### Visibility Model
- **Public content** - Visible to all authenticated users
- **Private content** - Only visible to creator
- **Assigned content** - Private content becomes visible when assigned to users

## Tables Protected by RLS

### 1. Users Table
**Protection**: User profile data (email, role, department, manager relationships)

**Policies**:
- ✅ Users can view their own profile
- ✅ Admins and managers can view all profiles (needed for assignments)
- ✅ Users can update their own profile (but not their role)
- ✅ Admins can update any user profile including roles
- ✅ Users can be created during signup
- ✅ Admins can create new users
- ✅ Admins can delete users

**Why this matters**: Without RLS, any user could read all email addresses, roles, and organizational structure.

### 2. Categories Table
**Protection**: Training categories with public/private visibility

**Policies**:
- ✅ Users can view public categories
- ✅ Users can view their own categories (public or private)
- ✅ Users can create categories
- ✅ Users can update their own categories
- ✅ Users can delete their own categories

**Status**: Already configured

### 3. Topics Table
**Protection**: Topics within categories with public/private visibility

**Policies**:
- ✅ Users can view public topics
- ✅ Users can view their own topics (public or private)
- ✅ Users can create topics
- ✅ Users can update their own topics
- ✅ Users can delete their own topics

**Why this matters**: Topics should follow the same visibility model as categories.

### 4. Scenarios Table
**Protection**: Training scenarios with advanced visibility rules

**Policies**:
- ✅ Users can view public scenarios
- ✅ Users can view their own scenarios (public or private)
- ✅ Users can view scenarios assigned to them (even if private)
- ✅ Users can create scenarios
- ✅ Users can update their own scenarios
- ✅ Users can delete their own scenarios

**Why this matters**: Scenarios contain training content that should be controlled. The assignment-based access allows private scenarios to be shared with specific users.

### 5. Personas Table
**Protection**: AI personas with public/private visibility

**Policies**:
- ✅ Users can view public personas
- ✅ Users can view their own personas (public or private)
- ✅ Users can create personas
- ✅ Users can update their own personas
- ✅ Users can delete their own personas

**Status**: Already configured

### 6. Content Assignments Table
**Protection**: Assignment records linking users to content

**Policies**:
- ✅ Users can view assignments assigned to them
- ✅ Users can view assignments they created
- ✅ Admins and managers can view all assignments
- ✅ Admins and managers can create assignments
- ✅ Admins and managers can update assignments they created (or all if admin)
- ✅ Users can update completion status of their own assignments
- ✅ Admins and managers can delete assignments

**Why this matters**: Without RLS, any user could see who is assigned what content, or modify assignments.

### 7. Rubrics Table
**Protection**: Scoring criteria for scenarios

**Policies**:
- ✅ Users can view rubrics for public scenarios
- ✅ Users can view rubrics for their own scenarios
- ✅ Users can view rubrics for assigned scenarios
- ✅ Admins and managers can view all rubrics
- ✅ Scenario creators can create/update/delete rubrics for their scenarios
- ✅ Admins and managers can create/update/delete any rubrics

**Why this matters**: Rubrics define how users are scored. Access should be controlled to prevent gaming the system.

### 8. Training Sessions Table
**Protection**: User training progress and scores

**Policies**:
- ✅ Users can view their own training sessions
- ✅ Users can create their own training sessions
- ✅ Users can update their own training sessions
- ✅ Admins and managers can view all training sessions

**Status**: Already configured

## Installation

### Quick Setup (Recommended)

Run the master script that configures all tables at once:

```bash
# In Supabase SQL Editor, run:
```
```sql
-- Copy and paste the contents of setup-all-rls-policies.sql
```

### Individual Table Setup

If you prefer to enable RLS table-by-table, run these scripts in order:

1. `setup-users-rls.sql` - User profiles
2. `setup-topics-rls.sql` - Topics
3. `setup-scenarios-rls.sql` - Scenarios
4. `setup-content-assignments-rls.sql` - Assignments
5. `setup-rubrics-rls.sql` - Rubrics

**Note**: Categories, personas, and training_sessions already have RLS enabled.

## Verification

After running the setup scripts, verify RLS is working:

### 1. Check RLS is Enabled

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'users', 'categories', 'topics', 'scenarios',
  'personas', 'content_assignments', 'rubrics', 'training_sessions'
);
```

Expected result: All tables should show `rowsecurity = true`

### 2. View All Policies

```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 3. Test Access Control

Create a test employee account and verify:
- ✅ Can only see their own profile
- ✅ Can only see public or assigned content
- ✅ Cannot see other users' private content
- ✅ Cannot modify other users' data

Create a test manager account and verify:
- ✅ Can see all user profiles
- ✅ Can create and manage assignments
- ✅ Can see all training sessions

## Security Considerations

### What RLS Protects Against

✅ **Unauthorized data access** - Users can't bypass frontend to access restricted data
✅ **Data leakage** - Private content stays private
✅ **Privilege escalation** - Users can't change their own roles
✅ **Assignment tampering** - Users can't modify assignments
✅ **Profile snooping** - Users can't see other users' email/personal info

### What RLS Does NOT Protect Against

❌ **Application logic bugs** - Still need proper authorization checks in code
❌ **SQL injection** - Use parameterized queries
❌ **Brute force attacks** - Implement rate limiting
❌ **Social engineering** - Train users on security

### Best Practices

1. **Never disable RLS in production** - Keep it enabled at all times
2. **Test policies thoroughly** - Verify with different user roles
3. **Use frontend checks too** - RLS is backup, not replacement for UI authorization
4. **Monitor policy performance** - Indexes are crucial for complex policies
5. **Review policies regularly** - Update as features change

## Performance Optimization

All RLS scripts include performance indexes:

```sql
-- Example indexes created
CREATE INDEX idx_scenarios_visibility ON scenarios(is_public, created_by);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_content_assignments_assigned_users ON content_assignments USING GIN(assigned_users);
```

These indexes ensure RLS policy checks are fast even with large datasets.

## Troubleshooting

### Issue: Users can't see data they should access

**Solution**: Check if the user's role is set correctly:
```sql
SELECT id, email, role FROM users WHERE email = 'user@example.com';
```

**Solution**: Verify assignments are created properly:
```sql
SELECT * FROM content_assignments
WHERE assigned_to_id = 'user_id' OR 'user_id' = ANY(assigned_users);
```

### Issue: Admins can't access certain data

**Solution**: Verify admin role is set correctly:
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

### Issue: Performance degradation

**Solution**: Check if indexes are present:
```sql
SELECT tablename, indexname FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'scenarios';
```

**Solution**: Run ANALYZE to update statistics:
```sql
ANALYZE scenarios;
ANALYZE content_assignments;
```

### Issue: Policy conflicts

**Solution**: Check for overlapping policies:
```sql
SELECT * FROM pg_policies
WHERE tablename = 'users' AND cmd = 'SELECT';
```

Note: Multiple SELECT policies with USING clauses are combined with OR logic.

## Migration from Development

If you previously had RLS disabled for development:

### 1. Backup Data First
```sql
-- Export important data
COPY (SELECT * FROM users) TO '/tmp/users_backup.csv' CSV HEADER;
```

### 2. Update Existing Data

Ensure all content has proper `created_by` and `is_public` fields:

```sql
-- Check for NULL created_by fields
SELECT tablename, COUNT(*) FROM (
  SELECT 'categories' as tablename FROM categories WHERE created_by IS NULL
  UNION ALL
  SELECT 'topics' FROM topics WHERE created_by IS NULL
  UNION ALL
  SELECT 'scenarios' FROM scenarios WHERE created_by IS NULL
) AS nulls GROUP BY tablename;

-- Fix NULL values (example for categories)
-- Replace 'your-admin-user-id' with actual admin UUID
UPDATE categories SET created_by = 'your-admin-user-id' WHERE created_by IS NULL;
UPDATE categories SET is_public = true WHERE is_public IS NULL;
```

### 3. Enable RLS Gradually

Enable RLS one table at a time and test:

```sql
-- Enable for one table
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- Test access
-- (Log in as different users and verify data access)

-- If issues found, temporarily disable while fixing
ALTER TABLE topics DISABLE ROW LEVEL SECURITY;
```

### 4. Monitor Logs

Check Supabase logs for RLS-related errors:
- Dashboard → Logs → Database
- Look for "permission denied" errors
- Identify which policies are blocking legitimate access

## Related Files

- [setup-all-rls-policies.sql](setup-all-rls-policies.sql) - Master setup script (use this)
- [setup-users-rls.sql](setup-users-rls.sql) - Users table policies
- [setup-topics-rls.sql](setup-topics-rls.sql) - Topics table policies
- [setup-scenarios-rls.sql](setup-scenarios-rls.sql) - Scenarios table policies
- [setup-content-assignments-rls.sql](setup-content-assignments-rls.sql) - Assignments policies
- [setup-rubrics-rls.sql](setup-rubrics-rls.sql) - Rubrics policies
- [setup-category-visibility-rls.sql](setup-category-visibility-rls.sql) - Categories (existing)
- [setup-persona-visibility-rls.sql](setup-persona-visibility-rls.sql) - Personas (existing)

## Support

If you encounter issues:

1. Check the Troubleshooting section above
2. Review Supabase documentation: https://supabase.com/docs/guides/auth/row-level-security
3. Check PostgreSQL RLS docs: https://www.postgresql.org/docs/current/ddl-rowsecurity.html

## Summary

✅ **Run** `setup-all-rls-policies.sql` in Supabase SQL Editor
✅ **Verify** all tables have RLS enabled
✅ **Test** with different user roles
✅ **Monitor** for any access issues

**This is critical for production security!** Your application is now public and without RLS, your data is at risk.
