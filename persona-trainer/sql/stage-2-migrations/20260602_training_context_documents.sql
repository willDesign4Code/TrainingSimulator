-- Migration: Training Context Documents
-- Date: 2026-06-02
-- Purpose: Add training document upload and scenario linking capability.
--          Allows admins/managers to upload reference docs that get injected
--          into AI training session prompts for more realistic, grounded practice.

-- ============================================================================
-- FORWARD MIGRATION
-- ============================================================================

-- Step 1: Add document_mode column to scenarios
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS document_mode VARCHAR(20)
  DEFAULT 'augmented'
  CHECK (document_mode IN ('augmented', 'document_only'));

-- Step 2: Create training_documents table
CREATE TABLE IF NOT EXISTS training_documents (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT         NOT NULL,
  description   TEXT,
  file_type     VARCHAR(10)  NOT NULL CHECK (file_type IN ('pdf', 'docx', 'txt', 'md')),
  file_size     INTEGER      NOT NULL,
  file_url      TEXT         NOT NULL,
  extracted_text TEXT,
  character_count INTEGER,
  uploaded_by   UUID         NOT NULL REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_documents_uploaded_by ON training_documents(uploaded_by);

CREATE OR REPLACE FUNCTION update_training_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS training_documents_updated_at ON training_documents;
CREATE TRIGGER training_documents_updated_at
  BEFORE UPDATE ON training_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_training_documents_updated_at();

ALTER TABLE training_documents ENABLE ROW LEVEL SECURITY;

-- Step 3: Create scenario_documents junction table
CREATE TABLE IF NOT EXISTS scenario_documents (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID        NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  document_id UUID        NOT NULL REFERENCES training_documents(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (scenario_id, document_id)
);

CREATE INDEX IF NOT EXISTS idx_scenario_documents_scenario_id ON scenario_documents(scenario_id);
CREATE INDEX IF NOT EXISTS idx_scenario_documents_document_id ON scenario_documents(document_id);

ALTER TABLE scenario_documents ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS policies for training_documents

-- Admins and managers can read all documents directly
CREATE POLICY "Admins and managers can select training documents"
ON training_documents FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- Employees can read documents only when reached through a scenario link.
-- This allows the training session join query to succeed without exposing
-- the full document library to employees.
CREATE POLICY "Employees can read documents linked to scenarios"
ON training_documents FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM scenario_documents
    WHERE document_id = training_documents.id
  )
);

-- Admins and managers can upload new documents
CREATE POLICY "Admins and managers can insert training documents"
ON training_documents FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
  AND uploaded_by = auth.uid()
);

-- Admins can delete any document; managers can only delete their own
CREATE POLICY "Admins and managers can delete training documents"
ON training_documents FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  OR (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'manager')
    AND uploaded_by = auth.uid()
  )
);

-- Step 5: RLS policies for scenario_documents

-- All authenticated users can read junction rows.
-- Employees need this so the training session join query can resolve document IDs.
CREATE POLICY "All authenticated users can select scenario documents"
ON scenario_documents FOR SELECT TO authenticated
USING (true);

-- Only admins and managers can link documents to scenarios
CREATE POLICY "Admins and managers can insert scenario documents"
ON scenario_documents FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- Only admins and managers can remove document links
CREATE POLICY "Admins and managers can delete scenario documents"
ON scenario_documents FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'scenarios' AND column_name = 'document_mode';

SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('training_documents', 'scenario_documents')
ORDER BY table_name;

SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('training_documents', 'scenario_documents')
ORDER BY tablename, policyname;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- DROP TABLE IF EXISTS scenario_documents;
-- DROP TABLE IF EXISTS training_documents;
-- DROP FUNCTION IF EXISTS update_training_documents_updated_at();
-- ALTER TABLE scenarios DROP COLUMN IF EXISTS document_mode;
