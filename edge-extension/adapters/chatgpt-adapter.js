/**
 * chatgpt-adapter.js
 * Site adapter for ChatGPT (chatgpt.com / chat.openai.com).
 *
 * TODO: ChatGPT's DOM changes frequently. If selectors stop working,
 * update the CSS selectors in this file. Verify in browser DevTools.
 */

'use strict';

class ChatGPTAdapter extends SiteAdapterBase {
  constructor() {
    super({
      name: 'ChatGPT',
      domains: ['chatgpt.com', 'chat.openai.com'],
      selectors: {
        // TODO: Verify these selectors against current ChatGPT DOM
        promptInputs: [
          '#prompt-textarea',                    // Main textarea (current)
          'div[contenteditable="true"]',          // Fallback contenteditable
          'textarea[data-id="request-:r1:"]',    // Older versions
        ],
        submitButtons: [
          'button[data-testid="send-button"]',   // Current send button
          'button[aria-label="Send message"]',
          'button[aria-label="Send prompt"]',
          'button.send-button',                  // Fallback class
        ],
      },
    });
  }

  /**
   * ChatGPT uses a contenteditable div as the primary prompt input.
   * Override to prioritize it correctly.
   */
  findPromptElement() {
    // Try each selector in priority order
    for (const selector of this.selectors.promptInputs) {
      const el = document.querySelector(selector);
      if (el && (el.offsetParent !== null || el.isConnected)) {
        return el;
      }
    }
    return null;
  }

  /**
   * ChatGPT's submit button may be disabled until text is entered.
   * Find it regardless of disabled state.
   */
  findSubmitButton() {
    for (const selector of this.selectors.submitButtons) {
      const el = document.querySelector(selector);
      if (el) return el;
    }
    return null;
  }

  getUiInsertionPoint(promptEl) {
    if (!promptEl) return null;
    // Insert UI in the form container, above the submit button row
    const form = promptEl.closest('form') || promptEl.parentElement?.parentElement;
    return form || promptEl.parentElement;
  }
}
