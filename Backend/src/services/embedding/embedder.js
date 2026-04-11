import { HfInference } from '@huggingface/inference';
import { config } from '../../config/env.js';
import { supabaseAdmin } from '../../config/supabase.js';

const hf = config.ai.huggingfaceApiKey
  ? new HfInference(config.ai.huggingfaceApiKey)
  : null;

const EMBEDDING_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';
const EMBEDDING_DIM = 384;

/**
 * Generate embedding vector for text
 * @param {string} text
 * @returns {number[]} embedding vector (384 dims)
 */
export async function generateEmbedding(text) {
  if (!hf) {
    throw new Error('HuggingFace API key not configured');
  }

  const result = await hf.featureExtraction({
    model: EMBEDDING_MODEL,
    inputs: text,
  });

  // HF returns nested array for single input
  return Array.isArray(result[0]) ? result[0] : result;
}

/**
 * Store document chunks with embeddings in Supabase
 * Matches the existing `documents` table schema used by n8n
 * @param {Array<{content: string, index: number}>} chunks
 * @param {{ userId: string, quizId: string }} metadata
 */
export async function storeChunksWithEmbeddings(chunks, metadata) {
  console.log(`[Embedding] Storing ${chunks.length} chunks for quiz ${metadata.quizId}...`);

  for (const chunk of chunks) {
    try {
      const embedding = await generateEmbedding(chunk.content);

      await supabaseAdmin.from('documents').insert({
        content: chunk.content,
        embedding,
        metadata: {
          chunk_index: chunk.index,
          user_id: metadata.userId,
          quiz_id: metadata.quizId,
        },
        user_id: metadata.userId,
        quiz_id: metadata.quizId,
      });
    } catch (err) {
      console.warn(`[Embedding] Failed to store chunk ${chunk.index}:`, err.message);
    }
  }

  console.log(`[Embedding] Done storing chunks for quiz ${metadata.quizId}`);
}

/**
 * Search for similar chunks using vector similarity
 * @param {string} query - User's question
 * @param {string} quizId - Quiz/material ID to scope the search
 * @param {number} limit - Max results
 * @returns {string[]} Array of relevant text chunks
 */
export async function searchSimilarChunks(query, quizId, limit = 5) {
  try {
    const queryEmbedding = await generateEmbedding(query);

    const { data, error } = await supabaseAdmin.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_count: limit,
      filter_quiz_id: quizId,
    });

    if (error) {
      console.warn('[Embedding] Vector search RPC failed, falling back to text search:', error.message);
      return await fallbackTextSearch(quizId);
    }

    return (data || []).map(d => d.content);
  } catch (err) {
    console.warn('[Embedding] Search failed, using fallback:', err.message);
    return await fallbackTextSearch(quizId);
  }
}

/**
 * Fallback: just fetch all documents for a quiz
 */
async function fallbackTextSearch(quizId) {
  const { data } = await supabaseAdmin
    .from('documents')
    .select('content')
    .eq('quiz_id', quizId)
    .limit(5);

  return (data || []).map(d => d.content);
}
