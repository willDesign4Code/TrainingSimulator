-- Create training_sessions table to track user progress on scenarios
CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  session_data JSONB,
  score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('in_progress', 'completed', 'abandoned'))
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_id ON training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_scenario_id ON training_sessions(scenario_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_scenario ON training_sessions(user_id, scenario_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_status ON training_sessions(status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_training_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER training_sessions_updated_at
BEFORE UPDATE ON training_sessions
FOR EACH ROW
EXECUTE FUNCTION update_training_sessions_updated_at();

-- Enable Row Level Security
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own training sessions
CREATE POLICY "Users can view own training sessions"
  ON training_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own training sessions
CREATE POLICY "Users can insert own training sessions"
  ON training_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own training sessions
CREATE POLICY "Users can update own training sessions"
  ON training_sessions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins and managers can view all training sessions
CREATE POLICY "Admins can view all training sessions"
  ON training_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- Create a view for easy querying of user scenario completion status
CREATE OR REPLACE VIEW user_scenario_completion AS
SELECT
  user_id,
  scenario_id,
  MAX(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as is_completed,
  MAX(completed_at) as last_completed_at,
  COUNT(*) as attempt_count,
  MAX(score) as best_score
FROM training_sessions
GROUP BY user_id, scenario_id;

-- Add comments for documentation
COMMENT ON TABLE training_sessions IS 'Tracks user training sessions and completion status for scenarios';
COMMENT ON COLUMN training_sessions.status IS 'Current status: in_progress, completed, or abandoned';
COMMENT ON COLUMN training_sessions.session_data IS 'JSON data containing chat history, evaluation results, and other session information';
COMMENT ON COLUMN training_sessions.score IS 'Optional numerical score from 0-100 based on performance';
