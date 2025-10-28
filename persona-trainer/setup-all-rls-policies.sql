-- ============================================================================
-- COMPLETE RLS (Row Level Security) SETUP FOR SCENARIO SIM TRAINER
-- ============================================================================
-- This script enables and configures Row Level Security for all tables
-- in the Scenario Sim Trainer application.
--
-- IMPORTANT: Run this script in your Supabase SQL editor or via psql
--
-- Security Model:
-- - Users can view their own data and public content
-- - Admins and managers have elevated permissions
-- - Content visibility controlled via is_public flags
-- - Assignments determine access to private content
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
-- Protects user profile data (email, role, department)

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admins and managers can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can update user profiles" ON users;
DROP POLICY IF EXISTS "Users can be created during signup" ON users;
DROP POLICY IF EXISTS "Admins can create users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

CREATE POLICY "Users can view their own profile"
ON users FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins and managers can view all profiles"
ON users FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = (SELECT role FROM users WHERE id = auth.uid())
);

CREATE POLICY "Admins can update user profiles"
ON users FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can be created during signup"
ON users FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can create users"
ON users FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete users"
ON users FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);

-- ============================================================================
-- 2. CATEGORIES TABLE (Already configured - verifying)
-- ============================================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_categories_created_by ON categories(created_by);
CREATE INDEX IF NOT EXISTS idx_categories_is_public ON categories(is_public);
CREATE INDEX IF NOT EXISTS idx_categories_visibility ON categories(is_public, created_by);

-- ============================================================================
-- 3. TOPICS TABLE
-- ============================================================================

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view public topics" ON topics;
DROP POLICY IF EXISTS "Users can view their own topics" ON topics;
DROP POLICY IF EXISTS "Users can create topics" ON topics;
DROP POLICY IF EXISTS "Users can update their own topics" ON topics;
DROP POLICY IF EXISTS "Users can delete their own topics" ON topics;

CREATE POLICY "Users can view public topics"
ON topics FOR SELECT TO authenticated
USING (is_public = true);

CREATE POLICY "Users can view their own topics"
ON topics FOR SELECT TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Users can create topics"
ON topics FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own topics"
ON topics FOR UPDATE TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own topics"
ON topics FOR DELETE TO authenticated
USING (created_by = auth.uid());

CREATE INDEX IF NOT EXISTS idx_topics_created_by ON topics(created_by);
CREATE INDEX IF NOT EXISTS idx_topics_is_public ON topics(is_public);
CREATE INDEX IF NOT EXISTS idx_topics_visibility ON topics(is_public, created_by);
CREATE INDEX IF NOT EXISTS idx_topics_category_id ON topics(category_id);

-- ============================================================================
-- 4. SCENARIOS TABLE
-- ============================================================================

ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view public scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can view their own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can view scenarios for assigned content" ON scenarios;
DROP POLICY IF EXISTS "Users can create scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can update their own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can delete their own scenarios" ON scenarios;

CREATE POLICY "Users can view public scenarios"
ON scenarios FOR SELECT TO authenticated
USING (is_public = true);

CREATE POLICY "Users can view their own scenarios"
ON scenarios FOR SELECT TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Users can view scenarios for assigned content"
ON scenarios FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM content_assignments
    WHERE (
      (content_type = 'scenario' AND content_id = scenarios.id)
      OR (content_type = 'topic' AND content_id = scenarios.topic_id)
      OR (content_type = 'category' AND content_id = (
        SELECT category_id FROM topics WHERE id = scenarios.topic_id
      ))
    )
    AND (
      (assigned_to_type = 'user' AND assigned_to_id::uuid = auth.uid())
      OR auth.uid() = ANY(assigned_users::uuid[])
    )
  )
);

CREATE POLICY "Users can create scenarios"
ON scenarios FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own scenarios"
ON scenarios FOR UPDATE TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own scenarios"
ON scenarios FOR DELETE TO authenticated
USING (created_by = auth.uid());

CREATE INDEX IF NOT EXISTS idx_scenarios_created_by ON scenarios(created_by);
CREATE INDEX IF NOT EXISTS idx_scenarios_is_public ON scenarios(is_public);
CREATE INDEX IF NOT EXISTS idx_scenarios_visibility ON scenarios(is_public, created_by);
CREATE INDEX IF NOT EXISTS idx_scenarios_topic_id ON scenarios(topic_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_persona_id ON scenarios(persona_id);

-- ============================================================================
-- 5. PERSONAS TABLE (Already configured - verifying)
-- ============================================================================

ALTER TABLE personas ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_personas_created_by ON personas(created_by);
CREATE INDEX IF NOT EXISTS idx_personas_is_public ON personas(is_public);
CREATE INDEX IF NOT EXISTS idx_personas_visibility ON personas(is_public, created_by);

-- ============================================================================
-- 6. CONTENT_ASSIGNMENTS TABLE
-- ============================================================================

ALTER TABLE content_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view assignments assigned to them" ON content_assignments;
DROP POLICY IF EXISTS "Admins and managers can view all assignments" ON content_assignments;
DROP POLICY IF EXISTS "Admins and managers can create assignments" ON content_assignments;
DROP POLICY IF EXISTS "Admins and managers can update assignments" ON content_assignments;
DROP POLICY IF EXISTS "Users can update their assignment completion" ON content_assignments;
DROP POLICY IF EXISTS "Admins and managers can delete assignments" ON content_assignments;

CREATE POLICY "Users can view assignments assigned to them"
ON content_assignments FOR SELECT TO authenticated
USING (
  (assigned_to_type = 'user' AND assigned_to_id::uuid = auth.uid())
  OR auth.uid() = ANY(assigned_users::uuid[])
  OR assigned_by::uuid = auth.uid()
);

CREATE POLICY "Admins and managers can view all assignments"
ON content_assignments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

CREATE POLICY "Admins and managers can create assignments"
ON content_assignments FOR INSERT TO authenticated
WITH CHECK (
  assigned_by::uuid = auth.uid()
  AND EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

CREATE POLICY "Admins and managers can update assignments"
ON content_assignments FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (
      role = 'admin'
      OR (role = 'manager' AND auth.uid() = content_assignments.assigned_by::uuid)
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (
      role = 'admin'
      OR (role = 'manager' AND auth.uid() = content_assignments.assigned_by::uuid)
    )
  )
);

CREATE POLICY "Users can update their assignment completion"
ON content_assignments FOR UPDATE TO authenticated
USING (
  (assigned_to_type = 'user' AND assigned_to_id::uuid = auth.uid())
  OR auth.uid() = ANY(assigned_users::uuid[])
)
WITH CHECK (
  (assigned_to_type = 'user' AND assigned_to_id::uuid = auth.uid())
  OR auth.uid() = ANY(assigned_users::uuid[])
);

CREATE POLICY "Admins and managers can delete assignments"
ON content_assignments FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (
      role = 'admin'
      OR (role = 'manager' AND auth.uid() = content_assignments.assigned_by::uuid)
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_content_assignments_assigned_by ON content_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_content_assignments_assigned_to_id ON content_assignments(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_content_assignments_content ON content_assignments(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_assignments_assigned_users ON content_assignments USING GIN(assigned_users);

-- ============================================================================
-- 7. RUBRICS TABLE
-- ============================================================================

ALTER TABLE rubrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view rubrics for public scenarios" ON rubrics;
DROP POLICY IF EXISTS "Users can view rubrics for their own scenarios" ON rubrics;
DROP POLICY IF EXISTS "Users can view rubrics for assigned scenarios" ON rubrics;
DROP POLICY IF EXISTS "Admins and managers can view all rubrics" ON rubrics;
DROP POLICY IF EXISTS "Scenario creators can create rubrics" ON rubrics;
DROP POLICY IF EXISTS "Admins and managers can create rubrics" ON rubrics;
DROP POLICY IF EXISTS "Scenario creators can update rubrics" ON rubrics;
DROP POLICY IF EXISTS "Admins and managers can update rubrics" ON rubrics;
DROP POLICY IF EXISTS "Scenario creators can delete rubrics" ON rubrics;
DROP POLICY IF EXISTS "Admins and managers can delete rubrics" ON rubrics;

CREATE POLICY "Users can view rubrics for public scenarios"
ON rubrics FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM scenarios
    WHERE scenarios.id = rubrics.scenario_id AND scenarios.is_public = true
  )
);

CREATE POLICY "Users can view rubrics for their own scenarios"
ON rubrics FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM scenarios
    WHERE scenarios.id = rubrics.scenario_id AND scenarios.created_by = auth.uid()
  )
);

CREATE POLICY "Users can view rubrics for assigned scenarios"
ON rubrics FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM scenarios
    JOIN content_assignments ON (
      (content_assignments.content_type = 'scenario' AND content_assignments.content_id = scenarios.id)
      OR (content_assignments.content_type = 'topic' AND content_assignments.content_id = scenarios.topic_id)
      OR (content_assignments.content_type = 'category' AND content_assignments.content_id = (
        SELECT category_id FROM topics WHERE id = scenarios.topic_id
      ))
    )
    WHERE scenarios.id = rubrics.scenario_id
    AND (
      (content_assignments.assigned_to_type = 'user' AND content_assignments.assigned_to_id::uuid = auth.uid())
      OR auth.uid() = ANY(content_assignments.assigned_users::uuid[])
    )
  )
);

CREATE POLICY "Admins and managers can view all rubrics"
ON rubrics FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

CREATE POLICY "Scenario creators can create rubrics"
ON rubrics FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM scenarios
    WHERE scenarios.id = rubrics.scenario_id AND scenarios.created_by = auth.uid()
  )
);

CREATE POLICY "Admins and managers can create rubrics"
ON rubrics FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

CREATE POLICY "Scenario creators can update rubrics"
ON rubrics FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM scenarios
    WHERE scenarios.id = rubrics.scenario_id AND scenarios.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM scenarios
    WHERE scenarios.id = rubrics.scenario_id AND scenarios.created_by = auth.uid()
  )
);

CREATE POLICY "Admins and managers can update rubrics"
ON rubrics FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

CREATE POLICY "Scenario creators can delete rubrics"
ON rubrics FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM scenarios
    WHERE scenarios.id = rubrics.scenario_id AND scenarios.created_by = auth.uid()
  )
);

CREATE POLICY "Admins and managers can delete rubrics"
ON rubrics FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

CREATE INDEX IF NOT EXISTS idx_rubrics_scenario_id ON rubrics(scenario_id);

-- ============================================================================
-- 8. TRAINING_SESSIONS TABLE (Already configured - verifying)
-- ============================================================================

ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_training_sessions_user_id ON training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_scenario_id ON training_sessions(scenario_id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Display all RLS policies for verification
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  CASE
    WHEN LENGTH(qual) > 50 THEN LEFT(qual, 47) || '...'
    ELSE qual
  END as qual_preview
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

COMMIT;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- All tables now have Row Level Security enabled with appropriate policies.
--
-- Summary:
-- ✓ users - Protected user profiles
-- ✓ categories - Public/private visibility (already configured)
-- ✓ topics - Public/private visibility
-- ✓ scenarios - Public/private visibility with assignment access
-- ✓ personas - Public/private visibility (already configured)
-- ✓ content_assignments - Users see their assignments, admins see all
-- ✓ rubrics - Access based on scenario visibility
-- ✓ training_sessions - Users see their own sessions (already configured)
-- ============================================================================
