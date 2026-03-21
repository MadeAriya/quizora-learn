import express from 'express';
import cors from 'cors';
import { YoutubeTranscript } from 'youtube-transcript/dist/youtube-transcript.esm.js';

const app = express();
app.use(cors()); // Allow Vite frontend to communicate
app.use(express.json());

// Helper to extract the 11-character video ID from any YouTube URL
function extractVideoId(urlOrId) {
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = urlOrId.match(regExp);
  if (match && match[2].length === 11) {
    return match[2];
  }
  // Try to return as-is if it's already an 11-char ID
  return urlOrId;
}

app.post('/api/transcript', async (req, res) => {
  const { link, user_id } = req.body;

  if (!link) {
    return res.status(400).json({ success: false, error: 'link is required' });
  }

  const videoId = extractVideoId(link);

  try {
    console.log(`[Backend] Fetching transcript for video ID: ${videoId}...`);
    // 1. Get the transcript
    const transcriptBits = await YoutubeTranscript.fetchTranscript(videoId);
    const fullText = transcriptBits.map(t => t.text).join(' ');

    // 2. Send to your n8n webhook
    const webhookUrl = "https://n8n.ayakdev.web.id/webhook/d21b3b4e-1ca4-4d3b-9dd3-3c583a90eedc";
    
    console.log(`[Backend] Transcript extracted! Length: ${fullText.length}. Sending to n8n webhook...`);
    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, link, user_id: user_id || "", transcript: fullText })
    });

    if (n8nResponse.ok) {
      console.log('[Backend] Successfully sent to n8n webhook!');
      return res.json({ success: true, message: 'Transcript processed and sent to n8n.' });
    } else {
      const errorText = await n8nResponse.text();
      console.error(`[Backend] n8n Error Data:`, errorText);
      throw new Error(`n8n responded with status ${n8nResponse.status}: ${errorText.substring(0, 200)}`);
    }

  } catch (error) {
    console.error('[Backend] Error processing request:', error.message);
    return res.status(400).json({ 
      success: false, 
      error: error.message || 'An unknown error occurred.' 
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
