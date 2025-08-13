import { AgentEngine, AgentEngineConfig } from '../core/agent-engine';
import { ToolManager } from '../core/tool-manager';
import { ToolFactory } from '../tools';
// import { agentLogger } from '../../shared/utils/agent.logger';
import { sessionStore } from '../../core/session/session-store';

export interface ChatRequest {
  message: string;
  sessionId?: string;
  context?: Record<string, any>;
  options?: {
    retryCount?: number;
    timeout?: number;
    enableMonitoring?: boolean;
  };
}

export interface ChatResponse {
  response: string;
  sessionId: string;
  timestamp: string;
  metadata: {
    responseTime: number;
    toolsUsed: string[];
    memorySize: number;
    model: string;
    tokensUsed?: number;
  };
  context?: Record<string, any>;
}

export interface AgentServiceConfig {
  engine: Partial<AgentEngineConfig>;
  tools: {
    autoRegister: boolean;
    defaultEnabled: boolean;
    categories: string[];
  };
  monitoring: {
    enabled: boolean;
    metricsInterval: number;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
  sessions: {
    timeout: number;
    maxSessions: number;
    cleanupInterval: number;
  };
}

export class AgentService {
  private engine!: AgentEngine;
  private toolManager!: ToolManager;
  private config: AgentServiceConfig;
  private metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    totalResponseTime: number;
  } = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    totalResponseTime: 0,
  };

  constructor(config?: Partial<AgentServiceConfig>) {
    console.log('🚀 [AGENT-SERVICE] Initializing Agent Service with config:', {
      hasConfig: !!config,
      configKeys: config ? Object.keys(config) : [],
    });

    this.config = {
      engine: {
        model: 'gpt-5-mini',
        temperature: 0,
        maxTokens: 4000,
        memoryEnabled: true,
        maxMemorySize: 100,
        retryEnabled: true,
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 30000,
        enableMonitoring: true,
        enableMetrics: true,
        sessionTimeout: 3600000,
      },
      tools: {
        autoRegister: true,
        defaultEnabled: true,
        categories: ['search', 'calculation', 'payment', 'weather', 'utility'],
      },
      monitoring: {
        enabled: true,
        metricsInterval: 60000, // 1 minute
        logLevel: 'info',
      },
      sessions: {
        timeout: 3600000, // 1 hour
        maxSessions: 1000,
        cleanupInterval: 300000, // 5 minutes
      },
      ...config,
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      console.log('🔄 [AGENT-SERVICE] Starting initialization...');

      // Initialize tool manager
      console.log('🔧 [AGENT-SERVICE] Initializing tool manager...');
      this.toolManager = new ToolManager({
        autoDiscovery: this.config.tools.autoRegister,
        hotReload: false,
        defaultConfig: {
          enabled: this.config.tools.defaultEnabled,
          maxRetries: 3,
          retryDelay: 1000,
          timeout: 30000,
          cacheEnabled: true,
          cacheTTL: 300000,
        },
        categories: this.config.tools.categories,
      });

      // Register tools
      if (this.config.tools.autoRegister) {
        console.log('📦 [AGENT-SERVICE] Auto-registering tools...');
        this.registerDefaultTools();
      }

      // Initialize agent engine
      console.log('🤖 [AGENT-SERVICE] Initializing agent engine...');
      this.engine = new AgentEngine(this.toolManager, this.config.engine);

      // Make agent engine globally accessible for tools
      (global as any).__agentEngine = this.engine;

      // Start monitoring
      if (this.config.monitoring.enabled) {
        console.log('📊 [AGENT-SERVICE] Starting monitoring...');
        this.startMonitoring();
      }

      console.log('✅ [AGENT-SERVICE] Initialization complete!');
    } catch (error: any) {
      console.log('❌ [AGENT-SERVICE] Initialization failed:', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  private registerDefaultTools(): void {
    console.log('🔧 [AGENT-SERVICE] Registering default tools...');

    const tools = ToolFactory.createAllTools();
    console.log('📦 [AGENT-SERVICE] Created tools:', {
      count: tools.length,
      toolNames: tools.map((tool) => tool.getMetadata().name),
    });

    for (const tool of tools) {
      this.toolManager.registerTool(tool);
    }

    console.log('✅ [AGENT-SERVICE] Default tools registered:', {
      count: tools.length,
      categories: this.toolManager.getCategories(),
    });
  }

  public async processChat(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    console.log('🔄 [AGENT-SERVICE] Processing chat request:', {
      sessionId: request.sessionId || 'will be generated',
      messageLength: request.message.length,
      hasContext: !!request.context,
      contextKeys: request.context ? Object.keys(request.context) : [],
    });

    try {
      console.log('🤖 [AGENT-SERVICE] Calling agent engine...');

      // Persist chat history (user message) and context to session store
      const sid =
        request.sessionId || `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await sessionStore.append(sid, {
        role: 'user',
        content: request.message,
        timestamp: Date.now(),
      });
      // Also persist context as an assistant-side memory note for history awareness
      if (request.context) {
        await sessionStore.append(sid, {
          role: 'assistant',
          content: `[context] ${JSON.stringify(request.context).slice(0, 1500)}`,
          timestamp: Date.now(),
        });
      }

      const result = await this.engine.processMessage(request.message, sid, request.context);

      // Persist assistant reply
      await sessionStore.append(result.sessionId, {
        role: 'assistant',
        content: result.response,
        timestamp: Date.now(),
      });

      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true);

      const response: ChatResponse = {
        response: result.response,
        sessionId: result.sessionId,
        timestamp: new Date().toISOString(),
        metadata: {
          responseTime,
          toolsUsed: result.metadata.toolsUsed,
          memorySize: result.metadata.memorySize,
          model: this.config.engine.model || 'gpt-5-mini',
        },
        context: request.context,
      };

      console.log('✅ [AGENT-SERVICE] Chat request processed successfully:', {
        sessionId: result.sessionId,
        responseTime: `${responseTime}ms`,
        responseLength: result.response.length,
        toolsUsed: result.metadata.toolsUsed,
        memorySize: result.metadata.memorySize,
      });

      return response;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false);

      console.log('❌ [AGENT-SERVICE] Chat request processing failed:', {
        sessionId: request.sessionId,
        error: error.message,
        responseTime: `${responseTime}ms`,
        stack: error.stack,
      });

      throw error;
    }
  }

  public async processWithRetry(request: ChatRequest, maxRetries?: number): Promise<ChatResponse> {
    const retries = maxRetries || this.config.engine.maxRetries || 3;
    let lastError: Error;

    console.log('🔄 [AGENT-SERVICE] Processing with retry:', {
      maxRetries: retries,
    });

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log('🔄 [AGENT-SERVICE] Attempt', {
          attempt,
          maxRetries: retries,
        });
        return await this.processChat(request);
      } catch (error: any) {
        lastError = error as Error;
        console.log('⚠️ [AGENT-SERVICE] Attempt failed:', {
          error: error.message,
          attempt,
          maxRetries: retries,
        });

        if (attempt < retries) {
          const delay = (this.config.engine.retryDelay || 1000) * attempt;
          console.log('⏳ [AGENT-SERVICE] Waiting before retry:', {
            delay: `${delay}ms`,
          });
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    console.log('❌ [AGENT-SERVICE] All retry attempts failed');
    throw lastError!;
  }

  public getSession(sessionId: string) {
    console.log('🔍 [AGENT-SERVICE] Getting session:', sessionId);
    return this.engine.getSession(sessionId);
  }

  public getAllSessions() {
    console.log('📋 [AGENT-SERVICE] Getting all sessions');
    return this.engine.getAllSessions();
  }

  public clearSession(sessionId: string): boolean {
    console.log('🗑️ [AGENT-SERVICE] Clearing session:', sessionId);
    return this.engine.clearSession(sessionId);
  }

  public getToolManager(): ToolManager {
    return this.toolManager;
  }

  public getEngine(): AgentEngine {
    return this.engine;
  }

  public getMetrics() {
    console.log('📊 [AGENT-SERVICE] Getting metrics...');
    const metrics = {
      ...this.metrics,
      engine: this.engine.getMetrics(),
      tools: this.toolManager.getToolStats(),
      sessions: {
        total: this.engine.getAllSessions().length,
        active: this.engine
          .getAllSessions()
          .filter(
            (session) => Date.now() - session.lastActivity.getTime() < this.config.sessions.timeout,
          ).length,
      },
    };

    console.log('📊 [AGENT-SERVICE] Metrics retrieved:', {
      totalRequests: metrics.totalRequests,
      successfulRequests: metrics.successfulRequests,
      failedRequests: metrics.failedRequests,
      averageResponseTime: metrics.averageResponseTime,
      totalSessions: metrics.sessions.total,
      activeSessions: metrics.sessions.active,
    });

    return metrics;
  }

  public updateConfig(config: Partial<AgentServiceConfig>): void {
    console.log('⚙️ [AGENT-SERVICE] Updating config:', {
      configKeys: Object.keys(config),
    });
    this.config = { ...this.config, ...config };
  }

  public registerTool(tool: any): void {
    console.log('🔧 [AGENT-SERVICE] Registering tool:', tool.getMetadata().name);
    this.toolManager.registerTool(tool);
  }

  public unregisterTool(name: string): boolean {
    console.log('🗑️ [AGENT-SERVICE] Unregistering tool:', name);
    return this.toolManager.unregisterTool(name);
  }

  public enableTool(name: string): boolean {
    console.log('✅ [AGENT-SERVICE] Enabling tool:', name);
    return this.toolManager.enableTool(name);
  }

  public disableTool(name: string): boolean {
    console.log('❌ [AGENT-SERVICE] Disabling tool:', name);
    return this.toolManager.disableTool(name);
  }

  public getToolStats() {
    console.log('📊 [AGENT-SERVICE] Getting tool stats');
    return this.toolManager.getToolStats();
  }

  public clearAllCaches(): void {
    console.log('🗑️ [AGENT-SERVICE] Clearing all caches');
    this.toolManager.clearAllCaches();
  }

  private updateMetrics(responseTime: number, success: boolean): void {
    this.metrics.totalResponseTime += responseTime;
    this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.totalRequests;

    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }
  }

  private startMonitoring(): void {
    console.log(
      '📊 [AGENT-SERVICE] Starting monitoring with interval:',
      this.config.monitoring.metricsInterval,
    );
    setInterval(() => {
      const metrics = this.getMetrics();
      console.log('📊 [AGENT-SERVICE] Monitoring metrics:', {
        totalRequests: metrics.totalRequests,
        successRate:
          metrics.totalRequests > 0
            ? (metrics.successfulRequests / metrics.totalRequests) * 100
            : 0,
        averageResponseTime: metrics.averageResponseTime,
        activeSessions: metrics.sessions.active,
        totalTools: Object.keys(metrics.tools).length,
      });
    }, this.config.monitoring.metricsInterval);
  }

  public getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  } {
    console.log('🏥 [AGENT-SERVICE] Getting health status...');

    const engineMetrics = this.engine.getMetrics();
    const toolStats = this.toolManager.getToolStats();
    const sessions = this.engine.getAllSessions();

    const errorRate = engineMetrics.errorRate;
    const activeSessions = sessions.filter(
      (session) => Date.now() - session.lastActivity.getTime() < this.config.sessions.timeout,
    ).length;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (errorRate > 0.1 || activeSessions > this.config.sessions.maxSessions * 0.8) {
      status = 'degraded';
    }

    if (errorRate > 0.3 || activeSessions >= this.config.sessions.maxSessions) {
      status = 'unhealthy';
    }

    const healthDetails = {
      status,
      details: {
        errorRate,
        activeSessions,
        maxSessions: this.config.sessions.maxSessions,
        totalTools: Object.keys(toolStats).length,
        engineStatus: engineMetrics,
      },
    };

    console.log('🏥 [AGENT-SERVICE] Health status:', healthDetails);
    return healthDetails;
  }
}
