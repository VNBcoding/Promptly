/**
 * pdf-extractor.js
 * Extracts text from machine-readable PDF files using PDF.js.
 * Loaded as a content script in pages that support file uploads.
 *
 * DEPENDENCY: PDF.js (pdf.min.js + pdf.worker.min.js) must be bundled in /lib/.
 * Download from: https://mozilla.github.io/pdf.js/getting_started/
 */

'use strict';

const PdfExtractor = (() => {
  // PDF.js worker path relative to extension root
  const WORKER_SRC = chrome.runtime.getURL('lib/pdf.worker.min.js');

  /**
   * Extract all text content from a PDF File object.
   * @param {File} file - A File object from an <input type="file"> or drag-drop.
   * @returns {Promise<{text: string, pageCount: number}>}
   * @throws {Error} If the PDF has no extractable text or is corrupt.
   */
  async function extractTextFromFile(file) {
    if (!file || file.type !== 'application/pdf') {
      throw new Error(`Unsupported file type: ${file?.type || 'unknown'}. Only PDF is supported.`);
    }

    const arrayBuffer = await file.arrayBuffer();
    return extractTextFromArrayBuffer(arrayBuffer);
  }

  /**
   * Extract text from a raw PDF ArrayBuffer.
   * @param {ArrayBuffer} arrayBuffer
   * @returns {Promise<{text: string, pageCount: number}>}
   */
  async function extractTextFromArrayBuffer(arrayBuffer) {
    // Ensure PDF.js worker is configured
    if (typeof pdfjsLib === 'undefined') {
      throw new Error('PDF.js library not loaded. Cannot extract PDF text.');
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_SRC;

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    let pdfDoc;

    try {
      pdfDoc = await loadingTask.promise;
    } catch (err) {
      throw new Error(`Failed to parse PDF: ${err.message}`);
    }

    const pageCount = pdfDoc.numPages;
    const pageTexts = [];

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => item.str).join(' ');
      pageTexts.push(pageText.trim());
    }

    const fullText = pageTexts.join('\n\n').trim();

    if (!fullText) {
      throw new Error(
        'This PDF contains no extractable text. It may be a scanned image-only PDF. ' +
        'Please upload a machine-readable PDF or paste your prompt as plain text.'
      );
    }

    return { text: fullText, pageCount };
  }

  return { extractTextFromFile, extractTextFromArrayBuffer };
})();
