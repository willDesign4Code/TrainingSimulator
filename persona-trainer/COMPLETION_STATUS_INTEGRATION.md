# Completion Status Integration Guide

## Overview
This guide explains how to integrate the actual completion status from the `training_sessions` table into the dashboard views. Currently, all scenarios show "Not Started" as a placeholder.

## Database Query Pattern

The `training_sessions` table tracks when users complete scenarios. Use this query pattern to fetch completion status:

```sql
-- Get completion status for a specific user and scenario
SELECT
  ts.status,
  ts.completed_at,
  ts.score
FROM training_sessions ts
WHERE ts.user_id = '[user_id]'
  AND ts.scenario_id = '[scenario_id]'
  AND ts.status = 'completed'
ORDER BY ts.completed_at DESC
LIMIT 1;
```

Or use the view for simplified queries:

```sql
-- Using the user_scenario_completion view
SELECT
  is_completed,
  last_completed_at,
  attempt_count,
  best_score
FROM user_scenario_completion
WHERE user_id = '[user_id]'
  AND scenario_id = '[scenario_id]';
```

## Integration Points

### 1. MyAssignedCategories Component

**File:** `src/components/dashboard/MyAssignedCategories.tsx`
**Line:** ~130 (in `fetchCategories` function)

**Current Code:**
```typescript
// TODO: Count completed scenarios (will implement after adding training_sessions table)
const completedCount = 0;
```

**Updated Code:**
```typescript
// Count completed scenarios using the view
const { data: completionData } = await supabase
  .from('user_scenario_completion')
  .select('scenario_id')
  .in('scenario_id', scenarioIds) // scenarioIds from scenarios query
  .eq('user_id', user?.id)
  .eq('is_completed', 1);

const completedCount = completionData?.length || 0;
```

**Full Context:**
```typescript
// Fetch scenarios for these topics
const { data: scenariosData } = await supabase
  .from('scenarios')
  .select('id')
  .in('topic_id', topicIds);

const scenarioIds = scenariosData?.map(s => s.id) || [];

// Count completed scenarios
const { data: completionData } = await supabase
  .from('user_scenario_completion')
  .select('scenario_id')
  .in('scenario_id', scenarioIds)
  .eq('user_id', user?.id)
  .eq('is_completed', 1);

const completedCount = completionData?.length || 0;
const scenarioCount = scenarioIds.length;
const progress = scenarioCount ? (completedCount / scenarioCount) * 100 : 0;
```

### 2. MyTrainingScenarios Component

**File:** `src/components/dashboard/MyTrainingScenarios.tsx`
**Line:** ~103 (in `fetchScenarios` function)

**Current Code:**
```typescript
// TODO: Fetch completion status from training_sessions table (will implement later)
// For now, all scenarios are "Not Started"
```

**Updated Code:**
```typescript
// Fetch completion status for all scenarios
const scenarioIds = scenariosData.map(s => s.id);

const { data: completionData } = await supabase
  .from('user_scenario_completion')
  .select('scenario_id, is_completed, last_completed_at')
  .in('scenario_id', scenarioIds)
  .eq('user_id', user?.id);

// Create a map for quick lookup
const completionMap = new Map(
  completionData?.map(c => [c.scenario_id, c]) || []
);
```

**Full Context:**
```typescript
// Fetch scenarios for these topics
const { data: scenariosData } = await supabase
  .from('scenarios')
  .select('id, title, topic_id, created_at, updated_at')
  .in('topic_id', topicIds);

if (!scenariosData) {
  setScenarios([]);
  setLoading(false);
  return;
}

// Fetch completion status
const scenarioIds = scenariosData.map(s => s.id);
const { data: completionData } = await supabase
  .from('user_scenario_completion')
  .select('scenario_id, is_completed, last_completed_at')
  .in('scenario_id', scenarioIds)
  .eq('user_id', user?.id);

const completionMap = new Map(
  completionData?.map(c => [c.scenario_id, c]) || []
);

// Map scenarios with completion status
const scenariosWithDetails = scenariosData.map(scenario => {
  const topic = topicsData.find(t => t.id === scenario.topic_id);
  const category = categoriesData?.find(c => c.id === topic?.category_id);
  const assignment = assignmentsData.find(a => a.content_id === category?.id);
  const completion = completionMap.get(scenario.id);

  return {
    id: scenario.id,
    title: scenario.title,
    category_name: category?.name || 'Unknown',
    topic_name: topic?.name || 'Unknown',
    status: (completion?.is_completed ? 'Completed' : 'Not Started') as const,
    updated_at: scenario.updated_at,
    created_at: scenario.created_at,
    assigned_date: assignment?.created_at || scenario.created_at
  };
});
```

### 3. CategoryDetails Component (User View)

**File:** `src/pages/CategoryDetails.tsx`
**Line:** ~143 (in `fetchData` useEffect)

**Current Code:**
```typescript
// TODO: Fetch completion status from training_sessions table
const scenarios: ScenarioData[] = (scenariosData || []).map(s => ({
  id: s.id,
  title: s.title,
  status: 'Not Started' as const,
  updated_at: s.updated_at
}));
```

**Updated Code:**
```typescript
// Fetch completion status for these scenarios
const scenarioIds = (scenariosData || []).map(s => s.id);

const { data: completionData } = await supabase
  .from('user_scenario_completion')
  .select('scenario_id, is_completed')
  .in('scenario_id', scenarioIds)
  .eq('user_id', userProfile?.id);

const completionMap = new Map(
  completionData?.map(c => [c.scenario_id, c.is_completed]) || []
);

const scenarios: ScenarioData[] = (scenariosData || []).map(s => ({
  id: s.id,
  title: s.title,
  status: (completionMap.get(s.id) ? 'Completed' : 'Not Started') as const,
  updated_at: s.updated_at
}));
```

## Testing After Integration

After implementing these changes, test the following scenarios:

### Test 1: Fresh User (No Completions)
1. Login as a new user
2. Verify all scenarios show "Not Started"
3. Verify category progress shows 0%

### Test 2: Complete a Training
1. Login as a user
2. Start a training scenario
3. Complete it (click "End Session")
4. Navigate back to dashboard
5. **Expected Results:**
   - Scenario should show "Completed" status with green chip
   - Category progress bar should update
   - "Start Training" button should change to "Retake Training"

### Test 3: Partial Completion
1. User with some completed scenarios
2. Verify progress bar shows correct percentage
3. Verify scenario table shows mixed statuses correctly

### Test 4: Multiple Attempts
1. Complete a scenario multiple times
2. Verify it still shows as "Completed" (not duplicated)
3. Check database that multiple sessions are recorded

## Additional Features to Consider

### 1. Show Last Completion Date
Instead of just showing "Completed", show when:

```typescript
<Chip
  label={
    scenario.status === 'Completed'
      ? `Completed ${new Date(completion.last_completed_at).toLocaleDateString()}`
      : 'Not Started'
  }
  size="small"
  color={scenario.status === 'Completed' ? 'success' : 'default'}
/>
```

### 2. Show Best Score
Display the user's best score on completed scenarios:

```typescript
{completion?.best_score && (
  <Chip
    label={`Best Score: ${completion.best_score}%`}
    size="small"
    color="primary"
    variant="outlined"
  />
)}
```

### 3. Show Attempt Count
Show how many times user has attempted:

```typescript
<Typography variant="caption" color="text.secondary">
  {completion?.attempt_count || 0} attempt{completion?.attempt_count !== 1 ? 's' : ''}
</Typography>
```

### 4. Refresh Data After Training
Add a callback to refresh the dashboard data when training modal closes:

```typescript
// In Dashboard.tsx
const handleTrainingComplete = () => {
  // Trigger refresh of data
  // Could use a key change or call a refresh function
};

// Pass to modal
<TrainingChatModal
  {...props}
  onTrainingComplete={handleTrainingComplete}
/>
```

## Performance Optimization

For better performance with large datasets:

### Use Aggregation in a Single Query
Instead of multiple queries, use Postgres aggregation:

```typescript
const { data: categoryProgress } = await supabase
  .rpc('get_category_progress', {
    p_user_id: user.id,
    p_category_ids: categoryIds
  });
```

Create the RPC function:

```sql
CREATE OR REPLACE FUNCTION get_category_progress(
  p_user_id UUID,
  p_category_ids UUID[]
)
RETURNS TABLE (
  category_id UUID,
  total_scenarios BIGINT,
  completed_scenarios BIGINT,
  progress_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id as category_id,
    COUNT(DISTINCT s.id) as total_scenarios,
    COUNT(DISTINCT CASE WHEN usc.is_completed = 1 THEN s.id END) as completed_scenarios,
    ROUND(
      (COUNT(DISTINCT CASE WHEN usc.is_completed = 1 THEN s.id END)::NUMERIC /
       NULLIF(COUNT(DISTINCT s.id), 0) * 100),
      2
    ) as progress_percentage
  FROM categories c
  LEFT JOIN topics t ON t.category_id = c.id
  LEFT JOIN scenarios s ON s.topic_id = t.id
  LEFT JOIN user_scenario_completion usc
    ON usc.scenario_id = s.id
    AND usc.user_id = p_user_id
  WHERE c.id = ANY(p_category_ids)
  GROUP BY c.id;
END;
$$ LANGUAGE plpgsql;
```

## Troubleshooting

### Completion Status Not Updating
1. Check that the `training_sessions` table was created successfully
2. Verify RLS policies allow the current user to read their sessions
3. Check browser console for any Supabase errors
4. Verify the training modal is successfully saving sessions

### Progress Shows Wrong Percentage
1. Verify scenario count query includes all scenarios
2. Check that completion query uses same scenario IDs
3. Ensure no duplicate scenarios in count

### Performance Issues
1. Verify indexes exist on `training_sessions` table
2. Use the `user_scenario_completion` view instead of raw table
3. Consider implementing the RPC function for aggregation
4. Add caching with React Query or SWR if needed

## Summary

After implementing these changes:
- ✅ Real completion status from database
- ✅ Accurate progress bars
- ✅ Proper "Start Training" vs "Retake Training" buttons
- ✅ Better user experience with actual data

The implementation is straightforward - fetch completion data and merge it with scenario data using Maps for efficient lookups.
