// store.js — the one door to localStorage. Every key the reader keeps is named
// here, and every read and write is guarded: a private window, a full quota or
// a hand-edited value never throws into the UI — the reader just forgets.
// The key strings are the ones shipped since the first release (no migration needed).

const STORE_KEYS = Object.freeze({
    text: 'synthesize_savedText',
    index: 'synthesize_savedIndex',
    notes: 'synthesize_notes',
    size: 'synthesize_textSize',
    rate: 'synthesize_rate',
    voice: 'synthesize_voice',
});

function createStore(backend) {
    const area = () => {
        try { return backend !== undefined ? backend : globalThis.localStorage; } catch (_) { return null; }
    };
    return {
        get(key, fallback = null) {
            try {
                const value = area() && area().getItem(key);
                return value === null || value === undefined ? fallback : value;
            } catch (_) { return fallback; }
        },
        set(key, value) {
            try { if (area()) area().setItem(key, String(value)); return true; } catch (_) { return false; }
        },
        getJSON(key, fallback) {
            const raw = this.get(key, null);
            if (raw === null) return fallback;
            try { return JSON.parse(raw); } catch (_) { return fallback; }
        },
        setJSON(key, value) { return this.set(key, JSON.stringify(value)); },
    };
}

const store = createStore();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { STORE_KEYS, createStore };
}
