/**
 * copilot-adapter.js
 * Site adapter for Microsoft Copilot (copilot.microsoft.com).
 *
 * TODO: Copilot's DOM may change with Microsoft updates.
 * Verify selectors using browser DevTools if the extension stops working.
 */

'use strict';

class CopilotAdapter extends SiteAdapterBase {
  constructor() {
    super({
      name: 'Copilot',
      domains: ['copilot.microsoft.com'],
      selectors: {
        promptInputs: [
          '#userInput',
          'textarea[data-testid="composer-input"]',
          'textarea[placeholder="Message Copilot"]',
        ],
        submitButtons: [
          'button[data-testid="submit-button"]',
          'button[aria-label="Submit message"]',
        ],
      },
    });
  }

  getUiInsertionPoint(promptEl) {
    if (!promptEl) return null;
    const container = promptEl.closest('[class*="input"]') ||
                      promptEl.closest('form') ||
                      promptEl.parentElement;
    return container || promptEl.parentElement;
  }
}
