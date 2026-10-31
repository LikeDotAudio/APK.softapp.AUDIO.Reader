// Header and Controls Logic

const voiceSelect = document.getElementById('voice-select');
const rateSlider = document.getElementById('rate-slider');
const rateValue = document.getElementById('rate-value');
const btnFormat = document.getElementById('btn-format');
const btnClearText = document.getElementById('btn-clear-text');
const btnPlay = document.getElementById('btn-play');
const btnPause = document.getElementById('btn-pause');
const sizeSelect = document.getElementById('size-select');
const alternateVoiceCheckbox = document.getElementById('alternate-voice-checkbox');

// Text Size logic
const savedSize = store.get(STORE_KEYS.size);
if (savedSize) {
    sizeSelect.value = savedSize;
    document.documentElement.style.setProperty('--prompter-font-size', savedSize);
}

sizeSelect.addEventListener('change', () => {
    const newSize = sizeSelect.value;
    document.documentElement.style.setProperty('--prompter-font-size', newSize);
    store.set(STORE_KEYS.size, newSize);
});

// Speed and chosen voice survive a reload, like text, position and size
const savedRate = store.get(STORE_KEYS.rate);
if (savedRate) {
    rateSlider.value = savedRate;
    rateValue.textContent = Number(rateSlider.value).toFixed(1);
}

voiceSelect.addEventListener('change', () => {
    const chosen = voiceSelect.selectedOptions[0];
    if (chosen) store.set(STORE_KEYS.voice, chosen.getAttribute('data-name'));
});

function populateVoiceList() {
    // speech.js sorts them: English first, then Google/Premium/Enhanced, then by name
    voices = speech.voices();
    voiceSelect.innerHTML = '';
    
    voices.forEach((voice, i) => {
        const option = document.createElement('option');
        option.textContent = `${voice.name} (${voice.lang})`;
        
        if (isPremiumVoice(voice)) {
            option.textContent += ' ⭐ (Best for High Speed)';
        } else if (voice.default) {
            option.textContent += ' -- DEFAULT';
        }

        option.setAttribute('data-lang', voice.lang);
        option.setAttribute('data-name', voice.name);
        voiceSelect.appendChild(option);
    });

    const savedVoice = store.get(STORE_KEYS.voice);
    if (savedVoice) {
        const match = [...voiceSelect.options].find(o => o.getAttribute('data-name') === savedVoice);
        if (match) match.selected = true;
    }
}

// Ensure voices are loaded
populateVoiceList();
speech.onVoicesChanged(populateVoiceList);

// Update speed label
rateSlider.addEventListener('input', () => {
    rateValue.textContent = Number(rateSlider.value).toFixed(1);
    store.set(STORE_KEYS.rate, rateSlider.value);
});

btnFormat.addEventListener('click', () => {
    formatText();
    
    // Visual feedback
    btnFormat.textContent = 'Formatted!';
    setTimeout(() => {
        btnFormat.textContent = 'Format Text';
    }, 1500);
});

btnClearText.addEventListener('click', () => {
    textInput.value = '';
    store.set(STORE_KEYS.text, '');
    store.set(STORE_KEYS.index, '0');
    // Visual feedback
    btnClearText.textContent = 'Cleared!';
    setTimeout(() => {
        btnClearText.textContent = 'Clear Text';
    }, 1500);
});

btnPlay.addEventListener('click', () => {
    speak();
});

btnPause.addEventListener('click', () => {
    speech.pause();
});
// Sync play button state with speech synthesis
setInterval(() => {
    if (speech.speaking) {
        btnPlay.classList.add('running');
    } else {
        btnPlay.classList.remove('running');
    }
}, 200);
