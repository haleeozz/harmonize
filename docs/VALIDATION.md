# Validation — shared-direction release

Checked 2026-10-28. This document supersedes the earlier v2-only validation report: a green material-plan test did not prove that Qloo influenced the plan.

## Completed checks

- `npm run verify`: type checking, lint, all 38 tests and release scan passed.
- `npm run build`: production build passed on Node 24.20.0.
- `npm audit --omit=dev --audit-level=high --json`: zero reported runtime dependency vulnerabilities at the time of checking. This is not a complete security audit.
- `node scripts/check-qloo-contract.mjs`: four read-only live requests confirmed both legacy and current entity filters restrict results to the requested candidate. The current documented parameter is used by the app.
- Production Playwright run with real Qloo: five completed scenarios; no page errors. Report: ignored `artifacts/shared-direction/browser-validation.json`, completed 2026-10-28T12:45:31Z.

## Automated coverage

The 12-case category/needs matrix now goes through the server orchestration, including mandatory Qloo direction discovery and approval, rather than only testing the pure material builder.

Additional checks cover the mandatory compact/economical/daily/dark/dramatic room; dark+calm and light+dramatic; notes retained without interpretation; differing needs and qualities; four preserved original influences; altered catalog fields; no compatible material; ambiguous/unknown/invalid entity choices; missing individual scores; real zero scores; disjoint partial matches; API/auth/network/quota failures; cache/concurrency/cooldown; stale and invented bridge choices; changed Qloo graph changing available direction and exports; approved shared interpretation changing an actual material decision; input-order neutrality; subscriber cancellation isolation; and bounded UTF-8 request-body reading.

The controlled graph tests are not evidence of live Qloo uptime. Quota errors were simulated rather than deliberately exhausting the live account.

## Real browser cases

| Scenario | Category | Selected shared reference | All inputs scored |
| --- | --- | --- | --- |
| Rick Owens + Massive Attack | Compact dark dramatic room | Supreme | 2 / 2 |
| Aesop + Bon Iver | Light calm everyday capsule | Everlane | 2 / 2 |
| Blade Runner 2049 + Ryoji Ikeda | Dark calm small artwork | Vice | 2 / 2 |
| Rick Owens + Massive Attack | Compact everyday object | Supreme | 2 / 2 |
| Lana Del Rey + White Fang + Seven | Standard dark dramatic artwork | Nirvana | 3 / 3 |

These are observed results, not hardcoded winners. The test chooses the first fully checked option and explicitly selects a creative interpretation. No claim is made that an automated click establishes its artistic merit. In the three-reference case, incomplete brand/place candidates remained evidence gaps; a fully scored artist candidate was available.

The browser checks empty start; explicit choices; review; name disambiguation; mandatory bridge and interpretation selection; selected bridge in the result; section order; correct surfaces; Markdown download exact equality; prompt/clipboard equality after Windows newline normalization; evidence download equality; and no fabricated percentages. Both direction selection and result were checked for horizontal overflow at 320, 390 and 768 pixels. The local burst guard was encountered and Retry-After was respected. It was not bypassed.

Screenshots and three full result read-throughs support the separate product review. Screenshot review included the simplified shared-direction selector and the three-reference mobile strategy.

## Delivery gate

Local checks pass. A functional public demo URL, a public MIT-licensed source repository and an English description are required for the event. Source packaging is prepared separately. The subsequent production run below proves deployed signed-out access. Final Devpost submission has not been performed.

## Clean source installation

A separate source-only directory at `WORK/harmonize-release-check` was created without `.env.local`, `.next`, `node_modules` or prior artifacts. `npm ci` succeeded, followed by `npm run verify` (38 tests) and `npm run build`. No Qloo key was needed to install or build; the runtime requires the host's private key. This checks source reproducibility independently from the existing local installation. The clean build includes the final refresh hint for older browser clients.

## Public source verification

The user-created public repository is https://github.com/haleeozz/harmonize . Source commit `213bb01d4b74e807b2aaa4c6b23fdfe442b73565` was cloned without credentials and all 46 Git blob IDs were compared with the uploaded source snapshot. They matched. Private configuration, generated files and local Git history were excluded. Later delivery-document updates do not change application behavior. Public application hosting was subsequently completed; see the production verification below.

## Production verification — 2026-10-28

The public application is https://harmonize-three.vercel.app on `hale1/harmonize`, Node 24.x. Source-controlled `vercel.json` sets the Next.js framework and `npm ci` / `npm run build`; an initial generic-site preset produced a 404 and was corrected before acceptance. The Qloo key is a private Production Secret and is absent from the public repository.

The full five-scenario production-browser run completed at **2026-10-28T13:25:57.138Z** against the public URL. No Vercel login cookies, bypass headers or authenticated CLI proxy were used. All four categories and the spontaneous three-reference mix passed the same result, evidence, Markdown, clipboard and 320/390/768-pixel overflow assertions as locally. Report: ignored `artifacts/production/browser-validation.json`. Page errors: none. The application burst guard was observed and its Retry-After respected.

At 13:26 UTC, the public HTML and 11 linked public static assets were checked locally against the actual configured Qloo key; no match was found. No key value was printed or sent as part of that comparison. Report: ignored `artifacts/production/key-exposure-check.json`.

The production application is functional and public. GitHub auto-deploy linking was attempted but the Vercel account's Git-provider access was unavailable; this release was deployed directly through the authenticated CLI. Automatic Git deployment is not claimed. No Devpost form has been submitted.
