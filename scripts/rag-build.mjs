// Builds the vector index:  npm run rag:build
// documents -> chunks -> embeddings -> server/rag/index.json
import { buildDocs } from '../server/rag/knowledge.js';
import { chunkDocs } from '../server/rag/chunk.js';
import { embed } from '../server/rag/embed.js';
import { saveIndex } from '../server/rag/store.js';
import { EMBED_MODEL, INDEX_PATH } from '../server/rag/config.js';

const docs = buildDocs();
const chunks = chunkDocs(docs);
console.log(`[rag] ${docs.length} documents -> ${chunks.length} chunks`);

const vectors = [];
for (let i = 0; i < chunks.length; i += 16) {
  const batch = chunks.slice(i, i + 16);
  vectors.push(...(await embed(batch.map((c) => c.embedText))));
}
const index = {
  model: EMBED_MODEL,
  dim: vectors[0].length,
  createdAt: new Date().toISOString(),
  chunks: chunks.map(({ embedText, ...c }, i) => ({ ...c, embedText, vec: vectors[i] })),
};
saveIndex(index);
console.log(`[rag] wrote ${INDEX_PATH} (${index.chunks.length} vectors, ${index.dim} dimensions)`);
for (const c of index.chunks) console.log(`  - ${c.id}  (${c.text.length} chars)  ${c.title}`);
