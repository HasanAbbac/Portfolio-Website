// Steps 5 and 6: retrieve the most relevant chunks for a question, then answer from them only.
//  - below the similarity threshold  -> a fixed "I don't have that information" reply (the LLM is never called)
//  - an LLM is configured            -> Claude writes the answer from the passages (and may still say NOT_FOUND)
//  - no LLM configured               -> an extractive answer: the best-matching sentences, quoted from the documents
import { TOP_K, MIN_SCORE, LEXICAL_MIN_SCORE, SENTENCE_MIN_SCORE, CONFIDENT_SENTENCE_SCORE } from './config.js';
import { search } from './store.js';
import { lexicalSearch, tokens } from './lexical.js';
import { splitSentences } from './chunk.js';
import { NOT_FOUND } from './llm.js';

export const REFUSAL = "I don't have that information in Hasan's portfolio or CV. For anything else, please use the contact form below and he'll reply himself.";

// Personal topics the assistant never answers, even if a passage happened to mention them.
export const PRIVATE_REPLY = "That's personal information Hasan doesn't share here. If you need to reach him, please use the contact form below.";
const PRIVATE_RE = /\b(salary|salaries|income|how much (does|do) he (earn|make)|married|marital|wife|husband|girlfriend|boyfriend|dating|birthday|date of birth|how old|religion|religious|politic\w*|phone( number)?|passport|cnic|password|parents|siblings?)\b|\b(home|street|house|postal|residential)\s+address\b|where\s+(does|do)\s+(he|hasan)\s+live/i;
export const isPrivateQuestion = (q) => PRIVATE_RE.test(q);

// Greetings, thanks and "who are you" get a friendly fixed reply. No search and no model call, so they are instant and cost nothing.
export const GREETING_REPLY = "Hi! I'm the assistant on Hasan's portfolio. Ask me about his skills, projects, education or how to contact him.";
export const ABOUT_BOT_REPLY = "I'm an AI assistant on Hasan Abbasi's portfolio. I answer questions about his skills, projects, education and certificates using only his CV and portfolio, and I'll say so when I don't know. Try asking about a project, for example Rage Station.";
export const THANKS_REPLY = "You're welcome! Ask me anything else about Hasan's skills or projects.";

// The same fixed replies in the site's other languages, chosen by the page's language (the `lang` field of the request).
// Answers written by the language model follow the visitor's own language on their own; only these fixed replies need a table.
const T = {
  ur: {
    greeting: 'سلام! میں حسن کے پورٹ فولیو کا اسسٹنٹ ہوں۔ ان کی مہارتوں، پروجیکٹس، تعلیم یا رابطے کے بارے میں پوچھیں۔',
    thanks: 'خوش آمدید! حسن کی مہارتوں یا پروجیکٹس کے بارے میں مزید کچھ پوچھیں۔',
    about: 'میں حسن عباسی کے پورٹ فولیو پر ایک AI اسسٹنٹ ہوں۔ میں صرف ان کے CV اور پورٹ فولیو سے ان کی مہارتوں، پروجیکٹس اور تعلیم کے سوالوں کے جواب دیتا ہوں، اور جو معلوم نہ ہو وہ بتا دیتا ہوں۔',
    refusal: 'یہ معلومات حسن کے پورٹ فولیو یا CV میں موجود نہیں ہیں۔ باقی باتوں کے لیے نیچے رابطہ فارم استعمال کریں، وہ خود جواب دیں گے۔',
    private: 'یہ ذاتی معلومات ہیں جو حسن یہاں شیئر نہیں کرتے۔ رابطے کے لیے نیچے رابطہ فارم استعمال کریں۔',
  },
  es: {
    greeting: '¡Hola! Soy el asistente del portafolio de Hasan. Pregúntame por sus habilidades, proyectos, estudios o cómo contactarlo.',
    thanks: '¡De nada! Pregúntame lo que quieras sobre las habilidades o proyectos de Hasan.',
    about: 'Soy un asistente de IA en el portafolio de Hasan Abbasi. Respondo preguntas sobre sus habilidades, proyectos y estudios usando solo su CV y portafolio, y te aviso cuando no lo sé.',
    refusal: 'No tengo esa información en el portafolio ni en el CV de Hasan. Para cualquier otra cosa, usa el formulario de contacto de abajo y él responderá personalmente.',
    private: 'Es información personal que Hasan no comparte aquí. Si necesitas contactarlo, usa el formulario de contacto de abajo.',
  },
  fr: {
    greeting: 'Bonjour ! Je suis l’assistant du portfolio de Hasan. Interrogez-moi sur ses compétences, ses projets, ses études ou comment le contacter.',
    thanks: 'Avec plaisir ! Posez-moi d’autres questions sur les compétences ou les projets de Hasan.',
    about: 'Je suis un assistant IA du portfolio de Hasan Abbasi. Je réponds aux questions sur ses compétences, projets et études uniquement à partir de son CV et de son portfolio, et je le dis quand je ne sais pas.',
    refusal: 'Je n’ai pas cette information dans le portfolio ni le CV de Hasan. Pour toute autre question, utilisez le formulaire de contact ci-dessous, il répondra lui-même.',
    private: 'Ce sont des informations personnelles que Hasan ne partage pas ici. Pour le joindre, utilisez le formulaire de contact ci-dessous.',
  },
  zh: {
    greeting: '你好！我是 Hasan 作品集的助手。可以问我他的技能、项目、教育背景或联系方式。',
    thanks: '不客气！还可以继续问我关于 Hasan 技能或项目的问题。',
    about: '我是 Hasan Abbasi 作品集上的 AI 助手，只根据他的简历和作品集回答关于技能、项目和教育的问题，不知道时我会如实说明。',
    refusal: '我在 Hasan 的作品集或简历中没有找到这些信息。其他问题请使用下方的联系表单，他会亲自回复。',
    private: '这是 Hasan 不在此公开的个人信息。如需联系他，请使用下方的联系表单。',
  },
  ar: {
    greeting: 'مرحباً! أنا مساعد معرض أعمال حسن. اسألني عن مهاراته أو مشاريعه أو دراسته أو كيفية التواصل معه.',
    thanks: 'على الرحب والسعة! اسألني أي شيء آخر عن مهارات حسن أو مشاريعه.',
    about: 'أنا مساعد ذكاء اصطناعي في معرض أعمال حسن عباسي. أجيب عن أسئلة مهاراته ومشاريعه ودراسته اعتماداً على سيرته الذاتية ومعرض أعماله فقط، وأقول ذلك عندما لا أعرف.',
    refusal: 'ليست لدي هذه المعلومات في معرض أعمال حسن أو سيرته الذاتية. لأي شيء آخر، استخدم نموذج التواصل أدناه وسيرد بنفسه.',
    private: 'هذه معلومات شخصية لا يشاركها حسن هنا. للتواصل معه، استخدم نموذج التواصل أدناه.',
  },
  tr: {
    greeting: 'Merhaba! Ben Hasan’ın portfolyo asistanıyım. Becerileri, projeleri, eğitimi veya iletişim hakkında sorabilirsiniz.',
    thanks: 'Rica ederim! Hasan’ın becerileri veya projeleri hakkında başka bir şey sorabilirsiniz.',
    about: 'Ben Hasan Abbasi’nin portfolyosundaki bir yapay zekâ asistanıyım. Becerileri, projeleri ve eğitimi hakkındaki soruları yalnızca CV’si ve portfolyosuna dayanarak yanıtlarım; bilmediğimde bunu söylerim.',
    refusal: 'Bu bilgi Hasan’ın portfolyosunda veya CV’sinde yok. Başka konular için aşağıdaki iletişim formunu kullanın, kendisi yanıtlayacaktır.',
    private: 'Bu, Hasan’ın burada paylaşmadığı kişisel bir bilgidir. Ulaşmak için aşağıdaki iletişim formunu kullanın.',
  },
};
export const fixedReply = (kind, lang, english) => (T[lang] && T[lang][kind]) || english;
const GREETING_RE = /^\s*(hi+|hello+|hey+|hiya|howdy|yo|sup|good\s+(morning|afternoon|evening)|greetings|salaam|salam|assalam\s*(u|o)?\s*alaikum|assalamualaikum|namaste|hola|bonjour|merhaba)(\s+(there|bot|assistant|everyone))?[\s!.,?]*$/i;
const THANKS_RE = /^\s*(thanks|thank\s+you|thank\s+you\s+very\s+much|thx|ty|cheers|shukriya)(\s+(a\s+lot|so\s+much))?[\s!.]*$/i;
const ABOUT_BOT_RE = /\b(who|what)\s+are\s+you\b|\bwhat\s+can\s+you\s+(do|help)\b|\bhow\s+can\s+you\s+help\b|\bwho\s+(made|built|created)\s+you\b/i;
export function smallTalkReply(q, lang = 'en') {
  if (GREETING_RE.test(q)) return fixedReply('greeting', lang, GREETING_REPLY);
  if (THANKS_RE.test(q)) return fixedReply('thanks', lang, THANKS_REPLY);
  if (ABOUT_BOT_RE.test(q)) return fixedReply('about', lang, ABOUT_BOT_REPLY);
  return null;
}

// A short follow-up such as "and his education?" is searched together with the previous question.
export function buildQuery(question, history = []) {
  const prev = [...history].reverse().find((m) => m.role === 'user');
  return prev && tokens(question).length < 3 ? `${prev.content} ${question}` : question;
}

const toSource = (c) => ({ title: c.title, label: c.label, href: c.href, projectIndex: c.projectIndex });
function uniqueSources(chunks, max = 3) {
  const seen = new Set();
  const out = [];
  for (const c of chunks) {
    if (seen.has(c.docId)) continue;
    seen.add(c.docId);
    out.push(toSource(c));
    if (out.length >= max) break;
  }
  return out;
}

// Returns { hits: [{ chunk, score }], method, minScore }.
export async function retrieve(query, index, { embedFn, k = TOP_K } = {}) {
  if (embedFn) {
    try {
      const [qv] = await embedFn([query]);
      return { hits: search(index, qv, k), method: 'embeddings', minScore: MIN_SCORE };
    } catch (err) {
      console.warn('[rag] embeddings unavailable, using keyword search:', err.message);
    }
  }
  return { hits: lexicalSearch(index, query, k), method: 'keywords', minScore: LEXICAL_MIN_SCORE };
}

// Extractive answer (no LLM): quote the best-matching passage in full. Passages are short and self-contained, so this is
// more reliable than stitching sentences together. The best sentence score is only used to decide whether to answer at all.
async function extractive(question, hits, { embedFn, method }) {
  const top = hits[0];
  const chunks = [top.chunk];
  const second = hits[1];
  if (second && second.chunk.docId !== top.chunk.docId && second.score >= top.score * 0.9) chunks.push(second.chunk);
  let bestSentence = 2; // keyword mode: no sentence-level score
  if (method === 'embeddings' && embedFn) {
    const sents = hits.slice(0, 3).flatMap((h) => splitSentences(h.chunk.text));
    const vecs = await embedFn([question, ...sents]);
    bestSentence = Math.max(...sents.map((_, i) => vecs[i + 1].reduce((acc, v, j) => acc + v * vecs[0][j], 0)));
  }
  return { text: chunks.map((c) => c.text).join(' '), chunks, bestSentence };
}

// deps: { index, embedFn, llm }   input: { question, history }
export async function answerQuestion({ question, history = [], lang = 'en' }, { index, embedFn, llm }) {
  const refusal = fixedReply('refusal', lang, REFUSAL);
  const chat = smallTalkReply(question, lang);
  if (chat) return { answer: chat, sources: [], mode: 'smalltalk', score: 1, method: 'rule' };
  if (isPrivateQuestion(question)) return { answer: fixedReply('private', lang, PRIVATE_REPLY), sources: [{ title: 'Contact Hasan', label: 'Contact', href: '#contact', projectIndex: null }], mode: 'refusal', score: 0, method: 'rule' };
  const query = buildQuery(question, history);
  const { hits, method, minScore } = await retrieve(query, index, { embedFn });
  const best = hits[0] ? hits[0].score : 0;
  if (!hits.length || best < minScore) return { answer: refusal, sources: [], mode: 'refusal', score: best, method };

  const strong = hits.filter((h) => h.score >= minScore * 0.85);
  if (llm) {
    const passages = strong.map((h, i) => ({ n: i + 1, title: h.chunk.title, text: h.chunk.text }));
    const text = await llm({ question, history, passages });
    if (!text || text.trim() === NOT_FOUND) return { answer: refusal, sources: [], mode: 'refusal', score: best, method };
    return { answer: text, sources: uniqueSources(strong.map((h) => h.chunk)), mode: 'llm', score: best, method };
  }
  const ex = await extractive(question, strong, { embedFn: method === 'embeddings' ? embedFn : null, method });
  const confident = method === 'embeddings' ? CONFIDENT_SENTENCE_SCORE : 2;
  if (method === 'embeddings' && ex.bestSentence < SENTENCE_MIN_SCORE) return { answer: refusal, sources: [], mode: 'refusal', score: best, method };
  const text = ex.bestSentence >= confident ? ex.text : `I couldn't find an exact answer to that, but this is the closest information in the portfolio: ${ex.text}`;
  return { answer: text, sources: uniqueSources(ex.chunks), mode: 'extractive', score: best, method };
}
