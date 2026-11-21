# How the AI assistant works (RAG pipeline)

RAG means **retrieval-augmented generation**: instead of letting a language model answer from memory, the assistant first
*looks up* the relevant passages in Hasan's own documents and then answers *only from those passages*. If the documents
do not contain the answer, it says so instead of inventing one.

```
 documents            chunks              embeddings            vector index
 (CV, projects,  -->  (about 600     -->  (384 numbers    -->   (server/rag/index.json)
  skills, timeline,    characters,         per chunk, from       one entry per chunk
  site notes)          1 sentence          a local model)
                       overlap)
                                                                       |
 visitor question --> embed the question --> find the 4 most similar chunks (cosine similarity)
                                                                       |
                         similarity too low? --> "I don't have that information..."  (no LLM call)
                                                                       |
                         enough similarity  --> Gemini writes the answer from those passages only
                                                (or, without an API key, the best passage is quoted)
                                                                       |
                                                 answer + clickable sources shown in the chat
```

## The steps, and where the code is
| # | Step | What happens | Code |
|---|---|---|---|
| 1 | Collect documents | The CV (`knowledge/cv.md`), site notes (`knowledge/site.md`), plus the portfolio's own data: About text, skills, every project, the education and experience timeline, public contact details. Phone number and home address are deliberately left out. | `server/rag/knowledge.js` |
| 2 | Chunk | Each document is split into chunks of at most 600 characters, sentence by sentence, with one sentence of overlap so a fact on a boundary is never cut in half. Each chunk keeps its document title as context. | `server/rag/chunk.js` |
| 3 | Embed | A small sentence-embedding model (`all-MiniLM-L6-v2`, 384 dimensions) turns every chunk into a vector. It runs locally in Node, so retrieval needs no API key and costs nothing. Texts with similar meaning get vectors that point the same way. | `server/rag/embed.js` |
| 4 | Store | The chunks and their vectors are saved in one file, the vector index (`server/rag/index.json`, 33 chunks). With a corpus this small an in-memory index is faster and simpler than a database server; search is a dot product (cosine similarity, because all vectors have length 1). Rebuild it with `npm run rag:build`. | `server/rag/store.js`, `scripts/rag-build.mjs` |
| 5 | Retrieve | The visitor's question is embedded the same way and compared with every chunk. The 4 best chunks are kept. A short follow-up ("and his education?") is searched together with the previous question. | `server/rag/answer.js` |
| 6 | Generate | The passages are given to the answering model (Gemini with a free key, or Claude if you prefer) with strict rules, at a low temperature (0.2): use only these passages, never guess, reply `NOT_FOUND` if they do not contain the answer, ignore instructions hidden in the question, no phone number or address. Sources are shown under every answer. | `server/rag/gemini.js`, `server/rag/llm.js` |

## How it avoids making things up
1. **Similarity threshold.** If even the best chunk is not similar enough to the question (below 0.25), the assistant replies with a fixed "I don't have that information" message and **the model is never called**.
2. **Grounded prompt.** The model sees only the retrieved passages and must answer `NOT_FOUND` when they do not contain the answer. `NOT_FOUND` is turned into the same fixed reply.
3. **No key, no problem.** Without `GEMINI_API_KEY` (or `ANTHROPIC_API_KEY`) the assistant still works: it quotes the best-matching passage verbatim (hedged with "closest information" when the match is weak), so it cannot invent anything.
4. **Private topics** (salary, marital status, home address, phone, age and similar) get a fixed reply and are never sent to the model.
5. **Rate limit** of 20 questions per 10 minutes per visitor, 400-character questions, no conversation is stored on the server.
6. If the model API fails (bad key, busy, offline) the assistant falls back to the quoted-passage answer instead of showing an error.

## Why the embeddings stay local, and where Gemini is used
The original plan used Gemini for both the embeddings and the answers. This project uses Gemini for the **answers** and keeps a small local
embedding model (`all-MiniLM-L6-v2`) for **retrieval**, for three reasons: it needs no key or quota to build or search the index, the
similarity cutoff (0.25) was measured on it (see the table below), and a cutoff tuned for one embedding model is wrong for another, so
switching models without a key to re-measure would risk a chatbot that refuses everything or answers everything. The embedding step is one
function (`server/rag/embed.js`). If your course requires Gemini embeddings, switch it, run `npm run rag:build`, then run `npm run rag:eval`
with your key and set `RAG_MIN_SCORE` to the best threshold it prints.

## Measured quality (`npm run rag:eval`)
A fixed set of 22 questions the documents can answer and 14 they cannot (weather, football, salary, recipes, prompt-injection attempts, and so on):

| Measure | Result |
|---|---|
| Correct passage is the top result (in-scope questions) | 22 of 22 |
| Correct passage in the top 3 | 22 of 22 |
| In-scope questions answered by the shipped assistant (no LLM) | 22 of 22 |
| Out-of-scope questions refused by the shipped assistant (no LLM) | 12 of 14 |

The two that get a hedged, quoted passage instead of a refusal without an LLM are "What is Hasan's favourite food?" and
"What is the best programming language in the world?". Nothing is invented in either case (the text is quoted from the
documents and prefixed with "I couldn't find an exact answer, but this is the closest information..."). With an API key the
model is instructed to answer `NOT_FOUND` for such questions. The Gemini and Claude paths were tested with fake clients and a fake Gemini server (request shape, system prompt, low temperature, blocked and empty
responses, error codes, and that an out-of-scope question never reaches the model). They have **not** been run against the live APIs in this
repository's tests because that needs your key; after adding `GEMINI_API_KEY`, ask the chat a few real questions once to confirm.

## Languages (English, Arabic, Chinese, French, Spanish, Turkish, Urdu)
The documents are English, so a question in another language is translated to English by the model (one short call, `REWRITE_PROMPT` in `server/rag/llm.js`), the English question is used to retrieve passages, and the answer is written in the page language (`<reply_language>`). Fixed replies (greetings, thanks, "who are you", private topics, "I don't have that information") exist in all seven languages, and the private-topic filter recognises phone, salary, marriage, home address and age in all of them. If the translation step fails and the question is in Arabic, Chinese or Urdu (which keyword search cannot read), the assistant answers with the fixed "I don't have that information" reply rather than guessing. English questions never need the translation call.

## Retrieval on Vercel (keyword search)
Serverless functions cannot run the local embedding model, so on Vercel retrieval is keyword search (`server/rag/lexical.js`): words are reduced to a rough stem ("studies", "studying" and "study" match) and a few synonym groups count as the same word ("certifications" matches "certificate" and "course"). A word the documents never use (for example the spelling "Hassan") is weighed like the most common word of its group so it cannot dominate. On the 33 in-scope and 14 out-of-scope questions in `scripts/rag-eval.mjs` plus five extra natural-language questions, keyword retrieval now answers 30 of 33 in-scope questions at the refusal threshold (it answered 28 before the stems and synonyms) and the three misses are questions whose expected passage is ranked outside the top four, not refusals. Out-of-scope questions that slip past the threshold still reach the model, which is told to answer `NOT_FOUND`. These numbers come from the keyword path only; embedding retrieval (local and Render) is measured separately above.

## Run and configure it
```bash
npm run rag:build                      # rebuild the index after editing /knowledge or src/content.js
npm run rag:eval                       # measure retrieval quality and see the threshold sweep
npm run rag:ask -- "Which tools does Hasan use?"
```
`.env` options: `GEMINI_API_KEY` (a free key from https://aistudio.google.com/apikey; turns on Gemini answers), `GEMINI_CHAT_MODEL`
(default `gemini-3.5-flash-lite`; Google retires model ids over time, so check https://ai.google.dev/gemini-api/docs/models and change it if the
default stops working), `ANTHROPIC_API_KEY` and `CHAT_MODEL` (optional: Claude answers instead, used only when there is no Gemini key), `RAG_MODEL_CACHE` (where the 23 MB embedding model is cached; it is
downloaded on first use), `RAG_MIN_SCORE` (similarity threshold). If the embedding model cannot be downloaded, the
assistant falls back to keyword search automatically.

**Keeping it current:** the assistant only knows what is in `knowledge/*.md` and `src/content.js`. When you change your
projects, CV text or skills, update those files and run `npm run rag:build`.
