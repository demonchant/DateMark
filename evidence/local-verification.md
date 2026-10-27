# Local verification record

**Run date:** 2026-10-27 (11:50–12:06 UTC)  
**Revision:** no Git repository/commit existed in the workspace.  
**Environment:** Windows PowerShell, Node.js v24.18.0, Docker CLI 29.6.2 / Compose 5.3.1.  
**No credentials, API keys, personal records, or production data were used.**

## Deterministic logic checks

Command: `node tests/parser.test.js`  
Result: **7 passed, 0 failed**.

Covered explicit English-month/ISO dates, non-coursework-line omission, missing year, numeric ambiguity, user-supplied year review, CRLF source offsets, invalid dates/configuration, confirmed-only ICS serialization, escaping and UTF-8 75-octet line folding. Test inputs are isolated controlled inputs and do not appear as product activity or seeded data.

Syntax commands: `node --check src/parser.js`, `node --check src/app.js`, `node --check server.js`, `node --check playwright.config.js`, `node --check e2e/app.spec.js`. All exited 0.

## Real-source parser spike

Command used the exact official event deadline sentence supplied on the [LaunchPad Hacks rules page](https://launchpad-hacks.devpost.com/rules):

```text
Submissions close November 20, 2026 at 5:00 PM Eastern Time.
```

Observed result: one candidate, `2026-11-20`, `needs_review`, with `sourceText` exactly equal to the input line. This proves the deterministic parser handles this one real English month-name deadline. It does not prove syllabus-wide extraction accuracy, user demand, timing accuracy, or calendar import.

## Static HTTP and configuration smoke checks

Command: `node server.js` (foreground session) then local HTTP requests to `127.0.0.1:4173`.

| Request | Observed response | What it establishes |
|---|---|---|
| `GET /` | 200, `text/html; charset=utf-8`, CSP present | Main page is served by the actual Node static server |
| `GET /src/parser.js` | 200, JavaScript content type, CSP present | Real parser asset is served |
| `GET /src/styles.css` | 200, CSS content type, CSP present | Real stylesheet is served |
| `HEAD /` | 200, no body | HEAD path works |
| `POST /` | 405 | Static server does not accept writes |
| `GET /..%2F.env.example` | 404 | Encoded traversal did not retrieve an outside file |
| `GET /%` | 400 | Malformed path encoding returned an error without crashing server |

Configuration failure command: set `PORT=90000`, then `node server.js`. Observed exit code 1 and message `Invalid PORT: use a decimal integer from 1024 to 65535.` Default run accepted port 4173. This is local-only smoke evidence, not container/public deployment evidence.

After the landing page update, command `node tests/http-smoke.js` exited 0. It observed homepage, stylesheet and local SVG icon as HTTP 200; verified the navigation anchors `#how-it-works`, `#tool`, and `#privacy`; confirmed that no sample deadline records or remote font hosts appear in the page; and checked that the CSS palette has no green or blue hues. This is an HTTP/content check, not a rendered-browser or accessibility result. `node tests/parser.test.js` remained 7/7 passing, and all listed JavaScript source/config/test files passed `node --check`.

## Compose/Docker/npm

- `docker context ls` showed `desktop-linux` and `default` contexts.
- `docker --context desktop-linux info` returned Docker client 29.6.2 but server access failed: `permission denied while trying to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`.
- `docker --context desktop-linux compose config --quiet` exited 0. This validates Compose syntax only; it does not build or boot a service.
- `npm.cmd install --package-lock-only --ignore-scripts --fetch-retries=0 --fetch-timeout=10000` failed to reach the configured registry proxy (`ECONNREFUSED 127.0.0.1:9`). A preceding offline attempt reported no cached registry response. No `package-lock.json` was created.
- The E2E suite is implemented but **BLOCKED**. No Playwright browser ran. `Dockerfile.e2e` pins Playwright npm version 1.64.1 and uses the matching official `v1.64.1-noble` browser image, but dependency installation, container startup, browser assertions, screenshot capture, and trace inspection remain unverified.
- A host Chrome/Edge headless smoke attempt was also blocked by process permissions (`CreateFile: Access is denied` and a Mojo platform-channel fatal error). The CDP helper did not connect; no browser screenshot or interaction evidence was produced. It remains separate from the required Docker Playwright run.

## What is not established

At the time of this original verification record, no demo media had been prepared and the dashboard's public deployment had not been checked. Subsequent media production and remote repository observations are recorded below. No actual syllabus corpus/user interview, real calendar-account import, Devpost submission, or submission receipt is established by this record.
### Separate dashboard route and remote source (2026-10-27)

At 2026-10-27 13:48 UTC, after moving the tool out of the landing page, the following checks ran in the workspace:

- node tests/parser.test.js exited 0; 7 tests passed, 0 failed.
- node tests/http-smoke.js exited 0. Homepage, dashboard, stylesheet, and favicon each returned HTTP 200. The smoke check verified the landing CTA targets dashboard.html, tool inputs exist on the dashboard but not the landing page, the UI contains no sample records, there are no remote fonts, and the palette contains no green/blue hues.
- node --check passed for app/parser/server/HTTP smoke/Playwright spec.
- docker --context desktop-linux compose config --quiet exited 0.

These checks prove static local route/asset availability and parser invariants. They do not prove rendered browser behavior, browser accessibility, a public deployment of the dashboard, or browser E2E behavior. The E2E browser suite remains blocked by Docker engine/npm registry access. The GitHub connector later observed remote commit `3e6569a` (`Add DateMark dashboard and study planner visuals`) and read back `dashboard.html` plus the Pages workflow from the remote repository. The user reports that the public landing page is live; this agent could not independently fetch either public Pages URL, so live availability of the latest dashboard remains unverified here.
### Final local route/parser recheck after dashboard split

At 2026-10-27 13:55 UTC: node tests/parser.test.js exited 0 (7 passed, 0 failed); node tests/http-smoke.js exited 0 (landing, dashboard, stylesheet, and favicon HTTP 200); node --check passed for app/parser/server/HTTP smoke/Playwright spec; docker --context desktop-linux compose config --quiet exited 0. The landing page now omits the app scripts and controls; the dashboard loads the parser/app scripts. This is local static and unit evidence only. Browser interaction and the pushed/public dashboard route remain unverified.

### Demo video and submission screenshots

At 2026-10-27 17:04 UTC, the source recording `1.mp4` (H.264, 1736×778, 30 fps, 166.267 s) was edited into `video_work/1.mp4`. The FFmpeg edit used the source ranges 0–147 s and 159–166.266 s, removing source interval **00:02:27–00:02:39**. A separately generated Edge TTS `en-NG-EzinneNeural` narration, timed captions, animated callout cards, project/research credits, and an end slate were added. Local Downloads filenames visible in the source recording were covered in the edited ending.

Observed output from `ffprobe`: 154.233 s, 1280×720, square pixels, H.264 video, AAC audio, 29,172,939 bytes. `ffmpeg` audio `volumedetect` observed mean volume −16.5 dB and peak −1.4 dB. The screenshots in `media/` were selected from source-recording frames at 00:00:08, 00:00:40, 00:01:20, and 00:02:43; the last image is cropped to the actual `.ics` read-back so unrelated local download filenames are excluded. The source shows synthetic course text, not a real course or user outcome. These artifacts establish a produced media deliverable and its recorded visual content; they do not establish actual browser actions beyond those visible in the supplied source recording.

The entrant supplied the YouTube URL `https://youtu.be/xHnsVDTlIQ4`. Its current access and privacy settings were not independently verified. The voice track is generated narration only; the shipped DateMark app contains no AI feature.
### Multi-source intake change

At 2026-10-27 17:32 UTC, `node tests/parser.test.js` exited 0 (7 passed, 0 failed) after updating the ICS assertion to require source provenance. `node --check src/app.js`, `node --check src/parser.js`, and `node --check server.js` exited 0. Requests to `http://127.0.0.1:4173/dashboard.html`, `/src/app.js`, and `/src/parser.js` each returned HTTP 200; the returned dashboard included the Add another source control and the returned scripts contained the multi-source identifier and ICS source-description field. A fresh `node server.js` launch could not bind because port 4173 was already occupied (`EADDRINUSE`); these HTTP checks exercised the already-running listener, not a fresh server process.

`npm run test:e2e` did not start: this checkout has no `node_modules/@playwright/test`, and `playwright` was not recognized. The new two-source browser scenario is therefore **IMPLEMENTED / UNVERIFIED**. No multi-source browser interaction or live deployed revision has been verified. The existing linked YouTube video predates this change and must not be described as showing it.
