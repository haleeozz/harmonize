# Publish the reviewed build

This application needs a server. Do not deploy it as a static export or to GitHub Pages.

## Before publication
1. Run `npm ci`, `npm run verify`, and `npm run build` on Node.js 22.19.0 or newer.
2. Review `docs/SUBMISSION.md` and `docs/VALIDATION.md`.
3. Run `npm run check:release`. Confirm `.env.local` is ignored (`git check-ignore .env.local`).
4. Confirm the Qloo key is individually issued to this project and approved for a public demo. Keys previously shared outside the private environment should be replaced through Qloo before publication. Never put a credential into the source, demo, public log, or submission text.

## Vercel
1. Publish the reviewed source to a new public repository, including `LICENSE`, the lockfile, and `.env.local.example`.
2. Import the repository in Vercel. Framework: Next.js. Install: `npm ci`. Build: `npm run build`.
3. Set `QLOO_API_KEY` in the private production environment. Set `QLOO_BASE_URL=https://hackathon.api.qloo.com` for the hackathon credential, or the official host assigned by Qloo for a production credential.
4. Deploy and ensure external visitors can access the application without a Vercel sign-in. Configure this in the hosting dashboard if deployment protection is enabled.
5. Run the judge walkthrough from a signed-out browser. Test downloads, the four project types, and the ambiguity flow. Check the runtime logs for errors without exposing secrets.
6. Copy the working public URL and repository URL into the submission.

## Other Node hosting
Use `npm ci`, `npm run build`, and `npm start`. The server honors the usual Next.js `PORT` variable. Configure the same private Qloo environment variables and HTTPS. A request can take up to 45 seconds, so the host must permit at least 60 seconds for this route.

## Quota and availability
- Each cold two-reference brief uses at most 11 requests: two searches, three joint recommendation queries, six individual checks. Four references use at most 19.
- A clarification request performs only searches. Confirming the choice reuses successful cached searches when the process is warm.
- Successful data is cached for 15 minutes in a bounded per-process cache. A mode switch can reuse this evidence.
- A process-local guard allows eight valid brief attempts per client per minute. It is a demo burst guard, not a distributed quota guarantee. Use hosting-level limits and a Qloo account quota for a larger rollout.
- Upstream calls have a ten-second timeout. The entire operation has a 45-second deadline and no automatic retry loop.
- At most three upstream calls run concurrently per process. A Qloo HTTP 429 starts a cooldown using Retry-After, or 60 seconds when it is absent. New upstream calls are blocked during that period; cached successful data can still be served.
- Review the assigned key's actual expiry and quota with Qloo. This project cannot extend a credential or promise API uptime.

## Publication boundary
The local source package and submission text can be reviewed without uploading anything. Creating a public repository, transferring the private key to a host, and publishing the application are separate external actions. Do not claim a live demo exists until those actions and a deployed smoke test are complete.
