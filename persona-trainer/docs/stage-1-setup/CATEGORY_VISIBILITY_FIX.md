# Category Visibility Fix - Implementation Guide

## Summary

This document describes the fixes implemented to properly enforce category visibility rules in the Training Simulator application.

## Problem Statement

The category visibility system was not working as expected:

1. **Missing `created_by` tracking**: Categories were created without recording who created them
2. **No server-side filtering**: All categories were visible to all users regardless of the `is_public` flag
3. **No RLS policies**: Database-level security was not enforced
4. **Assignment issues**: Assignment page showed all categories regardless of visibility

## Expected Behavior

After these fixes:

- **Public categories** (`is_public = true`): Visible to all authenticated users (admins, managers, employees)
- **Private categories** (`is_public = false`): Only visible to the creator
- **Category ownership**: All categories must have a `created_by` field set to the creator's user ID
- **Assignments**: Only categories you can see (public + your private ones) appear in assignment dropdowns

## Changes Made

### 1. Categories.tsx Updates

**File**: [persona-trainer/src/pages/Categories.tsx](persona-trainer/src/pages/Categories.tsx)

#### Added Auth Context
```typescript
import { useAuth } from '../contexts/AuthContext';

const Categories = () => {
  const { user, userProfile } = useAuth();
  // ...
}
```

#### Fixed Category Creation (Line 215)
Now includes `created_by` field:
```typescript
const { error } = await supabase
  .from('categories')
  .insert([{
    name: newCategory.name.trim(),
    details: newCategory.details.trim(),
    image_url: newCategory.imageUrl.trim() || null,
    is_public: newCategory.isPublic,
    created_by: user.id  // ✅ NEW: Track who created the category
  }]);
```

#### Fixed Category Fetching (Line 81-85)
Now filters by visibility and ownership:
```typescript
const { data, error } = await supabase
  .from('categories')
  .select('*')
  .or(`is_public.eq.true,created_by.eq.${user.id}`)
  .order('created_at', { ascending: false });
```

This query returns:
- All public categories (`is_public = true`)
- All private categories created by the current user (`created_by = user.id`)

### 2. Assignments.tsx Updates

**File**: [persona-trainer/src/pages/Assignments.tsx](persona-trainer/src/pages/Assignments.tsx)

#### Fixed Category Dropdown (Line 134-145)
Now respects visibility rules when showing categories for assignment:
```typescript
const { data: categoriesData, error: categoriesError } = await supabase
  .from('categories')
  .select('id, name')
  .or(`is_public.eq.true,created_by.eq.${user.id}`)
  .order('name', { ascending: true });
```

### 3. Database RLS Policies

**File**: [persona-trainer/setup-category-visibility-rls.sql](persona-trainer/setup-category-visibility-rls.sql)

Created comprehensive SQL script to set up Row Level Security policies.

## How to Apply These Fixes

### Step 1: Update Existing Categories (Required)

Before the frontend changes will work properly, you need to migrate existing categories to have a `created_by` value.

**Option A: Run the SQL Migration Script (Recommended)**

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Open the file: `setup-category-visibility-rls.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click "Run" to execute

This script will:
- Add the `created_by` column if missing
- Set existing categories to be owned by the first admin user
- Enable Row Level Security
- Create all necessary policies
- Add performance indexes

**Option B: Manual Migration (if script fails)**

Run this in Supabase SQL Editor:
```sql
-- Add the column if it doesn't exist
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Assign existing categories to an admin
UPDATE categories
SET created_by = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
WHERE created_by IS NULL;

-- Make it required
ALTER TABLE categories
ALTER COLUMN created_by SET NOT NULL;
```

### Step 2: Deploy Frontend Changes

The following files have been updated and need to be deployed:

1. ✅ `persona-trainer/src/pages/Categories.tsx`
2. ✅ `persona-trainer/src/pages/Assignments.tsx`

No additional dependencies are required - all changes use existing imports.

### Step 3: Test the Implementation

#### Test Case 1: Creating Categories
1. Log in as User A
2. Create a public category
3. Create a private category
4. Both should appear in User A's category list

#### Test Case 2: Viewing Categories
1. Log in as User B (different user)
2. Navigate to Categories page
3. Should see: User A's public category
4. Should NOT see: User A's private category
5. Create a private category as User B
6. Should see your own private category

#### Test Case 3: Assignments
1. Log in as User A
2. Navigate to Assignments page
3. Click "Create Assignment"
4. Category dropdown should show:
   - All public categories (any creator)
   - Your own private categories only

#### Test Case 4: Database Level Security (with RLS)
After running the SQL script, test direct database queries:
```sql
-- Should only return public categories + user's private ones
SELECT * FROM categories;
```

## Verification Queries

Run these in Supabase SQL Editor to verify the setup:

```sql
-- Check all categories and their visibility
SELECT
  name,
  is_public,
  created_by,
  (SELECT name FROM users WHERE id = categories.created_by) as creator_name
FROM categories
ORDER BY created_at DESC;

-- Verify RLS policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'categories';

-- Check for categories missing created_by
SELECT COUNT(*) as missing_created_by
FROM categories
WHERE created_by IS NULL;
```

## Rollback Plan

If you need to revert these changes:

### Disable RLS (but keep the column)
```sql
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view public categories" ON categories;
DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
DROP POLICY IF EXISTS "Users can create categories" ON categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;
```

### Revert Frontend Code
```typescript
// In Categories.tsx - Line 81
// Change from:
.or(`is_public.eq.true,created_by.eq.${user.id}`)

// Back to:
.select('*')  // No filtering
```

## Security Considerations

### With RLS Enabled (Recommended)
- ✅ Database-level security enforcement
- ✅ Protection even if frontend is bypassed
- ✅ API calls automatically filtered
- ✅ Defense in depth

### Without RLS (Current State)
- ⚠️ Relies only on frontend filtering
- ⚠️ Direct database access could bypass rules
- ⚠️ API tools could view all categories

**Recommendation**: Always enable RLS for production environments.

## Future Enhancements

Consider these additional features:

1. **Admin Override**: Allow admins to see all categories
   ```typescript
   if (userProfile?.role === 'admin') {
     // Fetch all categories
   } else {
     // Use visibility filter
   }
   ```

2. **Shared Categories**: Allow sharing private categories with specific users
   - Add `shared_with` array field
   - Update RLS policies to include shared access

3. **Category Transfer**: Allow transferring ownership
   - Add UI for changing `created_by`
   - Requires admin permissions

4. **Audit Trail**: Track category visibility changes
   - Log when `is_public` is toggled
   - Track who accessed private categories

## Support

If you encounter issues:

1. Check browser console for errors
2. Check Supabase logs for database errors
3. Verify user authentication is working
4. Confirm `created_by` values are set
5. Test RLS policies with direct SQL queries

## Summary of Files

| File | Purpose | Status |
|------|---------|--------|
| `Categories.tsx` | Frontend category management | ✅ Updated |
| `Assignments.tsx` | Assignment category selection | ✅ Updated |
| `setup-category-visibility-rls.sql` | Database RLS policies | ✅ Created |
| `CATEGORY_VISIBILITY_FIX.md` | This documentation | ✅ Created |

---

**Implementation Date**: 2025-10-24
**Developer**: Claude Code
**Status**: Ready for testing
