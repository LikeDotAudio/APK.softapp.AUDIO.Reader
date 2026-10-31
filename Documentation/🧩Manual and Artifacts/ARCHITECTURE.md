# Architecture — AUDIO.reader (Read.Like.audio)

## Use
Open `src/index.html` (Launch Pad: **Read** 🗣, or https://read.like.audio/). Paste text or Markdown — it is formatted on paste (**Format Text** re-runs it) — and press **Play**. The prompter replaces the text box, centres the sentence being read and highlights the word; `#`…`######` headings build the chapter sidebar (click to jump). Tick a line's box to keep it in **Notes**. Speed (0.5–2×, default 1.3×), voice, text size and **Change voice every chapter** sit in the header.

## Files
| File | Role |
|---|---|
| `src/index.html` | Page; loads `styles.css` and, in order, `store.js`, `speech.js`, `chunker.js`, `behaviours.js`, `script.js`, `Prompter.js`, `Header.js`, `NoteBook.js` as classic scripts sharing globals. |
| `src/store.js` | The one door to LocalStorage: `STORE_KEYS` (every key) and `store.get/set/getJSON/setJSON`, each guarded by `try/catch` so a private window or bad JSON never throws. |
| `src/speech.js` | The one door to `speechSynthesis`: `createSpeech()` (`say` one chunk, `stop`, `pause`, `resume`; Chrome's `interrupted` error counts as done, a deliberate `stop` is silent), `sortVoices`, `pickAlternateVoices`. |
| `src/chunker.js` | Pure `parseTextToChunks` (sentences ≤ 150 chars, TOC) and `headingSize`; also a CommonJS module for the tests. |
| `src/script.js` | Creates the `speech` adapter; `formatText`, auto-format on paste, text and position persistence. |
| `src/Prompter.js` | `buildPrompterUI` (depth-based line numbers, TOC sidebar), `jumpTo`, `speak` / `playChunk` (one `speech.say` per chunk, chained on `onDone`, word highlight from `onWord`), voice alternation. |
| `src/Header.js` | Controls: voice list (English first, Google/Premium/Enhanced first), speed, size, Play/Pause/Format/Clear; persists size, speed, voice. |
| `src/NoteBook.js` | Notes modal: show, copy, clear. |
| `src/behaviours.js` | The catalogue of every special case, and `FORMATTING_RULES` — the one copy of the formatting rules, loaded first; `formatText` runs its `format`. |
| `src/styles.css` | Dark theme; `--prompter-font-size` is set from the size control; `--font-ui` is Inter when installed, else the system UI face (no web-font fetch). |
| `test/` | `node --test`: every formatting and chunking rule, the store and speech adapters, and a stub-DOM load of the whole page. Run before every FTPS deploy. |
| `display.json` | Launch Pad manifest (`id: Read`, group `Pipeline` / `01 · Event`, `app` → `src/index.html`). |

## Data flow
Paste → `formatText` → textarea + `synthesize_savedText` → **Play** → `parseTextToChunks` → prompter DOM + TOC → `playChunk(i)` → `speech.say` → `onDone` → `i+1` (index saved to `synthesize_savedIndex`).

## Storage and network
LocalStorage keys (named once, in `src/store.js` `STORE_KEYS`): `synthesize_savedText`, `synthesize_savedIndex`, `synthesize_textSize`, `synthesize_rate`, `synthesize_voice`, `synthesize_notes`. Network: none — the page runs fully offline. No bus connection.
