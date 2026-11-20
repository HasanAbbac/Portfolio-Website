// Step 6 with Google Gemini (free key from Google AI Studio): write the final answer from the retrieved passages.
// Same interface as createLlm() in llm.js, so the rest of the pipeline does not care which model answers.
// The key is read from the environment (GEMINI_API_KEY), sent in a header, and never logged.
import { NOT_FOUND, SYSTEM_PROMPT } from './llm.js';

// Model names change over time, so the id is configurable. Check https://ai.google.dev/gemini-api/docs/models for the
// current fast model on your free tier and set GEMINI_CHAT_MODEL if the default is retired.
export const GEMINI_MODEL = process.env.GEMINI_CHAT_MODEL || 'gemini-3.5-flash-lite';
const BASE_URL = process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta';

export function createGeminiLlm({
  apiKey = process.env.GEMINI_API_KEY,
  model = GEMINI_MODEL,
  baseUrl = BASE_URL,
  fetchFn = fetch,
  timeoutMs = 20000,
  retryDelayMs = 800,
} = {}) {
  if (!apiKey) return null;

  // passages: [{ n, title, text }]. history: [{ role: 'user' | 'assistant', content }]
  return async function ask({ question, history = [], passages }) {
    const context = passages.map((p) => `<passage n="${p.n}" source="${p.title.replace(/"/g, "'")}">\n${p.text}\n</passage>`).join('\n');
    const contents = [
      ...history.slice(-6).map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      { role: 'user', parts: [{ text: `<passages>\n${context}\n</passages>\n\n<question>\n${question}\n</question>` }] },
    ];
    const body = {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      // low temperature keeps the answer factual; models that ignore the setting simply use their default
      generationConfig: { temperature: 0.2, maxOutputTokens: 1500 },
    };
    // A brand-new key can briefly answer 403 while Google finishes enabling it, and servers can hiccup (5xx), so try once more.
    let res;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        res = await fetchFn(`${baseUrl}/models/${encodeURIComponent(model)}:generateContent`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch {
        throw Object.assign(new Error('The assistant could not answer right now.'), { code: 'llm_error' });
      }
      if (res.ok || attempt === 1 || !(res.status === 403 || res.status >= 500)) break;
      await new Promise((r) => setTimeout(r, retryDelayMs));
    }
    if (!res.ok) {
      if (res.status === 401 || res.status === 403 || res.status === 400) throw Object.assign(new Error('The assistant is not configured correctly.'), { code: 'llm_auth', status: res.status });
      if (res.status === 429) throw Object.assign(new Error('The assistant is busy right now.'), { code: 'llm_busy', status: res.status });
      throw Object.assign(new Error('The assistant could not answer right now.'), { code: 'llm_error', status: res.status });
    }
    const data = await res.json().catch(() => ({}));
    if (data.promptFeedback && data.promptFeedback.blockReason) return NOT_FOUND; // the prompt was blocked: say "I don't know"
    const cand = (data.candidates || [])[0];
    if (!cand) return NOT_FOUND;
    if (cand.finishReason && !['STOP', 'MAX_TOKENS'].includes(cand.finishReason)) return NOT_FOUND; // safety, recitation, etc.
    const text = ((cand.content && cand.content.parts) || []).map((p) => p.text || '').join('').trim();
    return text || NOT_FOUND;
  };
}

// Which model writes the answers: Gemini if GEMINI_API_KEY is set, else Claude if ANTHROPIC_API_KEY is set, else none
// (then the assistant quotes the best-matching passage from the documents).
export function pickAnswerer(createClaude) {
  const gemini = createGeminiLlm();
  if (gemini) return { fn: gemini, name: 'Gemini' };
  const claude = createClaude ? createClaude() : null;
  return claude ? { fn: claude, name: 'Claude' } : null;
}
