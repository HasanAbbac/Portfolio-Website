# Hasan Abbasi: interactive 3D portfolio

A scroll-driven 3D portfolio built around one idea: **scrolling walks you through a Blender render pipeline.**
A rigged 3D avatar (a stylized character with a 21-bone skeleton, loaded from `public/models/avatar-hero.glb`) is built from scattered points when the page opens, then swept into a wireframe, a clay render and the finished materials as you scroll (Vertices, Wireframe, Solid, Material, Render, Export). Each stage is a section of the site. If the model cannot load, a built-in low-poly character is used instead.

**Sections:** Home, About, Skills (node graph), Projects (gallery with 3D viewer and playable games), Education and experience (dope-sheet timeline you can scrub), Contact (export dialog).
**Also:** an AI assistant that answers questions about Hasan from his own documents (RAG) in all seven site languages, a draggable avatar (drag it sideways to turn it; it eases back to its resting pose), project search with category, tool and sort filters, dark and light themes, 7 languages (English, Arabic, Chinese, French, Spanish, Turkish, Urdu), a quick menu (press K), keyboard and screen-reader support.

## Tech
Vite 6, vanilla JS (ES modules), Three.js, Express (local and Render) or Vercel serverless functions (`api/`), Nodemailer, Helmet, express-rate-limit, Gemini (or the Anthropic SDK) for answers and a local embedding model (Transformers.js, optional) for retrieval. Tests use Node's built-in test runner.

## Run it
Requires **Node.js 18.18 or newer** (https://nodejs.org).

```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm run dev
```
Open **http://localhost:5173**. The contact API runs alongside on port 3001 (proxied automatically).

### Production build
```bash
npm run build
npm start                 # serves dist/ and the API on http://localhost:3001
```
Before you deploy, set `SITE_URL` (for example `SITE_URL=https://your-domain.com`) in the environment when you run `npm run build`. It adds the canonical URL, absolute social-preview links, `sitemap.xml` and a `robots.txt` that points to it. Set `NODE_ENV=production` when you run `npm start` so the HTTPS-only security headers are on.

### Tests
```bash
npm test                  # form validation, spam checks, rate limit, 404 handling, and the RAG pipeline
```
```bash
npm run build && npm run test:e2e   # browser tests: opens the real site in Chrome/Edge (dry-run mail), walks navigation, Back/Forward, contact form, popups, 320 px phone, chat
```
A GitHub Actions workflow (`.github/workflows/ci.yml`) runs lint, build, tests and a dependency audit on every push.

## Contact form and email
Edit `.env`:
- `MAIL_TO`: where messages are delivered.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: for Gmail use `smtp.gmail.com`, port 465, and a Google **App Password** (Account, Security, 2-Step Verification, App passwords). Never use your normal password.
- `MAIL_DRY_RUN=true`: logs messages to the terminal instead of sending. The page then says "Test mode" instead of "sent", and a production server warns at start-up. Use it for testing, then set it back to `false`.

Protections: hidden honeypot field, a minimum-fill-time check (field errors are reported first; a too-fast submit is rejected with a message so a real visitor can just press Send again), rate limit (5 accepted messages per 15 minutes per visitor, plus a looser cap on all attempts; adjustable in `.env`), 10 kB body limit, server-side validation, header-injection and HTML escaping. **Send one real test message with your SMTP settings before you go live; the automated tests only use dry-run mode.**

## AI assistant (RAG chatbot)
Visitors can ask questions about you in the chat panel (the chat button in the top bar, or "Ask AI" bottom left). It retrieves the most relevant passages from your CV, projects, skills and timeline, and answers only from them; if the answer is not in your documents it says so instead of inventing one. Sources are shown under each answer. A short explanation of the pipeline, the measured quality and the settings is in **`docs/RAG-PIPELINE.md`**.
```bash
npm run rag:build         # (re)build the vector index after editing knowledge/*.md or src/content.js
npm run rag:eval          # measure retrieval quality
npm run rag:ask -- "Which tools does Hasan use?"
```
Set `GEMINI_API_KEY` (or `ANTHROPIC_API_KEY`) in `.env` to have a model write the answers; without a key the assistant quotes the best-matching passage. Questions in Arabic, Chinese, French, Spanish, Turkish or Urdu are translated to English for the search and answered in the page language. The first run downloads a 23 MB embedding model (needs internet once).

## Proof that email arrives
`npm run mail:test` sends one real test message and logs the mail server's receipt; the steps and the evidence checklist are in **`docs/EMAIL-PROOF.md`**.

## Email (Brevo) and AI answers (Gemini): both free
Add these to `.env` (see `.env.example`); both keys stay in `.env` and are never committed.
- **Contact form email:** `BREVO_API_KEY` and `BREVO_SENDER_EMAIL` (your verified Gmail). Without them the form falls back to SMTP, and without that it asks the visitor to email you directly. Step-by-step proof of delivery: `docs/EMAIL-PROOF.md`. Check with `npm run mail:test`.
- **Chatbot answers:** `GEMINI_API_KEY` from Google AI Studio (optionally `GEMINI_CHAT_MODEL`). Without a key the assistant still answers by quoting the best-matching passage from your documents. How it works: `docs/RAG-PIPELINE.md`.

## Adding projects
Open `src/content.js` and add one object per project to the `projects` array (the comment above it lists every option). The section becomes a filterable gallery (All, 3D Models, Web Games, Unity Games), shows 6 cards with a "Show more" button, and each card opens a popup.

| Project | Put the files in | Fields |
|---|---|---|
| Blender model | thumbnail in `public/projects/`, model in `public/models/` | `type: 'model'`, `image`, `model: '/models/name.glb'` |
| HTML game | game folder in `public/games/<name>/` (must contain `index.html`) | `type: 'web'`, `image`, `play: '/games/<name>/index.html'` |
| Unity game | WebGL build folder in `public/games/<name>/`, or just a gameplay video | `type: 'unity'`, `image`, `play: '/games/<name>/index.html'` or `video: '/projects/<name>.mp4'` |
| Unreal Engine game | gameplay video in `public/projects/` | `type: 'unreal'`, `image`, `video: '/projects/<name>.mp4'` |

Optional on any project: `year`, `role` (shown beside the type in the popup), `links: [{ label, href }]`, `video` (YouTube link or a local `.mp4`, shown with a title cover and play button; set `cover` to the cover image), the "Technique" dropdown options come from `techniques` in `src/content.js` (a short fixed list, tools are covered by the category tabs), `shots` (screenshot list), `fit: [width, height]` (scales a fixed-size game to the popup).

- **Blender export:** File, Export, glTF 2.0, format *glTF Binary (.glb)*, and tick **Compression (Draco)** and keep textures at 2048 px or smaller. The viewer decodes Draco models, so files stay small (about 0.2 to 3 MB each).
- **Unity export:** Build Profiles, Web, and in Publishing Settings set *Compression Format* to **Disabled** (or enable *Decompression Fallback*), otherwise the built-in server cannot serve it.
- **Redirect instead of a popup:** add `href: 'https://...'` and the card opens that link in a new tab.

## CV
`public/Hasan_Abbasi_CV.pdf` is built from `scripts/cv/cv.html`, which uses the site's own colours and fonts. Edit that file and run `npm run cv:build` (needs Chrome or Edge installed).

## Fonts and images
Latin fonts (Unbounded, Manrope, DM Mono) are self-hosted in `public/fonts/`. Arabic, Urdu and Chinese fonts load from Google Fonts only when that language is chosen. The social-sharing image is `public/og-image.jpg` (1200 by 630).

## Deploying
See `DEPLOY.md` (Vercel: `vercel.json` and `api/`; Render blueprint in `render.yaml`). `npm run mail:status` shows Brevo's delivered/opened events for sent messages. `npm run lint` checks the code.
