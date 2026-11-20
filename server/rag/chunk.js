// Step 2: split each document into small, self-contained chunks (about 600 characters).
// Short documents stay whole. Longer ones are packed sentence by sentence with one sentence of overlap,
// so a fact that sits on a boundary still appears in full in at least one chunk.
import { CHUNK_MAX_CHARS, CHUNK_OVERLAP_SENTENCES } from './config.js';

export function splitSentences(text) {
  const out = String(text).replace(/\s+/g, ' ').trim().match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g);
  return (out || []).map((s) => s.trim()).filter(Boolean);
}

export function chunkText(text, max = CHUNK_MAX_CHARS, overlap = CHUNK_OVERLAP_SENTENCES) {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean ? [clean] : [];
  const sentences = splitSentences(clean);
  const chunks = [];
  let cur = [];
  let fresh = 0; // sentences in `cur` that were not already in the previous chunk
  for (const s of sentences) {
    if (cur.length && [...cur, s].join(' ').length > max) {
      chunks.push(cur.join(' '));
      cur = cur.slice(-overlap);
      fresh = 0;
    }
    cur.push(s);
    fresh += 1;
  }
  if (cur.length && fresh > 0) chunks.push(cur.join(' '));
  return chunks;
}

// Turns documents into chunk records. `embedText` is what gets embedded: the title plus the chunk,
// so a chunk keeps its context ("Project: Chess Set: ...") even when it is shown on its own.
export function chunkDocs(docs) {
  const out = [];
  for (const d of docs) {
    chunkText(d.text).forEach((text, n) => {
      out.push({ id: `${d.id}#${n}`, docId: d.id, title: d.title, href: d.href, label: d.label, projectIndex: d.projectIndex ?? null, text, embedText: `${d.title}. ${text}` });
    });
  }
  return out;
}
