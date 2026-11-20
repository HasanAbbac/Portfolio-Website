// Step 3: turn text into embeddings (vectors of 384 numbers) with a small local model.
// Texts with similar meaning get vectors that point the same way, so "which tools does he use?" lands
// near a passage about Blender and Three.js even if the words differ.
import { EMBED_MODEL, MODEL_CACHE } from './config.js';

let extractor = null;

async function getExtractor() {
  if (!extractor) {
    extractor = (async () => {
      const { pipeline, env } = await import('@huggingface/transformers');
      env.cacheDir = MODEL_CACHE;
      return pipeline('feature-extraction', EMBED_MODEL, { dtype: 'q8' });
    })();
    extractor.catch(() => { extractor = null; }); // allow a retry if the first load failed
  }
  return extractor;
}

// Returns one unit-length vector (array of numbers) per input text.
export async function embed(texts) {
  const ex = await getExtractor();
  const out = await ex(texts, { pooling: 'mean', normalize: true });
  return out.tolist();
}

export const warmup = () => getExtractor();
