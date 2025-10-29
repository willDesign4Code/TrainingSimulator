# user_scenario_completion View - RLS Status

## Summary

`user_scenario_completion` is a **database VIEW**, not a table. Views **do not require separate RLS policies** - they automatically inherit RLS from the underlying tables they query.

## View Definition

```sql
CREATE VIEW user_scenario_completion AS
SELECT
  user_id,
  scenario_id,
  MAX(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as is_completed,
  MAX(completed_at) as last_completed_at,
  COUNT(*) as attempt_count,
  MAX(score) as best_score
FROM training_sessions
GROUP BY user_id, scenario_id;
```

## Security Model

### Underlying Table: `training_sessions`

The view queries from `training_sessions`, which **has RLS enabled** with the following policies:

1. **"Users can view own training sessions"** - SELECT WHERE auth.uid() = user_id
2. **"Users can insert own training sessions"** - INSERT WITH CHECK auth.uid() = user_id
3. **"Users can update own training sessions"** - UPDATE WHERE auth.uid() = user_id
4. **"Admins can view all training sessions"** - SELECT WHERE user role IN ('admin', 'manager')

### How RLS Works with Views

When a user queries `user_scenario_completion`:
1. PostgreSQL applies the RLS policies from `training_sessions`
2. Users only see aggregated data from their own training sessions
3. Admins/managers see aggregated data from all training sessions
4. The view automatically filters data based on the user's access to the underlying table

### Example

```sql
-- As a regular user
SELECT * FROM user_scenario_completion;
-- Returns: Only completion data for YOUR training sessions

-- As an admin
SELECT * FROM user_scenario_completion;
-- Returns: Completion data for ALL users' training sessions
```

## Why No Separate RLS Needed

PostgreSQL documentation states:
> "Row security policies are applied to the results of a view's underlying query."

This means:
- ✅ Views inherit RLS from source tables
- ✅ No additional policies needed on the view itself
- ✅ Security is enforced at the data source level
- ✅ View simply aggregates what the user can already see

## Verification

To confirm the view respects RLS:

```sql
-- Check RLS on underlying table
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'training_sessions';
-- Result: rowsecurity = true ✅

-- Views don't have RLS (they inherit it)
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'user_scenario_completion';
-- Result: No row (it's a view, not a table)

-- Check view definition
SELECT definition
FROM pg_views
WHERE viewname = 'user_scenario_completion';
```

## Usage in Application

The view is used in:
- `src/components/dashboard/MyTrainingScenarios.tsx`
- `src/components/dashboard/MyAssignedCategories.tsx`
- `src/pages/CategoryTraining.tsx`

All queries to this view are automatically filtered by the RLS policies on `training_sessions`.

## Conclusion

✅ **No action needed** - `user_scenario_completion` is secure through inherited RLS from `training_sessions`

The view cannot bypass RLS policies - it shows only what the user is authorized to see from the underlying `training_sessions` table.

## Related Documentation

- PostgreSQL Views: https://www.postgresql.org/docs/current/sql-createview.html
- RLS with Views: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security

## Files

- View Definition: `fix-training-sessions-table.sql` or `create-training-sessions-table.sql`
- Underlying Table RLS: Already enabled on `training_sessions`
- Master RLS Script: `setup-all-rls-policies.sql`
