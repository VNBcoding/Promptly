/**
 * submit-interceptor.js
 * Intercepts submit actions on AI platform prompt forms.
 * Blocks submission, triggers validation, and manages allow/block state.
 *
 * Uses a "locked" flag to prevent rapid re-clicks during validation.
 */

'use strict';

const SubmitInterceptor = (() => {
  let _isValidated = false;   // True when current prompt has passed validation
  let _isLocked = false;      // True while validation request is in-flight
  let _submitEl = null;       // Currently bound submit button element
  let _handler = null;        // Bound event handler reference (for cleanup)

  /**
   * Attach click interception to the submit button.
   * If already bound, unbinds first to prevent duplicate listeners.
   * @param {Element} submitEl
   * @param {Function} onSubmitAttempt - Async callback: () => Promise<void>
   */
  function bind(submitEl, onSubmitAttempt) {
    unbind(); // Always clean up previous binding

    _submitEl = submitEl;
    _isValidated = false;
    _isLocked = false;

    _handler = async (event) => {
      if (_isValidated) {
        // Prompt has been cleared as safe — allow native submit
        _isValidated = false; // Reset for next prompt
        return;
      }

      // Block the submit action
      event.preventDefault();
      event.stopImmediatePropagation();

      if (_isLocked) {
        // Validation already in progress — ignore rapid clicks
        return;
      }

      _isLocked = true;
      try {
        await onSubmitAttempt();
      } finally {
        _isLocked = false;
      }
    };

    // Use capture phase to intercept before site's own handlers
    submitEl.addEventListener('click', _handler, { capture: true });

    // Also intercept keyboard Enter in the prompt box
    // (handled in content-main.js via prompt element keydown)
  }

  /**
   * Remove the intercept handler from the submit button.
   */
  function unbind() {
    if (_submitEl && _handler) {
      _submitEl.removeEventListener('click', _handler, { capture: true });
    }
    _submitEl = null;
    _handler = null;
    _isValidated = false;
    _isLocked = false;
  }

  /**
   * Mark the current prompt as validated and safe to submit.
   * The next click on the submit button will be allowed through.
   */
  function allowNextSubmit() {
    _isValidated = true;
  }

  /**
   * Reset validation state (e.g., when user edits the prompt after a result).
   */
  function resetValidation() {
    _isValidated = false;
  }

  /**
   * Check if a submit is currently blocked (not validated, not in-flight).
   */
  function isBlocked() {
    return !_isValidated && !_isLocked;
  }

  function isValidated() { return _isValidated; }
  function isLocked() { return _isLocked; }
  function lock() { _isLocked = true; }
  function unlock() { _isLocked = false; }

  return { bind, unbind, allowNextSubmit, resetValidation, isBlocked, isValidated, isLocked, lock, unlock };
})();
