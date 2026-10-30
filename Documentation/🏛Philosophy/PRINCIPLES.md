# Principles — AUDIO.reader (Read.Like.audio)

The README's Philosophy section, pointed at the lines that keep each rule. Ecosystem rules live in the APK.audio root's `Documentation/🏛Philosophy/` (Soft Apps laws in `Soft Apps/`).

| Principle | Kept by |
|---|---|
| **The speech engine is fragile, so feed it small pieces.** Nothing over 150 characters reaches `speechSynthesis`; long sentences break at `,` `;` `:`, then a space, then hard at 149. Sentences split only where `.!?` is followed by space, so `NAME.DN` stays whole. | `src/Prompter.js` `parseTextToChunks` (from line 8) |
| **Keep going on an error.** Chrome's spurious `interrupted` advances to the next chunk; a manual stop is told apart by `isManuallyStopped`. | `src/Prompter.js` `utterThis.onerror` (line 349) |
| **Never lose the reader's place.** Text, position, size, speed, voice and notes are written to LocalStorage as they change and restored on load. | `src/script.js` (text, index), `src/Header.js` (size, `synthesize_rate`, `synthesize_voice`), `src/Prompter.js` (index), `src/NoteBook.js` (notes) |
| **Clean text for the ear, not the eye.** Markup, arrows, pipes and dash runs go; `6.7ms` becomes "6.7 milliseconds"; numbers ≥ 1 000 000 are dropped; periods are left alone so filenames survive. | `src/script.js` `formatText` |
| **No machinery.** Plain HTML, CSS and four classic scripts sharing globals; no build, framework or server. | `src/index.html` (script tags at the end) |

## Where it falls short
- It knows no broker. The Soft Apps doctrine makes the bus a soft app's door out; `display.json` declares `APK.audio/Gui/Display/Read` and nothing publishes on it.
- `src/behaviours.js` restates the formatting regexes as `FORMATTING_RULES` but nothing loads it, so it can drift from `formatText`.
- **Copy to Clipboard** uses the deprecated `document.execCommand('copy')` (`src/NoteBook.js`).
