/**
 * adapter-base.js
 * Abstract base class defining the interface all site adapters must implement.
 * Each supported AI platform gets its own adapter that extends this.
 *
 * Adapters encapsulate all DOM-specific knowledge about a given site.
 * The rest of the extension only calls the methods defined here.
 */

'use strict';

class SiteAdapterBase {
  constructor(config) {
    /**
     * @property {string} name - Human-readable platform name (e.g. "ChatGPT")
     * @property {string[]} domains - Domains this adapter handles
     * @property {object} selectors - CSS selectors for DOM elements
     */
    this.name = config.name;
    this.domains = config.domains;
    this.selectors = config.selectors;
  }

  /**
   * Find the primary prompt input element on the page.
   * Must be overridden by subclasses if default logic is insufficient.
   * @returns {Element|null}
   */
  findPromptElement() {
    for (const selector of this.selectors.promptInputs) {
      const el = document.querySelector(selector);
      if (el) return el;
    }
    return null;
  }

  /**
   * Find the submit button element on the page.
   * @returns {Element|null}
   */
  findSubmitButton() {
    for (const selector of this.selectors.submitButtons) {
      const el = document.querySelector(selector);
      if (el) return el;
    }
    return null;
  }

  /**
   * Extract the current prompt text from the input element.
   * Handles both textarea and contenteditable elements.
   * @param {Element} promptEl
   * @returns {string}
   */
  getPromptText(promptEl) {
    if (!promptEl) return '';
    if (promptEl.tagName === 'TEXTAREA' || promptEl.tagName === 'INPUT') {
      return promptEl.value.trim();
    }
    // contenteditable div (used by ChatGPT, Copilot, etc.)
    return promptEl.innerText.trim();
  }

  /**
   * Replace the prompt text in the input element.
   * Dispatches native input events so the site's React/Vue state updates.
   * @param {Element} promptEl
   * @param {string} newText
   */
  setPromptText(promptEl, newText) {
    if (!promptEl) return;

    if (promptEl.tagName === 'TEXTAREA' || promptEl.tagName === 'INPUT') {
      // For textarea: use native input value setter to bypass React's synthetic events
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      ).set;
      nativeInputValueSetter.call(promptEl, newText);
    } else {
      // For contenteditable: set innerText directly
      promptEl.innerText = newText;

      // Place caret at end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(promptEl);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }

    // Fire input and change events so the site's state management picks up the change
    promptEl.dispatchEvent(new Event('input', { bubbles: true }));
    promptEl.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /**
   * Find file input elements on the page that may have uploaded files.
   * @returns {HTMLInputElement[]}
   */
  findFileInputs() {
    return Array.from(document.querySelectorAll('input[type="file"]'));
  }

  /**
   * Get all File objects that have been uploaded by the user.
   * @returns {File[]}
   */
  getUploadedFiles() {
    const inputs = this.findFileInputs();
    const files = [];
    for (const input of inputs) {
      if (input.files && input.files.length > 0) {
        files.push(...Array.from(input.files));
      }
    }
    return files;
  }

  /**
   * Returns the container element near the prompt box where the
   * extension's in-page UI should be inserted.
   * @param {Element} promptEl
   * @returns {Element|null}
   */
  getUiInsertionPoint(promptEl) {
    if (!promptEl) return null;
    // Default: insert after the prompt element's parent
    return promptEl.parentElement || promptEl;
  }
}
