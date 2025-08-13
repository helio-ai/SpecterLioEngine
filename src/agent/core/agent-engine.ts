import { AgentExecutor } from 'langchain/agents';
import { StateGraph, Annotation } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';
import { agentConfig } from '../../core/config/agent.config';
import { sessionStore } from '../../core/session/session-store';
import { OpenAIClient } from '../../core/openai/openai-client';
// import { agentLogger } from '../../shared/utils/agent.logger';
import { ToolManager } from './tool-manager';

export interface AgentEngineConfig {
  model: string;
  temperature: number;
  maxTokens?: number;
  memoryEnabled: boolean;
  maxMemorySize: number;
  retryEnabled: boolean;
  maxRetries: number;
  retryDelay: number;
  timeout: number;
  enableMonitoring: boolean;
  enableMetrics: boolean;
  sessionTimeout: number;
}

export interface AgentSession {
  id: string;
  createdAt: Date;
  lastActivity: Date;
  memory: BaseMessage[];
  metadata: Record<string, any>;
  stats: {
    messageCount: number;
    toolUsage: Record<string, number>;
    averageResponseTime: number;
    errorCount: number;
  };
}

export interface AgentMetrics {
  totalSessions: number;
  activeSessions: number;
  totalMessages: number;
  averageResponseTime: number;
  toolUsage: Record<string, number>;
  errorRate: number;
  memoryUsage: number;
}

export class AgentEngine {
  private llm!: OpenAIClient;
  private toolManager: ToolManager;
  private sessions: Map<string, AgentSession> = new Map();
  private config: AgentEngineConfig;
  private agent!: any;
  private executor!: AgentExecutor;
  private graph!: any;
  private metrics: {
    totalMessages: number;
    totalErrors: number;
    totalResponseTime: number;
    toolUsage: Record<string, number>;
  } = {
    totalMessages: 0,
    totalErrors: 0,
    totalResponseTime: 0,
    toolUsage: {},
  };

  constructor(toolManager: ToolManager, config?: Partial<AgentEngineConfig>) {
    this.toolManager = toolManager;
    this.config = {
      model: agentConfig.model,
      temperature: agentConfig.temperature,
      maxTokens: agentConfig.maxTokens,
      memoryEnabled: true,
      maxMemorySize: 100,
      retryEnabled: true,
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 30000,
      enableMonitoring: true,
      enableMetrics: true,
      sessionTimeout: 3600000, // 1 hour
      ...config,
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      console.log('🚀 [AGENT-ENGINE] Starting initialization...');

      await this.initializeLLM();
      await this.initializeAgent();
      await this.initializeGraph();

      // Start session cleanup
      this.startSessionCleanup();

      console.log('✅ [AGENT-ENGINE] Initialization complete!');
    } catch (error: any) {
      console.log('❌ [AGENT-ENGINE] Initialization failed:', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  private async initializeLLM(): Promise<void> {
    console.log('🤖 [AGENT-ENGINE] Initializing LLM with config:', {
      model: this.config.model,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
      timeout: this.config.timeout,
    });

    this.llm = new OpenAIClient({
      model: this.config.model,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
      timeoutMs: this.config.timeout,
    });
    console.log('✅ [AGENT-ENGINE] LLM initialized successfully');
  }

  private async initializeAgent(): Promise<void> {
    console.log('🤖 [AGENT-ENGINE] Creating agent...');

    const tools = this.toolManager.getEnabledTools().map((tool) => tool.getTool());

    console.log('🔧 [AGENT-ENGINE] Available tools:', {
      count: tools.length,
      toolNames: tools.map((tool) => tool.name || 'unnamed'),
    });

    // Reserved for future prompt customization (unused currently)

    // LangChain tool-calling executor disabled; routing handled separately
    this.agent = null as any;
    this.executor = null as any;

    console.log('✅ [AGENT-ENGINE] Agent initialized successfully:', {
      toolCount: tools.length,
    });
  }

  private async initializeGraph(): Promise<void> {
    console.log('📊 [AGENT-ENGINE] Initializing execution graph...');

    const GraphState = Annotation.Root({
      input: Annotation<string>(),
      agentOut: Annotation<string>(),
      chat_history: Annotation<BaseMessage[]>(),
      sessionId: Annotation<string>(),
    });

    this.graph = new StateGraph(GraphState)
      .addNode('validateInput', (state: any) => {
        console.log('🔍 [AGENT-ENGINE] Validating input:', {
          input: state.input?.substring(0, 100) + (state.input?.length > 100 ? '...' : ''),
          sessionId: state.sessionId,
        });
        return { input: state.input, sessionId: state.sessionId };
      })
      .addNode('callAgent', async (state: any) => {
        console.log('🤖 [AGENT-ENGINE] Calling LLM...');
        const startTime = Date.now();

        try {
          let output = '';

          // Build OpenAI tool list from registered tools
          const enabledTools = this.toolManager.getEnabledTools();
          const toolDefs = enabledTools.map((t) => t.getOpenAIFunctionSpec());
          const sessionMeta = this.sessions.get(state.sessionId)?.metadata || {};

          // Build short chat history for model awareness
          const rawHistory = await sessionStore.getHistory(state.sessionId);
          const maxHistory = 12;
          const historySlice = rawHistory.slice(-maxHistory);
          const historyMessages = historySlice.map((m: any) => ({
            role: m.role,
            content: m.content,
          }));

          const messages: any[] = [
            {
              role: 'system',
              content: [
                "You are Lio, HelioAI's assistant for campaign analytics and campaign creation.",
                'Policies:',
                "- Prefer calling tools when data is needed. Use 'analyzeCampaigns' for metrics, failures, template usage, message analytics, and attribution.",
                '- Always use the provided session context (especially widgetId) and do not ask for it again if present.',
                '- Never reveal or display internal identifiers (e.g., widgetId).',
                '- Avoid repeating clarifying questions; ask at most once, and only for critical missing info.',
                "- Minimize tool calls: reuse prior results in this session when the request doesn't change timeRange or flags.",
                '- Default timeRange: 14d unless the user specifies (e.g., 7d).',
                'Capabilities:',
                '- Campaign analysis: compute deliverability, engagement, error-code insights (e.g., 131049, 131026, 131048, etc.), root causes, and actionable optimizations.',
                '- Attribution: summarize orders, revenue, AOV; highlight top campaigns.',
                '- Campaign creator: suggest high-quality templates (reuse variables from historical templates), and propose optimal send times based on past performance.',
                "Output style: concise, in the user's language, with clear bullets and sections (Summary, Problems, Root causes, Optimizations, Attribution, Recommendations, Suggested templates, Send windows).",
              ].join('\n'),
            },
            {
              role: 'system',
              content: `Session context: ${JSON.stringify(sessionMeta).slice(0, 1500)}`,
            },
            ...historyMessages,
            { role: 'user', content: state.input },
          ];

          // One-shot tool-calling; follow the tool call if present
          const resp = await this.llm.chatWithToolsRaw(messages, toolDefs, {
            model: this.config.model || 'gpt-5-mini',
            maxTokens: this.config.maxTokens,
            reasoningEffort: 'minimal',
            tool_choice: 'auto',
            timeoutMs: this.config.timeout,
          });

          const msg = resp.choices?.[0]?.message;
          const toolCalls = msg?.tool_calls || [];

          if (toolCalls.length === 0) {
            output = msg?.content || '';
          } else {
            // Execute tool(s) sequentially and return final model answer
            // IMPORTANT: include the assistant message that contains tool_calls before tool responses
            if (msg) {
              messages.push(msg);
            }
            for (const call of toolCalls) {
              const toolName = call.function?.name;
              const argsStr = call.function?.arguments || '{}';
              const tool = this.toolManager.getTool(toolName);
              if (!tool) {
                messages.push({
                  role: 'tool',
                  tool_call_id: call.id,
                  content: `{"error":"Tool '${toolName}' not found"}`,
                });
                continue;
              }
              let parsedArgs: any = {};
              try {
                parsedArgs = JSON.parse(argsStr);
              } catch {}
              // Always pass frontend-provided context
              parsedArgs.context = {
                ...(parsedArgs.context || {}),
                ...sessionMeta,
              };
              // For campaign analysis, enforce widgetId from frontend context
              if (toolName === 'analyzeCampaigns' && sessionMeta?.widgetId) {
                parsedArgs.widgetId = sessionMeta.widgetId;
              }
              const result = await tool.execute(parsedArgs);
              const toolContent = JSON.stringify(
                result.success ? result.data : { error: result.error },
              );
              messages.push({
                role: 'tool',
                tool_call_id: call.id,
                content: toolContent,
              });
              // Opportunistically cache last analysis key for follow-ups
              if (toolName === 'analyzeCampaigns' && result.success && result.data) {
                const widgetIdUsed = (result.data as any).widgetId || sessionMeta.widgetId;
                const lastKey = (tool as any).generateCacheKey?.({
                  widgetId: widgetIdUsed,
                  timeRange: (result.data as any).timeRange || '14d',
                  includeFailed: true,
                  includeMessages: true,
                  includeAttribution: true,
                });
                const sidSession = this.sessions.get(state.sessionId);
                if (sidSession && lastKey) {
                  sidSession.metadata.lastAnalysisKey = lastKey;
                  sidSession.metadata.lastAnalysisWidgetId = widgetIdUsed;
                  sidSession.metadata.lastAnalysisTimeRange =
                    (result.data as any).timeRange || '14d';
                }
              }
            }

            // Ask model to produce final answer from tool outputs without allowing further tool calls
            const finalResp = await this.llm.chatWithToolsRaw(messages, [], {
              model: this.config.model || 'gpt-5-mini',
              maxTokens: this.config.maxTokens,
              reasoningEffort: 'low',
              tool_choice: 'none' as any,
              timeoutMs: this.config.timeout,
            });
            output = finalResp.choices?.[0]?.message?.content || '';
          }

          // Redact sensitive identifiers like widgetId from model output
          output = this.redactSensitiveIdentifiers(output, sessionMeta);

          const responseTime = Date.now() - startTime;
          this.updateMetrics(responseTime, []);

          console.log('✅ [AGENT-ENGINE] Agent execution complete:', {
            responseLength: output.length,
            responseTime: `${responseTime}ms`,
            intermediateSteps: 0,
          });

          return {
            agentOut: output,
            sessionId: state.sessionId,
          };
        } catch (error: any) {
          console.log('❌ [AGENT-ENGINE] Agent execution failed:', {
            error: error.message,
            stack: error.stack,
          });
          throw error;
        }
      })
      .addNode('return', (state: any) => {
        console.log('📤 [AGENT-ENGINE] Returning response');
        return {
          agentOut: state.agentOut,
          sessionId: state.sessionId,
        };
      })
      .addEdge('__start__', 'validateInput')
      .addEdge('validateInput', 'callAgent')
      .addEdge('callAgent', 'return')
      .addEdge('return', '__end__')
      .compile();

    console.log('✅ [AGENT-ENGINE] Execution graph initialized successfully');
  }

  public async processMessage(
    input: string,
    sessionId?: string,
    context?: Record<string, any>,
  ): Promise<{
    response: string;
    sessionId: string;
    metadata: Record<string, any>;
  }> {
    const sessionId_ = sessionId || this.generateSessionId();
    const startTime = Date.now();

    try {
      console.log('🔄 [AGENT-ENGINE] Processing message:', {
        sessionId: sessionId_,
        inputLength: input.length,
        input: input.substring(0, 100) + (input.length > 100 ? '...' : ''),
      });

      // Update session with context
      this.updateSession(sessionId_, input, context);

      // Process through graph
      console.log('📊 [AGENT-ENGINE] Invoking execution graph...');
      const result = await this.graph.invoke({
        input,
        sessionId: sessionId_,
      });

      const response = result.agentOut as string;
      const responseTime = Date.now() - startTime;

      // Update session with response
      this.updateSessionStats(sessionId_, responseTime, response);

      console.log('✅ [AGENT-ENGINE] Message processed successfully:', {
        sessionId: sessionId_,
        responseTime: `${responseTime}ms`,
        responseLength: response.length,
        response: response.substring(0, 100) + (response.length > 100 ? '...' : ''),
      });

      return {
        response,
        sessionId: sessionId_,
        metadata: {
          responseTime,
          toolsUsed: [],
          memorySize: (await sessionStore.getHistory(sessionId_)).length,
        },
      };
    } catch (error: any) {
      this.metrics.totalErrors++;
      console.log('❌ [AGENT-ENGINE] Error processing message:', {
        sessionId: sessionId_,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  public async processWithRetry(
    input: string,
    sessionId?: string,
    maxRetries?: number,
  ): Promise<{
    response: string;
    sessionId: string;
    metadata: Record<string, any>;
  }> {
    const retries = maxRetries || this.config.maxRetries;
    let lastError: Error;

    console.log('🔄 [AGENT-ENGINE] Processing with retry:', {
      maxRetries: retries,
      sessionId,
    });

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log('🔄 [AGENT-ENGINE] Attempt', {
          attempt,
          maxRetries: retries,
        });
        return await this.processMessage(input, sessionId);
      } catch (error: any) {
        lastError = error as Error;
        console.log('⚠️ [AGENT-ENGINE] Attempt failed:', {
          error: error.message,
          sessionId,
          attempt,
        });

        if (attempt < retries) {
          const delay = this.config.retryDelay * attempt;
          console.log('⏳ [AGENT-ENGINE] Waiting before retry:', {
            delay: `${delay}ms`,
          });
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    console.log('❌ [AGENT-ENGINE] All retry attempts failed');
    throw lastError!;
  }

  public getSession(sessionId: string): AgentSession | undefined {
    console.log('🔍 [AGENT-ENGINE] Getting session:', sessionId);
    return this.sessions.get(sessionId);
  }

  public getAllSessions(): AgentSession[] {
    console.log('📋 [AGENT-ENGINE] Getting all sessions, count:', this.sessions.size);
    return Array.from(this.sessions.values());
  }

  public clearSession(sessionId: string): boolean {
    console.log('🗑️ [AGENT-ENGINE] Clearing session:', sessionId);
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.delete(sessionId);
      console.log('✅ [AGENT-ENGINE] Session cleared successfully:', sessionId);
      return true;
    }
    console.log('❌ [AGENT-ENGINE] Session not found for clearing:', sessionId);
    return false;
  }

  public getMetrics(): AgentMetrics {
    console.log('📊 [AGENT-ENGINE] Getting metrics...');

    const activeSessions = Array.from(this.sessions.values()).filter(
      (session) => Date.now() - session.lastActivity.getTime() < this.config.sessionTimeout,
    );

    const metrics = {
      totalSessions: this.sessions.size,
      activeSessions: activeSessions.length,
      totalMessages: this.metrics.totalMessages,
      averageResponseTime:
        this.metrics.totalMessages > 0
          ? this.metrics.totalResponseTime / this.metrics.totalMessages
          : 0,
      toolUsage: { ...this.metrics.toolUsage },
      errorRate:
        this.metrics.totalMessages > 0 ? this.metrics.totalErrors / this.metrics.totalMessages : 0,
      memoryUsage: this.sessions.size,
    };

    console.log('📊 [AGENT-ENGINE] Metrics retrieved:', {
      totalSessions: metrics.totalSessions,
      activeSessions: metrics.activeSessions,
      totalMessages: metrics.totalMessages,
      averageResponseTime: metrics.averageResponseTime,
      errorRate: metrics.errorRate,
      toolUsage: metrics.toolUsage,
    });

    return metrics;
  }

  public getToolManager(): ToolManager {
    return this.toolManager;
  }

  public updateConfig(config: Partial<AgentEngineConfig>): void {
    console.log('⚙️ [AGENT-ENGINE] Updating config:', {
      configKeys: Object.keys(config),
    });
    this.config = { ...this.config, ...config };
  }

  private generateSessionId(): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('🆔 [AGENT-ENGINE] Generated session ID:', sessionId);
    return sessionId;
  }

  private updateSession(sessionId: string, input: string, context?: Record<string, any>): void {
    const now = new Date();
    const existingSession = this.sessions.get(sessionId);

    if (existingSession) {
      existingSession.lastActivity = now;
      existingSession.stats.messageCount++;
      // Update context if provided
      if (context) {
        existingSession.metadata = { ...existingSession.metadata, ...context };
      }
      console.log('🔄 [AGENT-ENGINE] Updated existing session:', {
        sessionId,
        messageCount: existingSession.stats.messageCount,
        hasContext: !!context,
      });
    } else {
      this.sessions.set(sessionId, {
        id: sessionId,
        createdAt: now,
        lastActivity: now,
        memory: [],
        metadata: context || {},
        stats: {
          messageCount: 1,
          toolUsage: {},
          averageResponseTime: 0,
          errorCount: 0,
        },
      });
      console.log('🆕 [AGENT-ENGINE] Created new session:', sessionId);
    }
  }

  private updateSessionStats(sessionId: string, responseTime: number, _response: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.stats.averageResponseTime =
        (session.stats.averageResponseTime * (session.stats.messageCount - 1) + responseTime) /
        session.stats.messageCount;

      console.log('📊 [AGENT-ENGINE] Updated session stats:', {
        sessionId,
        averageResponseTime: session.stats.averageResponseTime,
        messageCount: session.stats.messageCount,
      });
    }
  }

  private updateMetrics(responseTime: number, intermediateSteps: any[]): void {
    this.metrics.totalMessages++;
    this.metrics.totalResponseTime += responseTime;

    // Update tool usage
    for (const step of intermediateSteps) {
      if (step.action && step.action.tool) {
        const toolName = step.action.tool;
        this.metrics.toolUsage[toolName] = (this.metrics.toolUsage[toolName] || 0) + 1;
      }
    }

    console.log('📊 [AGENT-ENGINE] Updated metrics:', {
      totalMessages: this.metrics.totalMessages,
      totalResponseTime: this.metrics.totalResponseTime,
      toolUsage: this.metrics.toolUsage,
    });
  }

  private getToolsUsedInResponse(result: any): string[] {
    const toolsUsed: string[] = [];
    if (result.intermediateSteps) {
      for (const step of result.intermediateSteps) {
        if (step.action && step.action.tool) {
          toolsUsed.push(step.action.tool);
        }
      }
    }
    const uniqueTools = [...new Set(toolsUsed)];
    console.log('🔧 [AGENT-ENGINE] Tools used in response:', uniqueTools);
    return uniqueTools;
  }

  private startSessionCleanup(): void {
    console.log('🧹 [AGENT-ENGINE] Starting session cleanup (every 5 minutes)');
    setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;

      for (const [sessionId, session] of this.sessions.entries()) {
        if (now - session.lastActivity.getTime() > this.config.sessionTimeout) {
          this.sessions.delete(sessionId);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log('🧹 [AGENT-ENGINE] Session cleanup completed:', {
          cleanedCount,
        });
      }
    }, 300000); // Run every 5 minutes
  }

  // Remove sensitive IDs from the final text response
  private redactSensitiveIdentifiers(text: string, meta: Record<string, any>): string {
    if (!text) return text;
    const widgetId = meta?.widgetId;
    let result = text;
    if (typeof widgetId === 'string' && widgetId.length >= 8) {
      const safe = widgetId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(safe, 'gi'), '[redacted]');
    }
    return result;
  }
}
