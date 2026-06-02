# Training Context Documents — Supabase Setup

Before the Training Context Documents feature works end-to-end, two manual steps are required in the Supabase dashboard: running the SQL migration and creating the Storage bucket.

---

## Step 1: Run the SQL Migration

1. Open your Supabase project → **SQL Editor** → **New query**
2. Paste the contents of `sql/stage-2-migrations/20260602_training_context_documents.sql`
3. Click **Run**

The migration:
- Adds a `document_mode` column to the `scenarios` table (default `'augmented'`)
- Creates the `training_documents` table with RLS policies
- Creates the `scenario_documents` junction table with RLS policies

**Verify it worked:** Run the verification queries at the bottom of the migration file. You should see:
- `document_mode` column in scenarios
- Both new tables listed
- Six RLS policies across the two tables

---

## Step 2: Create the Storage Bucket

Supabase Storage buckets cannot be created via SQL — they must be created in the dashboard.

1. Open your Supabase project → **Storage** (left sidebar)
2. Click **New bucket**
3. Configure:
   - **Name:** `training-documents` (exact, case-sensitive)
   - **Public bucket:** OFF (private)
   - **File size limit:** `10 MB` (enter `10485760` bytes or use the slider)
   - **Allowed MIME types:** *(leave blank to allow all, or restrict to:* `application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain, text/markdown`*)*
4. Click **Save**

### Storage RLS Policies

After creating the bucket, go to **Storage → Policies** and ensure authenticated users can upload and download. The simplest policy for a private bucket used only by your app:

```sql
-- Allow authenticated users to upload (INSERT)
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'training-documents');

-- Allow authenticated users to read/download (SELECT)
CREATE POLICY "Authenticated users can read documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'training-documents');

-- Allow admins and managers to delete storage objects
CREATE POLICY "Admins and managers can delete documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'training-documents'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);
```

Run these in the SQL Editor or add them via the Storage policy UI.

---

## Step 3: Verify End-to-End

1. Log in as an admin or manager
2. Navigate to **Training Documents** in the sidebar
3. Upload a `.txt` file — it should appear in the table with its character count
4. Open a Topic → edit a Scenario → confirm the Training Documents section appears
5. Select the uploaded document → save the scenario
6. As an employee, start training on that scenario → the AI should reference the document content
