# Known Issues & Task Tracking — Read.Like.audio

## 🔍 Active Issues & Edge Cases
* After an auto-format on paste, the **Format Text** button's label changes to "Auto-Formatted!" and
  then to "Clear Text" instead of back to "Format Text" (`src/script.js`, paste handler).
* Speed and the chosen voice are not persisted; every load starts at 1.3× with the top-sorted voice.
* `src/behaviours.js` restates the formatting regexes as `FORMATTING_RULES` but nothing imports it, so
  it can drift from the live copies in `src/script.js`.
* **Copy to Clipboard** in the notes modal uses the deprecated `document.execCommand('copy')`
  (`src/NoteBook.js`).
