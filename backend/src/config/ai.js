import OpenAI from 'openai';
import { config } from './index.js';

export const openai = new OpenAI({
  apiKey: config.ai.openaiKey,
});

// Keep anthropic export for backward compatibility
export const anthropic = {
  messages: {
    create: async (params) => {
      // Convert Anthropic format to OpenAI format
      const openaiParams = {
        model: config.ai.model,
        messages: [
          { role: 'system', content: params.system },
          { role: 'user', content: params.messages[0].content }
        ],
        max_tokens: params.max_tokens || 2048,
      };
      
      const response = await openai.chat.completions.create(openaiParams);
      
      // Convert OpenAI response back to Anthropic format
      return {
        content: [{
          text: response.choices[0].message.content
        }],
        usage: {
          prompt_tokens: response.usage.prompt_tokens,
          completion_tokens: response.usage.completion_tokens,
          total_tokens: response.usage.total_tokens
        }
      };
    }
  }
};