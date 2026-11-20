// Keyword fallback. If the embedding model cannot be loaded (for example on a host with no internet for the
// first download), retrieval still works by weighting rare words: a chunk scores by the share of the
// question's (idf-weighted) words that it contains. It is less clever than embeddings but never invents anything.
const STOP = new Set('the a an and or of to in on for with is are was were be been has have had does do did what which who whom whose where when why how can could would should his her him he she they them their its it this that these those about from by at as any all some tell me you your i my me please also than then there here into out up'.split(' '));

export const tokens = (s) => String(s).toLowerCase().replace(/[^a-z0-9+#.\s]/g, ' ').split(/\s+/).map((w) => w.replace(/^\.+|\.+$/g, '')).filter((w) => w.length > 1 && !STOP.has(w));

export function buildLexicon(chunks) {
  const df = new Map();
  const sets = chunks.map((c) => new Set(tokens(c.embedText || c.text)));
  sets.forEach((set) => set.forEach((w) => df.set(w, (df.get(w) || 0) + 1)));
  const n = chunks.length;
  const idf = (w) => Math.log(1 + n / (df.get(w) || 0.5));
  return { sets, idf };
}

export function lexicalSearch(index, question, k = 4) {
  const lex = (index._lex ||= buildLexicon(index.chunks));
  const q = [...new Set(tokens(question))];
  const total = q.reduce((s, w) => s + lex.idf(w), 0) || 1;
  return index.chunks
    .map((chunk, i) => ({ chunk, score: q.reduce((s, w) => s + (lex.sets[i].has(w) ? lex.idf(w) : 0), 0) / total }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
