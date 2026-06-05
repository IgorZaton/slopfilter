/**
 * Smoke tests for text eligibility gating.
 * Run: node test/textEligibility.test.js
 */

const assert = require('node:assert/strict');

globalThis.SlopFilter = {};
require('../src/data/patterns.js');

const { isClassifiableText } = SlopFilter;

assert.equal(isClassifiableText(''), false);
assert.equal(isClassifiableText('great post thanks'), false);
assert.equal(
  isClassifiableText('This is only one sentence with a few words in it.'),
  false
);
assert.equal(
  isClassifiableText(
    'First sentence here with enough words to pass the minimum count. '
    + 'Second sentence makes this a longer block worth checking.'
  ),
  true
);

const longSingleBlock = Array.from({ length: 55 }, (_, i) => `word${i}`).join(' ');
assert.equal(isClassifiableText(longSingleBlock), true);

console.log('Text eligibility test passed');
