/**
 * ui-component.js
 * In-page UI overlay that displays validation results near the prompt box.
 * Injects a single DOM element and updates its content based on state.
 *
 * Entirely self-contained — no external UI framework required.
 */

'use strict';

const UIComponent = (() => {
  const ELEMENT_ID = 'ai-compliance-guard-ui';
  let _onAutocorrectAccept = null;
  let _onAutocorrectReject = null;

  /**
   * Create and insert the UI element into the page.
   * If it already exists, just return the existing element.
   * @param {Element} insertionPoint - DOM element to insert after.
   * @returns {Element} The UI container element.
   */
  function mount(insertionPoint) {
    let container = document.getElementById(ELEMENT_ID);
    if (container) return container;

    container = document.createElement('div');
    container.id = ELEMENT_ID;
    container.setAttribute('data-extension', 'ai-compliance-guard');

    // Insert after the insertion point
    if (insertionPoint && insertionPoint.parentNode) {
      insertionPoint.parentNode.insertBefore(container, insertionPoint.nextSibling);
    } else {
      document.body.appendChild(container);
    }

    return container;
  }

  /**
   * Remove the UI element from the page.
   */
  function unmount() {
    const el = document.getElementById(ELEMENT_ID);
    if (el) el.remove();
  }

  /**
   * Ensure the UI element exists, mounting if needed.
   */
  function getOrMount(insertionPoint) {
    return document.getElementById(ELEMENT_ID) || mount(insertionPoint);
  }

  /**
   * Show "validation in progress" spinner.
   * @param {Element} insertionPoint
   */
  function showPending(insertionPoint) {
    const el = getOrMount(insertionPoint);
    el.className = 'acg-ui acg-pending';
    el.innerHTML = `
      <div class="acg-header">
        <span class="acg-icon"></span>
        <span class="acg-title">AI Guard</span>
      </div>
      <div class="acg-body">
        <p>Thinking<span class="acg-dots"></span></p>
      </div>
    `;
  }

  /**
   * Show "prompt is valid" state.
   * @param {Element} insertionPoint
   * @param {string} message - Human-readable message from API.
   */
  function showValid(insertionPoint, message) {
    const el = getOrMount(insertionPoint);
    el.className = 'acg-ui acg-valid';
    el.innerHTML = `
      <div class="acg-header">
        <span class="acg-icon"></span>
        <span class="acg-title">AI Guard &mdash; Prompt Approved</span>
      </div>
      <div class="acg-body">
        <p>${escapeHtml(message || 'Your prompt complies with the organization policy.')}</p>
        <p class="acg-hint">You may now click Send to submit your prompt.</p>
      </div>
    `;
  }

  /**
   * Show invalid state with autocorrect offer.
   * @param {Element} insertionPoint
   * @param {object} apiResponse - Full API response object.
   * @param {Function} onAccept - Called when user accepts autocorrect.
   * @param {Function} onReject - Called when user rejects autocorrect.
   */
  function showInvalidAutocorrect(insertionPoint, apiResponse, onAccept, onReject) {
    _onAutocorrectAccept = onAccept;
    _onAutocorrectReject = onReject;

    const el = getOrMount(insertionPoint);
    el.className = 'acg-ui acg-invalid';

    const reasonsHtml = (apiResponse.reasons || [])
      .map((r) => `<li>${escapeHtml(r)}</li>`)
      .join('');

    const violationsHtml = (apiResponse.violations || [])
      .map((v) => `<li><strong>${escapeHtml(v.type)}:</strong> ${escapeHtml(v.reason)}</li>`)
      .join('');

    el.innerHTML = `
      <div class="acg-header">
        <span class="acg-icon"></span>
        <span class="acg-title">AI Guard &mdash; Policy Violation Detected</span>
      </div>
      <div class="acg-body">
        <p>${escapeHtml(apiResponse.message || 'Your prompt may violate the organization policy.')}</p>
        ${reasonsHtml ? `<ul class="acg-reasons">${reasonsHtml}</ul>` : ''}
        ${violationsHtml ? `<ul class="acg-violations">${violationsHtml}</ul>` : ''}
        <div class="acg-autocorrect-section">
          <p class="acg-autocorrect-label">A corrected version of your prompt is available.</p>
          <p>Would you like to apply the autocorrection?</p>
          <div class="acg-buttons">
            <button id="acg-accept-btn" class="acg-btn acg-btn-accept">Yes, apply correction</button>
            <button id="acg-reject-btn" class="acg-btn acg-btn-reject">No, I will edit manually</button>
          </div>
        </div>
      </div>
    `;

    // Attach button handlers
    document.getElementById('acg-accept-btn')?.addEventListener('click', () => {
      if (_onAutocorrectAccept) _onAutocorrectAccept();
    });
    document.getElementById('acg-reject-btn')?.addEventListener('click', () => {
      if (_onAutocorrectReject) _onAutocorrectReject();
    });
  }

  /**
   * Show offline/unavailable error state.
   * @param {Element} insertionPoint
   */
  function showOffline(insertionPoint) {
    const el = getOrMount(insertionPoint);
    el.className = 'acg-ui acg-offline';
    el.innerHTML = `
      <div class="acg-header">
        <span class="acg-icon"></span>
        <span class="acg-title">AI Guard &mdash; Unavailable</span>
      </div>
      <div class="acg-body">
        <p>Verification unavailable. Prompt cannot be submitted right now.</p>
        <p class="acg-hint">Please ensure the local compliance server is running on port 5000.</p>
      </div>
    `;
  }

  /**
   * Show "no policy" state.
   * @param {Element} insertionPoint
   */
  function showNoPolicy(insertionPoint) {
    const el = getOrMount(insertionPoint);
    el.className = 'acg-ui acg-no-policy';
    el.innerHTML = `
      <div class="acg-header">
        <span class="acg-icon"></span>
        <span class="acg-title">AI Guard</span>
      </div>
      <div class="acg-body">
        <p>No organization policy uploaded. Prompt cannot be verified.</p>
        <p class="acg-hint">Click the extension icon in the toolbar to upload a policy.</p>
      </div>
    `;
  }

  /**
   * Show PDF extraction error.
   * @param {Element} insertionPoint
   * @param {string} detail - Error detail message.
   */
  function showPdfError(insertionPoint, detail) {
    const el = getOrMount(insertionPoint);
    el.className = 'acg-ui acg-error';
    el.innerHTML = `
      <div class="acg-header">
        <span class="acg-icon"></span>
        <span class="acg-title">AI Guard &mdash; File Error</span>
      </div>
      <div class="acg-body">
        <p>${escapeHtml(detail)}</p>
        <p class="acg-hint">Submission is blocked until the issue is resolved.</p>
      </div>
    `;
  }

  /**
   * Show generic error (malformed response, unexpected failure).
   * @param {Element} insertionPoint
   * @param {string} detail
   */
  function showError(insertionPoint, detail) {
    const el = getOrMount(insertionPoint);
    el.className = 'acg-ui acg-error';
    el.innerHTML = `
      <div class="acg-header">
        <span class="acg-icon"></span>
        <span class="acg-title">AI Guard &mdash; Error</span>
      </div>
      <div class="acg-body">
        <p>${escapeHtml(detail || 'An unexpected error occurred during validation.')}</p>
      </div>
    `;
  }

  /**
   * Escape HTML to prevent XSS from API response content.
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  return {
    mount,
    unmount,
    showPending,
    showValid,
    showInvalidAutocorrect,
    showOffline,
    showNoPolicy,
    showPdfError,
    showError,
  };
})();
