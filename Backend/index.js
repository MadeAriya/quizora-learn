import express from 'express';
import cors from 'cors';
import { YoutubeTranscript } from 'youtube-transcript/dist/youtube-transcript.esm.js';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
app.use(cors()); // Allow Vite frontend to communicate
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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

// Extract chunks from HTML for Doomscroll Explanation Cards
function extractChunksFromHtml(html) {
  if (!html) return [];
  // match block level elements commonly used in CKEditor
  const matches = html.match(/<(p|h[1-6]|ul|ol|blockquote|table|figure)[^>]*>[\s\S]*?<\/\1>/gi);
  if (matches && matches.length > 0) {
    return matches.map((m, i) => ({ id: `chunk-${i}`, html: m }));
  }
  return [{ id: 'chunk-0', html }];
}

app.post('/api/learning/generate', async (req, res) => {
  const { user_id, quiz_id, confidenceScore = 50, seenIds = [] } = req.body;
  
  if (!quiz_id) {
    return res.status(400).json({ error: 'quiz_id is required' });
  }

  try {
    const [{ data: questions }, { data: flashcards }, { data: notesData }] = await Promise.all([
      supabase.from('questions').select('*').eq('quiz_id', quiz_id),
      supabase.from('flashcard').select('*').eq('quiz_id', quiz_id),
      supabase.from('notes').select('*').eq('quiz_id', quiz_id).single()
    ]);

    const explanations = notesData ? extractChunksFromHtml(notesData.html) : [];

    // Filter out items the user has already seen in this session
    const unseenQuestions = (questions || []).filter(q => !seenIds.includes(`q-${q.id}`));
    const unseenFlashcards = (flashcards || []).filter(f => !seenIds.includes(`f-${f.id}`));
    const unseenExplanations = explanations.filter(e => !seenIds.includes(`e-${e.id}`));

    // If all are seen, loop back to all available items to ensure infinite scroll
    const qs = unseenQuestions.length ? unseenQuestions : (questions || []);
    const fs = unseenFlashcards.length ? unseenFlashcards : (flashcards || []);
    const es = unseenExplanations.length ? unseenExplanations : explanations;

    // Adaptive probability based on confidenceScore
    let pool = [];
    const rand = Math.random() * 100;
    let selectedType = 'quiz';

    if (confidenceScore < 40) {
      if (rand < 60 && es.length) selectedType = 'explanation';
      else if (rand < 80 && fs.length) selectedType = 'flashcard';
      else if (qs.length) selectedType = 'quiz';
    } else if (confidenceScore > 70) {
      if (rand < 60 && qs.length) selectedType = 'quiz';
      else if (rand < 90 && fs.length) selectedType = 'flashcard';
      else if (es.length) selectedType = 'explanation';
    } else {
      if (rand < 40 && qs.length) selectedType = 'quiz';
      else if (rand < 70 && es.length) selectedType = 'explanation';
      else if (fs.length) selectedType = 'flashcard';
    }

    // Fallback if the selected type has no items
    const availableTypes = [];
    if (qs.length) availableTypes.push('quiz');
    if (fs.length) availableTypes.push('flashcard');
    if (es.length) availableTypes.push('explanation');

    if (!availableTypes.includes(selectedType)) {
      if (availableTypes.length === 0) {
        return res.json({ item: null });
      }
      selectedType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    }

    let selectedItem = null;
    let itemId = '';
    
    if (selectedType === 'quiz') {
      const q = qs[Math.floor(Math.random() * qs.length)];
      selectedItem = q;
      itemId = `q-${q.id}`;
    } else if (selectedType === 'flashcard') {
      const f = fs[Math.floor(Math.random() * fs.length)];
      selectedItem = f;
      itemId = `f-${f.id}`;
    } else {
      const e = es[Math.floor(Math.random() * es.length)];
      selectedItem = e;
      itemId = `e-${e.id}`;
    }

    return res.json({
      item: {
        type: selectedType,
        id: itemId,
        content: selectedItem,
        difficulty: 'medium', // dynamic difficulty could be added
        topic: 'Doomscroll'
      }
    });
  } catch (error) {
    console.error('[Backend] Error generating learning item:', error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/learning/feedback', (req, res) => {
  // Acknowledge receipt. In a fuller version, we could save this to a `user_performance` table
  res.json({ success: true });
});

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
