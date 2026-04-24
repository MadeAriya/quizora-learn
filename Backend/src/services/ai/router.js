import { geminiProvider } from './gemini.js';
import { groqProvider } from './groq.js';
import { sambanovaProvider } from './sambanova.js';
import { config } from '../../config/env.js';
import { supabaseAdmin } from '../../config/supabase.js';

const providers = {
  gemini: geminiProvider,
  groq: groqProvider,
  sambanova: sambanovaProvider,
};

/**
 * AI Router — handles provider selection, fallback, and retry
 */
export const aiRouter = {
  /**
   * Generate AI response with automatic fallback
   * @param {string} systemPrompt
   * @param {string} userPrompt
   * @param {object} options - { temperature, maxTokens, jsonMode, taskType, userId, quizId }
   * @returns {{ text: string, provider: string, model: string, inputTokens: number, outputTokens: number, latencyMs: number }}
   */
  async generate(systemPrompt, userPrompt, options = {}) {
    const { taskType = 'unknown', userId = null, quizId = null, retries = 1, ...aiOptions } = options;

    const primaryName = config.ai.primaryProvider;
    const fallbackName = config.ai.fallbackProvider;

    const primary = providers[primaryName];
    const fallback = providers[fallbackName];

    // Try primary provider
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await primary.generate(systemPrompt, userPrompt, aiOptions);
        await this._logGeneration(userId, quizId, taskType, primary.name, primary.model, result, 'success');
        return { ...result, provider: primary.name, model: primary.model };
      } catch (err) {
        console.warn(`[AI Router] ${primary.name} attempt ${attempt + 1} failed:`, err.message);
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }

    // Try fallback provider
    if (fallback) {
      try {
        console.log(`[AI Router] Falling back to ${fallback.name}...`);
        const result = await fallback.generate(systemPrompt, userPrompt, aiOptions);
        await this._logGeneration(userId, quizId, taskType, fallback.name, fallback.model, result, 'success');
        return { ...result, provider: fallback.name, model: fallback.model };
      } catch (err) {
        console.error(`[AI Router] Fallback ${fallback.name} also failed:`, err.message);
        await this._logGeneration(userId, quizId, taskType, fallback.name, fallback.model, {}, 'error', err.message);
      }
    }

    throw new Error('All AI providers failed. Please try again later.');
  },

  /**
   * Log generation to history table
   */
  async _logGeneration(userId, quizId, type, provider, model, result, status, errorMessage = null) {
    try {
      await supabaseAdmin.from('generation_history').insert({
        user_id: userId,
        quiz_id: quizId,
        type,
        provider,
        model,
        input_tokens: result.inputTokens || 0,
        output_tokens: result.outputTokens || 0,
        latency_ms: result.latencyMs || 0,
        status,
        error_message: errorMessage,
      });
    } catch (err) {
      // Non-critical — don't fail the request if logging fails
      console.warn('[AI Router] Failed to log generation:', err.message);
    }
  },
};
