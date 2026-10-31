// speech.js — the one door to the browser's speechSynthesis (behaviours.js §3).
// Voice ordering, the alternate-voice pick and Chrome's random 'interrupted'
// error live here, not in the UI. The pure parts (sortVoices, isPremiumVoice,
// pickAlternateVoices) are tested under `node --test`; createSpeech() takes the
// engine and utterance constructor so a test can hand it fakes.

const PREMIUM = /Google|Premium|Enhanced/;
const MALE = /Male|Guy|David|Alex/;
const FEMALE = /Female|Aria|Zira|Jenny|Samantha/;

const isEnglish = (v) => String(v.lang || '').toLowerCase().startsWith('en');
const isPremiumVoice = (v) => PREMIUM.test(v.name || '');

// English first, then premium, then by name.
function sortVoices(list) {
    return [...list].sort((a, b) => {
        if (isEnglish(a) !== isEnglish(b)) return isEnglish(a) ? -1 : 1;
        if (isPremiumVoice(a) !== isPremiumVoice(b)) return isPremiumVoice(a) ? -1 : 1;
        return a.name.localeCompare(b.name);
    });
}

// The "change voice every chapter" pair: a male and a female English voice,
// falling back to any two distinct English voices; null when there are not two.
function pickAlternateVoices(voices) {
    const en = voices.filter(v => String(v.lang || '').startsWith('en'));
    const male = en.find(v => MALE.test(v.name)) || en[0];
    const female = en.find(v => FEMALE.test(v.name)) || en.find(v => v !== male);
    return male && female && male !== female ? { male, female } : null;
}

function createSpeech(engine = globalThis.speechSynthesis,
                      Utterance = globalThis.SpeechSynthesisUtterance) {
    let current = null;      // held so some browsers do not garbage-collect it mid-chunk
    let stopping = false;    // a cancel we asked for is not an error
    return {
        voices: () => (engine ? sortVoices(engine.getVoices()) : []),
        onVoicesChanged(fn) { if (engine && engine.onvoiceschanged !== undefined) engine.onvoiceschanged = fn; },
        get speaking() { return !!(engine && engine.speaking && !engine.paused); },
        get paused() { return !!(engine && engine.paused); },
        pause() { if (engine && engine.speaking && !engine.paused) engine.pause(); },
        resume() { if (engine) engine.resume(); },
        // Stop on purpose: the utterance's error is swallowed, not reported.
        stop() { stopping = true; if (engine) engine.cancel(); },
        // Speak one chunk. onDone(next) fires on end AND on Chrome's 'interrupted'
        // error, so the reader moves on seamlessly; other errors go to onError.
        say(text, { voice, rate, onDone, onError, onWord } = {}) {
            stopping = false;
            const u = new Utterance(text);
            current = u;
            if (voice) u.voice = voice;
            if (rate) u.rate = rate;
            u.onend = () => { if (!stopping && current === u && onDone) onDone(); };
            u.onerror = (event) => {
                if (stopping || current !== u) return;
                if (event && event.error === 'interrupted') { if (onDone) onDone(); return; }
                if (onError) onError(event);
            };
            u.onboundary = (event) => { if (event.name === 'word' && onWord) onWord(event.charIndex); };
            engine.speak(u);
            return u;
        },
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { sortVoices, isPremiumVoice, pickAlternateVoices, createSpeech };
}
