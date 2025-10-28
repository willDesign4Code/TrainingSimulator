# Persona Visibility Implementation Guide

This document describes the implementation of public/private visibility controls for personas in the Scenario Sim Trainer application.

## Overview

Personas can now be marked as either **public** (visible to all users) or **private** (visible only to their creator). This matches the existing functionality already implemented for categories.

## Database Changes

### Schema Updates

A new column `is_public` has been added to the `personas` table:

```sql
ALTER TABLE personas ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
```

### Row Level Security (RLS) Policies

Five RLS policies have been created to enforce visibility rules at the database level:

1. **Users can view public personas** - Anyone can see personas marked as public
2. **Users can view their own personas** - Users can always see their own personas regardless of visibility
3. **Users can create personas** - Users can create new personas (automatically set as creator)
4. **Users can update their own personas** - Users can only edit their own personas
5. **Users can delete their own personas** - Users can only delete their own personas

### Database Indexes

Performance indexes have been added:
- `idx_personas_created_by` - For creator-based queries
- `idx_personas_is_public` - For public/private filtering
- `idx_personas_visibility` - Composite index for optimal query performance

### Running the Migration

To apply these database changes, run the SQL script:

```bash
# Connect to your Supabase database and run:
psql your_database < setup-persona-visibility-rls.sql
```

Or execute the SQL through the Supabase dashboard SQL editor.

## Frontend Changes

### Type Definition Updates

**File:** [src/services/supabase/client.ts](src/services/supabase/client.ts)

The `Persona` type now includes the `is_public` field:

```typescript
export type Persona = {
  id: string;
  name: string;
  age: number;
  pronoun: string;
  occupation: string;
  voice?: string;
  interests: string[];
  goals: string[];
  image_url?: string;
  is_ai_generated_image: boolean;
  created_by: string;
  is_public: boolean;  // NEW FIELD
  created_at: string;
  updated_at: string;
};
```

### Personas Page Updates

**File:** [src/pages/Personas.tsx](src/pages/Personas.tsx)

Key changes:

1. **Authentication Context** - Now uses `useAuth()` to get current user
2. **Visibility Filtering** - Fetches only public personas OR personas created by current user:
   ```typescript
   const { data, error } = await supabase
     .from('personas')
     .select('*')
     .or(`is_public.eq.true,created_by.eq.${user.id}`)
     .order('created_at', { ascending: false });
   ```

3. **Form State** - Added `is_public` field to form data (defaults to `true`)
4. **Save Logic** - Includes `is_public` when creating/updating personas
5. **Creator Tracking** - Sets `created_by` field when creating new personas
6. **UI Toggle** - Added Switch component in dialog for toggling public/private status

### PersonaCard Component Updates

**File:** [src/components/personas/PersonaCard.tsx](src/components/personas/PersonaCard.tsx)

Added visibility status display:

1. **New Props** - Added `isPublic?: boolean` prop
2. **Visual Indicator** - Chip badge showing "Public" (green) or "Private" (gray) with icons
3. **Positioning** - Badge appears in top-right corner of persona card image

### TopicDetails Page Updates

**File:** [src/pages/TopicDetails.tsx](src/pages/TopicDetails.tsx)

Updated persona fetching in scenario creation:

1. **Authentication Context** - Added `useAuth()` hook to get current user
2. **Visibility Filtering** - Persona dropdown now only shows public personas OR personas created by current user:
   ```typescript
   const { data: personasData, error: personasError } = await supabase
     .from('personas')
     .select('*')
     .or(`is_public.eq.true,created_by.eq.${user?.id}`)
     .order('name', { ascending: true });
   ```

This ensures that when creating scenarios, users can only select from personas they have access to.

## User Experience

### Creating a Persona

1. Click "Add Persona" button
2. Fill in persona details (name, age, occupation, etc.)
3. Toggle "Make this persona public" switch:
   - **ON (default)**: Everyone can view and use this persona
   - **OFF**: Only you can view and use this persona
4. Click "Create"

### Editing a Persona

1. Click "Edit" on any persona card (you can only edit your own)
2. Modify fields as needed, including the public/private toggle
3. Click "Save Changes"

### Viewing Personas

- **Public personas**: Visible to all users (shown with green "Public" badge)
- **Your private personas**: Only visible to you (shown with gray "Private" badge)
- **Other users' private personas**: Not visible in your list

## Consistency with Categories

This implementation mirrors the existing category visibility system:

| Feature | Categories | Personas |
|---------|------------|----------|
| `is_public` field | ✅ | ✅ |
| `created_by` tracking | ✅ | ✅ |
| RLS policies | ✅ | ✅ |
| Public/Private toggle UI | ✅ | ✅ |
| Visibility badge on cards | ✅ | ✅ |
| Filtered fetch queries | ✅ | ✅ |

## Security Considerations

1. **Database-level enforcement**: RLS policies ensure visibility rules are enforced even if someone bypasses the frontend
2. **Creator verification**: Users can only modify/delete their own content
3. **Default visibility**: New personas default to public for ease of use
4. **Authentication required**: All persona operations require a logged-in user

## Testing Checklist

- [ ] Run the SQL migration script in your Supabase database
- [ ] Verify RLS policies are active: `SELECT * FROM pg_policies WHERE tablename = 'personas'`
- [ ] Create a new persona and toggle public/private
- [ ] Verify public personas appear for all users
- [ ] Verify private personas only appear for their creator
- [ ] Test editing: should only work for your own personas
- [ ] Test deleting: should only work for your own personas
- [ ] Verify visibility badges display correctly on persona cards
- [ ] Check that existing personas work (may need to set `is_public=true` for legacy data)

## Migration Notes for Existing Data

If you have existing personas in your database, they will need the `is_public` field populated. The migration script sets the default to `true` (public), but you may want to update this:

```sql
-- Make all existing personas public (recommended for smooth transition)
UPDATE personas SET is_public = true WHERE is_public IS NULL;

-- OR make all existing personas private to their creators
UPDATE personas SET is_public = false WHERE is_public IS NULL;
```

## Future Enhancements

Potential improvements for the future:

1. **Bulk visibility updates**: Select multiple personas and change visibility at once
2. **Team sharing**: Share private personas with specific teams or users
3. **Visibility filters**: Filter persona list by public/private status
4. **Analytics**: Track which public personas are most popular
5. **Permissions**: Role-based visibility (e.g., managers can see all team personas)

## Related Files

- [setup-persona-visibility-rls.sql](setup-persona-visibility-rls.sql) - Database migration script
- [src/services/supabase/client.ts:60-75](src/services/supabase/client.ts#L60-L75) - Persona type definition
- [src/pages/Personas.tsx](src/pages/Personas.tsx) - Personas management page
- [src/pages/TopicDetails.tsx:218-225](src/pages/TopicDetails.tsx#L218-L225) - Scenario creation with persona selection
- [src/components/personas/PersonaCard.tsx](src/components/personas/PersonaCard.tsx) - Persona card component
- [setup-category-visibility-rls.sql](setup-category-visibility-rls.sql) - Reference for category visibility (similar implementation)
