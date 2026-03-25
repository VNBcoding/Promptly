/**
 * service-worker.js
 * Background service worker for AI Compliance Guard.
 *
 * Responsibilities:
 *  - Receive VALIDATE_PROMPT messages from content scripts
 *  - Forward validation requests to the local Flask API
 *  - Return structured responses (or error indicators) back to content scripts
 *  - Track pending audit log updates (LOG_AUTOCORRECT_ACCEPTED)
 *
 * The service worker handles the fetch() call because content scripts
 * on third-party pages cannot make cross-origin requests to localhost
 * without relaxed CSP. The background worker has broader fetch access.
 */

'use strict';

// In-memory map of tabId -> last audit entry (for autocorrect accepted updates)
const _pendingAuditUpdates = new Map();

// ---------------------------------------------------------------------------
// Programmatic injection for Copilot (Edge blocks declarative content scripts
// on Microsoft-owned domains)
// ---------------------------------------------------------------------------
const COPILOT_SCRIPTS = [
  'utils/constants.js',
  'utils/storage.js',
  'lib/pdf.min.js',
  'utils/pdf-extractor.js',
  'adapters/adapter-base.js',
  'adapters/chatgpt-adapter.js',
  'adapters/copilot-adapter.js',
  'adapters/adapter-registry.js',
  'content/ui-component.js',
  'content/submit-interceptor.js',
  'content/prompt-extractor.js',
  'content/content-main.js',
];

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;
  let hostname;
  try { hostname = new URL(tab.url).hostname; } catch { return; }
  if (hostname !== 'copilot.microsoft.com') return;

  chrome.scripting.executeScript({ target: { tabId }, files: COPILOT_SCRIPTS })
    .catch(err => console.warn('[ACG SW] Copilot script injection failed:', err.message));
  chrome.scripting.insertCSS({ target: { tabId }, files: ['content/content-styles.css'] })
    .catch(err => console.warn('[ACG SW] Copilot CSS injection failed:', err.message));
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'VALIDATE_PROMPT') {
    handleValidatePrompt(message.payload, sender)
      .then((result) => sendResponse(result))
      .catch((err) => {
        console.error('[ACG SW] Validation error:', err);
        sendResponse({ error: true, message: err.message });
      });
    return true; // Keep message channel open for async response
  }

  if (message.type === 'LOG_AUTOCORRECT_ACCEPTED') {
    // Notify Flask API to update the audit log entry autocorrect flag
    notifyAutocorrectAccepted(message.payload, sender);
    return false;
  }
});

/**
 * Send the prompt content to the local Flask validation API.
 * @param {object} payload
 * @param {object} sender
 * @returns {Promise<{data: object}|{error: boolean}>}
 */
async function handleValidatePrompt(payload, sender) {
  const { promptText, attachmentText, attachmentNotes, policy, domain } = payload;

  const requestBody = {
    prompt_text: promptText,
    attachment_text: attachmentText || '',
    attachment_notes: attachmentNotes || [],
    policy_text: policy,
    domain: domain,
  };

  let res;
  try {
    res = await fetch(`http://localhost:5000/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
  } catch (err) {
    // Network error = local server is not running
    console.warn('[ACG SW] Local API unreachable:', err.message);
    return { error: true, offline: true };
  }

  if (!res.ok) {
    console.error('[ACG SW] API returned error status:', res.status);
    return { error: true, message: `API error: ${res.status}` };
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    console.error('[ACG SW] Failed to parse API response:', err);
    return { error: true, message: 'Malformed response from validation API.' };
  }

  // Validate response structure
  if (!data.status) {
    return { error: true, message: 'Validation response missing required "status" field.' };
  }

  return { data };
}

/**
 * Send autocorrect-accepted notification to the local API audit logger.
 * @param {object} payload
 * @param {object} sender
 */
async function notifyAutocorrectAccepted(payload, sender) {
  try {
    await fetch('http://localhost:5000/audit/autocorrect-accepted', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: payload.domain }),
    });
  } catch (err) {
    console.warn('[ACG SW] Could not notify audit logger of autocorrect acceptance:', err.message);
  }
}
