const textInput = document.getElementById('text-input');
const prompterView = document.getElementById('prompter-view');


// A problem card through the SDK (vendor/apk-softapp): what happened / why / do this.
// `p` is { problem, detail, fix } (speechProblem) or a catalogue code.
function showReaderProblem(p, opts = {}) {
    const sdk = globalThis.APKSoftapp;
    const it = typeof p === 'string' ? { problem: p } : p;
    if (!sdk) { console.error(it.problem, it.detail || '', opts.subject || ''); return; }
    sdk.showProblem(it.problem, { detail: it.detail, fix: it.fix, ...opts });
}

if (globalThis.APKSoftapp) globalThis.APKSoftapp.describe({
    name: 'Read.like.audio',
    does: 'Paste text and hear it read aloud by the browser voice, chunk by chunk, with a teleprompter and chapters. Nothing leaves the page; nothing on the bus.',
    inputs: [
        { name: 'Text', from: 'typed or pasted into the box (a paste is formatted at once)' },
        { name: 'Voices', from: "the browser's speech engine (the voice list)" },
        { name: 'Last session', from: 'this browser: text, place, notes, speed, voice and size' },
    ],
    outputs: [
        { name: 'Speech', to: "the browser's audio output", kind: 'audio' },
        { name: 'Teleprompter', to: 'the reading view, the spoken word highlighted; chapters on the left' },
        { name: 'Notes', to: 'the Notes window: copy to the clipboard' },
    ],
    controls: [
        { name: 'Play / Pause', how: 'Play starts or resumes from the remembered place; Pause holds it' },
        { name: 'Format Text', how: 'strips markup, expands units, splits headings into chapters' },
        { name: 'Clear Text', how: 'empties the box and the remembered place' },
        { name: 'Jump', how: 'click a chapter or a line to read from there' },
        { name: 'Favourite a line', how: 'its tick box adds it to Notes' },
        { name: 'Voice / Change voice every chapter / Speed / Text Size', how: 'the header controls' },
    ],
    problems: ['permission_denied', 'unsupported_browser', 'device_busy', 'bad_input', 'storage_full'],
});

// Text that could not be kept (a full storage quota): said once, not on every key.
let saidStorageFull = false;
function keep(key, value) {
    if (store.set(key, value) || saidStorageFull) return;
    saidStorageFull = true;
    showReaderProblem('storage_full', { subject: 'Saved text',
        fix: ['Your text is still on screen but will not survive closing the tab: copy it somewhere safe.'] });
}

// speechSynthesis only through speech.js; localStorage only through store.js.
const speech = createSpeech();
let voices = [];
const storedNotes = store.getJSON(STORE_KEYS.notes, []);
let savedNotes = new Set(Array.isArray(storedNotes) ? storedNotes : []);

// Restore from local storage on load
const restoredText = store.get(STORE_KEYS.text);
if (restoredText) {
    textInput.value = restoredText;
}

textInput.addEventListener('input', () => {
    keep(STORE_KEYS.text, textInput.value);
    store.set(STORE_KEYS.index, '0');
    
    if (textInput.value.trim() === '') {
        btnFormat.textContent = 'Format Text';
    }
});



// Basic text formatter — the rules live in behaviours.js (FORMATTING_RULES).
function formatText() {
    let text = textInput.value;
    
    if (!text.trim()) return;

    text = FORMATTING_RULES.format(text);
    
    textInput.value = text;
    
    keep(STORE_KEYS.text, textInput.value);
    store.set(STORE_KEYS.index, '0');
}



// Auto-format on paste
textInput.addEventListener('paste', () => {
    setTimeout(() => {
        formatText();
        
        // Brief visual feedback on the button to show it happened automatically
        btnFormat.textContent = 'Auto-Formatted!';
        setTimeout(() => {
            btnFormat.textContent = 'Format Text';
        }, 1500);
    }, 10);
});
