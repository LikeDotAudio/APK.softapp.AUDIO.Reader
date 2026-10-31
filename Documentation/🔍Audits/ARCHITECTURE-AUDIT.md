# 🔍 Architecture audit — AUDIO.reader (2026-10-30)

Audited against the APK.audio multi-repo architecture standard: coupling, boundaries, duplication, contracts.
← [Audits](INDEX.md) · Improvements: [🛣Roadmap/IMPROVEMENTS.md](../%F0%9F%9B%A3Roadmap/IMPROVEMENTS.md)

## Bounded context
Read.Like.audio: a teleprompter / text-to-speech reader — cleans pasted text or Markdown for speech, chunks it to ≤150-character utterances, reads it through the browser's `speechSynthesis`, with a heading TOC and bookmarked notes. Vanilla HTML/CSS/JS with classic-script globals, ~1.1 k lines in `src/`. Sampled: everything in `src/`, `display.json`, README, the FTPS workflow, KNOWN_ISSUES.

## Context map
| Talks to | How (topic / endpoint / file / import) | Relationship |
|---|---|---|
| Softapp launcher | `display.json` (`id: Read`, group `Pipeline` › `01 · Event`, no `topic`: nothing publishes) | Published Language (manifest) |
| Browser Speech Synthesis API | `window.speechSynthesis`, `SpeechSynthesisUtterance` | Conformist (platform API) |
| Google Fonts | `<link>` to fonts.googleapis.com (`src/index.html:7`) | Conformist |
| Browser storage | six `synthesize_*` localStorage keys | Local state only |
| FTPS host | `.github/workflows/ftp-deploy.yml` on push to `master` | Delivery |

No bus, no HTTP API, no sibling-repo files.

## Scorecard
| Category | Score (0–3) | Finding |
|---|---|---|
| Coupling & Cohesion | 3 | Self-contained; nothing outside `src/` is referenced and no network fetch remains (the web font is gone). Scripts share state through globals in load order, which is internal cohesion, not cross-repo coupling. |
| Boundary Integrity | 3 | `speechSynthesis` only through `src/speech.js`, `localStorage` only through `src/store.js` (guarded); a test enforces both. |
| Duplication Control | 3 | Storage keys named once (`STORE_KEYS`); formatting rules once (`behaviours.js`); chunking once (`chunker.js`). |
| Testing & Contracts | 3 | `node --test` covers every documented rule, both adapters and a stub-DOM page load; the FTPS deploy runs it first. |
| Change management | 2 | Storage keys are fixed by principle. The deploy branch is still `master` while the monorepo's softapps use `main` (needs owner). |
Score key: 3 meets the standard · 2 minor gaps · 1 significant gaps · 0 absent / violated.

## Findings
1. **Good — standalone and fully offline**; `display.json` declares it cleanly in the launcher.
2. **Good — rules written down and tested.** [`src/behaviours.js`](../../src/behaviours.js) documents every cleanup and chunking rule, and `test/` encodes them.
3. **Needs owner: deploy branch.** [`.github/workflows/ftp-deploy.yml`](../../.github/workflows/ftp-deploy.yml) deploys on `master`; the monorepo's other softapps use `main`. Renaming the default branch is a GitHub setting (and moves the deploy trigger), so it is left to the owner.

Delivered items: see [🌍Publishing/DELIVERY.md](../%F0%9F%8C%8DPublishing/DELIVERY.md) "Delivered from the 2026-10-30 audit".
