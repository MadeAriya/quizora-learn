import { aiRouter } from '../ai/router.js';
import { promptTemplates } from '../prompts/templates.js';
import { supabaseAdmin } from '../../config/supabase.js';

/**
 * Generate HTML notes from text
 * Replicates n8n AI Agent4/5 → Create notes row flow
 *
 * @param {string} text - Source text (transcript or document)
 * @param {string} userId
 * @param {string} quizId
 * @param {string} topic - Optional topic name
 * @returns {{ html: string }}
 */
export async function generateNotes(text, userId, quizId, topic = '') {
  console.log(`[Notes] Generating HTML notes for quiz ${quizId}...`);

  const result = await aiRouter.generate(
    promptTemplates.notes_html.system,
    promptTemplates.notes_html.user(text, topic),
    { temperature: 0.6, taskType: 'notes', userId, quizId }
  );

  const html = result.text;

  // Store in notes table
  const { error } = await supabaseAdmin.from('notes').insert({
    html,
    user_id: userId,
    quiz_id: quizId,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.warn(`[Notes] Failed to store notes: ${error.message}`);
  }

  console.log(`[Notes] Notes generated and stored for quiz ${quizId}`);
  return { html };
}
