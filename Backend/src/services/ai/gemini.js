import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config/env.js';

const genAI = new GoogleGenerativeAI(config.ai.geminiApiKey);

/**
 * Google Gemini AI Provider
 */
export const geminiProvider = {
  name: 'gemini',
  model: 'gemini-2.0-flash',

  /**
   * Generate text completion
   * @param {string} systemPrompt
   * @param {string} userPrompt
   * @param {object} options - { temperature, maxTokens, jsonMode }
   * @returns {{ text: string, inputTokens: number, outputTokens: number }}
   */
  async generate(systemPrompt, userPrompt, options = {}) {
    const { temperature = 0.7, maxTokens = 8192, jsonMode = false } = options;

    const model = genAI.getGenerativeModel({
      model: this.model,
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        ...(jsonMode && { responseMimeType: 'application/json' }),
      },
    });

    const startTime = Date.now();
    const result = await model.generateContent(userPrompt);
    const response = result.response;
    const text = response.text();

    const usage = response.usageMetadata || {};
    return {
      text,
      inputTokens: usage.promptTokenCount || 0,
      outputTokens: usage.candidatesTokenCount || 0,
      latencyMs: Date.now() - startTime,
    };
  },
};
