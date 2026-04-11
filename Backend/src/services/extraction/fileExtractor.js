import pdf from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import { readFile } from 'fs/promises';

/**
 * Extract text from uploaded file based on MIME type
 * @param {string} filePath - Path to uploaded file
 * @param {string} mimeType - MIME type of the file
 * @returns {string} Extracted text
 */
export async function extractTextFromFile(filePath, mimeType) {
  const buffer = await readFile(filePath);

  if (mimeType === 'application/pdf') {
    return extractPDF(buffer);
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    return extractDOCX(buffer);
  } else if (mimeType === 'text/plain') {
    return buffer.toString('utf-8');
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

async function extractPDF(buffer) {
  const data = await pdf(buffer);
  return data.text;
}

async function extractDOCX(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

/**
 * Supported MIME types
 */
export const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
];
