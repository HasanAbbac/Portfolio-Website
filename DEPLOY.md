# Deploying the portfolio (Render, free plan)

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
