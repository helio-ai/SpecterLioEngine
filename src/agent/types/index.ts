import { BaseMessage } from '@langchain/core/messages';

export interface AgentState {
  input: string;
  agentOut: string;
  chat_history?: BaseMessage[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  required: string[];
}

export interface AgentConfig {
  model: string;
  temperature: number;
  maxTokens?: number;
  memoryEnabled?: boolean;
  retryEnabled?: boolean;
  maxRetries?: number;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  context?: Record<string, any>;
}

export interface ChatResponse {
  response: string;
  sessionId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface AgentSession {
  id: string;
  createdAt: Date;
  lastActivity: Date;
  memory: BaseMessage[];
  metadata: Record<string, any>;
}
