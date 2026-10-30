# Known Issues & Task Tracking — Read.Like.audio

## 🔍 Active Issues & Edge Cases
* `src/behaviours.js` restates the formatting regexes as `FORMATTING_RULES` but nothing imports it, so
  it can drift from the live copies in `src/script.js`.
* **Copy to Clipboard** in the notes modal uses the deprecated `document.execCommand('copy')`
  (`src/NoteBook.js`).
