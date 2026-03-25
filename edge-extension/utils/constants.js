/**
 * constants.js
 * Central configuration for the AI Compliance Guard extension.
 * Edit ALLOWED_DOMAINS to add more AI platforms.
 */

'use strict';

const CONSTANTS = {
  // Configurable allowlist of AI platform domains.
  // Add new domains here to extend coverage without touching other files.
  ALLOWED_DOMAINS: [
    'chatgpt.com',
    'chat.openai.com',
    'copilot.microsoft.com',
  ],

  // Local validation API endpoint. Must match the Flask server address.
  API_BASE_URL: 'http://localhost:5000',
  API_VALIDATE_ENDPOINT: '/validate',

  // Storage keys for chrome.storage.local
  STORAGE_KEYS: {
    POLICY_TEXT: 'org_policy_text',
    POLICY_SOURCE: 'org_policy_source', // 'text' | 'pdf'
    POLICY_FILENAME: 'org_policy_filename',
  },

  // Validation status values returned by the API
  STATUS: {
    VALID: 'valid',
    INVALID_AUTOCORRECT: 'invalid - autocorrect',
  },

  // UI state labels
  UI_STATE: {
    PENDING: 'pending',
    VALID: 'valid',
    INVALID: 'invalid',
    OFFLINE: 'offline',
    NO_POLICY: 'no_policy',
    PDF_ERROR: 'pdf_error',
    BLOCKED: 'blocked',
  },

  // How long (ms) to wait before re-trying to find DOM elements after page render
  DOM_RETRY_DELAY_MS: 500,
  DOM_RETRY_MAX_ATTEMPTS: 20,

  // Truncate attached PDF text in logs to this character limit for practicality
  LOG_ATTACHMENT_TEXT_MAX_CHARS: 5000,
};

// Make available in content scripts (not using ES modules for MV3 compatibility)
if (typeof module !== 'undefined') {
  module.exports = CONSTANTS;
}
