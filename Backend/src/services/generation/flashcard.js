import { aiRouter } from '../ai/router.js';
import { promptTemplates } from '../prompts/templates.js';
import { parseAIJson, normalizeQuestions } from '../../utils/jsonParser.js';
import { supabaseAdmin } from '../../config/supabase.js';

/**
 * Generate flashcards (essay Q&A) from transcript
 * Replicates n8n Webhook2 → AI Agent3 → Code7 → Create flashcard rows flow
 *
 * @param {string} transcript - Source transcript text
 * @param {string} userId
 * @param {string} quizId
 * @returns {{ topic: string, flashcards: Array }}
 */
export async function generateFlashcards(transcript, userId, quizId) {
  console.log(`[Flashcard] Generating flashcards for quiz ${quizId}...`);

  // Truncate to ~12K chars (~3K tokens) to reduce token usage
  const truncated = transcript.length > 12000 ? transcript.slice(0, 12000) + '\n\n[...materi dipotong untuk efisiensi]' : transcript;

  const result = await aiRouter.generate(
    promptTemplates.flashcard_essay.system,
    promptTemplates.flashcard_essay.user(truncated),
    { jsonMode: true, temperature: 0.7, taskType: 'flashcard', userId, quizId }
  );

  const parsed = parseAIJson(result.text);
  const questions = normalizeQuestions(parsed);
  const topic = parsed.topic || '';
  const createdAt = new Date().toISOString();

  // Batch insert flashcards
  for (const q of questions) {
    await supabaseAdmin.from('flashcard').insert({
      user_id: userId,
      quiz_id: quizId,
      topic,
      question: q.question,
      answer: q.answer,
      created_at: createdAt,
    });
  }

  console.log(`[Flashcard] Inserted ${questions.length} flashcards for quiz ${quizId}`);
  return { topic, flashcards: questions };
}
