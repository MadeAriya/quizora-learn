import { YoutubeTranscript } from 'youtube-transcript/dist/youtube-transcript.esm.js';

/**
 * Extract video ID from YouTube URL
 */
export function extractVideoId(urlOrId) {
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = urlOrId.match(regExp);
  if (match && match[2].length === 11) {
    return match[2];
  }
  return urlOrId;
}

/**
 * Validate YouTube URL
 */
export function isValidYouTubeUrl(str) {
  if (!str || typeof str !== 'string') return false;
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}/.test(str);
}

/**
 * Fetch YouTube transcript
 * @param {string} videoId - 11-character video ID
 * @returns {string} Full transcript text
 */
export async function fetchYouTubeTranscript(videoId) {
  console.log(`[YouTube] Fetching transcript for video ID: ${videoId}...`);
  const transcriptBits = await YoutubeTranscript.fetchTranscript(videoId);
  const fullText = transcriptBits.map(t => t.text).join(' ');
  console.log(`[YouTube] Transcript extracted! Length: ${fullText.length} characters`);
  return fullText;
}
