# Training Context Documents — Implementation Plan

## Context

Admins/Managers need to attach reference documents to scenarios so the AI persona has access to real company policies and procedures during training sessions. V1 injects the full extracted text into the OpenAI system prompt (no vector search). Spec: `_specs/training-context-documents.md`. PRD: `persona-trainer/docs/stage-2-enhancements/04-training-context-documents.md`.

---

## Implementation Order

Bottom-up: DB schema → TypeScript types → service utilities → AI prompt extension → training flow → new Documents page → scenario dialog additions → nav/routing.

---

## Phase 1: SQL Migration

**Create:** `persona-trainer/sql/stage-2-migrations/20260602_training_context_documents.sql`

Follow exact style of existing migrations (UUID primary keys, `gen_random_uuid()`, `updated_at` trigger, RLS enabled with named policies, auth.uid() + role check via EXISTS subquery).

Three changes in one file:

**1. ALTER scenarios:**
```sql
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS document_mode VARCHAR(20)
  DEFAULT 'augmented' CHECK (document_mode IN ('augmented', 'document_only'));
```

**2. CREATE training_documents:**
Columns: `id`, `name TEXT NOT NULL`, `description TEXT`, `file_type VARCHAR(10) CHECK IN ('pdf','docx','txt','md')`, `file_size INTEGER`, `file_url TEXT NOT NULL`, `extracted_text TEXT`, `character_count INTEGER`, `uploaded_by UUID REFERENCES auth.users`, `created_at`, `updated_at` + auto-update trigger.

RLS policies:
- Admin/Manager can SELECT, INSERT, DELETE (role check via EXISTS on `users` table)
- **Critical:** Add a separate SELECT policy for all authenticated users: `USING (EXISTS (SELECT 1 FROM scenario_documents WHERE document_id = training_documents.id))` — employees need this for the training session join query, otherwise document text silently returns null during sessions.

**3. CREATE scenario_documents (junction):**
Columns: `id`, `scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE`, `document_id UUID REFERENCES training_documents(id) ON DELETE CASCADE`, `created_at`. Unique on `(scenario_id, document_id)`. Indexes on both FK columns.

RLS: all authenticated users can SELECT; only admin/manager can INSERT/DELETE.

**4. Manual step (not SQL):** Create a private Supabase Storage bucket named `training-documents` with 10 MB file size limit in the dashboard before testing uploads.

---

## Phase 2: TypeScript Types

**Modify:** `persona-trainer/src/services/supabase/client.ts`

- Update `Scenario` type: add `document_mode?: 'augmented' | 'document_only'`
- Add `TrainingDocument` type: all columns from the new table
- Add `ScenarioDocument` type: id, scenario_id, document_id, created_at, plus optional `training_document?: TrainingDocument` for joined queries

---

## Phase 3: Client-Side Extraction Utility

**Create:** `persona-trainer/src/services/documents/extractor.ts`

Install: `npm install pdfjs-dist mammoth` from `persona-trainer/`.

Exports:
- `extractText(file: File): Promise<{ text: string; characterCount: number } | null>` — returns null on any failure (upload proceeds but with null extracted_text)
- `validateFile(file: File): string | null` — checks MIME type/extension and size <= 10 MB

Extraction per type:
- `.txt` / `.md`: `file.text()`
- `.pdf`: `pdfjsLib.getDocument(arrayBuffer)` → iterate pages → `page.getTextContent()` → join `.str` values
- `.docx`: `mammoth.extractRawText({ arrayBuffer })`

**pdfjs-dist worker gotcha:** Use `import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'` then `GlobalWorkerOptions.workerSrc = workerUrl`. If `?url` fails, fall back to matching CDN version string. Confirm version after install.

**mammoth types:** Use `import * as mammoth from 'mammoth'` if default import fails; add `declare module 'mammoth'` shim in `src/types.d.ts` if needed.

---

## Phase 4: Token Guard Utility

**Create:** `persona-trainer/src/services/documents/tokenGuard.ts`

Exports:
- `buildDocumentContext(documents: TrainingDocument[]): string` — concatenates `--- Document: ${name} ---\n${extracted_text}\n\n` blocks; stops adding when next block would exceed 32,000 chars; appends `(Document content truncated due to length. X document(s) not included.)` when truncated; skips docs with null extracted_text silently.
- `estimateCharCount(documents: TrainingDocument[]): number` — sums `character_count` values; used by the scenario dialog indicator.

---

## Phase 5: AI Prompt Extension

**Modify:** `persona-trainer/src/services/ai/openai.ts` — `createTrainingSystemPrompt` at lines 144-162.

Extend signature to:
```ts
createTrainingSystemPrompt(
  trainingTitle: string,
  scenarioDetails?: string,
  personaContext?: string,
  documentContext?: string,
  documentMode?: 'augmented' | 'document_only'
): string
```

- **Augmented mode** (default): append `ADDITIONAL KNOWLEDGE:\n${documentContext}` block after SCENARIO DETAILS, before CRITICAL INSTRUCTIONS. No-op if no documentContext.
- **Document-Only mode**: return a completely different template — minimal persona info (name, age, occupation only), then `REFERENCE DOCUMENTS:` block, then a short CRITICAL INSTRUCTIONS section focused on grounding in documents.

---

## Phase 6: TrainingChatModal Extension

**Modify:** `persona-trainer/src/components/training/TrainingChatModal.tsx`

**Query extension** (around line 94): extend the Supabase scenarios select to include:
```
scenario_documents(
  training_documents(*)
)
```

**After query:** extract linked docs array from `scenarioData.scenario_documents.map(sd => sd.training_documents).filter(Boolean)`.

**Before calling `createTrainingSystemPrompt`** (around line 155): call `buildDocumentContext(linkedDocs)`. In document_only mode, also build a minimal personaContext (name, age, occupation, emotional_state only — omit interests/goals). Pass both `documentContext` and `scenario.document_mode` as args 4 and 5.

Treat undefined `document_mode` as `'augmented'`.

---

## Phase 7: UploadDocumentDialog (Shared Component)

**Create:** `persona-trainer/src/components/documents/UploadDocumentDialog.tsx`

This is extracted as a shared component because it's used in both the Documents page AND inline in the scenario dialog.

Props: `open: boolean`, `onClose: () => void`, `onSuccess: (doc: TrainingDocument) => void`.

Internals:
- Drag-and-drop zone: styled `Box` with `onDragOver`, `onDrop` handlers (native HTML5, no library)
- Hidden `<input type="file" accept=".pdf,.docx,.txt,.md" ref>` triggered by "Browse Files" button
- `name` TextField (required; auto-populated from filename, user can edit), `description` TextField (optional)
- Helper text showing accepted formats and 10 MB limit
- `LinearProgress` during upload
- Submit flow: validate → extract text → upload to Supabase Storage at `${crypto.randomUUID()}-${file.name}` → insert row into `training_documents` → call `onSuccess(newDoc)` → close
- If extraction fails: proceed, insert with null extracted_text, show yellow Alert after upload

---

## Phase 8: TrainingDocuments Page

**Create:** `persona-trainer/src/pages/TrainingDocuments.tsx`

Pattern: mirrors `Assignments.tsx` (table-based management, in-file dialog state).

Fetch query: `.select('*, uploaded_by_user:users!uploaded_by(name), scenario_documents(count)')` to get uploader names and linked scenario counts in one query.

**Table columns:** Name, File Type (color Chip), Size (formatted bytes), Upload Date, Uploader, Scenarios ("X"), Actions (Preview icon, Download icon, Delete icon).

**Search/filter:** Client-side filter by name + file type filter Select.

**Dialogs (state-driven, rendered in same file):**
- **Upload:** render `<UploadDocumentDialog>` from Phase 7; on `onSuccess` prepend the new doc to state list
- **Preview:** shows extracted_text in scrollable monospace Box; header shows name, type, size, chars, estimated tokens (`Math.ceil(chars / 4)`); "Download Original" button generates a signed URL via `supabase.storage.from('training-documents').createSignedUrl(doc.file_url, 60)` then triggers download; handles null extracted_text with Alert
- **Delete confirmation:** pre-fetches linked scenario titles from `scenario_documents(scenarios(title))`; warns about cascade; on confirm: `supabase.from('training_documents').delete().eq('id', id)` + `supabase.storage.from('training-documents').remove([doc.file_url])`

**Access guard:** Check `userProfile?.role` at top of render; if not admin/manager, show `Alert severity="error"` and return early (defense-in-depth on top of RLS).

---

## Phase 9: Scenario Dialog Additions (TopicDetails.tsx)

**Modify:** `persona-trainer/src/pages/TopicDetails.tsx`

**New state:**
- `availableDocuments: TrainingDocument[]` — fetch in the existing `fetchData` useEffect with `.select('id, name, file_type, character_count').order('name')`
- Add `selectedDocumentIds: string[]` and `documentMode: 'augmented' | 'document_only'` to `newScenario` form state
- When opening edit dialog: fetch existing `scenario_documents` rows and pre-populate `selectedDocumentIds`

**Dialog additions** (after Persona Select, before any Rubrics section):

1. `Divider` + `Typography variant="subtitle2"` label "Training Documents"
2. Multi-select using exact pattern from `Assignments.tsx` lines 478-521 (`Select multiple` + `renderValue` chips with file type icons). Helper text: "Select up to 10 documents." Disable adding more at 10.
3. Character count indicator: `estimateCharCount(selectedDocs)` → display `~X chars / ~Y tokens (limit: 32,000 chars)` colored `text.secondary` / `warning.main` / `error.main` based on thresholds (24k / 32k)
4. "Upload New Document" outlined small `Button` → opens `<UploadDocumentDialog>`; on `onSuccess`, auto-add doc ID to `selectedDocumentIds` and prepend to `availableDocuments`
5. Document Mode radio group — visible only when `selectedDocumentIds.length > 0`: `RadioGroup` with two `FormControlLabel` options using `Radio` from MUI (add to imports)

**Submit handler:**
- Add `document_mode: newScenario.documentMode` to scenarioData object
- Change `.insert([scenarioData])` to `.insert([scenarioData]).select('id').single()` to capture new scenario ID
- After insert/update: delete all `scenario_documents` for the scenario then re-insert from `selectedDocumentIds`

**Reset on close:** add `selectedDocumentIds: [], documentMode: 'augmented'` to the reset call.

**ScenarioCard docs badge:** Add optional `documentCount?: number` prop to `ScenarioCard.tsx`; render a small Chip when `documentCount > 0`. In TopicDetails, extend scenario fetch to include `scenario_documents(count)` and pass the count through.

---

## Phase 10: Navigation and Routing

**DashboardLayout.tsx:** Import `DescriptionIcon` from `@mui/icons-material`. Add nav ListItem for `/training-documents` in the admin/manager `<List>` block, after Personas.

**App.tsx:** Import `TrainingDocuments` page. Add `<Route path="training-documents" element={<TrainingDocuments />} />` inside the protected layout.

---

## New Files Summary

| File | Purpose |
|------|---------|
| `sql/stage-2-migrations/20260602_training_context_documents.sql` | DB schema |
| `src/services/documents/extractor.ts` | PDF/docx/txt text extraction |
| `src/services/documents/tokenGuard.ts` | 32k char guard + char count helper |
| `src/components/documents/UploadDocumentDialog.tsx` | Shared upload dialog |
| `src/pages/TrainingDocuments.tsx` | Document library page |

## Modified Files Summary

| File | Change |
|------|--------|
| `src/services/supabase/client.ts` | +2 types, update Scenario |
| `src/services/ai/openai.ts` | Extend `createTrainingSystemPrompt` |
| `src/components/training/TrainingChatModal.tsx` | Add document fetch + prompt injection |
| `src/pages/TopicDetails.tsx` | Add document multi-select + mode radio + sync |
| `src/components/scenarios/ScenarioCard.tsx` | Add optional docs count badge |
| `src/components/layout/DashboardLayout.tsx` | Add nav item |
| `src/App.tsx` | Add route |

---

## Verification

1. Apply SQL migration in Supabase SQL editor. Inspect schema: confirm `scenarios.document_mode`, `training_documents`, `scenario_documents` tables exist.
2. Create the `training-documents` private Storage bucket in Supabase dashboard with 10 MB limit.
3. As admin, navigate to `/training-documents`. Upload one PDF, one .docx, one .txt. All three appear in the table with correct type/size.
4. Preview each — confirm extracted text shows.
5. Open a scenario dialog in TopicDetails. Select uploaded documents. Confirm char count indicator + mode radio appear.
6. Save scenario. Confirm docs badge on ScenarioCard.
7. As employee, start training on that scenario. Confirm no RLS errors in console. Confirm AI first response demonstrates document awareness.
8. Test truncation: select documents totaling > 32k chars. Confirm session starts without error; check console-logged system prompt for truncation note.
9. Delete a document → confirm linked-scenario warning shows, cascade removes junction row, scenario dialog no longer lists deleted doc.
10. `npm run lint` from `persona-trainer/` passes.
