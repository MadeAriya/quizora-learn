import { aiRouter } from '../ai/router.js';
import { promptTemplates } from '../prompts/templates.js';
import { parseAIJson, normalizeQuestions, cleanChoices } from '../../utils/jsonParser.js';
import { supabaseAdmin } from '../../config/supabase.js';

/**
 * Generate 10 MCQ quiz questions from text
 * Replicates n8n AI Agent → Code → Create quizez → Create questions flow
 *
 * @param {string} text - Source text (transcript or document)
 * @param {string} userId
 * @param {string} quizId - Existing quiz ID to add questions to
 * @returns {{ topic: string, questions: Array }}
 */
export async function generateQuiz(text, userId, quizId) {
  console.log(`[Quiz] Generating 10 MCQ for quiz ${quizId}...`);

  // Truncate to ~12K chars (~3K tokens) to reduce token usage
  const truncated = text.length > 12000 ? text.slice(0, 12000) + '\n\n[...materi dipotong untuk efisiensi]' : text;

  const result = await aiRouter.generate(
    promptTemplates.quiz_10_mcq.system,
    promptTemplates.quiz_10_mcq.user(truncated),
    { jsonMode: true, temperature: 0.7, taskType: 'quiz', userId, quizId }
  );

  const parsed = parseAIJson(result.text);
  const questions = cleanChoices(normalizeQuestions(parsed));

  // Batch insert questions into database
  for (const q of questions) {
    await supabaseAdmin.from('questions').insert({
      question: q.question,
      choices: q.choices,
      answer: q.answer,
      quiz_id: quizId,
      user_id: userId,
      created_at: new Date().toISOString(),
    });
  }

  console.log(`[Quiz] Inserted ${questions.length} questions for quiz ${quizId}`);
  return { topic: parsed.topic || '', questions };
}

/**
 * Generate 1 additional MCQ question
 * Replicates n8n Webhook4 → AI Agent1 → Code1 → Create a row4 flow
 */
export async function generateSingleQuestion(transcript, userId, quizId) {
  console.log(`[Quiz] Generating 1 additional MCQ for quiz ${quizId}...`);

  const result = await aiRouter.generate(
    promptTemplates.quiz_1_mcq.system,
    promptTemplates.quiz_1_mcq.user(transcript),
    { jsonMode: true, temperature: 0.8, taskType: 'question', userId, quizId }
  );

  const parsed = parseAIJson(result.text);
  const questions = cleanChoices(normalizeQuestions(parsed));

  if (questions.length === 0) {
    throw new Error('AI failed to generate a question');
  }

  const q = questions[0];
  const { data, error } = await supabaseAdmin.from('questions').insert({
    question: q.question,
    choices: q.choices,
    answer: q.answer,
    quiz_id: quizId,
    user_id: userId,
    created_at: new Date().toISOString(),
  }).select().single();

  if (error) throw new Error(`Failed to insert question: ${error.message}`);

  console.log(`[Quiz] Inserted 1 question for quiz ${quizId}`);
  return data;
}
