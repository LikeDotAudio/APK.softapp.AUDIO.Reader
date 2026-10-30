# Architecture Notes & Technical Specs — Read.Like.audio

## 🛠 Technical Specifications & Integration
* **Page**: `src/index.html` loads `styles.css` and four classic scripts that share globals, in order:
  `script.js` (formatting, text/position persistence), `Prompter.js` (chunking, TOC, line numbers,
  speech, highlighting), `Header.js` (controls, voice list, text size), `NoteBook.js` (notes modal).
  `src/behaviours.js` is a written catalogue of the special cases and is not loaded.
* **Speech**: the browser's `speechSynthesis`; one `SpeechSynthesisUtterance` per chunk (≤ 150
  characters), chained on `onend`; `onboundary` drives the word highlight.
* **Storage**: LocalStorage keys `synthesize_savedText`, `synthesize_savedIndex`,
  `synthesize_textSize`, `synthesize_notes`.
* **Network**: none, apart from the Inter font from Google Fonts. No broker connection; the
  `APK.audio/Gui/Display/Read` topic in `display.json` is a declaration only.
* **Deploy**: `.github/workflows/ftp-deploy.yml` uploads `src/` over FTPS on a push to `master`.
