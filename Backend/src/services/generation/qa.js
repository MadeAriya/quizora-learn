import { aiRouter } from '../ai/router.js';
import { promptTemplates } from '../prompts/templates.js';
import { searchSimilarChunks } from '../embedding/embedder.js';
import { supabaseAdmin } from '../../config/supabase.js';

/**
 * Q&A Chat with RAG context
 * Replicates n8n Webhook3 → AI Agent7 → Respond → conversation management flow
 *
 * @param {string} message - User's question
 * @param {string} userId
 * @param {string} quizId
 * @param {string} aiId - AI message identifier from frontend
 * @returns {{ answer: string, conversationId: string }}
 */
export async function chatQA(message, userId, quizId, aiId) {
  console.log(`[Chat] Processing Q&A for quiz ${quizId}...`);

  // 1. Search for relevant context via vector search
  let contextChunks = [];
  try {
    contextChunks = await searchSimilarChunks(message, quizId, 5);
  } catch (err) {
    console.warn('[Chat] Vector search failed, proceeding without context:', err.message);
  }

  // 2. Also fetch transcript as additional context
  const { data: transcriptData } = await supabaseAdmin
    .from('transcript')
    .select('transcribe_text')
    .eq('quiz_id', quizId)
    .single();

  const transcriptContext = transcriptData?.transcribe_text || '';

  // Combine contexts
  const context = [
    ...contextChunks,
    ...(transcriptContext ? [transcriptContext.slice(0, 3000)] : []),
  ].join('\n\n---\n\n');

  // 3. Generate AI response
  const systemPrompt = promptTemplates.qa_rag.system(userId, quizId);
  const userPrompt = promptTemplates.qa_rag.user(message, context);

  const result = await aiRouter.generate(
    systemPrompt,
    userPrompt,
    { temperature: 0.5, taskType: 'qa', userId, quizId }
  );

  const answer = result.text;

  // 4. Manage conversation (replicate n8n If → Create conversation / Get row flow)
  let conversationId;

  // Check if conversation exists for this quiz
  const { data: existingConv } = await supabaseAdmin
    .from('conversations')
    .select('id')
    .eq('quiz_id', quizId)
    .eq('user_id', userId)
    .single();

  if (existingConv) {
    conversationId = existingConv.id;
  } else {
    // Create new conversation
    const { data: newConv, error } = await supabaseAdmin
      .from('conversations')
      .insert({
        user_id: userId,
        quiz_id: quizId,
        title: message.slice(0, 100),
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create conversation: ${error.message}`);
    conversationId = newConv.id;
  }

  // 5. Store user message
  await supabaseAdmin.from('messages').insert({
    conversation_id: conversationId,
    role: 'user',
    text: message,
  });

  // 6. Store AI response
  await supabaseAdmin.from('messages').insert({
    conversation_id: conversationId,
    role: 'assistant',
    text: answer,
    ai_id: aiId,
  });

  console.log(`[Chat] Q&A completed for quiz ${quizId}, conversation ${conversationId}`);
  return { answer, conversationId };
}
