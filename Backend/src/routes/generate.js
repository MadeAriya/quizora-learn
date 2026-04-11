import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import { generateSingleQuestion } from '../services/generation/quiz.js';
import { generateFlashcards } from '../services/generation/flashcard.js';

const router = Router();

/**
 * POST /api/generate/question
 * Generate 1 additional quiz question
 * Replaces n8n webhook 661ad6c1
 */
router.post('/question', authMiddleware, async (req, res) => {
  const { transcript, user_id, quiz_id } = req.body;
  const userId = user_id || req.userId;

  if (!transcript || typeof transcript !== 'string') {
    return res.status(400).json({ error: 'transcript is required' });
  }
  if (!quiz_id) {
    return res.status(400).json({ error: 'quiz_id is required' });
  }

  try {
    const question = await generateSingleQuestion(transcript, userId, quiz_id);
    return res.json(question);
  } catch (error) {
    console.error('[Generate] Question generation error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/generate/flashcards
 * Generate flashcards from transcript
 * Replaces n8n webhook a3de8bc7
 */
router.post('/flashcards', authMiddleware, async (req, res) => {
  const { transcript, user_id, quiz_id, source } = req.body;
  const userId = user_id || req.userId;

  if (!quiz_id) {
    return res.status(400).json({ error: 'quiz_id is required' });
  }

  try {
    // If no transcript provided, fetch from database
    let text = transcript;
    if (!text) {
      const { data } = await supabaseAdmin
        .from('transcript')
        .select('transcribe_text')
        .eq('quiz_id', quiz_id)
        .single();

      text = data?.transcribe_text;
    }

    if (!text) {
      return res.status(400).json({ error: 'No transcript found for this quiz' });
    }

    const result = await generateFlashcards(text, userId, quiz_id);
    return res.json(result);
  } catch (error) {
    console.error('[Generate] Flashcard generation error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
