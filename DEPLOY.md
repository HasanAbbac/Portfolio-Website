# Deploying the portfolio

Two hosts are supported. **Vercel** (free) is what the live site uses; **Render** (free) runs the same code as one Node service.

## Vercel (static site plus serverless functions)
`vercel.json` builds the site (`npm run build`, output `dist/`), turns the files in `api/` into functions, bundles the chatbot index with them, and sets the security headers (Content Security Policy, HSTS, X-Frame-Options and more). Every push to `main` on GitHub redeploys automatically.

1. Vercel dashboard, **Add New**, **Project**, import the GitHub repository. Framework preset: **Vite** (detected automatically).
2. **Settings, Environment Variables**, add these for *Production* (they are stored by Vercel, never in GitHub):
   - `GEMINI_API_KEY` (answers, and translating questions in the other six languages)
   - `BREVO_API_KEY` and `BREVO_SENDER_EMAIL` (the sender you verified in Brevo)
   - `MAIL_TO` (optional, defaults to the address in `.env.example`)
   - `SITE_URL` is optional: on Vercel the production address is used automatically for the canonical URL, `sitemap.xml` and social previews. Set it only for a custom domain.
3. **Redeploy** after adding or changing variables (they apply to new deployments only).
4. Check: open `/api/chat/status` (it should say `{"ready":true}`), `/sitemap.xml`, ask the assistant a question, send yourself a contact message.

How the chatbot differs on Vercel: the 23 MB local embedding model cannot run in a serverless function, so retrieval uses keyword search (word stems and synonyms, see `server/rag/lexical.js`). A question in another language is first translated to English by Gemini, then searched, and the answer is written in the page language. That is two Gemini calls for a non-English question and one for an English question. The free Gemini tier allows about 15 calls per minute, which is plenty for a portfolio; if it is exceeded, English questions fall back to quoting your documents and non-English ones get a polite "I don't have that information".
Rate limits (contact form, chat) are kept in memory per function instance, so they are looser than on Render.
After changing `knowledge/*.md` or `src/content.js`, run `npm run rag:build` on your computer and commit the updated `server/rag/index.json`.

---

# Render (free plan)
The site, the contact form and the AI assistant run as one Node service. Nothing here needs a credit card.

## 1. Put the code on GitHub
1. Create a **private** repository and upload this folder. `.env` is in `.gitignore`, so your keys stay on your computer. Check that `.env` is not in the file list before you commit.
2. `.gitattributes` keeps the 3D models, videos and PDF from being corrupted by line-ending conversion.

## 2. Create the service on Render
1. Render dashboard, **New**, **Blueprint**, choose the repository. Render reads `render.yaml` and fills in the build and start commands.
2. When asked for the secret values, paste them there (they are stored by Render, not in GitHub):
   - `BREVO_API_KEY` and `BREVO_SENDER_EMAIL` (the sender you verified in Brevo)
   - `GEMINI_API_KEY`
   - `SITE_URL` (the address Render gives you, for example `https://hasan-portfolio.onrender.com`). If you do not know it yet, deploy once, copy the address, set it, and redeploy.
3. Wait for the build (about 5 minutes the first time: it also downloads the 23 MB embedding model once).

## 3. Check that it works
- Open `/api/health`: it should say `{"ok":true}`.
- Open the site, ask the assistant a question, send yourself a contact message.
- Then run `npm run mail:status` on your computer to see Brevo's delivered/opened events for the messages the site sent.

## Good to know
- Free Render services sleep after 15 minutes without visitors; the first visit afterwards takes about 30 seconds. This is a plan limit, not a bug.
- Rotate keys if they were ever shared: make new ones in Brevo and Google AI Studio, paste them into Render, delete the old ones.
- Limits (messages per visitor, questions per visitor, assistant calls per hour) can be changed with the variables at the bottom of `.env.example`.
- Behind Render exactly one proxy is in front of the server, so `TRUST_PROXY=1` is correct. If you host somewhere without a proxy, set it to `0`.
