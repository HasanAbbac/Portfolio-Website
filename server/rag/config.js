import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// Embedding model: a small sentence-embedding model (384 dimensions) that runs locally in Node, so no API key
// or per-request cost is needed for retrieval. The first run downloads about 23 MB into the cache folder.
export const EMBED_MODEL = process.env.RAG_EMBED_MODEL || 'Xenova/all-MiniLM-L6-v2';
export const MODEL_CACHE = process.env.RAG_MODEL_CACHE ? path.resolve(process.env.RAG_MODEL_CACHE) : path.join(ROOT, '.model-cache');
export const INDEX_PATH = process.env.RAG_INDEX_PATH ? path.resolve(process.env.RAG_INDEX_PATH) : path.join(ROOT, 'server', 'rag', 'index.json');

// Retrieval settings
export const TOP_K = 4; // passages handed to the answering step
export const MIN_SCORE = Number(process.env.RAG_MIN_SCORE) || 0.25; // best passage below this = the question is not about anything in the documents
export const SENTENCE_MIN_SCORE = 0.28; // extractive mode only: the best sentence must be at least this similar
export const CONFIDENT_SENTENCE_SCORE = 0.45; // above this the extractive answer is stated plainly, below it is hedged
export const LEXICAL_MIN_SCORE = 0.2; // same idea for the keyword fallback

// Chunking settings
export const CHUNK_MAX_CHARS = 600;
export const CHUNK_OVERLAP_SENTENCES = 1;

// LLM settings (the LLM is optional: without ANTHROPIC_API_KEY the assistant answers extractively from the passages)
export const CHAT_MODEL = process.env.CHAT_MODEL || 'claude-opus-5-5';
export const CHAT_MAX_TOKENS = 2000; // adaptive thinking tokens also count toward this
