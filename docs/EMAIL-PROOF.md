# Proof that the contact form email really arrives

The form, the validation and the spam protection are covered by automated tests (`npm test`). Those tests use a fake
Brevo server, so they prove the **request is built correctly** (sender, recipient, reply-to, API key header) but they
never send a real email. Real delivery needs your own accounts, so this part is yours to run. It takes about ten minutes.

## 1. Set up Brevo (once, free, no domain needed)
1. Create a free account at https://www.brevo.com (the free plan allows roughly 300 emails a day).
2. Add your Gmail address as a sender and **verify it** (Brevo emails you a confirmation link): Senders, Domains and dedicated IPs, Senders.
3. Create an API key: your name, SMTP and API, API keys, Generate a new API key.
4. Copy `.env.example` to `.env` and fill in (the file is git-ignored, so the key never enters the repository or the zip):
   ```
   MAIL_TO=your-address@gmail.com
   BREVO_API_KEY=<the key from step 3>
   BREVO_SENDER_EMAIL=<the Gmail address you verified in step 2>
   MAIL_DRY_RUN=false
   ```
   The sender **must** be the verified address, otherwise Brevo rejects the message.

## 2. Send one real test message (two ways, do both)
```bash
npm run mail:test                    # straight through Brevo
npm start                            # in a second terminal: the site and API on http://localhost:3001
npm run mail:test -- --via-site      # through /api/contact, exactly the way a visitor's message travels
```
You can also fill in the real form in the browser at http://localhost:3001 and press Send.

## 3. Collect the four pieces of evidence
| # | Evidence | How |
|---|---|---|
| 1 | The email in your Gmail inbox | Screenshot of the message whose subject contains the `DELIVERY-TEST-...` token. If it is not in the inbox, check **Spam**: mail sent without your own domain can land there. Mark it "Not spam" and note that in the report. |
| 2 | Brevo shows it delivered | Brevo dashboard, Transactional, Logs: screenshot the entry with the status "Delivered". |
| 3 | The server log line with the message id | The `[contact] sent via Brevo: messageId=<...>` line in the terminal running `npm start`, and the `SENT via Brevo ... messageId=...` line in `docs/email-proof/delivery-log.txt`. The same id appears in the Brevo log entry. |
| 4 | Reply-to works | In Gmail press **Reply** on the message: screenshot that the To field is the visitor's address (not the sender address). Send the reply and screenshot it arriving at the test visitor. |

Put the screenshots in `docs/email-proof/` next to the log and include that folder in your report.

## 4. Failure handling you can also demonstrate
- Empty or invalid fields: the form shows the highlighted-field error and the server returns 400 with per-field messages.
- Sending too fast or a filled honeypot: the form asks the visitor to wait and retry; bots receive a quiet success and nothing is sent.
- More than 5 messages in 15 minutes from one address: HTTP 429 and a "Too many attempts" message.
- A wrong or unverified Brevo key or sender: the visitor gets "The message could not be delivered..." and the server log names the cause (for example `401 unauthorized`), never the key.
- No internet: the form says it could not reach the server and keeps what the visitor typed.

## Alternative: Gmail SMTP instead of Brevo
Leave `BREVO_API_KEY` empty and set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER` and `SMTP_PASS` (a Google **App Password**, never your normal password). `npm run mail:test` and the evidence steps work the same way, except step 2 of the evidence is the Gmail "Sent" folder instead of the Brevo log.

## Delivery status from Brevo itself (not just "accepted")

`npm run mail:status` asks Brevo's events API what happened to every message id in `email-proof/delivery-log.txt`.
Result for the test message sent on 2026-11-20 (message id `202611201627.14433859067@smtp-relay.mailin.fr`):

```
requests   21:27:15   Brevo accepted the request
delivered  21:27:16   the receiving mail server accepted it
opened     21:38:28   opened in the inbox
```

Delivered and opened means it reached the inbox, not the spam folder's bounce path. To keep checking after deployment, run the same command
with a new message id (the server prints `messageId=...` for every contact message it sends).
