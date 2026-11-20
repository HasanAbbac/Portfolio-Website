// Ask the assistant from the command line:  npm run rag:ask -- "Which tools does Hasan use?"
// Uses Claude when ANTHROPIC_API_KEY is set, otherwise answers extractively from the documents.
import 'dotenv/config';
import { loadIndex } from '../server/rag/store.js';
import { embed } from '../server/rag/embed.js';
import { createLlm } from '../server/rag/llm.js';
import { answerQuestion } from '../server/rag/answer.js';

const questions = process.argv.slice(2).filter(Boolean);
if (!questions.length) { console.error('Usage: npm run rag:ask -- "your question"'); process.exit(1); }
const index = loadIndex();
if (!index) { console.error('No index found. Run: npm run rag:build'); process.exit(1); }
const llm = createLlm();
console.log(llm ? '[mode] Claude answers from the retrieved passages' : '[mode] no ANTHROPIC_API_KEY set: extractive answers straight from the documents');

for (const question of questions) {
  const r = await answerQuestion({ question }, { index, embedFn: embed, llm });
  console.log(`\nQ: ${question}\nA: ${r.answer}\n   mode=${r.mode} retrieval=${r.method} best-score=${r.score.toFixed(2)}`);
  if (r.sources.length) console.log('   sources: ' + r.sources.map((s) => `${s.title} (${s.href})`).join('; '));
}
