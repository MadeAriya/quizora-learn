import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';

const router = Router();

/**
 * Extract chunks from HTML for Doomscroll Explanation Cards
 * Preserved from original Backend/index.js
 */
function extractChunksFromHtml(html) {
  if (!html) return [];
  const matches = html.match(/<(p|h[1-6]|ul|ol|blockquote|table|figure)[^>]*>[\s\S]*?<\/\1>/gi);
  if (matches && matches.length > 0) {
    return matches.map((m, i) => ({ id: `chunk-${i}`, html: m }));
  }
  return [{ id: 'chunk-0', html }];
}

/**
 * POST /api/learning/generate
 * Doomscroll learning feed — preserved from original backend
 */
router.post('/generate', async (req, res) => {
  const { user_id, quiz_id, confidenceScore = 50, seenIds = [] } = req.body;

  if (!quiz_id || typeof quiz_id !== 'string') {
    return res.status(400).json({ error: 'quiz_id is required and must be a string' });
  }
  if (!Array.isArray(seenIds)) {
    return res.status(400).json({ error: 'seenIds must be an array' });
  }

  try {
    const [{ data: questions }, { data: flashcards }, { data: notesData }] = await Promise.all([
      supabaseAdmin.from('questions').select('*').eq('quiz_id', quiz_id),
      supabaseAdmin.from('flashcard').select('*').eq('quiz_id', quiz_id),
      supabaseAdmin.from('notes').select('*').eq('quiz_id', quiz_id).maybeSingle(),
    ]);

    const explanations = notesData ? extractChunksFromHtml(notesData.html) : [];

    const unseenQuestions = (questions || []).filter(q => !seenIds.includes(`q-${q.id}`));
    const unseenFlashcards = (flashcards || []).filter(f => !seenIds.includes(`f-${f.id}`));
    const unseenExplanations = explanations.filter(e => !seenIds.includes(`e-${e.id}`));

    const qs = unseenQuestions.length ? unseenQuestions : (questions || []);
    const fs = unseenFlashcards.length ? unseenFlashcards : (flashcards || []);
    const es = unseenExplanations.length ? unseenExplanations : explanations;

    // Adaptive probability based on confidenceScore
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

    const availableTypes = [];
    if (qs.length) availableTypes.push('quiz');
    if (fs.length) availableTypes.push('flashcard');
    if (es.length) availableTypes.push('explanation');

    if (!availableTypes.includes(selectedType)) {
      if (availableTypes.length === 0) return res.json({ item: null });
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
        difficulty: 'medium',
        topic: 'Doomscroll',
      },
    });
  } catch (error) {
    console.error('[Learning] Error:', error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /api/learning/feedback
 */
router.post('/feedback', (req, res) => {
  const { item_id, performanceDelta } = req.body;
  if (!item_id || typeof item_id !== 'string') {
    return res.status(400).json({ error: 'item_id is required' });
  }
  res.json({ success: true });
});

export default router;
