import * as dotenv from 'dotenv';
import { AgentConfig } from '../../agent/types';

dotenv.config();

export const agentConfig: AgentConfig = {
  model: process.env.OPENAI_MODEL || 'gpt-5-mini',
  temperature: parseFloat(process.env.AGENT_TEMPERATURE || '0'),
  maxTokens: parseInt(process.env.AGENT_MAX_TOKENS || '4000'),
  memoryEnabled: process.env.AGENT_MEMORY_ENABLED === 'true',
  retryEnabled: process.env.AGENT_RETRY_ENABLED === 'true',
  maxRetries: parseInt(process.env.AGENT_MAX_RETRIES || '3'),
};

export const openaiConfig = {
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
};

export const stripeConfig = {
  apiKey: process.env.STRIPE_API_KEY,
  apiVersion: '2025-07-30.basil' as const,
};

export const googleConfig = {
  apiKey: process.env.GOOGLE_API_KEY,
};

export const sessionConfig = {
  maxSessions: parseInt(process.env.MAX_SESSIONS || '1000'),
  sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '3600000'), // 1 hour
  memoryLimit: parseInt(process.env.MEMORY_LIMIT || '50'), // messages
};
