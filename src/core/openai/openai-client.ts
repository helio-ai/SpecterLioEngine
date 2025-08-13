import OpenAI from 'openai';
import { openaiConfig, agentConfig } from '../config/agent.config';
import { logger } from '../../shared/utils/logger';

export type ReasoningEffort = 'low' | 'medium' | 'high' | 'minimal';

export interface OpenAIClientConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  reasoningEffort?: ReasoningEffort;
  timeoutMs?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
}

export type OpenAIToolDef = {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters: Record<string, any>;
  };
};

export class OpenAIClient {
  private client: OpenAI;
  private defaultModel: string;
  // private temperature: number;
  private maxTokens?: number;
  private reasoningEffort?: ReasoningEffort;
  private timeoutMs: number;

  constructor(config?: OpenAIClientConfig) {
    logger.info('OpenAIClient: init start');
    if (!openaiConfig.apiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    this.client = new OpenAI({
      apiKey: openaiConfig.apiKey,
      organization: openaiConfig.organization,
    });
    this.defaultModel = config?.model || agentConfig.model || 'gpt-5-mini';
    // this.temperature = config?.temperature ?? agentConfig.temperature ?? 0;
    this.maxTokens = config?.maxTokens ?? agentConfig.maxTokens;
    this.reasoningEffort = config?.reasoningEffort;
    this.timeoutMs = config?.timeoutMs ?? 30000;
    logger.info('OpenAIClient: init end');
  }

  async chat(messages: ChatMessage[], overrides?: Partial<OpenAIClientConfig>): Promise<string> {
    logger.info('OpenAIClient.chat: start');
    const model = overrides?.model || this.defaultModel;
    // const temperature = overrides?.temperature ?? this.temperature;
    const maxTokens = overrides?.maxTokens ?? this.maxTokens;
    const reasoningEffort = overrides?.reasoningEffort ?? this.reasoningEffort;
    const callTimeout = overrides?.timeoutMs ?? this.timeoutMs;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), callTimeout);
    let response;
    try {
      response = await this.client.chat.completions.create(
        {
          model,
          // temperature,
          // Newer models (e.g., gpt-5, gpt-4o) expect max_completion_tokens
          max_completion_tokens: maxTokens,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          reasoning_effort: reasoningEffort,
          // 'reasoning' is not supported on this SDK/version; omit it
        } as any,
        { signal: controller.signal },
      );
    } finally {
      clearTimeout(timeoutId);
    }

    const content = response.choices?.[0]?.message?.content || '';
    logger.info('OpenAIClient.chat: end');
    return content;
  }

  async chatWithTools(
    messages: ChatMessage[],
    tools: OpenAIToolDef[],
    options?: Partial<OpenAIClientConfig> & {
      tool_choice?: 'auto' | { type: 'function'; function: { name: string } };
    },
  ): Promise<any> {
    logger.info('OpenAIClient.chatWithTools: start');
    const model = options?.model || this.defaultModel;
    const maxTokens = options?.maxTokens ?? this.maxTokens;
    const reasoningEffort = options?.reasoningEffort ?? this.reasoningEffort;
    const callTimeout = options?.timeoutMs ?? this.timeoutMs;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), callTimeout);
    try {
      const resp = await this.client.chat.completions.create(
        {
          model,
          max_completion_tokens: maxTokens,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          tools: tools as any,
          tool_choice: options?.tool_choice || 'auto',
          reasoning_effort: reasoningEffort,
          // omit unsupported 'reasoning'
        } as any,
        { signal: controller.signal },
      );
      logger.info('OpenAIClient.chatWithTools: end');
      return resp;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Raw variant that accepts fully-typed OpenAI message payloads (including tool_call ids)
  async chatWithToolsRaw(
    messages: any[],
    tools: OpenAIToolDef[],
    options?: Partial<OpenAIClientConfig> & {
      tool_choice?: 'auto' | { type: 'function'; function: { name: string } };
    },
  ): Promise<any> {
    logger.info('OpenAIClient.chatWithToolsRaw: start');
    const model = options?.model || this.defaultModel;
    const maxTokens = options?.maxTokens ?? this.maxTokens;
    const reasoningEffort = options?.reasoningEffort ?? this.reasoningEffort;
    const callTimeout = options?.timeoutMs ?? this.timeoutMs;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), callTimeout);
    try {
      const resp = await this.client.chat.completions.create(
        {
          model,
          max_completion_tokens: maxTokens,
          messages,
          tools: tools as any,
          tool_choice: options?.tool_choice || 'auto',
          reasoning_effort: reasoningEffort,
          // omit unsupported 'reasoning'
        } as any,
        { signal: controller.signal },
      );
      logger.info('OpenAIClient.chatWithToolsRaw: end');
      return resp;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
