import Groq from 'groq-sdk';
import { config } from '../../config/env.js';

const groq = config.ai.groqApiKey ? new Groq({ apiKey: config.ai.groqApiKey }) : null;

/**
 * Groq AI Provider (Llama 3.3 70B)
 */
export const groqProvider = {
  name: 'groq',
  model: 'llama-3.3-70b-versatile',

  /**
   * Generate text completion
   * @param {string} systemPrompt
   * @param {string} userPrompt
   * @param {object} options - { temperature, maxTokens, jsonMode }
   * @returns {{ text: string, inputTokens: number, outputTokens: number }}
   */
  async generate(systemPrompt, userPrompt, options = {}) {
    if (!groq) {
      throw new Error('Groq API key not configured');
    }

    const { temperature = 0.7, maxTokens = 8192, jsonMode = false } = options;

    const startTime = Date.now();
    const completion = await groq.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
      ...(jsonMode && { response_format: { type: 'json_object' } }),
    });

    const choice = completion.choices[0];
    const usage = completion.usage || {};

    return {
      text: choice.message.content,
      inputTokens: usage.prompt_tokens || 0,
      outputTokens: usage.completion_tokens || 0,
      latencyMs: Date.now() - startTime,
    };
  },
};
