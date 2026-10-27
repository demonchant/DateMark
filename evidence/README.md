# Evidence index

Evidence is added only after the described command or browser behavior is actually observed. Record UTC time, project revision, exact command/request, actual output, provenance, what it proves, and what it does not prove.

| Artifact | Status | Provenance / reproduction | Proves | Does not prove |
|---|---|---|---|---|
| Official event source log in `docs/hackathon-analysis.md` | VERIFIED research | Official URLs retrieved 2026-10-27 | Listed rules and schedule as visible on those pages at retrieval | Entrant registration/eligibility; future page stability |
| Parser checks | VERIFIED (7 local checks) | `node tests/parser.test.js`; output and limits in `local-verification.md` | Listed deterministic cases and serializer invariants | Browser behavior, broad extraction accuracy or user demand |
| Real-source parser spike | VERIFIED for one sentence | Official LaunchPad rule text and result in `local-verification.md` | One explicit event-date format and exact source retention | Representative course syllabus quality or user demand |
| Static HTTP/config smoke | VERIFIED locally | Exact requests and responses in `local-verification.md` | Static server assets, methods, errors, invalid port | Docker/public hosting/browser UX |
| Landing and separate dashboard content smoke | VERIFIED via local HTTP | `node tests/http-smoke.js`; details in `local-verification.md` | Both routes/assets load; landing CTA opens dashboard; no sample records, remote fonts, green/blue hues | Rendered layout, browser navigation/accessibility, public dashboard deployment |
| ICS read-back | PARTIAL | Unit assertions in parser test; browser download pending | Generated text for deterministic cases | External calendar acceptance |
| Browser E2E report | BLOCKED | Requires Docker Linux engine + npm registry; result in `local-verification.md` | No browser coverage yet | N/A |
| Demo video and screenshot gallery | VERIFIED media production | `video_work/1.mp4`; selected source-recording frames in `media/`; media details in `local-verification.md` | The recorded demo shows the landing page, synthetic dashboard/review flow, and actual `.ics` read-back; requested 00:02:27–00:02:39 source interval is removed | Does not prove live Pages availability, user impact, user demand, or browser E2E coverage |
| YouTube video link | USER-PROVIDED / UNVERIFIED | `https://youtu.be/xHnsVDTlIQ4` supplied by the entrant | Identifies the intended Devpost video URL | Host access/privacy settings were not independently verified |
| Devpost receipt | BLOCKED | Requires eligible entrant's authenticated account and actual submission | Submission accepted at time of receipt | Judging outcome |

Keep generated reports/traces free of source syllabus text, secrets and personal information. Synthetic unit inputs are isolated logic fixtures, not live product data, and cannot support user/outcome claims.
