import { Router } from 'express';
import multer from 'multer';
import { unlink } from 'fs/promises';
import { authMiddleware } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import { extractVideoId, isValidYouTubeUrl, fetchYouTubeTranscript } from '../services/extraction/youtube.js';
import { extractTextFromFile, SUPPORTED_MIME_TYPES } from '../services/extraction/fileExtractor.js';
import { chunkText } from '../services/extraction/chunker.js';
import { storeChunksWithEmbeddings } from '../services/embedding/embedder.js';
import { generateQuiz } from '../services/generation/quiz.js';
import { generateNotes } from '../services/generation/notes.js';

const router = Router();
const upload = multer({ dest: '/tmp/uploads/', limits: { fileSize: 10 * 1024 * 1024 } });

/**
 * POST /api/materials/youtube
 * Full YouTube pipeline: extract transcript → embed → generate quiz + notes
 * Replaces n8n webhook d21b3b4e
 */
router.post('/youtube', authMiddleware, async (req, res) => {
  const { link, user_id } = req.body;
  const userId = user_id || req.userId;

  if (!link || typeof link !== 'string') {
    return res.status(400).json({ error: 'link is required' });
  }
  if (!isValidYouTubeUrl(link)) {
    return res.status(400).json({ error: 'invalid YouTube URL' });
  }

  try {
    const videoId = extractVideoId(link);

    // 1. Extract transcript
    const transcript = await fetchYouTubeTranscript(videoId);

    // 2. Create quiz record
    const { data: quizRow, error: quizError } = await supabaseAdmin
      .from('quizez')
      .insert({
        source: link,
        topic: 'Processing...', // updated after AI generates topic
        user_id: userId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (quizError) throw new Error(`Failed to create quiz: ${quizError.message}`);
    const quizId = quizRow.id;

    // 3. Chunk and embed text for vector search
    const chunks = chunkText(transcript);
    storeChunksWithEmbeddings(chunks, { userId, quizId: String(quizId) })
      .catch(err => console.warn('[Materials] Embedding storage failed:', err.message));

    // 4. Store raw transcript
    await supabaseAdmin.from('transcript').insert({
      user_id: userId,
      quiz_id: quizId,
      transcribe_text: transcript,
      created_at: quizRow.created_at,
    });

    // 5. Generate quiz questions (10 MCQ)
    const quizResult = await generateQuiz(transcript, userId, quizId);

    // 6. Update quiz topic
    await supabaseAdmin
      .from('quizez')
      .update({ topic: quizResult.topic })
      .eq('id', quizId);

    // 7. Generate notes (must await — Vercel kills background tasks after response)
    let notesGenerated = false;
    try {
      await generateNotes(transcript, userId, quizId, quizResult.topic);
      notesGenerated = true;
    } catch (err) {
      console.error('[Materials] Notes generation failed:', err.message);
    }

    return res.json({
      success: true,
      quizId,
      topic: quizResult.topic,
      questionCount: quizResult.questions.length,
      notesGenerated,
    });
  } catch (error) {
    console.error('[Materials] YouTube pipeline error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/materials/upload
 * File upload pipeline: extract text → embed → generate quiz + notes
 * Replaces n8n webhook f3a1f876
 */
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  const userId = req.body.user_id || req.userId;

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  if (!SUPPORTED_MIME_TYPES.includes(req.file.mimetype)) {
    await unlink(req.file.path).catch(() => {});
    return res.status(400).json({
      error: `Unsupported file type: ${req.file.mimetype}. Supported: PDF, DOCX, TXT`,
    });
  }

  try {
    // 1. Extract text from file
    const text = await extractTextFromFile(req.file.path, req.file.mimetype);

    // Clean up temp file
    await unlink(req.file.path).catch(() => {});

    if (!text || text.trim().length < 50) {
      return res.status(400).json({ error: 'Could not extract sufficient text from file' });
    }

    // 2. Create quiz record
    const { data: quizRow, error: quizError } = await supabaseAdmin
      .from('quizez')
      .insert({
        source: 'Document',
        topic: 'Processing...',
        user_id: userId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (quizError) throw new Error(`Failed to create quiz: ${quizError.message}`);
    const quizId = quizRow.id;

    // 3. Chunk and embed text
    const chunks = chunkText(text);
    storeChunksWithEmbeddings(chunks, { userId, quizId: String(quizId) })
      .catch(err => console.warn('[Materials] Embedding storage failed:', err.message));

    // 4. Store as transcript
    await supabaseAdmin.from('transcript').insert({
      user_id: userId,
      quiz_id: quizId,
      transcribe_text: text,
      created_at: quizRow.created_at,
    });

    // 5. Generate quiz
    const quizResult = await generateQuiz(text, userId, quizId);

    // 6. Update topic
    await supabaseAdmin
      .from('quizez')
      .update({ topic: quizResult.topic })
      .eq('id', quizId);

    // 7. Generate notes (must await — Vercel kills background tasks after response)
    let notesGenerated = false;
    try {
      await generateNotes(text, userId, quizId, quizResult.topic);
      notesGenerated = true;
    } catch (err) {
      console.error('[Materials] Notes generation failed:', err.message);
    }

    return res.json({
      success: true,
      quizId,
      topic: quizResult.topic,
      questionCount: quizResult.questions.length,
      notesGenerated,
    });
  } catch (error) {
    console.error('[Materials] Upload pipeline error:', error.message);
    // Clean up on error
    if (req.file) await unlink(req.file.path).catch(() => {});
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/materials/paste
 * Pasted text pipeline
 */
router.post('/paste', authMiddleware, async (req, res) => {
  const { text, user_id } = req.body;
  const userId = user_id || req.userId;

  if (!text || typeof text !== 'string' || text.trim().length < 50) {
    return res.status(400).json({ error: 'Text must be at least 50 characters' });
  }

  try {
    const { data: quizRow, error: quizError } = await supabaseAdmin
      .from('quizez')
      .insert({
        source: 'Paste',
        topic: 'Processing...',
        user_id: userId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (quizError) throw new Error(`Failed to create quiz: ${quizError.message}`);
    const quizId = quizRow.id;

    const chunks = chunkText(text);
    storeChunksWithEmbeddings(chunks, { userId, quizId: String(quizId) })
      .catch(err => console.warn('[Materials] Embedding storage failed:', err.message));

    await supabaseAdmin.from('transcript').insert({
      user_id: userId,
      quiz_id: quizId,
      transcribe_text: text,
      created_at: quizRow.created_at,
    });

    const quizResult = await generateQuiz(text, userId, quizId);

    await supabaseAdmin
      .from('quizez')
      .update({ topic: quizResult.topic })
      .eq('id', quizId);

    // Generate notes (must await — Vercel kills background tasks after response)
    let notesGenerated = false;
    try {
      await generateNotes(text, userId, quizId, quizResult.topic);
      notesGenerated = true;
    } catch (err) {
      console.error('[Materials] Notes generation failed:', err.message);
    }

    return res.json({
      success: true,
      quizId,
      topic: quizResult.topic,
      questionCount: quizResult.questions.length,
      notesGenerated,
    });
  } catch (error) {
    console.error('[Materials] Paste pipeline error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
