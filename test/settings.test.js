/**
 * Smoke tests for Settings storage behavior.
 * Run: node test/settings.test.js
 */

const assert = require('node:assert/strict');

globalThis.SlopFilter = {};

const syncStore = {};
globalThis.chrome = {
  runtime: { lastError: null },
  storage: {
    sync: {
      get(defaults, callback) {
        callback({ ...defaults, ...syncStore });
      },
      set(values, callback) {
        Object.assign(syncStore, values);
        callback();
      },
    },
  },
};

require('../src/settings/Settings.js');

(async () => {
  const settings = new SlopFilter.Settings();
  await settings.load();

  assert.equal(settings.enabled, true);
  assert.equal(settings.mode, 'dim');
  assert.equal(settings.sensitivity, 'medium');
  assert.equal(settings.debug, false);

  syncStore.debug = true;
  syncStore.sensitivity = 'high';

  await settings.load();
  assert.equal(settings.debug, true);
  assert.equal(settings.sensitivity, 'high');
  assert.equal(settings.threshold, 50);

  await settings.save({ debug: false, mode: 'badge' });
  assert.equal(syncStore.debug, false);
  assert.equal(syncStore.mode, 'badge');
  assert.equal(settings.debug, false);
  assert.equal(settings.mode, 'badge');

  console.log('Settings test passed');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
