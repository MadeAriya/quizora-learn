import { config } from '../../config/env.js';

const BASE_URL = 'https://api.sambanova.ai/v1';

/**
 * SambaNova AI Provider (OpenAI-compatible)
 * Uses Llama 3.3 70B via SambaNova Cloud
 */
export const sambanovaProvider = {
  name: 'sambanova',
  model: 'Meta-Llama-3.3-70B-Instruct',

  /**
   * Generate text completion
   * @param {string} systemPrompt
   * @param {string} userPrompt
   * @param {object} options - { temperature, maxTokens, jsonMode }
   * @returns {{ text: string, inputTokens: number, outputTokens: number, latencyMs: number }}
   */
  async generate(systemPrompt, userPrompt, options = {}) {
    const apiKey = config.ai.sambanovaApiKey;
    if (!apiKey) {
      throw new Error('SambaNova API key not configured');
    }

    const { temperature = 0.7, maxTokens = 8192, jsonMode = false } = options;

    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
      ...(jsonMode && { response_format: { type: 'json_object' } }),
    };

    const startTime = Date.now();

    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`SambaNova API error ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    const usage = data.usage || {};

    if (!choice?.message?.content) {
      throw new Error('SambaNova returned empty response');
    }

    return {
      text: choice.message.content,
      inputTokens: usage.prompt_tokens || 0,
      outputTokens: usage.completion_tokens || 0,
      latencyMs: Date.now() - startTime,
    };
  },
};
