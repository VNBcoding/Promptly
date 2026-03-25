/**
 * prompt-extractor.js
 * Extracts typed prompt text and uploaded file content from the page.
 * Returns structured data to be sent to the validation API.
 */

'use strict';

const PromptExtractor = (() => {
  /**
   * Extract prompt content from the current page.
   * @param {SiteAdapterBase} adapter - The active site adapter.
   * @returns {Promise<{promptText: string, attachmentText: string, attachmentNotes: string[]}>}
   */
  async function extract(adapter) {
    const promptEl = adapter.findPromptElement();
    const promptText = adapter.getPromptText(promptEl);

    let attachmentText = '';
    const attachmentNotes = [];

    // Extract text from uploaded files
    const uploadedFiles = adapter.getUploadedFiles();
    const pdfFiles = uploadedFiles.filter((f) => f.type === 'application/pdf');
    const unsupportedFiles = uploadedFiles.filter((f) => f.type !== 'application/pdf');

    // Note unsupported file types (images, etc.)
    for (const f of unsupportedFiles) {
      // JPEG / image files: out of scope for MVP
      if (f.type.startsWith('image/')) {
        attachmentNotes.push(`Image file "${f.name}" was attached but image-to-text extraction is not supported in this version. Only the typed text was validated.`);
      } else {
        attachmentNotes.push(`File "${f.name}" (type: ${f.type}) is not a supported type. Only PDF attachments are validated.`);
      }
    }

    // Extract text from PDF files
    const pdfTexts = [];
    for (const pdfFile of pdfFiles) {
      try {
        const { text } = await PdfExtractor.extractTextFromFile(pdfFile);
        pdfTexts.push(text);
      } catch (err) {
        // Re-throw with context so caller can show specific message
        throw Object.assign(err, { fileName: pdfFile.name, isPdfError: true });
      }
    }

    if (pdfTexts.length > 0) {
      attachmentText = pdfTexts.join('\n\n---\n\n');
    }

    return { promptText, attachmentText, attachmentNotes };
  }

  return { extract };
})();
