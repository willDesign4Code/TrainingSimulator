# UUID to TEXT Casting Fixes

## Summary

Fixed all UUID/TEXT type mismatch errors in RLS policies by adding explicit `::text` type casting.

## Root Cause

PostgreSQL cannot implicitly compare UUID and TEXT types. Our schema has:
- **UUID columns**: `users.id`, `scenarios.id`, `topics.id`, `categories.id`, `personas.id`
- **TEXT columns**: `content_assignments.content_id`, `content_assignments.assigned_to_id`, `content_assignments.assigned_by`, `content_assignments.assigned_users[]`

When RLS policies compared these without casting, PostgreSQL threw error `42883: operator does not exist: uuid = text`.

## Fixes Applied

### 1. setup-scenarios-rls.sql ✅

**Issue**: Comparing UUID columns with TEXT `content_id`

**Lines Fixed**:
- Line 44: `content_id = scenarios.id` → `content_id = scenarios.id::text`
- Line 47: `content_id = scenarios.topic_id` → `content_id = scenarios.topic_id::text`
- Line 51: `SELECT category_id FROM topics` → `SELECT category_id::text FROM topics`

**Policy Affected**: "Users can view scenarios for assigned content"

### 2. setup-rubrics-rls.sql ✅

**Issue**: Same UUID to TEXT comparison in assignment checks

**Lines Fixed**:
- Line 48: `content_id = scenarios.id` → `content_id = scenarios.id::text`
- Line 49: `content_id = scenarios.topic_id` → `content_id = scenarios.topic_id::text`
- Line 51: `SELECT category_id FROM topics` → `SELECT category_id::text FROM topics`

**Policy Affected**: "Users can view rubrics for assigned scenarios"

### 3. setup-content-assignments-rls.sql ✅

**Issue**: Comparing UUID `auth.uid()` with TEXT `assigned_by`

**Lines Fixed**:
- Line 30: `assigned_by = auth.uid()` → `assigned_by = auth.uid()::text`
- Line 52: `assigned_by = auth.uid()` → `assigned_by = auth.uid()::text`
- Line 71: `auth.uid() = content_assignments.assigned_by` → `auth.uid()::text = content_assignments.assigned_by`
- Line 81: `auth.uid() = content_assignments.assigned_by` → `auth.uid()::text = content_assignments.assigned_by`
- Line 112: `auth.uid() = content_assignments.assigned_by` → `auth.uid()::text = content_assignments.assigned_by`

**Policies Affected**:
- "Users can view assignments assigned to them"
- "Admins and managers can create assignments"
- "Admins and managers can update assignments"
- "Admins and managers can delete assignments"

### 4. setup-all-rls-policies.sql ✅

**Issue**: Same as above files (master script)

**All fixes from the above three files applied to the master script**

## Verification

After applying these fixes, all RLS policies should execute without type mismatch errors.

### Test Query

Run this to verify policies are working:

```sql
-- Enable RLS
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_assignments ENABLE ROW LEVEL SECURITY;

-- Create test policies (should not error)
-- Run the fixed SQL scripts

-- Verify no errors
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('scenarios', 'rubrics', 'content_assignments')
ORDER BY tablename, policyname;
```

Expected result: All policies created successfully with no errors.

## Type Casting Rules

For future reference:

### When to Cast UUID → TEXT

```sql
-- CAST when comparing with TEXT columns
WHERE content_id = scenarios.id::text           -- ✅ Correct
WHERE assigned_by = auth.uid()::text            -- ✅ Correct
WHERE auth.uid()::text = ANY(assigned_users)    -- ✅ Correct
```

### When NOT to Cast

```sql
-- NO CAST when comparing UUID with UUID
WHERE created_by = auth.uid()                   -- ✅ Correct (both UUID)
WHERE id = auth.uid()                          -- ✅ Correct (both UUID)
WHERE scenarios.id = rubrics.scenario_id       -- ✅ Correct (both UUID)
```

## Schema Reference

### UUID Columns
- `users.id` → UUID
- `categories.id`, `categories.created_by` → UUID
- `topics.id`, `topics.category_id`, `topics.created_by` → UUID
- `scenarios.id`, `scenarios.topic_id`, `scenarios.persona_id`, `scenarios.created_by` → UUID
- `personas.id`, `personas.created_by` → UUID
- `rubrics.scenario_id` → UUID
- `training_sessions.user_id`, `training_sessions.scenario_id` → UUID

### TEXT Columns
- `content_assignments.content_id` → TEXT
- `content_assignments.assigned_to_id` → TEXT
- `content_assignments.assigned_by` → TEXT
- `content_assignments.assigned_users` → TEXT[]

## Status

✅ All UUID/TEXT type mismatches fixed
✅ All RLS policies updated
✅ Master script (setup-all-rls-policies.sql) updated
✅ Ready for deployment

## Files Modified

1. `setup-scenarios-rls.sql` - 3 casts added
2. `setup-rubrics-rls.sql` - 3 casts added
3. `setup-content-assignments-rls.sql` - 5 casts added
4. `setup-all-rls-policies.sql` - 11 casts total (includes all above)

**Total Casting Operations Added**: 11 across 4 files
