import { loadIndex } from '../../server/rag/store.js';
import { createLlm } from '../../server/rag/llm.js';
import { pickAnswerer } from '../../server/rag/gemini.js';
import { answerQuestion } from '../../server/rag/answer.js';
import { clean } from '../../server/mail.js';
import { allow, clientIp, num, body } from '../../server/vercel-helpers.js';

// Retrieval is keyword-based here (embedFn: null): the local embedding model cannot run in a serverless function.
// The language model (Gemini, else Claude) still writes the answer from the retrieved passages.
let answerer;
const getLlm = () => { if (answerer === undefined) answerer = pickAnswerer(createLlm); return answerer ? answerer.fn : null; };

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  const win = num('CHAT_WINDOW_MINUTES', 10) * 60 * 1000;
  if (!allow('chat:' + clientIp(req), num('CHAT_LIMIT', 20), win)) {
    return res.status(429).json({ error: 'Too many questions in a short time. Please try again in a few minutes.' });
  }
  const b = body(req);
  const question = clean(b.message, 400).replace(/\s+/g, ' ');
  if (question.length < 2) return res.status(400).json({ error: 'Type a question first.' });
  const lang = typeof b.lang === 'string' ? b.lang.slice(0, 5) : 'en';
  const history = (Array.isArray(b.history) ? b.history : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-6)
    .map((m) => ({ role: m.role, content: clean(m.content, 600) }));
  const index = loadIndex();
  if (!index) return res.status(503).json({ error: 'The assistant is not set up yet. Please use the contact form instead.' });
  const llmOk = allow('chat-llm', num('CHAT_LLM_PER_HOUR', 300), 3600000);
  const deps = { index, embedFn: null, llm: llmOk ? getLlm() : null };
  try {
    let r;
    try {
      r = await answerQuestion({ question, history, lang }, deps);
    } catch (err) {
      console.error('[chat] LLM step failed:', err.code || err.message);
      r = await answerQuestion({ question, history, lang }, { ...deps, llm: null });
    }
    return res.status(200).json({ answer: r.answer, sources: r.sources, mode: r.mode });
  } catch (err) {
    console.error('[chat] failed:', err.message);
    return res.status(500).json({ error: 'The assistant could not answer right now. Please use the contact form instead.' });
  }
}
