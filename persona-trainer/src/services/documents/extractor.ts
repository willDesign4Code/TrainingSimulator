const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md'];

// Some browsers (especially for .md) report 'application/octet-stream' — allow it
const ACCEPTED_MIME_TYPES: Record<string, true> = {
  'application/pdf': true,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
  'text/plain': true,
  'text/markdown': true,
  'application/octet-stream': true,
};

export function validateFile(file: File): string | null {
  const lastDot = file.name.lastIndexOf('.');
  if (lastDot === -1 || lastDot === file.name.length - 1) {
    return 'Cannot determine file type. Please ensure the file has a valid extension (.pdf, .docx, .txt, .md).';
  }
  const ext = file.name.slice(lastDot).toLowerCase();
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    return 'Unsupported file type. Please upload a PDF, Word (.docx), text, or Markdown file.';
  }
  if (file.type && !ACCEPTED_MIME_TYPES[file.type]) {
    return 'File type mismatch. Expected PDF, Word, text, or Markdown.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'File is too large. Maximum size is 10 MB.';
  }
  return null;
}

async function extractPdf(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default as string;
  GlobalWorkerOptions.workerSrc = workerUrl;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  const parts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => (item as unknown as { str?: string }).str ?? '')
      .join(' ');
    parts.push(pageText);
  }

  return parts.join('\n\n');
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

export async function extractText(
  file: File
): Promise<{ text: string; characterCount: number } | null> {
  try {
    const ext = file.name.split('.').pop()?.toLowerCase();
    let text = '';

    if (ext === 'pdf') {
      text = await extractPdf(file);
    } else if (ext === 'docx') {
      text = await extractDocx(file);
    } else {
      // .txt or .md
      text = await file.text();
    }

    return { text, characterCount: text.length };
  } catch {
    return null;
  }
}
