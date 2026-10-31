const textInput = document.getElementById('text-input');
const prompterView = document.getElementById('prompter-view');


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
    store.set(STORE_KEYS.text, textInput.value);
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
    
    store.set(STORE_KEYS.text, textInput.value);
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
