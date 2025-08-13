import { AgentService, ChatRequest } from '../services/agent-service';
import { ToolManager } from '../core/tool-manager';
import { agentLogger } from '../../shared/utils/agent.logger';

export class AdvancedAgentExample {
  private agentService: AgentService;
  private toolManager: ToolManager;

  constructor() {
    // Initialize with custom configuration
    this.agentService = new AgentService({
      engine: {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        memoryEnabled: true,
        maxMemorySize: 150,
        retryEnabled: true,
        maxRetries: 3,
        enableMonitoring: true,
        enableMetrics: true,
      },
      tools: {
        autoRegister: true,
        defaultEnabled: true,
        categories: ['search', 'books'],
      },
      monitoring: {
        enabled: true,
        metricsInterval: 30000, // 30 seconds
        logLevel: 'info',
      },
      sessions: {
        timeout: 1800000, // 30 minutes
        maxSessions: 500,
        cleanupInterval: 300000, // 5 minutes
      },
    });

    this.toolManager = this.agentService.getToolManager();
  }

  async demonstrateBasicUsage(): Promise<void> {
    agentLogger.info('Demonstrating basic agent usage');

    const request: ChatRequest = {
      message: 'Can you help me find books about machine learning?',
      sessionId: 'demo-session-1',
    };

    try {
      const response = await this.agentService.processChat(request);

      agentLogger.success('Basic usage demonstration completed', {
        response: response.response.substring(0, 100) + '...',
        toolsUsed: response.metadata.toolsUsed,
        responseTime: response.metadata.responseTime,
      });
    } catch (error: any) {
      agentLogger.error('Basic usage demonstration failed', {
        error: error.message,
      });
    }
  }

  async demonstrateToolManagement(): Promise<void> {
    agentLogger.info('Demonstrating tool management features');

    // Get tool statistics
    const toolStats = this.toolManager.getToolStats();
    agentLogger.info('Current tool statistics', { toolStats });

    // Disable a tool
    this.toolManager.disableTool('searchBooks');
    agentLogger.info('Books tool disabled');

    // Try to use the disabled tool
    const bookRequest: ChatRequest = {
      message: 'Search for books about science fiction',
      sessionId: 'demo-session-2',
    };

    try {
      const response = await this.agentService.processChat(bookRequest);
      agentLogger.info('Book request response', {
        response: response.response.substring(0, 100),
      });
    } catch (error: any) {
      agentLogger.warn('Books tool is disabled', { error: error.message });
    }

    // Re-enable the tool
    this.toolManager.enableTool('searchBooks');
    agentLogger.info('Books tool re-enabled');
  }

  async demonstrateSessionManagement(): Promise<void> {
    agentLogger.info('Demonstrating session management');

    const sessionId = 'demo-session-3';

    // First message
    const request1: ChatRequest = {
      message: 'Hello, my name is John. I need help finding books.',
      sessionId,
    };

    const response1 = await this.agentService.processChat(request1);
    agentLogger.info('First message response', {
      sessionId: response1.sessionId,
      memorySize: response1.metadata.memorySize,
    });

    // Second message (should remember the context)
    const request2: ChatRequest = {
      message: 'I am interested in science fiction and fantasy books',
      sessionId,
    };

    const response2 = await this.agentService.processChat(request2);
    agentLogger.info('Second message response', {
      sessionId: response2.sessionId,
      memorySize: response2.metadata.memorySize,
    });

    // Get session details
    const session = this.agentService.getSession(sessionId);
    agentLogger.info('Session details', {
      sessionId: session?.id,
      messageCount: session?.stats.messageCount,
      averageResponseTime: session?.stats.averageResponseTime,
    });
  }

  async demonstrateErrorHandling(): Promise<void> {
    agentLogger.info('Demonstrating error handling and retry logic');

    const invalidRequest: ChatRequest = {
      message: 'Search for books with invalid parameters', // This should cause an error
      sessionId: 'demo-session-error',
    };

    try {
      const response = await this.agentService.processWithRetry(invalidRequest, 2);
      agentLogger.info('Error handling response', {
        response: response.response.substring(0, 100),
      });
    } catch (error: any) {
      agentLogger.warn('Expected error caught', { error: error.message });
    }
  }

  async demonstrateMetricsAndMonitoring(): Promise<void> {
    agentLogger.info('Demonstrating metrics and monitoring');

    // Perform some operations to generate metrics
    const requests = [
      {
        message: 'Find books about Python programming',
        sessionId: 'metrics-1',
      },
      {
        message: 'Search for books about machine learning',
        sessionId: 'metrics-2',
      },
      {
        message: 'Find books about artificial intelligence',
        sessionId: 'metrics-3',
      },
    ];

    for (const req of requests) {
      try {
        await this.agentService.processChat(req);
      } catch (error: any) {
        agentLogger.warn('Request failed', { error: error.message });
      }
    }

    // Get comprehensive metrics
    const metrics = this.agentService.getMetrics();
    agentLogger.info('Comprehensive metrics', {
      totalRequests: metrics.totalRequests,
      successRate:
        metrics.totalRequests > 0 ? (metrics.successfulRequests / metrics.totalRequests) * 100 : 0,
      averageResponseTime: metrics.averageResponseTime,
      activeSessions: metrics.sessions.active,
      toolUsage: metrics.engine.toolUsage,
    });

    // Get health status
    const health = this.agentService.getHealthStatus();
    agentLogger.info('Health status', {
      status: health.status,
      errorRate: health.details.errorRate,
      activeSessions: health.details.activeSessions,
    });
  }

  async demonstrateCustomToolRegistration(): Promise<void> {
    agentLogger.info('Demonstrating custom tool registration');

    // Create a custom tool
    class CustomGreetingTool extends (await import('../core/base-tool')).BaseTool {
      constructor() {
        super({
          name: 'customGreeting',
          description: 'Generate personalized greetings based on user input',
          version: '1.0.0',
          category: 'utility',
          tags: ['greeting', 'custom', 'utility'],
        });
      }

      async execute(input: { name: string; timeOfDay?: string }): Promise<any> {
        const { name, timeOfDay = 'day' } = input;
        const greetings = {
          morning: 'Good morning',
          afternoon: 'Good afternoon',
          evening: 'Good evening',
          night: 'Good night',
          day: 'Hello',
        };

        const greeting = greetings[timeOfDay as keyof typeof greetings] || 'Hello';
        return {
          success: true,
          data: `${greeting}, ${name}! How can I help you today?`,
        };
      }
    }

    // Register the custom tool
    const customTool = new CustomGreetingTool();
    this.toolManager.registerTool(customTool);
    agentLogger.info('Custom tool registered', {
      toolName: customTool.getMetadata().name,
    });

    // Use the custom tool
    const customRequest: ChatRequest = {
      message: 'Use the custom greeting tool to greet Alice in the morning',
      sessionId: 'demo-custom-tool',
    };

    try {
      const response = await this.agentService.processChat(customRequest);
      agentLogger.info('Custom tool response', {
        response: response.response.substring(0, 100),
      });
    } catch (error: any) {
      agentLogger.error('Custom tool usage failed', { error: error.message });
    }
  }

  async runAllDemonstrations(): Promise<void> {
    agentLogger.info('Starting comprehensive agent demonstration');

    try {
      await this.demonstrateBasicUsage();
      await this.demonstrateToolManagement();
      await this.demonstrateSessionManagement();
      await this.demonstrateErrorHandling();
      await this.demonstrateMetricsAndMonitoring();
      await this.demonstrateCustomToolRegistration();

      agentLogger.success('All demonstrations completed successfully');
    } catch (error: any) {
      agentLogger.error('Demonstration failed', { error: error.message });
    }
  }

  getAgentService(): AgentService {
    return this.agentService;
  }

  getToolManager(): ToolManager {
    return this.toolManager;
  }
}

// Export a default instance
export const advancedAgentExample = new AdvancedAgentExample();
