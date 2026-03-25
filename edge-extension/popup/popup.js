/**
 * popup.js
 * Controls the extension popup UI for managing the organization policy.
 *
 * Allows users to:
 *  - Paste policy text directly
 *  - Upload a PDF to extract and store policy text
 *  - View current policy status
 *  - Clear stored policy
 */

'use strict';

// --- DOM Element References ---
const policyStatusEl = document.getElementById('policy-status');
const policyMetaEl = document.getElementById('policy-meta');
const tabPasteBtn = document.getElementById('tab-paste');
const tabUploadBtn = document.getElementById('tab-upload');
const panelPaste = document.getElementById('panel-paste');
const panelUpload = document.getElementById('panel-upload');
const policyTextInput = document.getElementById('policy-text-input');
const policyPdfInput = document.getElementById('policy-pdf-input');
const fileLabelText = document.getElementById('file-label-text');
const pdfExtractStatus = document.getElementById('pdf-extract-status');
const savePolicyBtn = document.getElementById('save-policy-btn');
const clearPolicyBtn = document.getElementById('clear-policy-btn');
const saveStatusEl = document.getElementById('save-status');

// Track current active tab
let activeTab = 'paste';
let extractedPdfText = null;
let selectedFileName = '';

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
  await loadPolicyStatus();
  setupTabSwitching();
  setupEventListeners();
});

/**
 * Load and display the current policy status from storage.
 */
async function loadPolicyStatus() {
  const policy = await StorageService.getPolicy();
  const meta = await StorageService.getPolicyMeta();

  if (policy) {
    policyStatusEl.textContent = 'Policy loaded';
    policyStatusEl.className = 'policy-status policy-status--loaded';
    if (meta) {
      policyMetaEl.textContent = meta.source === 'pdf'
        ? `Source: PDF — ${meta.filename}`
        : 'Source: Pasted text';
      policyMetaEl.classList.remove('hidden');
    }
  } else {
    policyStatusEl.textContent = 'No policy uploaded';
    policyStatusEl.className = 'policy-status policy-status--none';
    policyMetaEl.classList.add('hidden');
  }
}

/**
 * Set up tab switching between Paste and Upload panels.
 */
function setupTabSwitching() {
  tabPasteBtn.addEventListener('click', () => switchTab('paste'));
  tabUploadBtn.addEventListener('click', () => switchTab('upload'));
}

function switchTab(tab) {
  activeTab = tab;
  if (tab === 'paste') {
    tabPasteBtn.classList.add('tab-btn--active');
    tabUploadBtn.classList.remove('tab-btn--active');
    panelPaste.classList.remove('hidden');
    panelUpload.classList.add('hidden');
  } else {
    tabUploadBtn.classList.add('tab-btn--active');
    tabPasteBtn.classList.remove('tab-btn--active');
    panelUpload.classList.remove('hidden');
    panelPaste.classList.add('hidden');
  }
  updateSaveButtonState();
}

/**
 * Set up all interactive event listeners.
 */
function setupEventListeners() {
  // Enable save button when textarea has content
  policyTextInput.addEventListener('input', updateSaveButtonState);

  // Handle PDF file selection
  policyPdfInput.addEventListener('change', handlePdfFileSelected);

  // Save policy
  savePolicyBtn.addEventListener('click', handleSavePolicy);

  // Clear policy
  clearPolicyBtn.addEventListener('click', handleClearPolicy);
}

/**
 * Enable/disable the Save button based on current tab state.
 */
function updateSaveButtonState() {
  if (activeTab === 'paste') {
    savePolicyBtn.disabled = policyTextInput.value.trim().length === 0;
  } else {
    savePolicyBtn.disabled = extractedPdfText === null;
  }
}

/**
 * Handle PDF file selection: extract text and enable save.
 */
async function handlePdfFileSelected(event) {
  const file = event.target.files[0];
  if (!file) return;

  selectedFileName = file.name;
  fileLabelText.textContent = file.name;
  extractedPdfText = null;

  pdfExtractStatus.textContent = 'Extracting text from PDF...';
  pdfExtractStatus.className = 'extract-status';
  savePolicyBtn.disabled = true;

  try {
    const { text, pageCount } = await PdfExtractor.extractTextFromFile(file);
    extractedPdfText = text;
    pdfExtractStatus.textContent = `Extracted text from ${pageCount} page(s). Ready to save.`;
    pdfExtractStatus.className = 'extract-status';
    updateSaveButtonState();
  } catch (err) {
    pdfExtractStatus.textContent = `Error: ${err.message}`;
    pdfExtractStatus.className = 'extract-status error';
    extractedPdfText = null;
    updateSaveButtonState();
  }
}

/**
 * Save the policy to chrome.storage.local.
 */
async function handleSavePolicy() {
  let policyText = '';
  let source = 'text';
  let filename = '';

  if (activeTab === 'paste') {
    policyText = policyTextInput.value.trim();
    if (!policyText) return;
    source = 'text';
  } else {
    if (!extractedPdfText) return;
    policyText = extractedPdfText;
    source = 'pdf';
    filename = selectedFileName;
  }

  try {
    await StorageService.savePolicy(policyText, source, filename);
    showSaveStatus('Policy saved successfully.', 'success');
    await loadPolicyStatus();
  } catch (err) {
    showSaveStatus(`Failed to save: ${err.message}`, 'error');
  }
}

/**
 * Clear the stored policy.
 */
async function handleClearPolicy() {
  await StorageService.clearPolicy();
  policyTextInput.value = '';
  extractedPdfText = null;
  fileLabelText.textContent = 'Choose PDF file\u2026';
  pdfExtractStatus.classList.add('hidden');
  showSaveStatus('Policy cleared.', 'success');
  await loadPolicyStatus();
  updateSaveButtonState();
}

/**
 * Show a status message below the save button.
 * @param {string} message
 * @param {'success'|'error'} type
 */
function showSaveStatus(message, type) {
  saveStatusEl.textContent = message;
  saveStatusEl.className = `save-status ${type}`;
  setTimeout(() => {
    saveStatusEl.className = 'save-status hidden';
  }, 3000);
}
