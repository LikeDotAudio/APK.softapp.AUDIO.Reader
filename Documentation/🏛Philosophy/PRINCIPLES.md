# Principles — AUDIO.reader (Read.Like.audio)

The README's Philosophy section, pointed at the lines that keep each rule. Ecosystem rules live in the APK.audio root's `Documentation/🏛Philosophy/` (Soft Apps laws in `Soft Apps/`).

| Principle | Kept by |
|---|---|
| **The speech engine is fragile, so feed it small pieces.** Nothing over 150 characters reaches `speechSynthesis`; long sentences break at `,` `;` `:`, then a space, then hard at 149. Sentences split only where `.!?` is followed by space, so `NAME.DN` stays whole. | `src/chunker.js` `parseTextToChunks`, `splitLongSentence`; `test/chunker.test.js` |
| **Keep going on an error.** Chrome's spurious `interrupted` advances to the next chunk; a deliberate stop is silent. | `src/speech.js` `createSpeech().say` (`onerror`, `stop`); `test/adapters.test.js` |
| **Never lose the reader's place.** Text, position, size, speed, voice and notes are written to LocalStorage as they change and restored on load. | `src/store.js` (every key, every access guarded); written from `src/script.js`, `src/Header.js`, `src/Prompter.js`, `src/NoteBook.js` |
| **Clean text for the ear, not the eye.** Markup, arrows, pipes and dash runs go; `6.7ms` becomes "6.7 milliseconds"; numbers ≥ 1 000 000 are dropped; periods are left alone so filenames survive. | `src/behaviours.js` `FORMATTING_RULES.format`, run by `src/script.js` `formatText`; `test/formatting.test.js` |
| **No machinery.** Plain HTML, CSS and eight classic scripts sharing globals; no build, framework, server or network fetch. The tests need only Node. | `src/index.html` (script tags at the end), `test/page-load.test.js` |
| **One door per browser API.** Only `store.js` touches LocalStorage and only `speech.js` touches `speechSynthesis`; a test fails if any other file does. | `test/adapters.test.js` |
| **The stored keys do not change.** The `synthesize_*` names are the ones every release has written, so a saved place survives any update; renaming one would need a read-old-write-new step in `store.js`. | `src/store.js` `STORE_KEYS` |

## Where it falls short
- It knows no broker. The Soft Apps doctrine makes the bus a soft app's door out; nothing publishes, so `display.json` declares no `topic` (WS-03).
