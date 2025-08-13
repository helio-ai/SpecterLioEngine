// Core Agent Components
export { AgentEngine, AgentEngineConfig } from './core/agent-engine';
export { ToolManager, ToolManagerConfig } from './core/tool-manager';
export { BaseTool, ToolMetadata, ToolConfig, ToolResult } from './core/base-tool';

// Agent Service
export {
  AgentService,
  AgentServiceConfig,
  ChatRequest,
  ChatResponse,
} from './services/agent-service';

// Tool Classes
export { BooksTool } from './tools/books-tool';
export { CampaignAnalyzerTool } from './tools/campaign-analyzer-tool';

// Tool Factory
export { ToolFactory } from './tools';

// Legacy Tools (for backward compatibility)
export { booksTool } from './tools';
export { availableTools, type AvailableTool } from './tools';

// Types
export type { AgentState, ToolDefinition, AgentConfig, AgentSession } from './types';

// Configuration
export {
  agentConfig,
  openaiConfig,
  stripeConfig,
  googleConfig,
  sessionConfig,
} from '../core/config/agent.config';

// Utilities
// export { agentLogger } from '../shared/utils/agent.logger';
export { sessionManager } from '../shared/utils/session';

// Examples and Tests
export { testAgent } from './test/agent.test';

// Default Agent Service Instance
import { AgentService } from './services/agent-service';

console.log('🚀 [AGENT-INDEX] Creating default agent service instance...');
export const defaultAgentService = new AgentService();
console.log('✅ [AGENT-INDEX] Default agent service instance created successfully');
