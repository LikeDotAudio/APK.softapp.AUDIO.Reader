const textInput = document.getElementById('text-input');
const prompterView = document.getElementById('prompter-view');


let synth = window.speechSynthesis;
let voices = [];
let savedNotes = new Set(JSON.parse(localStorage.getItem('synthesize_notes') || '[]'));

const SAVED_TEXT_KEY = 'synthesize_savedText';
const SAVED_INDEX_KEY = 'synthesize_savedIndex';

// Restore from local storage on load
if (localStorage.getItem(SAVED_TEXT_KEY)) {
    textInput.value = localStorage.getItem(SAVED_TEXT_KEY);
}

textInput.addEventListener('input', () => {
    localStorage.setItem(SAVED_TEXT_KEY, textInput.value);
    localStorage.setItem(SAVED_INDEX_KEY, '0');
    
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
    
    localStorage.setItem(SAVED_TEXT_KEY, textInput.value);
    localStorage.setItem(SAVED_INDEX_KEY, '0');
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






