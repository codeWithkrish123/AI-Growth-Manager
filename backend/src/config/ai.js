import Anthropic from '@anthropic-ai/sdk';
import { config } from './index.js';

export const anthropic = new Anthropic({
  apiKey: config.ai.anthropicKey,
});