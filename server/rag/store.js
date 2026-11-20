// Step 4: the vector index. A small corpus does not need a database server: the chunks and their vectors are
// saved in one JSON file (server/rag/index.json) and searched in memory. Because every vector has length 1,
// the dot product of two vectors is their cosine similarity (1 = same meaning, 0 = unrelated).
import fs from 'node:fs';
import { INDEX_PATH } from './config.js';

export function saveIndex(index, file = INDEX_PATH) {
  const slim = { ...index, chunks: index.chunks.map((c) => ({ ...c, vec: c.vec.map((v) => Math.round(v * 1e5) / 1e5) })) };
  fs.writeFileSync(file, JSON.stringify(slim));
}

let cached = null;
export function loadIndex(file = INDEX_PATH) {
  if (cached && cached.file === file) return cached.index;
  if (!fs.existsSync(file)) return null;
  const index = JSON.parse(fs.readFileSync(file, 'utf8'));
  cached = { file, index };
  return index;
}

const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };

// Top-k chunks by cosine similarity to the query vector.
export function search(index, queryVec, k = 4) {
  return index.chunks
    .map((c) => ({ chunk: c, score: dot(c.vec, queryVec) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
