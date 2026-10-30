# Architecture — AUDIO.reader (Read.Like.audio)

## Use
Open `src/index.html` (Launch Pad: **Read** 🗣, or https://read.like.audio/). Paste text or Markdown — it is formatted on paste (**Format Text** re-runs it) — and press **Play**. The prompter replaces the text box, centres the sentence being read and highlights the word; `#`…`######` headings build the chapter sidebar (click to jump). Tick a line's box to keep it in **Notes**. Speed (0.5–2×, default 1.3×), voice, text size and **Change voice every chapter** sit in the header.

## Files
| File | Role |
|---|---|
| `src/index.html` | Page; loads `styles.css` and, in order, `behaviours.js`, `script.js`, `Prompter.js`, `Header.js`, `NoteBook.js` as classic scripts sharing globals. |
| `src/script.js` | `formatText`, auto-format on paste, text and position persistence. |
| `src/Prompter.js` | `parseTextToChunks` (sentences ≤ 150 chars, TOC, depth-based line numbers), `buildPrompterUI`, `speak` / `playChunk` (one `SpeechSynthesisUtterance` per chunk, chained on `onend`, word highlight from `onboundary`), voice alternation. |
| `src/Header.js` | Controls: voice list (English first, Google/Premium/Enhanced first), speed, size, Play/Pause/Format/Clear; persists size, speed, voice. |
| `src/NoteBook.js` | Notes modal: show, copy, clear. |
| `src/behaviours.js` | The catalogue of every special case, and `FORMATTING_RULES` — the one copy of the formatting rules, loaded first; `formatText` runs its `format`. |
| `src/styles.css` | Dark theme; `--prompter-font-size` is set from the size control. |
| `display.json` | Launch Pad manifest (`id: Read`, group `Pipeline` / `01 · Event`, `app` → `src/index.html`). |

## Data flow
Paste → `formatText` → textarea + `synthesize_savedText` → **Play** → `parseTextToChunks` → prompter DOM + TOC → `playChunk(i)` → `speechSynthesis.speak` → `onend` → `i+1` (index saved to `synthesize_savedIndex`).

## Storage and network
LocalStorage keys: `synthesize_savedText`, `synthesize_savedIndex`, `synthesize_textSize`, `synthesize_rate`, `synthesize_voice`, `synthesize_notes`. Network: only the Inter font from Google Fonts. No bus connection.
