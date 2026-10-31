// Loads every <script> of src/index.html, in page order, into one vm context
// with a stub DOM: catches a global used before the file that defines it, a
// renamed function, or a script missing from index.html. Then reads a short
// text end to end through a fake speech engine.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SRC = path.join(__dirname, '..', 'src');

function element(id) {
  const handlers = {};
  return {
    id, value: '', textContent: '', innerHTML: '', checked: false, style: {},
    selectedOptions: [], options: [], handlers,
    classList: { add() {}, remove() {} },
    addEventListener(type, fn) { handlers[type] = fn; },
    appendChild() {}, setAttribute() {}, getAttribute() { return null; },
    scrollIntoView() {}, select() {},
  };
}

function loadPage() {
  const els = {};
  const spoken = [];
  const engine = { speaking: false, paused: false, onvoiceschanged: null,
    getVoices: () => [{ name: 'Alex', lang: 'en-US' }, { name: 'Samantha', lang: 'en-US' }],
    speak(u) { spoken.push(u); }, cancel() {}, pause() {}, resume() {} };
  const storage = new Map();
  const ctx = {
    console,
    document: {
      getElementById: (id) => (els[id] ||= element(id)),
      createElement: () => element(),
      querySelectorAll: () => [],
      documentElement: { style: { setProperty() {} } },
    },
    speechSynthesis: engine,
    SpeechSynthesisUtterance: class { constructor(t) { this.text = t; } },
    localStorage: { getItem: k => (storage.has(k) ? storage.get(k) : null), setItem: (k, v) => storage.set(k, String(v)) },
    navigator: {}, confirm: () => true,
    setTimeout: (fn) => { fn(); return 0; }, setInterval: () => 0,
  };
  vm.createContext(ctx);
  const html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
  // One script per file, so top-level const/let are shared like in a browser.
  for (const s of scripts) vm.runInContext(fs.readFileSync(path.join(SRC, s), 'utf8'), ctx, { filename: s });
  return { ctx, els, spoken, storage, scripts };
}

test('every script in index.html loads in order without a ReferenceError', () => {
  const { scripts } = loadPage();
  for (const f of ['store.js', 'speech.js', 'chunker.js', 'behaviours.js', 'script.js', 'Prompter.js', 'Header.js', 'NoteBook.js']) {
    assert.ok(scripts.includes(f), f + ' missing from index.html');
  }
  assert.ok(scripts.indexOf('store.js') < scripts.indexOf('script.js'));
  assert.ok(scripts.indexOf('chunker.js') < scripts.indexOf('Prompter.js'));
});

test('Play reads the text chunk by chunk and remembers the place', () => {
  const { els, spoken, storage } = loadPage();
  els['text-input'].value = '# Intro\nFirst sentence. Second one.';
  els['rate-slider'].value = '1.3';
  els['btn-play'].handlers.click();
  assert.equal(spoken.length, 1);
  assert.equal(spoken[0].text, 'Intro');
  spoken[0].onend();
  spoken[1].onerror({ error: 'interrupted' });        // Chrome's quirk: carry on
  spoken[2].onend();
  assert.deepEqual(spoken.map(u => u.text), ['Intro', 'First sentence.', 'Second one.']);
  assert.equal(storage.get('synthesize_savedIndex'), '0'); // finished: back to the top
});

test('display.json declares no topic: nothing here publishes (WS-03)', () => {
  const d = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'display.json'), 'utf8'));
  assert.equal(d.topic, undefined);
  assert.equal(d.app, 'APK:Softapps/AUDIO/AUDIO.reader/src/index.html');
});
