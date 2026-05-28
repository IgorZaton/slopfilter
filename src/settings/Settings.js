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
  });

  static SENSITIVITY_THRESHOLDS = Object.freeze({
    low: 80,
    medium: 60,
    high: 40,
  });

  constructor() {
    this._cache = { ...Settings.DEFAULTS };
    this._listeners = [];
  }

  async load() {
    try {
      const stored = await chrome.storage.sync.get(Settings.DEFAULTS);
      Object.assign(this._cache, stored);
    } catch {
      // Fallback to defaults on error (e.g. in tests without chrome API)
    }
    return this;
  }

  async save(partial) {
    Object.assign(this._cache, partial);
    try {
      await chrome.storage.sync.set(this._cache);
    } catch {
      // Silently fail if storage is unavailable
    }
    this._notify();
  }

  get enabled()     { return this._cache.enabled; }
  get mode()        { return this._cache.mode; }
  get sensitivity() { return this._cache.sensitivity; }

  get threshold() {
    return Settings.SENSITIVITY_THRESHOLDS[this._cache.sensitivity]
      ?? Settings.SENSITIVITY_THRESHOLDS.medium;
  }

  onChange(fn) {
    this._listeners.push(fn);
    return () => {
      this._listeners = this._listeners.filter(l => l !== fn);
    };
  }

  _notify() {
    const snapshot = { ...this._cache, threshold: this.threshold };
    this._listeners.forEach(fn => fn(snapshot));
  }
};
