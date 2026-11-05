// store.js and speech.js: the only doors to localStorage and speechSynthesis.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { STORE_KEYS, createStore } = require('../src/store.js');
const { sortVoices, pickAlternateVoices, createSpeech } = require('../src/speech.js');

const memory = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v) }; };
const throwing = { getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('QuotaExceeded'); } };

test('store keeps the shipped key names', () => {
  assert.equal(STORE_KEYS.notes, 'synthesize_notes');
  assert.equal(STORE_KEYS.text, 'synthesize_savedText');
});

test('store round-trips strings and JSON', () => {
  const s = createStore(memory());
  s.set(STORE_KEYS.index, 4);
  assert.equal(s.get(STORE_KEYS.index), '4');
  s.setJSON(STORE_KEYS.notes, ['a']);
  assert.deepEqual(s.getJSON(STORE_KEYS.notes, []), ['a']);
});

test('store never throws: blocked storage and bad JSON fall back', () => {
  const s = createStore(throwing);
  assert.equal(s.get('k', 'fb'), 'fb');
  assert.equal(s.set('k', 'v'), false);
  const m = memory(); m.setItem(STORE_KEYS.notes, '{not json');
  assert.deepEqual(createStore(m).getJSON(STORE_KEYS.notes, []), []);
});

test('nothing but store.js touches localStorage; nothing but speech.js touches speechSynthesis', () => {
  const dir = path.join(__dirname, '..', 'src');
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.js'))) {
    const code = fs.readFileSync(path.join(dir, f), 'utf8').replace(/\/\/.*$/gm, '');
    if (f !== 'store.js') assert.ok(!/localStorage/.test(code), f + ' uses localStorage');
    if (f !== 'speech.js') assert.ok(!/speechSynthesis|SpeechSynthesisUtterance\(/.test(code), f + ' uses speechSynthesis');
  }
});

const v = (name, lang) => ({ name, lang });

test('voices sort English first, then premium, then by name', () => {
  const out = sortVoices([v('Zed', 'fr-FR'), v('Bob', 'en-US'), v('Google UK', 'en-GB'), v('Google FR', 'fr-FR')]);
  assert.deepEqual(out.map(x => x.name), ['Google UK', 'Bob', 'Google FR', 'Zed']);
});

test('alternate voices: a male and a female English voice, or null', () => {
  const pair = pickAlternateVoices([v('Samantha', 'en-US'), v('Alex', 'en-US'), v('Thomas', 'fr-FR')]);
  assert.equal(pair.male.name, 'Alex');
  assert.equal(pair.female.name, 'Samantha');
  assert.equal(pickAlternateVoices([v('Solo', 'en-US')]), null);
});

function fakeEngine() {
  const spoken = [];
  return { spoken, speaking: false, paused: false, getVoices: () => [], cancel() { this.cancelled = true; },
           speak(u) { spoken.push(u); }, pause() {}, resume() {} };
}
class FakeUtterance { constructor(text) { this.text = text; } }

test("speech: Chrome's 'interrupted' error moves on; a deliberate stop does not", () => {
  const engine = fakeEngine();
  const sp = createSpeech(engine, FakeUtterance);
  let done = 0, errors = 0;
  const opts = { onDone: () => done++, onError: () => errors++ };
  const u = sp.say('one', opts);
  u.onerror({ error: 'interrupted' });
  assert.equal(done, 1);
  u.onerror({ error: 'synthesis-failed' });
  assert.equal(errors, 1);
  const u2 = sp.say('two', opts);
  sp.stop();
  u2.onerror({ error: 'canceled' });
  u2.onend();
  assert.equal(done, 1);
  assert.equal(errors, 1);
});

test('speech: a superseded utterance is ignored; voice, rate and word boundaries pass through', () => {
  const engine = fakeEngine();
  const sp = createSpeech(engine, FakeUtterance);
  let done = 0, word = -1;
  const old = sp.say('old', { onDone: () => done++ });
  const voice = v('Bob', 'en-US');
  const cur = sp.say('new', { voice, rate: 1.3, onDone: () => done++, onWord: i => { word = i; } });
  old.onend();
  assert.equal(done, 0);
  cur.onboundary({ name: 'word', charIndex: 2 });
  assert.equal(word, 2);
  assert.equal(cur.voice, voice);
  assert.equal(cur.rate, 1.3);
  cur.onend();
  assert.equal(done, 1);
});

test('speechProblem: each Web Speech error word is a catalogue problem with a first step', () => {
  const { speechProblem } = require('../src/speech.js');
  assert.equal(speechProblem('not-allowed').problem, 'permission_denied');
  assert.equal(speechProblem('audio-busy').problem, 'device_busy');
  assert.equal(speechProblem('synthesis-unavailable').problem, 'unsupported_browser');
  assert.equal(speechProblem('text-too-long').problem, 'bad_input');
  for (const e of ['not-allowed', 'network', 'voice-unavailable', 'whatever', undefined]) {
    const p = speechProblem(e);
    assert.ok(p.detail && p.fix.length >= 1, String(e));
  }
});

test('speech: no engine in the browser is an error, never a throw', () => {
  const { createSpeech } = require('../src/speech.js');
  let got = null;
  assert.equal(createSpeech(null, undefined).say('hi', { onError: (e) => { got = e; } }), null);
  assert.equal(got.error, 'unsupported');
});
