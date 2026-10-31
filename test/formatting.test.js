// Every cleanup rule behaviours.js §1 documents, run against FORMATTING_RULES.
// behaviours.js is a classic browser script, so it is evaluated in a vm sandbox.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'behaviours.js'), 'utf8');
const sandbox = {};
vm.runInNewContext(src + '\nthis.FORMATTING_RULES = FORMATTING_RULES;', sandbox);
const R = sandbox.FORMATTING_RULES;
const fmt = (t) => R.format(t);

test('HTML and Markdown symbols are stripped, # is kept for headings', () => {
  assert.equal(fmt('<b>bold</b> *star* _u_ `code` ~s~ > quote'), 'bold star u code s quote');
  assert.equal(fmt('# Title\ntext'), '# Title\ntext');
});

test('dashes, pipes and arrows are not spoken', () => {
  assert.equal(fmt('a --- b'), 'a b');
  assert.equal(fmt('a | b'), 'a b');
  assert.equal(fmt('a -> b <- c → d ← e'), 'a b c d e');
});

test('6.7ms expands to milliseconds', () => {
  assert.equal(fmt('latency 6.7ms here'), 'latency 6.7 milliseconds here');
  assert.equal(fmt('10 MS'), '10 milliseconds');
});

test('numbers of 1 000 000 or more are dropped, smaller ones stay', () => {
  assert.equal(fmt('serial 1234567 ok'), 'serial ok');
  assert.equal(fmt('serial 1,000,000 ok'), 'serial ok');
  assert.equal(fmt('count 999,999 ok'), 'count 999,999 ok');
});

test('whitespace: single spaces, no leading spaces, blank lines collapse to one', () => {
  assert.equal(fmt('a    b\n   c'), 'a b\nc');
  assert.equal(fmt('a\n\n\n\nb'), 'a\n\nb');
});

test('a space is added after ?!,;: but not after a period (NAME.DN survives)', () => {
  assert.equal(fmt('one,two;three:four?five!six'), 'one, two; three: four? five! six');
  assert.equal(fmt('open NAME.DN now'), 'open NAME.DN now');
});
