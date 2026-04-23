import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import { generateSingleQuestion } from '../services/generation/quiz.js';
import { generateFlashcards } from '../services/generation/flashcard.js';
import { generateNotes } from '../services/generation/notes.js';

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

/**
 * POST /api/generate/notes
 * Generate or regenerate notes for a quiz
 */
router.post('/notes', authMiddleware, async (req, res) => {
  const { quiz_id, user_id } = req.body;
  const userId = user_id || req.userId;

  if (!quiz_id) {
    return res.status(400).json({ error: 'quiz_id is required' });
  }

  try {
    // Check if notes already exist
    const { data: existing } = await supabaseAdmin
      .from('notes')
      .select('id')
      .eq('quiz_id', quiz_id)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ error: 'Notes already exist for this quiz' });
    }

    // Fetch transcript
    const { data: transcriptData } = await supabaseAdmin
      .from('transcript')
      .select('transcribe_text')
      .eq('quiz_id', quiz_id)
      .single();

    if (!transcriptData?.transcribe_text) {
      return res.status(400).json({ error: 'No transcript found for this quiz' });
    }

    // Fetch quiz topic
    const { data: quizData } = await supabaseAdmin
      .from('quizez')
      .select('topic')
      .eq('id', quiz_id)
      .single();

    const result = await generateNotes(
      transcriptData.transcribe_text,
      userId,
      quiz_id,
      quizData?.topic || ''
    );

    return res.json({ success: true, html: result.html });
  } catch (error) {
    console.error('[Generate] Notes generation error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
