# Product Requirements Document: Training Context Documents

**Version:** 1.1 (Revised)
**Date:** 2025-11-06
**Status:** Draft - Revised Architecture
**Owner:** Product Team
**Contributors:** Engineering, Design

---

## Revision Summary (v1.1)

**Key Architecture Decisions:**
1. ✅ **v1 Scope**: Scenario-level documents only (Categories/Topics in v2)
2. ✅ **Access Model**: All documents visible to all Admins/Managers (no public/private toggle)
3. ✅ **Upload UX**: Hybrid approach - centralized library + quick upload in Scenario dialog
4. ✅ **Inheritance**: Automatic cascading from Category → Topic → Scenario (v2 feature)
5. ✅ **Primary Use Case**: Widely-used policies with support for scenario-specific documents

---

## Executive Summary

This feature enables Admins and Managers to upload supplementary documents (PDF, Word, text, markdown) that provide additional context to AI trainers during training conversations. These documents can include company policies, insurance plans, industry-specific knowledge, or other reference materials that enhance the realism and effectiveness of AI-powered training scenarios.

**v1 Focus**: Scenario-level document management with centralized library for reusability.

### Business Value
- **Improved Training Realism**: AI trainers can reference actual company policies and procedures
- **Reduced Setup Time**: No need to manually copy-paste policies into scenario details
- **Consistency**: Same source documents used across multiple scenarios
- **Scalability**: Easy to update policies without modifying multiple scenarios
- **Better Trainee Performance**: More accurate, policy-compliant AI interactions

---

## Goals & Objectives

### Primary Goals
1. Allow Admins/Managers to upload documents as supplementary training context
2. Associate documents with specific scenarios
3. Inject document content into AI system prompts transparently
4. Provide flexibility between "augmented" and "document-only" training modes

### Non-Goals (Deferred to v2)
- **Category/Topic-level documents** with automatic inheritance (v2)
- **Persona-specific documents** (v2)
- **Public/Private visibility** for documents (all Admins/Managers see all documents in v1)
- **Document versioning** and history tracking (v2+)
- **Trainee-visible document libraries** (v2+)
- **Real-time document editing** (v2+)
- **Advanced permissions** (department-specific documents) (v2+)

### Success Criteria
- Admins/Managers can upload documents up to 10MB
- Documents are securely stored and accessible only to authorized users
- AI conversations incorporate document content naturally
- System handles token limits gracefully
- Documents can be managed (view, delete, replace) easily

---

## User Personas

### Admin User
- **Role**: System administrator, content curator
- **Needs**: Upload policy documents, manage organization-wide knowledge, ensure compliance
- **Pain Points**: Keeping training content up-to-date with policy changes

### Manager User
- **Role**: Department manager, team lead
- **Needs**: Upload team-specific procedures, customize training for their department
- **Pain Points**: Training scenarios that don't reflect current processes

### Employee (Trainee)
- **Role**: End user taking training
- **Needs**: Realistic training conversations that reflect actual job scenarios
- **Impact**: Experiences more authentic AI interactions (doesn't directly interact with documents)

---

## Feature Requirements

### Functional Requirements

#### FR-1: Document Upload (Hybrid Approach)
- **FR-1.1**: System accepts PDF (.pdf), Word (.docx), Text (.txt), and Markdown (.md) files
- **FR-1.2**: Maximum file size: 10MB per document
- **FR-1.3**: Files are uploaded to Supabase Storage with unique identifiers
- **FR-1.4**: System extracts text content from PDF/Word files for AI consumption
- **FR-1.5**: Upload interface validates file type and size before submission
- **FR-1.6**: **Two upload paths**:
  - **Path A**: Upload from "Training Documents" page → adds to library → link to scenarios later
  - **Path B**: Quick upload from Scenario dialog → adds to library AND auto-links to scenario

#### FR-2: Document Metadata Management
- **FR-2.1**: Each document has: name, description, file type, upload date, uploaded by user
- **FR-2.2**: Documents are stored in a `training_documents` database table
- **FR-2.3**: Document metadata includes extracted text content (for AI), file URL (for download)
- **FR-2.4**: System tracks file size and character count
- **FR-2.5**: All documents visible to all Admins/Managers (no public/private toggle in v1)

#### FR-3: Scenario Association
- **FR-3.1**: Documents can be linked to one or more scenarios (many-to-many relationship)
- **FR-3.2**: Scenarios can have zero or more associated documents
- **FR-3.3**: Association managed through `scenario_documents` junction table
- **FR-3.4**: UI shows which documents are linked to each scenario
- **FR-3.5**: UI shows which scenarios use each document

#### FR-4: Document Display Modes
- **FR-4.1**: Scenario has a "Document Mode" setting with two options:
  - **Augmented Mode** (default): AI uses scenario details + persona + documents
  - **Document-Only Mode**: AI relies primarily on documents, minimal scenario details
- **FR-4.2**: Mode is configurable per scenario (stored in scenarios table)
- **FR-4.3**: UI clearly indicates which mode is active for each scenario

#### FR-5: AI Integration
- **FR-5.1**: When training session starts, system retrieves all associated documents
- **FR-5.2**: Document text content is injected into system prompt before conversation begins
- **FR-5.3**: In Augmented Mode: Documents added as "Additional Knowledge" section
- **FR-5.4**: In Document-Only Mode: Documents replace scenario details with minimal persona context
- **FR-5.5**: System handles OpenAI token limits (truncate or warn if exceeded)

#### FR-6: Document Management UI
- **FR-6.1**: New "Training Documents" page accessible only to Admin/Manager
- **FR-6.2**: Table view showing all documents with: name, type, size, upload date, # scenarios using it
- **FR-6.3**: Upload button opens dialog with file picker and metadata form
- **FR-6.4**: Delete action with confirmation (warns if document is used by active scenarios)
- **FR-6.5**: Download action to retrieve original file
- **FR-6.6**: Search/filter by name, type, or associated scenarios

#### FR-7: Scenario Configuration UI
- **FR-7.1**: Scenarios page adds "Documents" section to create/edit dialog
- **FR-7.2**: Multi-select dropdown or chip selector to link documents
- **FR-7.3**: Toggle/radio to select Augmented vs Document-Only mode
- **FR-7.4**: Visual indicator showing how many documents are linked
- **FR-7.5**: Preview capability to see combined prompt before saving

### Non-Functional Requirements

#### NFR-1: Security
- **NFR-1.1**: Only Admin and Manager roles can upload/manage documents
- **NFR-1.2**: Row-Level Security (RLS) policies prevent unauthorized access
- **NFR-1.3**: Supabase Storage bucket policies restrict access to authenticated admin/manager users
- **NFR-1.4**: File uploads scanned for malicious content (basic MIME type validation)
- **NFR-1.5**: Document text content stored in database (not accessible via public URLs)

#### NFR-2: Performance
- **NFR-2.1**: Document upload completes within 10 seconds for 10MB files
- **NFR-2.2**: Text extraction from PDF/Word completes within 5 seconds
- **NFR-2.3**: Training session startup delay < 2 seconds even with multiple documents
- **NFR-2.4**: Document list page loads within 2 seconds (paginated if > 100 documents)

#### NFR-3: Scalability
- **NFR-3.1**: System supports up to 1,000 documents per organization
- **NFR-3.2**: Scenario can have up to 10 associated documents
- **NFR-3.3**: Combined document text limited to ~8,000 tokens (~32,000 characters)

#### NFR-4: Usability
- **NFR-4.1**: Drag-and-drop file upload supported
- **NFR-4.2**: Clear error messages for invalid files, size limits, token limits
- **NFR-4.3**: Progress indicator during upload and text extraction
- **NFR-4.4**: Responsive design for document management on tablet/desktop

---

## Technical Architecture

### Database Schema

#### New Table: `training_documents`
```sql
CREATE TABLE training_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  file_type VARCHAR(50) NOT NULL, -- 'pdf', 'docx', 'txt', 'md'
  file_size INTEGER NOT NULL, -- in bytes
  file_url TEXT NOT NULL, -- Supabase Storage URL
  extracted_text TEXT, -- Full text content for AI
  character_count INTEGER, -- Length of extracted_text
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_training_documents_uploaded_by ON training_documents(uploaded_by);
CREATE INDEX idx_training_documents_created_at ON training_documents(created_at DESC);

-- RLS Policies
ALTER TABLE training_documents ENABLE ROW LEVEL SECURITY;

-- Only admin/manager can view
CREATE POLICY "Admins and managers can view all documents"
  ON training_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- Only admin/manager can insert
CREATE POLICY "Admins and managers can insert documents"
  ON training_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- Only admin/manager can delete
CREATE POLICY "Admins and managers can delete documents"
  ON training_documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );
```

#### New Table: `scenario_documents` (Junction Table)
```sql
CREATE TABLE scenario_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES training_documents(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(scenario_id, document_id)
);

-- Indexes
CREATE INDEX idx_scenario_documents_scenario_id ON scenario_documents(scenario_id);
CREATE INDEX idx_scenario_documents_document_id ON scenario_documents(document_id);

-- RLS Policies
ALTER TABLE scenario_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and managers can manage scenario documents"
  ON scenario_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- Employees can view associations when starting training
CREATE POLICY "Users can view scenario documents for their training"
  ON scenario_documents FOR SELECT
  USING (true); -- This is safe because document content is not exposed, only the association
```

> **Note - v2 Expansion**: In v2, this table will be replaced with a more flexible `content_documents` table that supports linking documents to Categories, Topics, and Scenarios with automatic inheritance. See "Future Enhancements" section for details.

#### Update: `scenarios` Table
```sql
-- Add new column for document mode
ALTER TABLE scenarios
ADD COLUMN document_mode VARCHAR(20) DEFAULT 'augmented' CHECK (document_mode IN ('augmented', 'document_only'));
```

### File Storage

#### Supabase Storage Bucket: `training-documents`
```javascript
// Bucket Configuration
{
  name: 'training-documents',
  public: false, // Private bucket
  fileSizeLimit: 10485760, // 10MB in bytes
  allowedMimeTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'text/plain',
    'text/markdown'
  ]
}

// Storage Policy (RLS)
// Only admin/manager can upload
CREATE POLICY "Admins and managers can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'training-documents' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

// Only admin/manager can download
CREATE POLICY "Admins and managers can download documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'training-documents' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );
```

### TypeScript Types

```typescript
// src/services/supabase/client.ts

export type TrainingDocument = {
  id: string;
  name: string;
  description?: string;
  file_type: 'pdf' | 'docx' | 'txt' | 'md';
  file_size: number;
  file_url: string;
  extracted_text?: string;
  character_count?: number;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
};

export type ScenarioDocument = {
  id: string;
  scenario_id: string;
  document_id: string;
  created_at: string;
};

// Update existing Scenario type
export type Scenario = {
  // ... existing fields
  document_mode: 'augmented' | 'document_only';
};
```

### AI Integration Flow

```typescript
// Updated system prompt construction in TrainingChatModal.tsx

// 1. Fetch scenario with documents
const { data: scenario, error } = await supabase
  .from('scenarios')
  .select(`
    *,
    personas(*),
    scenario_documents(
      training_documents(*)
    )
  `)
  .eq('id', scenarioId)
  .single();

// 2. Extract document text
const documents = scenario.scenario_documents?.map(sd => sd.training_documents) || [];
const combinedDocumentText = documents
  .map(doc => doc.extracted_text)
  .filter(Boolean)
  .join('\n\n---\n\n');

// 3. Build system prompt based on mode
let systemPrompt: string;

if (scenario.document_mode === 'document_only') {
  // Minimal persona, focus on documents
  systemPrompt = `
You are a training AI roleplaying as ${persona.name}, a ${persona.age}-year-old ${persona.occupation}.

Communication Style: ${persona.communication_style}
Emotional State: ${persona.emotional_state}

CRITICAL INSTRUCTIONS:
- Base your conversation PRIMARILY on the following reference documents
- Stay in character as ${persona.name}
- Keep responses concise (2-4 sentences)
- Do NOT break character or reveal you are an AI

REFERENCE DOCUMENTS:
${combinedDocumentText}

Scenario Context: ${scenario.title}
`;
} else {
  // Augmented mode (default) - full scenario + documents
  systemPrompt = openAIService.createTrainingSystemPrompt(persona, scenario) + `

ADDITIONAL KNOWLEDGE:
The following documents provide supplementary information you should reference during the conversation:

${combinedDocumentText}
`;
}

// 4. Token limit handling
const estimatedTokens = systemPrompt.length / 4; // Rough estimate
if (estimatedTokens > 8000) {
  console.warn('System prompt exceeds recommended token limit');
  // Option 1: Truncate documents
  // Option 2: Show warning to admin
  // Option 3: Summarize documents with AI
}
```

---

## User Stories & Acceptance Criteria

### Epic 1: Document Upload & Management

#### Story 1.1: Upload Training Document
**As an** Admin or Manager
**I want to** upload a document (PDF, Word, text, markdown)
**So that** I can provide additional context for AI training conversations

**Acceptance Criteria:**
- [ ] Given I am logged in as Admin or Manager
- [ ] When I navigate to the "Training Documents" page
- [ ] Then I see an "Upload Document" button
- [ ] When I click "Upload Document"
- [ ] Then a dialog opens with file picker and metadata form
- [ ] When I select a file and fill in name/description
- [ ] Then the system validates file type (pdf, docx, txt, md) and size (≤10MB)
- [ ] When validation passes and I click "Upload"
- [ ] Then the file is uploaded to Supabase Storage
- [ ] And the text content is extracted (for PDF/Word)
- [ ] And a record is created in `training_documents` table
- [ ] And I see a success message
- [ ] And the document appears in the documents list

**Edge Cases:**
- [ ] Invalid file type shows error: "Unsupported file type. Please upload PDF, Word, Text, or Markdown."
- [ ] File > 10MB shows error: "File exceeds 10MB limit. Please choose a smaller file."
- [ ] Upload failure shows error: "Upload failed. Please try again."
- [ ] Duplicate names allowed (with warning or auto-rename)
- [ ] Text extraction failure logs error but allows upload (manual text entry option)

---

#### Story 1.2: View Training Documents
**As an** Admin or Manager
**I want to** view all uploaded training documents
**So that** I can see what reference materials are available

**Acceptance Criteria:**
- [ ] Given I am logged in as Admin or Manager
- [ ] When I navigate to "Training Documents" page
- [ ] Then I see a table/grid of all documents
- [ ] Each document shows: name, file type icon, size, upload date, uploaded by, # scenarios using it
- [ ] The list is sortable by name, date, or usage count
- [ ] The list is searchable by document name
- [ ] The list is filterable by file type
- [ ] Pagination is used if > 50 documents

**Edge Cases:**
- [ ] Empty state shows: "No documents uploaded yet. Click 'Upload Document' to get started."
- [ ] If uploaded by user no longer exists, shows "Unknown User"

---

#### Story 1.3: Delete Training Document
**As an** Admin or Manager
**I want to** delete a training document
**So that** I can remove outdated or incorrect reference materials

**Acceptance Criteria:**
- [ ] Given I am viewing the training documents list
- [ ] When I click the delete icon for a document
- [ ] Then a confirmation dialog appears
- [ ] The dialog shows: "Delete [document name]?" and lists scenarios using it (if any)
- [ ] If document is used by scenarios, dialog warns: "This document is used by X scenario(s). They will no longer have access to this reference material."
- [ ] When I confirm deletion
- [ ] Then the document record is deleted from `training_documents`
- [ ] And the file is removed from Supabase Storage
- [ ] And all entries in `scenario_documents` are removed (cascade)
- [ ] And I see success message: "Document deleted successfully"

**Edge Cases:**
- [ ] If deletion fails (file in use, permission error), show: "Unable to delete document. Please try again."
- [ ] Cannot undo deletion (future: add soft delete)

---

#### Story 1.4: Download Training Document
**As an** Admin or Manager
**I want to** download the original file of a training document
**So that** I can review the content or share it with others

**Acceptance Criteria:**
- [ ] Given I am viewing the training documents list
- [ ] When I click the download icon for a document
- [ ] Then the original file is downloaded to my computer
- [ ] The filename matches the uploaded filename
- [ ] The file is identical to the uploaded version (byte-for-byte)

**Edge Cases:**
- [ ] If file no longer exists in storage, show error: "File not found. It may have been deleted."
- [ ] Large files (>5MB) show download progress indicator

---

#### Story 1.5: Quick Upload from Scenario Dialog
**As an** Admin or Manager
**I want to** upload a document directly while creating/editing a scenario
**So that** I can quickly add reference materials without navigating away

**Acceptance Criteria:**
- [ ] Given I am creating or editing a scenario
- [ ] When I open the scenario dialog
- [ ] Then I see a "Training Documents" section with a multi-select dropdown
- [ ] And I see an "Upload New Document" button next to the dropdown
- [ ] When I click "Upload New Document"
- [ ] Then a compact upload dialog opens (similar to main upload dialog)
- [ ] When I successfully upload the document
- [ ] Then the document is added to the `training_documents` table
- [ ] And the document is automatically selected in the scenario's multi-select dropdown
- [ ] And the document is automatically linked to this scenario when I save
- [ ] And the upload dialog closes
- [ ] And I see the new document as a chip/tag in the scenario dialog

**Edge Cases:**
- [ ] Same validation rules as Story 1.1 (file type, size limits)
- [ ] If upload fails, show error but keep scenario dialog open
- [ ] Document name defaults to filename but is editable
- [ ] Newly uploaded document is now available in dropdown for other scenarios

---

### Epic 2: Scenario-Document Association

#### Story 2.1: Link Documents to Scenario
**As an** Admin or Manager
**I want to** associate training documents with a scenario
**So that** the AI trainer has access to relevant reference materials

**Acceptance Criteria:**
- [ ] Given I am creating or editing a scenario
- [ ] When I open the scenario dialog
- [ ] Then I see a "Training Documents" section
- [ ] The section has a multi-select dropdown listing all available documents
- [ ] When I select one or more documents
- [ ] Then they appear as chips/tags below the dropdown
- [ ] When I save the scenario
- [ ] Then entries are created in `scenario_documents` table
- [ ] And the scenario shows "X documents" badge in the scenarios list

**Edge Cases:**
- [ ] If no documents exist, show: "No documents available. Upload documents first."
- [ ] Can select up to 10 documents (enforced by UI)
- [ ] Selecting > 10 shows warning: "Maximum 10 documents per scenario. Please deselect some."
- [ ] Removing a document chip removes the association

---

#### Story 2.2: Configure Document Mode
**As an** Admin or Manager
**I want to** choose between "Augmented" and "Document-Only" mode for a scenario
**So that** I can control how heavily the AI relies on the documents

**Acceptance Criteria:**
- [ ] Given I am creating or editing a scenario
- [ ] When I open the scenario dialog
- [ ] Then I see a "Document Mode" setting
- [ ] The setting has two radio options:
  - [ ] "Augmented (Default)" - "Use documents as additional knowledge alongside scenario details"
  - [ ] "Document-Only" - "AI relies primarily on documents with minimal scenario context"
- [ ] "Augmented" is selected by default for new scenarios
- [ ] When I save the scenario
- [ ] Then `scenarios.document_mode` is set to 'augmented' or 'document_only'

**Edge Cases:**
- [ ] If no documents are linked, mode setting is disabled/grayed out
- [ ] Tooltip explains the difference between modes
- [ ] Changing mode shows preview of how prompt will be structured (future enhancement)

---

#### Story 2.3: View Document Usage
**As an** Admin or Manager
**I want to** see which scenarios use a specific document
**So that** I can understand the impact of editing or deleting it

**Acceptance Criteria:**
- [ ] Given I am viewing the training documents list
- [ ] When I click on a document row to expand/view details
- [ ] Then I see a list of scenarios that use this document
- [ ] Each scenario shows: title, topic, persona, created date
- [ ] I can click on a scenario to navigate to edit it
- [ ] The count of scenarios is displayed in the main list view

**Edge Cases:**
- [ ] If no scenarios use the document, show: "Not used by any scenarios yet"
- [ ] List is paginated if > 20 scenarios

---

### Epic 3: AI Integration

#### Story 3.1: Inject Documents into System Prompt (Augmented Mode)
**As a** System
**I want to** append document content to the system prompt
**So that** the AI trainer can reference it during conversations

**Acceptance Criteria:**
- [ ] Given a scenario has associated documents
- [ ] And the scenario's `document_mode` is 'augmented'
- [ ] When a training session starts
- [ ] Then the system fetches all linked documents via join query
- [ ] And concatenates all `extracted_text` fields with separators
- [ ] And appends to the standard system prompt with header: "ADDITIONAL KNOWLEDGE:"
- [ ] And sends the combined prompt to OpenAI API as the system message

**Edge Cases:**
- [ ] If `extracted_text` is null for a document, skip it (log warning)
- [ ] If combined text > 32,000 characters (~8,000 tokens), truncate with warning
- [ ] Truncation prioritizes documents in the order they were added (future: allow priority setting)

---

#### Story 3.2: Use Documents as Primary Context (Document-Only Mode)
**As a** System
**I want to** build a minimal system prompt focused on documents
**So that** the AI trainer prioritizes reference materials over scenario details

**Acceptance Criteria:**
- [ ] Given a scenario has associated documents
- [ ] And the scenario's `document_mode` is 'document_only'
- [ ] When a training session starts
- [ ] Then the system builds a simplified system prompt with:
  - [ ] Minimal persona info (name, age, occupation, communication style, emotional state)
  - [ ] Section header: "REFERENCE DOCUMENTS:"
  - [ ] All document `extracted_text` concatenated
  - [ ] Brief scenario title/context
  - [ ] Instructions to stay in character
- [ ] The prompt omits verbose persona details and scenario details
- [ ] Sends this streamlined prompt to OpenAI API

**Edge Cases:**
- [ ] If no documents are linked, fallback to augmented mode (log warning)
- [ ] Token limit handling same as augmented mode

---

#### Story 3.3: Handle Token Limits
**As a** System
**I want to** gracefully handle system prompts that exceed OpenAI token limits
**So that** training sessions don't fail due to excessive document length

**Acceptance Criteria:**
- [ ] Given document content is being added to system prompt
- [ ] When the estimated token count > 8,000 tokens (~32,000 characters)
- [ ] Then the system logs a warning to console
- [ ] And truncates the document text to fit within limits
- [ ] And appends a note: "(Document content truncated due to length)"
- [ ] And the training session proceeds normally

**Edge Cases:**
- [ ] Admin/Manager sees warning in UI when linking documents if total > limit (future)
- [ ] Truncation happens at document boundaries (not mid-document)
- [ ] Future: Add option to summarize documents with AI instead of truncating

---

### Epic 4: Document Viewing & Audit

#### Story 4.1: Preview Document Text
**As an** Admin or Manager
**I want to** preview the extracted text of a document
**So that** I can verify it was processed correctly

**Acceptance Criteria:**
- [ ] Given I am viewing the training documents list
- [ ] When I click "Preview" on a document
- [ ] Then a dialog opens showing the `extracted_text` content
- [ ] The text is displayed in a scrollable, monospace font
- [ ] The dialog shows character count and estimated token count
- [ ] Dialog has a "Close" button

**Edge Cases:**
- [ ] If `extracted_text` is null, show: "Text extraction failed or is pending."
- [ ] Very long text (>10,000 chars) is virtualized for performance
- [ ] Code/markdown is syntax-highlighted (nice to have)

---

#### Story 4.2: Audit Document Usage in Sessions
**As an** Admin
**I want to** see which training sessions used documents
**So that** I can measure the impact of reference materials (future)

**Acceptance Criteria:**
- [ ] (Deferred to v2) Training sessions record which documents were used
- [ ] (Deferred to v2) Document detail page shows "Used in X training sessions"
- [ ] (Deferred to v2) Can view session performance metrics filtered by document usage

---

## UI/UX Considerations

### New Page: Training Documents (`/training-documents`)

**Layout:**
- Header: "Training Documents" + "Upload Document" button (top right)
- Search bar and filter dropdowns (below header)
- Table with columns:
  - Icon (file type)
  - Name (clickable to preview)
  - Description (truncated)
  - File Type (badge)
  - Size (formatted: KB/MB)
  - Uploaded By
  - Upload Date
  - Scenarios Using (number, clickable)
  - Actions (download, delete icons)
- Pagination controls (bottom)

**Upload Dialog:**
- Title: "Upload Training Document"
- File picker (drag-and-drop zone)
- Text fields: Name (required), Description (optional)
- Supported formats hint: "PDF, Word (.docx), Text, Markdown"
- Size limit hint: "Maximum 10MB"
- Upload progress bar (during upload)
- "Cancel" and "Upload" buttons

**Delete Confirmation Dialog:**
- Title: "Delete Training Document?"
- Content: "Are you sure you want to delete '[Document Name]'?"
- Warning (if used): "This document is used by X scenario(s) and will be removed from them."
- List of affected scenarios (if any)
- "Cancel" and "Delete" buttons (red)

**Preview Dialog:**
- Title: "[Document Name] - Text Preview"
- Metadata: Type, Size, Characters, Est. Tokens
- Scrollable text area (white background, monospace font)
- "Download Original" and "Close" buttons

### Updated Page: Scenarios (`/scenarios`)

**Scenario Dialog Additions:**

Add a new section after "Persona" dropdown:

**Training Documents** (collapsible section)
- Label: "Training Documents (Optional)"
- Multi-select dropdown: "Select documents..."
  - Lists all documents by name
  - Shows file type icon next to each
- Selected documents shown as chips (removable)
- Document count badge: "3 documents selected"

**Document Mode** (radio group)
- Label: "How should the AI use these documents?"
- Option 1:
  - Radio: "Augmented (Recommended)"
  - Helper text: "Documents supplement scenario details and persona background"
- Option 2:
  - Radio: "Document-Only"
  - Helper text: "AI relies primarily on documents with minimal scenario context"

**Scenarios List View:**
- Add "Documents" column showing count badge (e.g., "3 docs")
- Filter dropdown: "Filter by documents" (Has documents / No documents)

### Navigation

Add new navigation item in `DashboardLayout.tsx`:
- Label: "Training Documents"
- Icon: `DescriptionIcon` (Material-UI)
- Route: `/training-documents`
- Visible to: Admin, Manager only

---

## Technical Considerations

### Security

1. **File Upload Security:**
   - Validate MIME type on server-side (not just extension)
   - Scan for malicious content (basic validation)
   - Store in private bucket (no public access)
   - Generate unique file names to prevent overwriting

2. **Access Control:**
   - Enforce RLS policies on all database operations
   - Verify user role before allowing upload/delete
   - Document content never exposed to employees (trainees)
   - Audit log for document uploads/deletions (future)

3. **Data Privacy:**
   - Documents may contain sensitive company policies
   - Ensure extracted text is not cached in browser
   - Consider encryption at rest for storage bucket (Supabase default)

### Performance

1. **Text Extraction:**
   - Use lightweight library for PDF parsing (e.g., `pdf-parse`)
   - For Word docs, use `mammoth` or similar
   - Offload extraction to server-side function (Supabase Edge Function)
   - Cache extracted text to avoid re-processing

2. **Token Optimization:**
   - Pre-calculate token counts on upload
   - Warn admins if document is very large
   - Consider AI summarization for excessively long documents

3. **Database Queries:**
   - Index `scenario_documents.scenario_id` for fast lookups
   - Use joins efficiently to fetch documents with scenarios
   - Cache document text in component state during training session

### Edge Cases

1. **Document Deletion:**
   - What if document is deleted during an active training session?
     - **Solution:** Session already has text cached, continue normally

2. **Concurrent Edits:**
   - What if two admins delete the same document?
     - **Solution:** Database constraint, show error to second user

3. **Large Document Sets:**
   - What if scenario has 10 documents totaling 100,000 characters?
     - **Solution:** Truncate or summarize, show warning to admin

4. **Failed Text Extraction:**
   - What if PDF is image-based (no selectable text)?
     - **Solution:** OCR is out of scope for v1, show error + allow manual text entry (future)

5. **File Format Variations:**
   - What if Word doc uses unusual encoding?
     - **Solution:** Try extraction, fallback to error state, log for investigation

### Dependencies

**New NPM Packages:**
- `pdf-parse` or `pdfjs-dist`: PDF text extraction
- `mammoth`: Word document (.docx) text extraction
- (Already have `@supabase/storage-js` for file uploads)

**Supabase Features:**
- Storage bucket creation
- Edge Functions (optional, for server-side text extraction)
- RLS policies on new tables

---

## Success Metrics

### Quantitative Metrics
- **Adoption Rate:** % of scenarios with linked documents (target: 40% within 3 months)
- **Document Usage:** Average # of documents per scenario (target: 2-3)
- **Upload Success Rate:** % of uploads that succeed (target: >95%)
- **Performance:** Average upload time (target: <10s for 10MB file)

### Qualitative Metrics
- **User Feedback:** Admin/Manager satisfaction with document management UI
- **Training Quality:** Trainee feedback on conversation realism (indirect measure)
- **Support Requests:** Reduction in questions about "How do I add policy info to scenarios?"

### KPIs to Track
- Number of documents uploaded per month
- Number of scenarios using documents vs. not using
- Document-Only mode adoption rate
- Average document size and text length
- Token truncation frequency (should be rare)

---

## Implementation Phases

### Phase 1: Core Upload & Storage (Week 1-2)
- [ ] Create `training_documents` table with RLS policies
- [ ] Create Supabase Storage bucket with policies
- [ ] Build Training Documents page UI
- [ ] Implement file upload with validation
- [ ] Implement text extraction (PDF, Word, text, markdown)
- [ ] Implement download and delete functionality

### Phase 2: Scenario Association (Week 3)
- [ ] Create `scenario_documents` junction table
- [ ] Add `document_mode` column to `scenarios` table
- [ ] Update Scenarios page UI with document selection
- [ ] Implement document mode toggle
- [ ] Add document count badge to scenarios list

### Phase 3: AI Integration (Week 4)
- [ ] Update `TrainingChatModal.tsx` to fetch associated documents
- [ ] Implement augmented mode prompt injection
- [ ] Implement document-only mode prompt construction
- [ ] Add token limit handling and truncation
- [ ] Test with various document sizes and combinations

### Phase 4: Polish & Testing (Week 5)
- [ ] Add preview functionality
- [ ] Add usage tracking (scenarios per document)
- [ ] Implement search and filtering
- [ ] Performance testing with large documents
- [ ] Security audit
- [ ] User acceptance testing with Admin/Manager

---

## Future Enhancements (Out of Scope for v1)

### v2 Features
1. **Persona-Specific Documents:**
   - Similar to scenario documents, but attached to personas
   - Useful for persona backstories, personality guides

2. **Category/Topic-Level Documents with Automatic Inheritance:**
   - Upload documents at Category, Topic, or Scenario level
   - Documents automatically cascade down the hierarchy
   - **Inheritance Logic** (when starting training for Scenario X):
     1. Fetch documents directly linked to Scenario X
     2. Fetch documents linked to Scenario X's parent Topic
     3. Fetch documents linked to the parent Category
     4. Combine all documents (remove duplicates if same doc linked at multiple levels)
     5. Inject combined set into system prompt
   - **Database Schema Change** (v2):
     ```sql
     -- Replace scenario_documents with content_documents
     CREATE TABLE content_documents (
       id UUID PRIMARY KEY,
       document_id UUID REFERENCES training_documents(id),
       content_type ENUM('category', 'topic', 'scenario'),
       content_id UUID, -- References categories.id, topics.id, or scenarios.id
       created_at TIMESTAMP,
       UNIQUE(document_id, content_type, content_id)
     );
     ```
   - **Benefits:**
     - Organization-wide policies (e.g., "HR Handbook") linked to Category apply to all scenarios
     - Department-specific docs (e.g., "Sales Process") linked to Topic apply to related scenarios
     - Scenario-specific docs override or supplement inherited ones
     - Reduces duplication: upload once, use everywhere
   - **UI Changes:**
     - Add document management to Category and Topic edit dialogs
     - Show inherited documents with visual indicator (e.g., grayed out chip with "Inherited from Category" tooltip)
     - Allow scenarios to "exclude" inherited documents (opt-out mechanism)

3. **Document Versioning:**
   - Track changes over time
   - Rollback to previous versions
   - View version history

4. **Document Templates:**
   - Pre-built templates for common policy types
   - Fill-in-the-blank forms for quick creation

5. **AI Summarization:**
   - Automatically summarize long documents
   - Use summary instead of truncation for token limits

6. **OCR Support:**
   - Extract text from image-based PDFs
   - Support scanned documents

7. **Document Analytics:**
   - Track which documents improve training scores
   - A/B test document effectiveness

8. **Collaborative Editing:**
   - Multiple admins editing documents simultaneously
   - Comments and suggestions on documents

9. **Document Libraries:**
   - Shared libraries across organizations
   - Import public policy templates

10. **Trainee Document Access:**
    - Optional: Show documents to trainees before/after training
    - Study materials or post-training reference

---

## Open Questions & Decisions Needed

### Questions
1. **Text Extraction Performance:** Should we use Supabase Edge Functions for server-side processing, or client-side extraction?
   - **Recommendation:** Client-side for simplicity (v1), migrate to Edge Functions if performance issues arise

2. **Document Reusability:** Can same document be used by scenarios from different admins/managers?
   - **Recommendation:** Yes, any admin/manager can link any document (promotes reusability)

3. **Document Editing:** Should we allow editing extracted text post-upload?
   - **Recommendation:** No for v1 (just delete & re-upload), add editing in v2

4. **Soft Delete:** Should deleted documents be soft-deleted (recoverable)?
   - **Recommendation:** Hard delete for v1, add soft delete in v2 if requested

### Decisions Made (Updated 2025-11-06)
✅ **v1 Scope:** Scenario-specific only (Category/Topic documents deferred to v2)
✅ **File Types:** PDF, Word, Text, Markdown support
✅ **Size Limit:** 10MB per document
✅ **Permissions:** Admin and Manager upload permissions only
✅ **Visibility:** All documents visible to all Admins/Managers (no public/private in v1)
✅ **Trainee Access:** Documents not visible to trainees
✅ **AI Modes:** Augmented (default) and Document-Only modes
✅ **Prompt Injection:** All documents concatenated in single system prompt
✅ **Upload UX:** Hybrid approach - centralized library + quick upload in Scenario dialog
✅ **Inheritance:** Automatic cascading (v2 feature) - Category → Topic → Scenario
✅ **Primary Use Case:** Widely-used policies with support for scenario-specific documents
✅ **Reusability:** Same document can be linked to multiple scenarios

---

## Glossary

- **Augmented Mode:** AI uses documents as supplementary knowledge alongside full scenario/persona details
- **Document-Only Mode:** AI relies primarily on documents with minimal scenario context
- **Extracted Text:** Text content extracted from uploaded files for AI consumption
- **System Prompt:** The initial instruction message sent to OpenAI that sets the AI's role and context
- **Token:** Unit of text used by OpenAI for billing and context limits (~4 characters = 1 token)
- **RLS (Row-Level Security):** Supabase database feature that restricts data access based on user identity/role
- **Junction Table:** A database table that creates many-to-many relationships (e.g., `scenario_documents`)

---

## Appendix A: Example System Prompts

### Example 1: Augmented Mode (Default)

**Scenario:** Customer Service - Insurance Claim
**Documents:**
- "Auto Insurance Policy Terms.pdf"
- "Claims Processing Guide.pdf"

**Resulting System Prompt:**
```
You are roleplaying as Sarah Chen, a 42-year-old insurance claims adjuster.

PERSONA DETAILS:
Age: 42
Occupation: Insurance Claims Adjuster
Interests: ["process efficiency", "customer satisfaction", "risk assessment"]
Goals: ["resolve claim fairly", "follow company policy", "prevent fraud"]
Communication Style: Professional but empathetic, detail-oriented, occasionally references policy terms
Emotional State: Focused and slightly stressed due to high caseload

SCENARIO:
Title: Denied Auto Insurance Claim
Details: You are calling a policyholder whose auto insurance claim was denied due to policy exclusions. The customer is upset and demanding an explanation. You need to explain the denial clearly while maintaining professionalism and empathy.

Additional Persona Details: You have 15 years of experience and take pride in fair, policy-compliant decisions.

CRITICAL INSTRUCTIONS:
- Stay completely IN CHARACTER as Sarah Chen
- DO NOT introduce yourself as an AI or break character
- Start the conversation with your issue/concern
- Keep responses concise (2-4 sentences)
- Use the persona's communication style and emotional state

ADDITIONAL KNOWLEDGE:
The following documents provide supplementary information you should reference during the conversation:

--- Auto Insurance Policy Terms.pdf ---
[Full extracted text of policy document...]

--- Claims Processing Guide.pdf ---
[Full extracted text of internal guide...]
```

---

### Example 2: Document-Only Mode

**Same scenario and documents as above**

**Resulting System Prompt:**
```
You are a training AI roleplaying as Sarah Chen, a 42-year-old Insurance Claims Adjuster.

Communication Style: Professional but empathetic, detail-oriented
Emotional State: Focused and slightly stressed

CRITICAL INSTRUCTIONS:
- Base your conversation PRIMARILY on the following reference documents
- Stay in character as Sarah Chen
- Keep responses concise (2-4 sentences)
- Do NOT break character or reveal you are an AI

REFERENCE DOCUMENTS:

--- Auto Insurance Policy Terms.pdf ---
[Full extracted text of policy document...]

--- Claims Processing Guide.pdf ---
[Full extracted text of internal guide...]

Scenario Context: Denied Auto Insurance Claim - You are calling a policyholder whose claim was denied due to policy exclusions.
```

**Key Differences:**
- Document-Only mode omits verbose persona details (interests, goals, full scenario details)
- Focuses AI's attention on the reference documents
- Useful when documents contain all necessary information (e.g., policies, scripts)

---

## Appendix B: Database Queries Reference

### Fetch Scenario with Documents
```typescript
const { data: scenario, error } = await supabase
  .from('scenarios')
  .select(`
    *,
    personas(*),
    scenario_documents(
      training_documents(*)
    )
  `)
  .eq('id', scenarioId)
  .single();

// Access documents
const documents = scenario?.scenario_documents?.map(sd => sd.training_documents) || [];
```

### Get All Documents with Usage Count
```typescript
const { data: documents, error } = await supabase
  .from('training_documents')
  .select(`
    *,
    scenario_documents(count)
  `)
  .order('created_at', { ascending: false });

// Calculate usage count
const documentsWithCount = documents?.map(doc => ({
  ...doc,
  scenarioCount: doc.scenario_documents[0]?.count || 0
}));
```

### Get Documents for Specific Scenario
```typescript
const { data: scenarioDocuments, error } = await supabase
  .from('scenario_documents')
  .select(`
    training_documents(*)
  `)
  .eq('scenario_id', scenarioId);

const documents = scenarioDocuments?.map(sd => sd.training_documents) || [];
```

### Upload Document (Complete Flow)
```typescript
// 1. Upload file to storage
const fileName = `${uuid()}-${file.name}`;
const { data: fileData, error: uploadError } = await supabase.storage
  .from('training-documents')
  .upload(fileName, file);

if (uploadError) throw uploadError;

// 2. Get public URL (for admin download)
const { data: { publicUrl } } = supabase.storage
  .from('training-documents')
  .getPublicUrl(fileName);

// 3. Extract text (client-side or Edge Function)
const extractedText = await extractTextFromFile(file);

// 4. Insert database record
const { data: document, error: dbError } = await supabase
  .from('training_documents')
  .insert({
    name: documentName,
    description: documentDescription,
    file_type: file.type,
    file_size: file.size,
    file_url: publicUrl,
    extracted_text: extractedText,
    character_count: extractedText.length,
    uploaded_by: user.id
  })
  .select()
  .single();
```

---

## Appendix C: Text Extraction Examples

### PDF Text Extraction (using pdf-parse)
```typescript
import pdfParse from 'pdf-parse';

async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const data = await pdfParse(buffer);
  return data.text;
}
```

### Word Document Extraction (using mammoth)
```typescript
import mammoth from 'mammoth';

async function extractDocxText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}
```

### Unified Extraction Function
```typescript
async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type;

  try {
    if (fileType === 'application/pdf') {
      return await extractPdfText(file);
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return await extractDocxText(file);
    } else if (fileType === 'text/plain' || fileType === 'text/markdown') {
      return await file.text();
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error('Text extraction failed:', error);
    throw new Error('Failed to extract text from file. Please try a different file.');
  }
}
```

---

## Document Version
**Version History:**
- **v1.1 (2025-11-06)**: Architecture revision based on stakeholder feedback
  - Simplified v1 scope to scenario-only documents
  - Added hybrid upload UX (library + quick upload)
  - Removed public/private visibility (all Admins/Managers see all docs)
  - Documented v2 inheritance logic (Category → Topic → Scenario)
  - Added new user story for quick upload feature
- **v1.0 (2025-11-04)**: Initial PRD created based on product requirements

**Next Review Date:** Post-implementation (estimated Week 6)

**Approval Status:** Draft - Ready for Technical Review

---

**End of Document**
