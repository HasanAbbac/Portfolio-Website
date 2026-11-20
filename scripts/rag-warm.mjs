// Downloads the 23 MB embedding model into the cache folder (RAG_MODEL_CACHE, default .model-cache).
// The Render build runs this once, so the live server never has to download anything when it starts.
import { warmup } from '../server/rag/embed.js';
await warmup();
console.log('Embedding model is ready.');
