/**
 * content-main.js
 * Main orchestrator for the AI Compliance Guard content script.
 * Injected into allowlisted AI platform pages.
 *
 * Responsibilities:
 *  - Identify the correct site adapter
 *  - Observe DOM mutations to re-bind when the page rerenders
 *  - Coordinate between submit interception, extraction, validation, and UI
 */

'use strict';

(async () => {
  // --- Guard: only run on allowed domains ---
  if (!AdapterRegistry.isAllowedDomain()) return;

  const adapter = AdapterRegistry.getAdapterForCurrentDomain();
  if (!adapter) {
    console.warn('[ACG] No adapter found for', window.location.hostname);
    return;
  }

  console.info(`[ACG] Loaded adapter: ${adapter.name}`);

  let _promptEl = null;
  let _submitEl = null;
  let _uiInsertionPoint = null;
  let _promptObserver = null;   // Watches for user edits after a result
  let _domObserver = null;      // Watches for page rerenders

  /**
   * Main bind function. Finds DOM elements and attaches all listeners.
   * Safe to call multiple times (cleans up previous listeners first).
   */
  async function bindToPage() {
    const promptEl = adapter.findPromptElement();
    const submitEl = adapter.findSubmitButton();

    if (!promptEl || !submitEl) {
      // Elements not found yet — DOM observer will retry
      return;
    }

    // Avoid re-binding if elements haven't changed
    if (promptEl === _promptEl && submitEl === _submitEl) return;

    _promptEl = promptEl;
    _submitEl = submitEl;
    _uiInsertionPoint = adapter.getUiInsertionPoint(promptEl);

    // Bind submit interception
    SubmitInterceptor.bind(submitEl, handleSubmitAttempt);

    // Intercept Enter key in the prompt box
    attachEnterKeyInterceptor(promptEl);

    // Watch for user edits after a validation result (resets state)
    attachPromptChangeObserver(promptEl);

    console.info('[ACG] Bound to prompt and submit elements.');
  }

  /**
   * Handle a submit attempt: extract, validate, and show result.
   */
  async function handleSubmitAttempt() {
    // Show pending UI immediately
    UIComponent.showPending(_uiInsertionPoint);

    // Check policy exists
    const policy = await StorageService.getPolicy();
    if (!policy) {
      UIComponent.showNoPolicy(_uiInsertionPoint);
      return;
    }

    // Extract prompt content
    let extraction;
    try {
      extraction = await PromptExtractor.extract(adapter);
    } catch (err) {
      if (err.isPdfError) {
        UIComponent.showPdfError(_uiInsertionPoint, err.message);
      } else {
        UIComponent.showError(_uiInsertionPoint, err.message);
      }
      return;
    }

    const { promptText, attachmentText, attachmentNotes } = extraction;

    if (!promptText && !attachmentText) {
      UIComponent.showError(_uiInsertionPoint, 'No prompt text found to validate.');
      return;
    }

    // Send to background service worker for API call
    let response;
    try {
      response = await chrome.runtime.sendMessage({
        type: 'VALIDATE_PROMPT',
        payload: {
          promptText,
          attachmentText,
          attachmentNotes,
          policy,
          domain: window.location.hostname,
        },
      });
    } catch (err) {
      UIComponent.showOffline(_uiInsertionPoint);
      return;
    }

    if (!response || response.error) {
      UIComponent.showOffline(_uiInsertionPoint);
      return;
    }

    handleValidationResult(response.data, extraction);
  }

  /**
   * Process the API validation result and update UI accordingly.
   * @param {object} result - Structured API response
   * @param {object} extraction - The extracted prompt data
   */
  function handleValidationResult(result, extraction) {
    if (!result || typeof result.status !== 'string') {
      UIComponent.showError(_uiInsertionPoint, 'Received an unexpected response from the validation server.');
      return;
    }

    const status = result.status.toLowerCase();

    if (status === CONSTANTS.STATUS.VALID) {
      UIComponent.showValid(_uiInsertionPoint, result.message);
      SubmitInterceptor.allowNextSubmit();
      return;
    }

    if (status === CONSTANTS.STATUS.INVALID_AUTOCORRECT) {
      if (!result.corrected_prompt) {
        // API returned invalid but no correction — treat as blocked
        UIComponent.showError(
          _uiInsertionPoint,
          result.message || 'Policy violation detected. Please edit your prompt manually.'
        );
        return;
      }

      UIComponent.showInvalidAutocorrect(
        _uiInsertionPoint,
        result,
        () => handleAutocorrectAccepted(result.corrected_prompt),
        () => handleAutocorrectRejected()
      );
      return;
    }

    // Unknown status — block and show error
    UIComponent.showError(_uiInsertionPoint, `Unknown validation status: ${result.status}`);
  }

  /**
   * User accepted the autocorrect. Replace prompt and allow submission.
   * @param {string} correctedPrompt - From the API response.
   */
  function handleAutocorrectAccepted(correctedPrompt) {
    const promptEl = adapter.findPromptElement();
    if (!promptEl) {
      UIComponent.showError(_uiInsertionPoint, 'Could not find prompt box to apply correction.');
      return;
    }

    adapter.setPromptText(promptEl, correctedPrompt);

    // Detach change observer briefly to avoid re-triggering reset
    _promptObserver?.disconnect();

    SubmitInterceptor.allowNextSubmit();

    // Show a brief "corrected" message
    UIComponent.showValid(
      _uiInsertionPoint,
      'Autocorrection applied. Your prompt complies with the organization policy. You may now click Send.'
    );

    // Notify background to update audit log: autocorrect accepted
    chrome.runtime.sendMessage({
      type: 'LOG_AUTOCORRECT_ACCEPTED',
      payload: { domain: window.location.hostname },
    });

    // Re-attach observer after slight delay
    setTimeout(() => attachPromptChangeObserver(promptEl), 300);
  }

  /**
   * User rejected autocorrect. Keep submission blocked.
   */
  function handleAutocorrectRejected() {
    UIComponent.showError(
      _uiInsertionPoint,
      'Submission is blocked. Please edit your prompt to comply with the organization policy, then try submitting again.'
    );
    SubmitInterceptor.resetValidation();
  }

  /**
   * Intercept Enter key on the prompt element to trigger validation.
   * Shift+Enter is allowed through (line break).
   * @param {Element} promptEl
   */
  function attachEnterKeyInterceptor(promptEl) {
    promptEl.addEventListener('keydown', async (event) => {
      if (event.key !== 'Enter' || event.shiftKey) return;
      if (SubmitInterceptor.isValidated()) return; // Already validated — let it through

      event.preventDefault();
      event.stopImmediatePropagation();

      if (SubmitInterceptor.isLocked()) return;

      SubmitInterceptor.lock();
      try {
        await handleSubmitAttempt();
      } finally {
        SubmitInterceptor.unlock();
      }
    }, { capture: true });
  }

  /**
   * Watch the prompt element for user edits.
   * If the user modifies the prompt after seeing a result, reset validation state.
   * @param {Element} promptEl
   */
  function attachPromptChangeObserver(promptEl) {
    _promptObserver?.disconnect();

    // For textarea: listen to input event
    if (promptEl.tagName === 'TEXTAREA' || promptEl.tagName === 'INPUT') {
      promptEl.addEventListener('input', onPromptChanged, { passive: true });
    } else {
      // For contenteditable: use MutationObserver
      _promptObserver = new MutationObserver(onPromptChanged);
      _promptObserver.observe(promptEl, { childList: true, subtree: true, characterData: true });
    }
  }

  /**
   * Called whenever the user modifies the prompt text.
   * Resets the validation state so the next submit will re-validate.
   */
  function onPromptChanged() {
    if (!SubmitInterceptor.isBlocked()) {
      // Was previously validated — reset it
      SubmitInterceptor.resetValidation();
      UIComponent.unmount();
    }
  }

  /**
   * Use MutationObserver to detect page rerenders and re-bind listeners.
   * This is necessary for SPAs that replace DOM subtrees on navigation.
   */
  function startDomObserver() {
    _domObserver?.disconnect();
    _domObserver = new MutationObserver(debounce(bindToPage, 500));
    _domObserver.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Simple debounce to prevent flooding bind calls during rapid DOM changes.
   * @param {Function} fn
   * @param {number} delayMs
   * @returns {Function}
   */
  function debounce(fn, delayMs) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delayMs);
    };
  }

  // --- Initial bind with retry logic ---
  let attempts = 0;
  const tryBind = async () => {
    await bindToPage();
    const promptEl = adapter.findPromptElement();
    if (!promptEl && attempts < CONSTANTS.DOM_RETRY_MAX_ATTEMPTS) {
      attempts++;
      setTimeout(tryBind, CONSTANTS.DOM_RETRY_DELAY_MS);
    }
  };

  await tryBind();
  startDomObserver();
})();
