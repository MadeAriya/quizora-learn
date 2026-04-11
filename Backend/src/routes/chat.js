import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { chatQA } from '../services/generation/qa.js';

const router = Router();

/**
 * POST /api/chat
 * Q&A Chat with RAG context
 * Replaces n8n webhook 905ef1d3
 */
router.post('/', authMiddleware, async (req, res) => {
  const { message, user_id, quiz_id, ai_id } = req.body;
  const userId = user_id || req.userId;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }
  if (!quiz_id) {
    return res.status(400).json({ error: 'quiz_id is required' });
  }

  try {
    const result = await chatQA(message, userId, quiz_id, ai_id || '');

    // Return in the same format n8n used (output field)
    return res.json({
      output: result.answer,
      conversationId: result.conversationId,
    });
  } catch (error) {
    console.error('[Chat] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
