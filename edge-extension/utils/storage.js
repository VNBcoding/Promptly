/**
 * storage.js
 * Thin abstraction over chrome.storage.local.
 * All extension components that read/write policy data use this module.
 */

'use strict';

const StorageService = (() => {
  /**
   * Retrieve the stored organization policy text.
   * @returns {Promise<string|null>} Policy text or null if not set.
   */
  async function getPolicy() {
    return new Promise((resolve) => {
      chrome.storage.local.get([CONSTANTS.STORAGE_KEYS.POLICY_TEXT], (result) => {
        resolve(result[CONSTANTS.STORAGE_KEYS.POLICY_TEXT] || null);
      });
    });
  }

  /**
   * Save policy text to local extension storage.
   * @param {string} policyText - Raw policy text content.
   * @param {string} source - 'text' or 'pdf'
   * @param {string} [filename] - Original filename if from PDF upload.
   * @returns {Promise<void>}
   */
  async function savePolicy(policyText, source = 'text', filename = '') {
    return new Promise((resolve) => {
      chrome.storage.local.set({
        [CONSTANTS.STORAGE_KEYS.POLICY_TEXT]: policyText,
        [CONSTANTS.STORAGE_KEYS.POLICY_SOURCE]: source,
        [CONSTANTS.STORAGE_KEYS.POLICY_FILENAME]: filename,
      }, resolve);
    });
  }

  /**
   * Retrieve metadata about the stored policy (source and filename).
   * @returns {Promise<{source: string, filename: string}|null>}
   */
  async function getPolicyMeta() {
    return new Promise((resolve) => {
      chrome.storage.local.get(
        [CONSTANTS.STORAGE_KEYS.POLICY_SOURCE, CONSTANTS.STORAGE_KEYS.POLICY_FILENAME],
        (result) => {
          const source = result[CONSTANTS.STORAGE_KEYS.POLICY_SOURCE];
          if (!source) { resolve(null); return; }
          resolve({
            source,
            filename: result[CONSTANTS.STORAGE_KEYS.POLICY_FILENAME] || '',
          });
        }
      );
    });
  }

  /**
   * Clear all stored policy data.
   * @returns {Promise<void>}
   */
  async function clearPolicy() {
    return new Promise((resolve) => {
      chrome.storage.local.remove([
        CONSTANTS.STORAGE_KEYS.POLICY_TEXT,
        CONSTANTS.STORAGE_KEYS.POLICY_SOURCE,
        CONSTANTS.STORAGE_KEYS.POLICY_FILENAME,
      ], resolve);
    });
  }

  return { getPolicy, savePolicy, getPolicyMeta, clearPolicy };
})();
