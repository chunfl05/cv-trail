import { extractText } from 'unpdf';
import mammoth from 'mammoth';

// Extracts plain text from an uploaded resume File (PDF or .docx). Server-only.
// Uses unpdf (not pdf-parse) — pdf-parse pulls in pdfjs-dist's Node build, which
// crashes at module-load time under Next.js's server bundling. unpdf ships a
// pdf.js build made for serverless/edge runtimes and doesn't have that problem.
export async function extractResumeText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const name = (file.name || '').toLowerCase();
  const type = file.type || '';

  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    const { text } = await extractText(new Uint8Array(arrayBuffer), { mergePages: true });
    return text;
  }

  if (
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx')
  ) {
    const { value } = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
    return value;
  }

  throw new Error('Unsupported file type — upload a PDF or .docx file.');
}
