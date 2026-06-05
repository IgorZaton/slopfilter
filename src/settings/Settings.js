var SlopFilter = (typeof globalThis !== "undefined" && globalThis.SlopFilter) || {};
if (typeof globalThis !== "undefined") globalThis.SlopFilter = SlopFilter;

/**
 * Manages user preferences via chrome.storage.sync.
 * Single Responsibility: only handles reading/writing/notifying settings.
 */
SlopFilter.Settings = class Settings {

  static DEFAULTS = Object.freeze({
    enabled: true,
    mode: 'dim',
    sensitivity: 'medium',
    debug: false,
  });

  /** Badge and dim/hide cutoffs per sensitivity (higher sensitivity = lower thresholds). */
  static SENSITIVITY_THRESHOLDS = Object.freeze({
    high:   Object.freeze({ badgeMin: 50, dimMin: 86 }),
    medium: Object.freeze({ badgeMin: 65, dimMin: 92 }),
    low:    Object.freeze({ badgeMin: 80, dimMin: 96 }),
  });

  constructor() {
    this._cache = { ...Settings.DEFAULTS };
    this._listeners = [];
  }

  async load() {
    try {
      const stored = await this._storageGet(Settings.DEFAULTS);
      Object.assign(this._cache, stored);
    } catch {
      // Fallback to defaults on error (e.g. in tests without chrome API)
    }
    return this;
  }

  async save(partial) {
    Object.assign(this._cache, partial);
    try {
      await this._storageSet(this._cache);
    } catch {
      // Silently fail if storage is unavailable
    }
    this._notify();
  }

  get enabled()     { return this._cache.enabled; }
  get mode()        { return this._cache.mode; }
  get sensitivity() { return this._cache.sensitivity; }
  get debug()       { return this._cache.debug; }

  get displayThresholds() {
    return Settings.SENSITIVITY_THRESHOLDS[this._cache.sensitivity]
      ?? Settings.SENSITIVITY_THRESHOLDS.medium;
  }

  /** Classifier flag threshold; matches badge cutoff for the active sensitivity. */
  get threshold() {
    return this.displayThresholds.badgeMin;
  }

  onChange(fn) {
    this._listeners.push(fn);
    return () => {
      this._listeners = this._listeners.filter(l => l !== fn);
    };
  }

  _notify() {
    const snapshot = {
      ...this._cache,
      threshold: this.threshold,
      displayThresholds: this.displayThresholds,
    };
    this._listeners.forEach(fn => fn(snapshot));
  }

  _storageGet(defaults) {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.sync.get(defaults, (items) => {
          if (chrome.runtime?.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(items || { ...defaults });
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  _storageSet(values) {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.sync.set(values, () => {
          if (chrome.runtime?.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve();
        });
      } catch (err) {
        reject(err);
      }
    });
  }
};
