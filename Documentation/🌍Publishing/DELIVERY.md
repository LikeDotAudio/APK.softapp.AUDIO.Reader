# Delivery — AUDIO.reader (Read.Like.audio)

## Build and test
No build step and no package dependency: `src/` is served as is. Tests: `node --test` from the repo root (Node 20+, no install) runs `test/` — formatting and chunking rules, the store and speech adapters, and a stub-DOM page load. `.apk.scripts/smoke.py` (root) checks HEAD is on origin and the live pages answer — see [SMOKE.md](../%F0%9F%A7%A9Manual%20and%20Artifacts/SMOKE.md).

## Where it lands
- **https://read.like.audio/** — `.github/workflows/ftp-deploy.yml` uploads `src/` over FTPS (`SamKirkland/FTP-Deploy-Action@v4.3.5`, secrets `FTP_SERVER` / `FTP_USERNAME` / `FTP_PASSWORD`) on every push to this repo's `master` branch, after `node --test` passes (the upload step does not run if a test fails). `test/` sits outside `src/`, so it is not uploaded.
- **apk.audio** — `https://apk.audio/APK:Softapps/AUDIO/AUDIO.reader/src/index.html`. The APK.audio root's `.github/workflows/ci.yml` uploads the Softapps tree with `.apk.scripts/deploy.py (root)` on a push to the root's `main`; this repo reaches it through a submodule bump (`.apk.scripts/deploy_all.py`).
- **A node** — copied with the Softapps tree into WEB.Frontend-Assets (`/srv/www/Softapps`) and Storage-Portal (`DATABASE.server.SQL`, `:8080`). After an edit: `up-stack.sh WEB.Frontend-Assets` and `up-stack.sh DATABASE.server.SQL`.

## Not automated
The root submodule bump; node image rebuilds. The branch is `master`, not `main` — a push to `main` deploys nothing.

Repository: `https://github.com/LikeDotAudio/APK.softapp.AUDIO.Reader.git` (the page's header links the older `LikeDotAudio/Read.Like.audio`).

## Delivered from the 2026-10-30 audit
- **Pure text rules, tested before deploy** — the chunker moved out of `Prompter.js` into the pure `src/chunker.js`; `test/formatting.test.js` and `test/chunker.test.js` cover every rule in `behaviours.js` (`6.7ms`, `NAME.DN`, ≥ 1 000 000 dropped, the 150-character split, comma/space/hard-cut breaks, headings and TOC). The tests found two real cleanup bugs, now fixed in `behaviours.js`: `->` lost its `>` to the Markdown rule and was left as a dash, and the tag pattern `<[^>]*>?` swallowed everything after a lone `<` (so `a <- b` lost the rest of the line). `.github/workflows/ftp-deploy.yml` runs `node --test` before the FTPS sync. Verified: `node --test` 24/24 pass (the deploy itself was not run).
- **LocalStorage behind `store.js`** — `src/store.js` names every key once (`STORE_KEYS`) and guards every read, write and `JSON.parse`; `script.js`, `Prompter.js`, `Header.js`, `NoteBook.js` use it. A test fails if any other file touches `localStorage`. Key names unchanged, so saved places survive. Verified by `test/adapters.test.js` (blocked storage and bad JSON fall back).
- **`speechSynthesis` behind `speech.js`** — voice ordering, the alternate male/female pick, the per-chunk utterance, Chrome's `interrupted` skip and the silent deliberate stop live in `src/speech.js`; `Prompter.js` and `Header.js` call the adapter. A cancelled utterance's late `onend` no longer advances the place. Verified by `test/adapters.test.js` and `test/page-load.test.js` (Play reads a heading and two sentences through a fake engine).
- **Runs fully offline** — the Google Fonts link is gone; `styles.css` uses `--font-ui` (Inter when installed, else the system UI face). Verified: `src/index.html` has no external URL apart from the header's GitHub link.
- **Brand accent from the token (WS-07, LOOSE-sdk-audio-reader)** — the eight `rgb(244, 144, 44)` / `rgba(244, 144, 44, …)` literals in `styles.css` read `var(--brand-accent)` / `rgba(var(--brand-accent-rgb), …)`, defined from `--apk-accent` in the vendored `src/vendor/apk-contracts/apk-tokens.css` (linked first in `index.html`). Verified: `grep -nE 'rgba?\(\s*244\s*,\s*144\s*,\s*44' src/styles.css` is empty; `node --test` passes.
- **Repeated key literals** — gone with `store.js` (`'synthesize_notes'` is spelled once).
- **Storage-key migration story** — Kept by design: the keys never change (PRINCIPLES "The stored keys do not change"); a rename would add a read-old-write-new step in `store.js`.
- **WS-03 declared topic with no publisher** (from the SDK/contracts audit) — `display.json` no longer declares `topic: APK.audio/Gui/Display/Read`: the reader has no bus client, so the OS's default display identity applies (as for AUDIO.YouTubeMusic / AUDIO.AppleMusic). README, PRINCIPLES and the audit context map updated; `test/page-load.test.js` fails if a `topic` comes back. Verified: `node --test` passes.
