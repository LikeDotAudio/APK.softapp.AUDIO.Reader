# Read.Like.audio

## What it is
Read.Like.audio is a minimalist teleprompter and screen reader built purely with vanilla web technologies (HTML, CSS, and JS). It takes plain text or Markdown, cleans it up for speech, splits it into sentences of at most 150 characters, and reads them with the browser's native Speech Synthesis API while the prompter follows along.

In APK.audio it is the Launch Pad entry **Read** (🗣, group `Pipeline`, sub-group `01 · Event`), declared by `display.json`.

## Features
- **Teleprompter View**: As the voice reads, the active sentence is scrolled to the centre of the view and the word being spoken is highlighted (from the speech engine's `onboundary` events).
- **Dynamic Table of Contents**: Automatically parses Markdown headings (`#` to `######`) and builds an interactive sidebar tree. As the prompter reads, the current chapter glows to show your position. You can also click any chapter to instantly jump the audio to that section.
- **Hierarchical Line Numbering**: Prompter lines are intelligently numbered based on the chapter depth (e.g., `8.1`, `8.2`).
- **Voice Toggling (opt-in)**: With **Change voice every chapter** ticked, it alternates between a male and a female English voice at every `#` or `##` heading, picked best-effort by name (e.g. David/Alex vs. Aria/Zira/Samantha) with fallbacks to any two English voices. Unticked, it uses the voice chosen in the list.
- **Bookmark Notes**: Every line in the prompter features a checkbox. Checking the box saves that sentence to a persistent "Notes" modal, where you can easily review and copy all of your highlighted takeaways to your clipboard.
- **Persistence**: Your text, current reading position, text size and bookmarked notes are saved to your browser's LocalStorage (`synthesize_savedText`, `synthesize_savedIndex`, `synthesize_textSize`, `synthesize_notes`) so you keep your place across sessions. Speed and the chosen voice are not saved; speed starts at 1.3× on every load.
- **Voice Ordering**: The voice list puts English voices first and, within each language group, voices named Google/Premium/Enhanced first (marked ⭐ "Best for High Speed"), so the default pick is the clearest one at high speed.
- **Auto-Formatting**: On paste (and on **Format Text**) it strips HTML tags and the Markdown marks `* _ ` ~ >` (keeping `#` for headings), drops arrows, pipes and runs of dashes, reads `6.7ms` as "6.7 milliseconds", deletes numbers of a million or more (serials, IDs), and fixes spacing. The full list is in `src/behaviours.js`.

## Markdown Header Hierarchy & Depth
The prompter uses specific Markdown headers to control the visual Table of Contents, line numbering, and voice-alternating engine:
- **`#` (H1) File Level**: Represents the overall document or meeting. Resets the chapter number to 0 and, with voice toggling on, switches the voice.
- **`##` (H2) Chapter Level**: Represents Phases or Chapters. Increments the chapter number (e.g., Chapter 8), restarts the line count, and, with voice toggling on, switches the voice.
- **`###`–`######` Sub-chapter Levels**: Represent sub-sections. They appear in the TOC (with depth) and count as an ordinary line; they neither switch the voice nor restart the line numbers.

## Why it is needed
Traditional screen readers and text-to-speech apps are often visually overwhelming, full of unnecessary GUI clutter, or technically unstable. Browsers commonly crash or cut out when their speech synthesis engines are fed massive blocks of text, especially at high playback speeds (e.g. 1.3x and beyond).

**Read.Like.audio** solves these problems by:
1. Implementing a sentence-level chunking algorithm (sentences split only where punctuation is followed by a space, so `NAME.DN` stays whole; anything over 150 characters broken at the last `,` `;` `:` or space) that keeps each utterance short enough for Chrome's speech engine, and skipping past Chrome's spurious `interrupted` errors to the next chunk.
2. Providing a clean, ultra-minimalist dark mode interface that maximizes screen real estate and minimizes distractions.
3. Bridging the gap between a reading tool and an active study tool by allowing users to effortlessly bookmark important lines and navigate huge documents via an auto-generated Table of Contents.

## Architecture
The application logic is modularized inside the `src/` directory for maintainability:
- **`Header.js`**: Manages the top-level UI controls, sliders, and format buttons.
- **`Prompter.js`**: The core engine that parses text, calculates depth-based line numbers, tracks the Table of Contents, and runs the SpeechSynthesis logic (including Voice Alternation).
- **`NoteBook.js`**: Manages the interactive notes modal, handling clipping sentences, clearing, and copying to the clipboard.
- **`script.js`**: Handles basic initialization, local storage binding, and the formatting/filtering logic (`formatText`, auto-format on paste).
- **`behaviours.js`**: Documentation in code: the list of every formatting, chunking and speech special case, with the formatting regexes restated as an exported `FORMATTING_RULES` object. `index.html` does not load it; the live rules are the ones in `script.js` and `Prompter.js`.

The scripts are classic (non-module) scripts sharing globals, loaded in the order `script.js`, `Prompter.js`, `Header.js`, `NoteBook.js` by `src/index.html`.

## Running Locally & Deployment
It has no build step, framework or package dependency; the only external request is the Inter font from Google Fonts. Open `src/index.html` in any modern web browser. There are no automated tests.

Inside APK.audio the page is served by the portal at `/APK:Softapps/AUDIO/AUDIO.reader/src/index.html` (the `app` field of `display.json`). `display.json` also declares `topic: "APK.audio/Gui/Display/Read"`; the app itself makes no bus connection.

For deployment, the repository contains a continuous delivery pipeline (`.github/workflows/ftp-deploy.yml`) that uploads `src/` to an FTPS server (`FTP_SERVER` / `FTP_USERNAME` / `FTP_PASSWORD` secrets) whenever a push to the `master` branch occurs. This repository's branch is `master`, not `main`.

Remote: https://github.com/LikeDotAudio/APK.softapp.AUDIO.Reader.git. (The header link in `src/index.html` points at `github.com/LikeDotAudio/Read.Like.audio`.) In the parent repository it is the submodule `PODS/POD.THIN/Softapps/AUDIO/AUDIO.reader`. (The `AUDIO.Reader` symlink beside it was removed in PLAN-3418.01: it collided with this folder on case-insensitive checkouts.)

## Philosophy
The principles the code follows, and where it shows them:

- **The speech engine is fragile, so feed it small pieces.** Nothing longer than 150 characters is ever handed to `speechSynthesis`; long sentences are broken at punctuation, then at a space, then hard at 149. — `src/Prompter.js` (`parseTextToChunks`)
- **Keep going on an error.** Chrome's `interrupted` error advances to the next chunk instead of stopping the read; a manual stop is told apart by `isManuallyStopped`. — `src/Prompter.js` (`utterThis.onerror`)
- **Never lose the reader's place.** Text, position, text size and notes are written to LocalStorage as they change and restored on load. — `src/script.js`, `src/Prompter.js`, `src/Header.js`, `src/NoteBook.js`
- **Clean text for the ear, not the eye.** Markup, arrows, pipes and dash runs are removed and units expanded so the voice says what a reader would; periods are left alone so filenames survive. — `src/script.js` (`formatText`), `src/behaviours.js`
- **No machinery.** Plain HTML, CSS and four classic scripts; no build, no framework, no server. — `src/index.html`
- **Where it does not hold:** it is a standalone site that knows no broker. The APK.audio Soft Apps doctrine says a soft app's door out is the bus (`display.json` declares `APK.audio/Gui/Display/Read`), and this app has none; everything stays in the browser.
