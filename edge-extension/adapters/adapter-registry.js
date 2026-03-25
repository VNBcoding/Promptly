/**
 * adapter-registry.js
 * Registry that maps domains to their site adapters.
 * To add a new AI platform: create a new adapter class and register it here.
 */

'use strict';

const AdapterRegistry = (() => {
  // Registry of all known adapters
  const adapters = [
    new ChatGPTAdapter(),
    new CopilotAdapter(),
    // TODO: Add more adapters here (e.g., new GeminiAdapter(), new ClaudeAdapter())
  ];

  /**
   * Get the adapter for the current page domain.
   * @returns {SiteAdapterBase|null}
   */
  function getAdapterForCurrentDomain() {
    const hostname = window.location.hostname;
    for (const adapter of adapters) {
      if (adapter.domains.some((d) => hostname === d || hostname.endsWith('.' + d))) {
        return adapter;
      }
    }
    return null;
  }

  /**
   * Check if current domain is in the allowlist.
   * @returns {boolean}
   */
  function isAllowedDomain() {
    const hostname = window.location.hostname;
    return CONSTANTS.ALLOWED_DOMAINS.some(
      (d) => hostname === d || hostname.endsWith('.' + d)
    );
  }

  return { getAdapterForCurrentDomain, isAllowedDomain };
})();
