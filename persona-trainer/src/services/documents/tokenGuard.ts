import type { TrainingDocument } from '../supabase/client';

const CHAR_LIMIT = 32_000;

export function buildDocumentContext(documents: TrainingDocument[]): string {
  let combined = '';

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    if (!doc.extracted_text) continue;

    const block = `--- Document: ${doc.name} ---\n${doc.extracted_text}\n\n`;

    if (combined.length + block.length > CHAR_LIMIT) {
      // 1 for the current document (index i) + any remaining docs with text after it
      const notIncluded = 1 + documents.slice(i + 1).filter(d => d.extracted_text).length;
      combined += `(Document content truncated due to length. ${notIncluded} document(s) not included.)\n`;
      break;
    }

    combined += block;
  }

  return combined;
}

export function estimateCharCount(documents: Array<{ character_count?: number | null }>): number {
  return documents.reduce((sum, doc) => sum + (doc.character_count ?? 0), 0);
}
