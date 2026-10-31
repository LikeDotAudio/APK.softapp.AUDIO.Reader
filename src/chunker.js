// chunker.js — THE ONE COPY of the chunking rules (behaviours.js §2).
// Pure: text in, { chunks, toc } out. No DOM, no speech, no storage, so
// test/chunker.test.js runs it under `node --test` before every deploy.
// Loaded as a classic script before script.js; under Node it is a CommonJS module.

const CHUNK_MAX = 150;
const ABBREVIATION = /\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|Inc|Ltd|Co|Corp|vs|etc|St|Mt|Rev|Hon|Capt|Col|Gen|Lieut|Sgt|Cpl|Maj|Pte)\s*$/i;
const SINGLE_INITIAL = /(^|\s)([A-Za-z])\s*$/;

// One sentence → pieces of at most CHUNK_MAX characters: break at the last
// , ; : before the limit, else the last space, else a hard cut at 149.
function splitLongSentence(s) {
    const out = [];
    while (s.length > 0) {
        if (s.length <= CHUNK_MAX) { out.push(s); break; }
        let breakIndex = Math.max(
            s.lastIndexOf(',', CHUNK_MAX),
            s.lastIndexOf(';', CHUNK_MAX),
            s.lastIndexOf(':', CHUNK_MAX)
        );
        if (breakIndex === -1) breakIndex = s.lastIndexOf(' ', CHUNK_MAX);
        if (breakIndex === -1) breakIndex = CHUNK_MAX - 1;
        out.push(s.substring(0, breakIndex + 1).trim());
        s = s.substring(breakIndex + 1).trim();
    }
    return out;
}

// A paragraph → sentences. Splits on . ! ? only when followed by a space or the
// end (NAME.DN stays whole); re-joins after an abbreviation or a single initial.
function splitSentences(paragraph) {
    const text = paragraph.replace(/\s+/g, ' ').trim();
    if (text === '') return [];
    const raw = text.split(/([.!?]+(?=\s|$))/);
    const sentences = [];
    let pending = '';
    for (let j = 0; j < raw.length; j += 2) {
        const sentence = raw[j];
        const combined = sentence + (raw[j + 1] || '');
        if (combined.trim().length === 0) continue;
        pending += combined;
        if (!(ABBREVIATION.test(sentence) || SINGLE_INITIAL.test(sentence))) {
            sentences.push(pending.trim());
            pending = '';
        }
    }
    if (pending.trim().length > 0) sentences.push(pending.trim());
    return sentences;
}

function parseTextToChunks(rawText) {
    const chunks = [];
    const toc = [];
    let paragraph = '';
    const flush = () => {
        splitSentences(paragraph).forEach(s =>
            splitLongSentence(s).forEach(text => chunks.push({ text, isHeading: false })));
        paragraph = '';
    };
    String(rawText).split(/\r?\n/).forEach(line => {
        const match = line.match(/^\s*(#{1,6})\s+(.*)$/);
        if (match) {
            flush();
            const title = match[2].trim();
            const level = match[1].length;
            toc.push({ title, level, chunkIndex: chunks.length });
            chunks.push({ text: title, isHeading: true, level });
        } else {
            paragraph += ' ' + line;
        }
    });
    flush();
    return { chunks, toc };
}

// Heading font size in em: 1.5 - level*0.1, never below 1.1.
function headingSize(level) {
    const size = 1.5 - (level * 0.1);
    return size < 1.1 ? 1.1 : size;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CHUNK_MAX, splitLongSentence, splitSentences, parseTextToChunks, headingSize };
}
