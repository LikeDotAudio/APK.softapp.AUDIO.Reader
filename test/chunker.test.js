// The chunking rules of behaviours.js §2, against src/chunker.js.
const test = require('node:test');
const assert = require('node:assert/strict');
const { CHUNK_MAX, parseTextToChunks, splitSentences, splitLongSentence, headingSize } = require('../src/chunker.js');

test('sentences split on . ! ? only before a space or the end', () => {
  assert.deepEqual(splitSentences('Open NAME.DN now. Then stop! Why?'), ['Open NAME.DN now.', 'Then stop!', 'Why?']);
});

test('abbreviations and single initials do not end a sentence', () => {
  assert.deepEqual(splitSentences('Dr. Smith met J. Doe. Done.'), ['Dr. Smith met J. Doe.', 'Done.']);
});

test('no chunk is longer than 150 characters', () => {
  const long = Array.from({ length: 60 }, (_, i) => 'word' + i).join(' ');
  const { chunks } = parseTextToChunks(long);
  assert.ok(chunks.length > 1);
  for (const c of chunks) assert.ok(c.text.length <= CHUNK_MAX, c.text.length);
  assert.equal(chunks.map(c => c.text).join(' '), long);
});

test('a long sentence breaks after the last , ; or : before the limit', () => {
  const s = 'a'.repeat(100) + ', ' + 'b'.repeat(80);
  assert.deepEqual(splitLongSentence(s), ['a'.repeat(100) + ',', 'b'.repeat(80)]);
});

test('with no punctuation it breaks at the last space', () => {
  const s = 'x'.repeat(140) + ' ' + 'y'.repeat(40);
  assert.deepEqual(splitLongSentence(s), ['x'.repeat(140), 'y'.repeat(40)]);
});

test('with no space at all (a long URL) it cuts hard at 149', () => {
  const s = 'u'.repeat(200);
  const parts = splitLongSentence(s);
  assert.equal(parts[0].length, 150);       // characters 0..149 inclusive: the cut is after index 149
  assert.equal(parts.join(''), s);
});

test('headings are their own chunks and fill the TOC', () => {
  const { chunks, toc } = parseTextToChunks('# One\nHello there.\n## Two\nBye.');
  assert.deepEqual(chunks, [
    { text: 'One', isHeading: true, level: 1 },
    { text: 'Hello there.', isHeading: false },
    { text: 'Two', isHeading: true, level: 2 },
    { text: 'Bye.', isHeading: false },
  ]);
  assert.deepEqual(toc, [
    { title: 'One', level: 1, chunkIndex: 0 },
    { title: 'Two', level: 2, chunkIndex: 2 },
  ]);
});

test('heading size is 1.5 - level*0.1, floored at 1.1', () => {
  assert.equal(headingSize(1), 1.4);
  assert.ok(Math.abs(headingSize(3) - 1.2) < 1e-9);
  assert.equal(headingSize(6), 1.1);
});
