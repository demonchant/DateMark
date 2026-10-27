# DateMark

**A source-first way to turn clearly written course deadlines into a calendar file.** Review every candidate against its original line, resolve uncertainty yourself, and export only what you confirm.

DateMark is a focused student prototype for reviewing dates in course text. The parser runs in the browser and uses deterministic rules. The product overview is on the landing page; date entry, review, and export live on a separate dashboard page. It does not use AI, send pasted text to a backend, connect to a calendar account, or claim that a calendar import succeeded.

- **Source repository:** https://github.com/demonchant/DateMark
- **Expected GitHub Pages URL:** https://demonchant.github.io/DateMark/ (available only after Pages is enabled and the deployment workflow succeeds)
- **Current deployment status:** The user reports the original landing URL is live. The separate dashboard, two page-specific images, and updated Pages artifact are ready locally. The latest push did not update GitHub; the dashboard route is not yet live.

## The problem

Students may find due dates in multiple places across a course site. A 2024 mixed-method survey of 324 students found that students ranked assignment deadlines as the most important syllabus content, yet they reported using four LMS locations to find dates: assignments, modules, syllabus, and calendar. That supports a problem of fragmented deadline visibility; it does not prove that DateMark itself is useful or that students want another tool. [Study in Advances in Physiology Education](https://journals.physiology.org/doi/full/10.1152/advan.00004.2024)

DateMark addresses the narrow manual handoff from course text to a student's own calendar: paste wording from a source you are checking, inspect each detected date beside its source line, and export only after confirmation. It does not crawl LMS pages, compare source freshness, or determine which conflicting course location is authoritative. Student interviews, representative syllabus testing, and measured impact have not yet been completed.

## What DateMark does

1. Paste course text you are authorized to use.
2. Find supported explicit dates on coursework-related lines.
3. Review each candidate beside its source line; edit, confirm, or reject it.
4. Download an iCalendar file containing only confirmed valid dates.
5. Import that file into your own calendar if you choose. DateMark does not connect to the calendar or verify an import.

Date candidates are not treated as truth automatically. Missing years and ambiguous numeric dates remain unresolved; the user has to check and resolve them.

## How it works

The static HTML, CSS, and JavaScript app parses text in the browser. Candidate state is held in page memory. The parser associates candidates with exact source spans and checks calendar validity. The exporter validates confirmed dates and generates a standard all-day iCalendar file for download.

There is no app backend, database, AI model, third-party API, account, or calendar OAuth integration. The static page itself is served over the network when hosted; pasted course text is processed in the browser and is not sent to a server by the app.

## Try it out

### Synthetic demonstration input

No real course document is bundled. If you do not have permission to share a syllabus, this explicitly fictional excerpt can demonstrate the parser. Keep its label visible and do not present it as a real course, student result, or evidence of demand.

For the **Course or source name** field, enter **SYNTHETIC DEMO - Environmental Data Systems 101**.

For the **Course or source name** field, enter: **SYNTHETIC DEMO - Environmental Data Systems 101**

~~~text
SYNTHETIC DEMO INPUT - fictional course outline, not a real syllabus.
Intro to Environmental Data Systems (fictional course)
Project proposal due January 21, 2027.
Midterm exam: February 18, 2027.
Homework 4 due March 5.
Final exam scheduled for 04/12/2027; confirm month/day order with the instructor.
~~~

The written January and February dates are intended to demonstrate supported formats. The missing-year homework date and numeric final-exam date should remain unresolved for review. If the actual app behaves differently, report the observed behavior rather than editing the result or claiming success.

### Local run

Requires Node.js 24 or a modern browser. The product has no runtime package installation or API key requirement.

~~~powershell
node server.js
~~~

Open http://localhost:4173, select **Open dashboard**, paste authorized text on the dashboard, and select **Find written dates**. Review and confirm a candidate before downloading. Refreshing clears the in-memory session.

## Supported input and known limitations

- English month names and ISO dates are supported when they appear on coursework-related lines.
- Numeric dates such as **04/12/2027**, relative dates, and dates without a year are not silently guessed. They require review or manual correction.
- Exported events are all-day events. DateMark does not infer a timezone or time of day.
- No scanned-PDF/OCR, LMS integration, change detection, reminders, calendar sync, cloud storage, or multi-user collaboration.
- Student demand and performance on real course materials have not been validated.
- Browser end-to-end behavior, a public deployment, and external calendar import are not verified yet.

## Built with

HTML, CSS, JavaScript, browser APIs (Blob download), Node.js built-in HTTP server, and the iCalendar format. GitHub Actions is configured to publish a static Pages artifact containing index.html, dashboard.html, the src/ app assets, and two decorative images from assets/.

There are no runtime third-party packages or datasets. The two page illustrations were supplied by the entrant; the image-generation service/model is not recorded here and should be credited in the Devpost entry according to its terms. Deployment uses the official GitHub Pages actions actions/configure-pages, actions/upload-pages-artifact, and actions/deploy-pages.

## Testing and verification

Observed local checks:

- **node tests/parser.test.js** — 7 parser/export checks passed.
- **node tests/http-smoke.js** — local landing and dashboard pages, stylesheet, favicon, both image assets, dashboard navigation, no sample records, no remote fonts, and requested non-green/non-blue palette checks passed.
- JavaScript syntax checks passed.
- **docker --context desktop-linux compose config --quiet** passed; Docker engine access and the Playwright browser suite were blocked in this environment, so no browser E2E result is claimed.

These checks do not establish student demand, real syllabus coverage, browser-rendered accessibility, Pages deployment, or calendar-app import.

## LaunchPad Hacks judging criteria

LaunchPad Hacks publishes four equally weighted criteria, each scored from 1 to 5. DateMark addresses them as follows:

- **Innovation & Originality:** A deliberately narrow, source-linked, deterministic review flow. Existing syllabus-to-calendar products are competitors; DateMark does not claim to be unique, and this distinction needs user validation.
- **Usefulness & Impact:** A prototype for reducing retyping and surfacing date ambiguity for students. The problem and expected value are not yet supported by interviews or measured outcomes.
- **Implementation & Functionality:** Real parsing, source-span retention, editable review states, confirmation checks, and iCalendar serialization are implemented. Unit checks pass; the browser workflow still needs end-to-end verification.
- **Design & Presentation:** A product landing page explains the workflow and limits and links to a separate dashboard for the working tool. Browser-rendered accessibility and responsive interaction still need verification.

## Originality, attribution, and event work

DateMark implementation began on October 27, 2026, within the event work window. The prototype is newly written for this submission; no pre-existing product code or course dataset is included. The synthetic sample above is explicitly marked as fabricated test text.

The Devpost entry must list the actual eligible entrant and any teammates; no team roster or institution is asserted in this README. Every listed participant must satisfy the official student, age-of-majority, and geographic requirements. Companies are excluded, and organizers/judges may not compete for awards.

**AI assistance disclosure:** OpenAI Codex assisted with event research, product planning, implementation, and documentation. The shipped product contains no AI feature, model, AI SDK, or model/API request.

The runtime app uses no third-party code packages or datasets. Two generated illustrations supplied by the entrant are included; the generator/model attribution must be added to Devpost if required by that tool's terms. The deployment workflow calls the official GitHub Pages Actions listed above. Follow their licenses and current terms when deploying.

## Publishing setup

The workflow at .github/workflows/pages.yml triggers on pushes to main. It prepares a deployment artifact from only index.html, dashboard.html, the src/ app files, and the two image assets; it does not publish this README, the Build Standard, the Rebuild Playbook, or research/evidence documents.

For the workflow to deploy:

1. In the repository, open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions** and save.
3. Open **Actions** and rerun the failed **Deploy DateMark to GitHub Pages** workflow, or push a new commit to main.
4. Wait for the deployment job to succeed, then verify https://demonchant.github.io/DateMark/ loads before sharing it.

The initial **Get Pages site failed / Not Found** error was resolved when the user selected GitHub Actions as the Pages source. The user reports the original public landing page is working. The latest local push attempt ended with a connection reset; the remote still has the older landing page. Push the prepared dashboard and assets, rerun deployment, and verify the dashboard route before sharing it.

## Event submission checklist

The official rules require one completed Devpost project page with the project name, pitch, team members, problem, users, solution, technology, challenges, learning, limitations, and an accessible demo/build/walkthrough with setup instructions. Include screenshots; a 2-3 minute demo video is encouraged. Credit libraries, datasets, assets, AI assistance, and pre-existing work, and submit only material you have permission to use. Keep judging links available during November 21-25, 2026. Submit one project entry by November 20, 2026 at 5:00 PM Eastern Time. Participants must follow the community conduct rules and must not include private personal information, secrets, or malicious content. See the [official LaunchPad Hacks rules](https://launchpad-hacks.devpost.com/rules) for eligibility, originality, attribution, dates, and conduct requirements.

Before submission, verify entrant geographic eligibility, finish the Pages deployment, run the browser walkthrough, capture genuine screenshots/video, confirm the actual public links work, and submit the final Devpost project page. No submission receipt or judging outcome is claimed here.
