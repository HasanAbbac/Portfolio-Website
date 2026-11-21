// Keyword retrieval. It is the search used on hosts that cannot run the local embedding model (for example Vercel
// serverless functions), and the fallback when the model cannot be loaded. A chunk scores by the share of the question's
// (idf-weighted) words that it contains. Two things make it work for natural questions:
//  - words are reduced to a rough stem ("studies", "studying" and "study" match each other)
//  - a few synonym groups ("certifications" also matches "certificate" and "course") count as the same word
// It is less clever than embeddings but never invents anything.
const STOP = new Set('the a an and or of to in on for with is are was were be been has have had does do did what which who whom whose where when why how can could would should his her him he she they them their its it this that these those about from by at as any all some tell me you your i my please also than then there here into out up use used using made make'.split(' '));

// Very small stemmer: enough to join plurals and -ing/-ed forms, short enough to read.
export function stem(w) {
  if (w.length <= 3) return w;
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
  if (w.endsWith('ing') && w.length > 5) return w.slice(0, -3);
  if (w.endsWith('ed') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('es') && w.length > 4 && /(ch|sh|ss|x|z)es$/.test(w)) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) return w.slice(0, -1);
  return w;
}

export const tokens = (s) => String(s).toLowerCase().replace(/[^a-z0-9+#.\s]/g, ' ').split(/\s+/).map((w) => w.replace(/^\.+|\.+$/g, '')).filter((w) => w.length > 1 && !STOP.has(w)).map(stem);

// Words that mean the same thing for this portfolio. Each group is listed as stems; a question word matches a chunk if the
// chunk contains the word itself or any other word of its group.
const GROUPS = [
  ['certif', 'certificate', 'certification', 'cert', 'course', 'coursera', 'cega', 'diploma', 'credential', 'qualification'],
  ['study', 'studie', 'student', 'university', 'degree', 'college', 'school', 'education', 'undergraduate', 'ned', 'bs', 'major', 'specializ', 'level', 'intermediate'],
  ['name', 'hasan', 'abbasi', 'hassan', 'hasaan', 'abbassi'],
  ['skill', 'ability', 'proficien', 'expert', 'tool', 'technolog', 'software', 'stack'],
  ['work', 'job', 'career', 'employ', 'intern', 'experience', 'professional', 'paid'],
  ['contact', 'reach', 'email', 'mail', 'message', 'form', 'github', 'linkedin'],
  ['game', 'arcade'],
  ['project', 'creation'],
  ['interest', 'hobby', 'passion'],
  ['site', 'website', 'page', 'portfolio'],
];
const GROUP_OF = new Map();
GROUPS.forEach((g) => { const stems = [...new Set(g.map(stem))]; g.forEach((w) => { const k = stem(w); GROUP_OF.set(k, [...new Set([...(GROUP_OF.get(k) || []), ...stems])]); }); });
const alternatives = (w) => GROUP_OF.get(w) || [w];

export function buildLexicon(chunks) {
  const df = new Map();
  // a chunk "contains" a word if it has the word or a longer word that starts with it (so "specializ" matches "specializing")
  const sets = chunks.map((c) => new Set(tokens(c.embedText || c.text)));
  sets.forEach((set) => set.forEach((w) => df.set(w, (df.get(w) || 0) + 1)));
  const n = chunks.length;
  const idf = (w) => Math.log(1 + n / (df.get(w) || 0.5));
  // A word the documents never use (a misspelling such as "Hassan", or a translation's wording) is weighed like the most
  // common word of its synonym group, so it cannot outweigh the words that really identify the answer.
  const weightOf = (w) => {
    if (df.get(w)) return Math.max(idf(w), 1);
    const known = alternatives(w).filter((a) => df.get(a));
    return Math.max(known.length ? Math.min(...known.map(idf)) : idf(w), 1);
  };
  const has = (i, w) => { if (sets[i].has(w)) return true; if (w.length < 5) return false; for (const x of sets[i]) if (x.startsWith(w)) return true; return false; };
  return { sets, idf, has, weightOf };
}

export function lexicalSearch(index, question, k = 4) {
  const lex = (index._lex ||= buildLexicon(index.chunks));
  const q = [...new Set(tokens(question))];
  const weight = lex.weightOf;
  const total = q.reduce((s, w) => s + weight(w), 0) || 1;
  return index.chunks
    .map((chunk, i) => ({
      chunk,
      score: q.reduce((s, w) => {
        if (lex.has(i, w)) return s + weight(w);
        // a synonym counts for most of the word's weight
        return alternatives(w).some((a) => a !== w && lex.has(i, a)) ? s + weight(w) * 0.8 : s;
      }, 0) / total,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
