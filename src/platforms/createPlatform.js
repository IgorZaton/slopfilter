var SlopFilter = (typeof globalThis !== "undefined" && globalThis.SlopFilter) || {};
if (typeof globalThis !== "undefined") globalThis.SlopFilter = SlopFilter;

/**
 * Pick the platform adapter for the current hostname.
 * @returns {SlopFilter.BasePlatform}
 */
SlopFilter.createPlatform = function createPlatform() {
  const host = location.hostname.toLowerCase();

  if (host === 'linkedin.com' || host.endsWith('.linkedin.com')) {
    return new SlopFilter.LinkedInPlatform();
  }

  if (host === 'reddit.com' || host.endsWith('.reddit.com')) {
    return new SlopFilter.RedditPlatform();
  }

  return new SlopFilter.GenericPlatform();
};
