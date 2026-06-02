# Training Context Documents

**Slug:** training-context-documents  
**Branch:** claude/feature/training-context-documents  
**Status:** Draft  
**Date:** 2026-06-02  
**PRD Reference:** `persona-trainer/docs/stage-2-enhancements/04-training-context-documents.md`

---

## Overview

Admins and Managers can upload supplementary documents (PDF, Word, text, markdown) and attach them to scenarios. When a trainee starts a session, the document text is injected into the AI system prompt so the persona can reference real company policies, procedures, and other reference material. This is commonly called RAG (Retrieval-Augmented Generation), though in v1 the "retrieval" is a straightforward database lookup rather than vector search — full semantic search is a future consideration.

---

## Goals

- Let Admins/Managers upload reference documents once and reuse them across multiple scenarios
- Make AI training conversations more realistic by grounding them in actual company content
- Keep document management and scenario authoring workflows closely integrated

## Non-Goals (Out of Scope for v1)

- Category-level or topic-level document inheritance (v2)
- Persona-specific documents (v2)
- Vector/semantic search across document content (future)
- Document versioning or edit history (v2)
- Trainee-visible document library (v2)
- OCR for image-based PDFs (future)
- Public/private visibility toggle on documents — all Admin/Manager users see all documents in v1

---

## User Stories

### Story 1: Upload a Training Document
**As an** Admin or Manager  
**I want to** upload a document from a centralized Training Documents page  
**So that** it becomes available to link to any scenario

**Acceptance Criteria:**
- [ ] Accepts PDF, .docx, .txt, .md; max 10 MB
- [ ] Name (required) and description (optional) captured on upload
- [ ] Text content extracted from file on upload and stored in the database
- [ ] Document appears in the library table after successful upload
- [ ] Clear error shown for invalid file type or oversized file

---

### Story 2: Quick-Upload While Editing a Scenario
**As an** Admin or Manager  
**I want to** upload a document without leaving the scenario dialog  
**So that** I can add new reference material inline without losing my place

**Acceptance Criteria:**
- [ ] "Upload New Document" button available inside the scenario's documents section
- [ ] Compact upload dialog with same validation rules as Story 1
- [ ] On success, document is auto-added to the library AND auto-selected for this scenario
- [ ] Upload dialog closes and new document appears as a chip in the scenario form

---

### Story 3: Link Documents to a Scenario
**As an** Admin or Manager  
**I want to** select one or more uploaded documents when creating or editing a scenario  
**So that** the AI has access to the right reference material during training

**Acceptance Criteria:**
- [ ] Multi-select control inside scenario dialog lists all available documents
- [ ] Selected documents shown as removable chips
- [ ] Maximum 10 documents per scenario enforced in UI
- [ ] Scenario list shows a "X docs" badge for scenarios that have documents attached

---

### Story 4: Choose Document Mode for a Scenario
**As an** Admin or Manager  
**I want to** choose between Augmented and Document-Only mode per scenario  
**So that** I can control how prominently the AI uses reference documents

**Acceptance Criteria:**
- [ ] Radio group with two options: "Augmented (Default)" and "Document-Only"
- [ ] Augmented: documents appended to the normal system prompt as "ADDITIONAL KNOWLEDGE"
- [ ] Document-Only: minimal persona details, AI instructed to rely primarily on the documents
- [ ] Mode selector disabled/greyed out when no documents are linked
- [ ] Selection persisted on scenario save

---

### Story 5: Manage the Document Library
**As an** Admin or Manager  
**I want to** view, download, preview, and delete uploaded documents  
**So that** I can keep the library current and accurate

**Acceptance Criteria:**
- [ ] Table shows: name, file type, size, upload date, uploader, number of linked scenarios
- [ ] Search by name; filter by file type
- [ ] Download retrieves the original file
- [ ] Preview shows extracted text with character count and estimated token count
- [ ] Delete prompts confirmation and lists any linked scenarios that will be affected
- [ ] Cascade delete removes all `scenario_documents` associations

---

### Story 6: Document Content Injected During Training
**As a** trainee starting a session  
**I want** the AI persona to be aware of relevant company documents  
**So that** conversations feel grounded in real policies and procedures

**Acceptance Criteria:**
- [ ] On session start, all documents linked to the scenario are fetched
- [ ] Extracted text concatenated and injected into the system prompt
- [ ] Augmented mode appends documents after normal prompt under "ADDITIONAL KNOWLEDGE:"
- [ ] Document-Only mode replaces verbose persona/scenario details with a streamlined prompt focused on document content
- [ ] If combined text exceeds ~32,000 characters (~8,000 tokens), content is truncated at document boundaries with a note appended

---

## Functional Requirements

### FR-1: File Upload & Storage
- Supabase Storage bucket `training-documents` (private)
- Accepted formats: PDF, .docx, .txt, .md
- Max file size: 10 MB
- Unique filenames generated server-side to prevent collisions

### FR-2: Text Extraction
- PDF: extract selectable text (no OCR in v1)
- .docx: extract raw text
- .txt / .md: read as-is
- Extracted text stored in `training_documents.extracted_text`; character count stored alongside it
- If extraction fails, upload still succeeds but `extracted_text` is null; UI shows a warning

### FR-3: Document-Scenario Association
- Many-to-many via `scenario_documents` junction table
- Scenario supports up to 10 linked documents (enforced in UI, not just DB)
- Deleting a document cascades to remove all junction rows

### FR-4: AI Prompt Construction
- Fetch scenario + linked documents in a single join query when session opens
- Augmented mode: append document text block to existing `createTrainingSystemPrompt()` output
- Document-Only mode: use a simplified prompt template (name, age, occupation, emotional state, documents, scenario title only)
- Token guard: truncate at document boundaries if combined text > 32,000 chars; append "(Document content truncated due to length)"

### FR-5: Access Control
- Only Admin and Manager roles can upload, edit, or delete documents
- Employees can trigger document fetch indirectly when starting training (via join query) but never see document content directly in the UI
- RLS policies on `training_documents` and `scenario_documents` enforce this at the database level

---

## Data Model Changes

### New table: `training_documents`
Columns: `id`, `name`, `description`, `file_type` (pdf/docx/txt/md), `file_size` (bytes), `file_url` (Supabase Storage path), `extracted_text`, `character_count`, `uploaded_by` (→ auth.users), `created_at`, `updated_at`

RLS: Admin/Manager can SELECT, INSERT, DELETE. Employees have no direct access.

### New table: `scenario_documents` (junction)
Columns: `id`, `scenario_id` (→ scenarios, CASCADE DELETE), `document_id` (→ training_documents, CASCADE DELETE), `created_at`  
Unique constraint on `(scenario_id, document_id)`

RLS: Admin/Manager can manage all rows. Employees can SELECT (needed for training session startup).

### Updated table: `scenarios`
Add column: `document_mode` VARCHAR(20) DEFAULT 'augmented' CHECK IN ('augmented', 'document_only')

### New TypeScript types (in `src/services/supabase/client.ts`)
`TrainingDocument` and `ScenarioDocument` types. Update `Scenario` type to include `document_mode`.

---

## UI / UX

### New page: `/training-documents` (Admin/Manager only)
- Table listing all documents (name, type badge, size, upload date, uploader, "X scenarios" count)
- Search bar + file type filter
- "Upload Document" button → upload dialog
- Per-row actions: Preview, Download, Delete

### Upload dialog
- Drag-and-drop file zone + file picker button
- Name field (required, defaults to filename), Description (optional)
- Supported formats + size limit shown as helper text
- Upload progress bar
- On success: dialog closes, new row appears in table

### Preview dialog
- Shows `extracted_text` in a scrollable monospace area
- Header: file name, type, size, character count, estimated token count
- Buttons: "Download Original", "Close"

### Delete confirmation dialog
- Lists scenarios currently using the document
- Warning copy if linked: "This document is used by X scenario(s) and will be removed from them."

### Scenario dialog additions (on existing Scenarios page)
Two new sections added after the Persona selector:

**Training Documents** section
- Multi-select dropdown: lists all documents by name with file type icon
- Selected documents rendered as removable chips
- "Upload New Document" inline button for quick-upload flow

**Document Mode** section (visible only when ≥1 document selected)
- Radio: "Augmented (Recommended)" — helper text explains documents supplement scenario details
- Radio: "Document-Only" — helper text explains AI focuses primarily on documents

Scenarios list view: add "Docs" column showing count badge; filter by "Has documents / No documents".

### Navigation
Add "Training Documents" (`DescriptionIcon`) to the Admin/Manager section of the `DashboardLayout` sidebar, linking to `/training-documents`.

---

## Open Questions

- **Text extraction location:** Client-side (simpler, v1 default) vs. Supabase Edge Function (more reliable for large files, better v2 option). Recommend client-side for v1 using `pdfjs-dist` for PDF and `mammoth` for .docx. Yes, this makes sense. 
- **Token overflow UX:** In v1, truncation is silent (only a note appended to the prompt). Should Admins see a warning in the UI when the combined document size for a scenario would exceed the token limit? Recommend adding a character-count indicator in the scenario dialog showing how close to the limit the selected documents are. Yes, that would be sense to include the character-count or any other means to control token usage/limit.
- **v2 inheritance design:** The PRD already specifies replacing `scenario_documents` with a `content_documents` table supporting category/topic/scenario levels. Should the v1 schema be designed to make this migration easier? Recommend using a naming convention in v1 that won't conflict (e.g., keep `scenario_documents` as-is in v1, add `content_documents` in v2 without removing it). I'll go with the recommend idea
- **Duplicate document names:** Currently allowed. Should there be a uniqueness check or auto-rename? Recommend allowing duplicates but surfacing a soft warning on upload. Yes, can we flag the possibility of a duplicate.
