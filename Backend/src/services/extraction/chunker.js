/**
 * Text chunker for vector store embedding
 * Splits text into overlapping chunks suitable for embedding
 */

const DEFAULT_CHUNK_SIZE = 1000;
const DEFAULT_OVERLAP = 200;

/**
 * Split text into chunks with overlap
 * @param {string} text - Raw text to chunk
 * @param {number} chunkSize - Max characters per chunk
 * @param {number} overlap - Character overlap between chunks
 * @returns {{ content: string, index: number }[]}
 */
export function chunkText(text, chunkSize = DEFAULT_CHUNK_SIZE, overlap = DEFAULT_OVERLAP) {
  if (!text || text.length === 0) return [];

  const chunks = [];
  let start = 0;
  let index = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    // Try to break at a sentence boundary
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      const lastNewline = text.lastIndexOf('\n', end);
      const breakPoint = Math.max(lastPeriod, lastNewline);

      if (breakPoint > start + chunkSize * 0.5) {
        end = breakPoint + 1;
      }
    }

    const content = text.slice(start, end).trim();
    if (content.length > 0) {
      chunks.push({ content, index });
      index++;
    }

    start = end - overlap;
    if (start >= text.length) break;
  }

  return chunks;
}
