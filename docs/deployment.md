# Deployment and configuration

## Product architecture

DateMark is a static browser app. It parses supported course text locally, retains source-line evidence in page memory, and produces a user-confirmed `.ics` download. No backend, database, account, AI, external API, calendar OAuth, or secret is needed for the product flow.

## Environment and local run

No environment variables are required by the browser app. `PORT` is optional for `server.js`: it must be an integer from 1024 through 65535 and defaults to 4173. The server does not load `.env` files; set `PORT` in the shell if needed.

From the repository root:

```powershell
node server.js
```

Open `http://localhost:4173/`, select **Open dashboard**, and test with text you are authorized to use. The app does not store the text; refreshing clears the in-memory session. No `npm install` or API credentials are needed to run the app.

## GitHub Pages deployment

The workflow at `.github/workflows/pages.yml` deploys on pushes to `main` and manual workflow dispatch. It copies `index.html`, `dashboard.html`, `src/`, and `assets/` into a static artifact. It does not publish tests, evidence, research documents, this README, the Build Standard, or the Rebuild Playbook as application files.

- Landing page: https://demonchant.github.io/DateMark/
- Dashboard: https://demonchant.github.io/DateMark/dashboard.html
- Repository: https://github.com/demonchant/DateMark
- Video demo: https://youtu.be/xHnsVDTlIQ4

The GitHub connector observed remote commit `3e6569a` (`Add DateMark dashboard and study planner visuals`, 2026-10-27), which includes the dashboard and Pages asset-copy workflow. The user reports the public landing page works. This agent could not independently retrieve the Pages URLs in its browser environment, so current public deployment of the latest dashboard remains **IMPLEMENTED / UNVERIFIED** here. Check the Actions deployment result and open both URLs before sharing with judges.

## Security and operations

- The static server accepts `GET` and `HEAD` only; it does not accept product data writes.
- Do not paste material you lack permission to use. Do not put course text, personal data, secrets, or credentials in screenshots, repository files, or logs.
- No app data is cached or persisted. There is no stale-data state or external provider recovery path because the app has no external data provider.
- The exported calendar file contains only confirmed dates, with its source wording. DateMark does not claim that another calendar imported it.
- The Playwright E2E suite is present but remains blocked in the recorded environment by unavailable Docker engine and package-registry access; see `evidence/local-verification.md`.

## Remaining prerequisites

1. Confirm both Pages routes are served by a successful current deployment.
2. Keep the YouTube demo accessible throughout judging (November 21–25, 2026).
3. In Devpost, list the actual eligible entrant and teammates, and add the exact source/model attribution for the two generated illustrations if known/required by its terms.
4. Submit one final Devpost entry by November 20, 2026 at 5:00 PM Eastern Time.
