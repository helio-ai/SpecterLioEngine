# Helio AI Agent - Class-Based Architecture

A robust, scalable, and highly customizable agentic backend system built with TypeScript and LangChain.

## 🏗️ Architecture Overview

The new architecture is built around several core components:

### Core Components

1. **BaseTool** - Abstract base class for all tools
2. **ToolManager** - Manages tool registration, discovery, and lifecycle
3. **AgentEngine** - Core agent processing engine with session management
4. **AgentService** - High-level service interface for agent operations

### Key Features

- ✅ **Class-based architecture** for better organization and extensibility
- ✅ **Comprehensive error handling** with retry mechanisms
- ✅ **Built-in caching** with configurable TTL
- ✅ **Rate limiting** per tool with customizable limits
- ✅ **Session management** with automatic cleanup
- ✅ **Real-time metrics and monitoring**
- ✅ **Health status monitoring**
- ✅ **Hot-reload capable** tool registration
- ✅ **Production-ready** with comprehensive logging

## 🚀 Quick Start

### Basic Usage

```typescript
import { AgentService, ChatRequest } from './agent';

// Create agent service with default configuration
const agentService = new AgentService();

// Process a chat request
const request: ChatRequest = {
  message: 'Find books about machine learning and calculate 15 * 23',
  sessionId: 'user-123',
};

const response = await agentService.processChat(request);
console.log(response.response);
```

### Advanced Configuration

```typescript
import { AgentService, AgentServiceConfig } from './agent';

const config: AgentServiceConfig = {
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
    categories: ['search', 'calculation', 'payment', 'weather', 'utility'],
  },
  monitoring: {
    enabled: true,
    metricsInterval: 60000,
    logLevel: 'info',
  },
  sessions: {
    timeout: 3600000, // 1 hour
    maxSessions: 1000,
    cleanupInterval: 300000, // 5 minutes
  },
};

const agentService = new AgentService(config);
```

## 🛠️ Tool Development

### Creating Custom Tools

All tools extend the `BaseTool` class:

```typescript
import { BaseTool, ToolResult, ToolMetadata } from './core/base-tool';

interface MyToolInput {
  query: string;
  options?: Record<string, any>;
}

interface MyToolResult {
  data: any;
  metadata?: Record<string, any>;
}

export class MyCustomTool extends BaseTool {
  constructor() {
    const metadata: ToolMetadata = {
      name: 'myCustomTool',
      description: 'Description of what this tool does',
      version: '1.0.0',
      category: 'utility',
      tags: ['custom', 'utility'],
      rateLimit: {
        requests: 100,
        window: 3600, // 1 hour
      },
      timeout: 10000,
    };

    super(metadata, {
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 10000,
      cacheEnabled: true,
      cacheTTL: 300000, // 5 minutes
    });
  }

  async execute(input: MyToolInput): Promise<ToolResult<MyToolResult>> {
    try {
      // Your tool logic here
      const result = await this.performOperation(input);

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async performOperation(input: MyToolInput): Promise<MyToolResult> {
    // Implementation here
    return { data: 'result' };
  }
}
```

### Registering Tools

```typescript
import { ToolManager } from './core/tool-manager';
import { MyCustomTool } from './tools/my-custom-tool';

const toolManager = new ToolManager();
const customTool = new MyCustomTool();

toolManager.registerTool(customTool);
```

## 📊 Monitoring and Metrics

### Getting Metrics

```typescript
const metrics = agentService.getMetrics();
console.log('Total requests:', metrics.totalRequests);
console.log('Success rate:', metrics.successfulRequests / metrics.totalRequests);
console.log('Average response time:', metrics.averageResponseTime);
console.log('Tool usage:', metrics.engine.toolUsage);
```

### Health Status

```typescript
const health = agentService.getHealthStatus();
console.log('Status:', health.status); // 'healthy' | 'degraded' | 'unhealthy'
console.log('Error rate:', health.details.errorRate);
console.log('Active sessions:', health.details.activeSessions);
```

## 🔧 Tool Management

### Tool Operations

```typescript
const toolManager = agentService.getToolManager();

// Get all tools
const allTools = toolManager.getAllTools();

// Get tools by category
const searchTools = toolManager.getToolsByCategory('search');

// Get tools by tag
const utilityTools = toolManager.getToolsByTag('utility');

// Enable/disable tools
toolManager.disableTool('getWeather');
toolManager.enableTool('getWeather');

// Update tool configuration
toolManager.updateToolConfig('searchBooks', {
  maxRetries: 5,
  cacheTTL: 600000, // 10 minutes
});

// Get tool statistics
const toolStats = toolManager.getToolStats();
```

## 🎯 Session Management

### Session Operations

```typescript
// Get session
const session = agentService.getSession('session-id');

// Get all sessions
const allSessions = agentService.getAllSessions();

// Clear session
agentService.clearSession('session-id');
```

## 🔄 Error Handling and Retry

### Automatic Retry

```typescript
// Process with custom retry count
const response = await agentService.processWithRetry(request, 5);
```

### Custom Error Handling

```typescript
try {
  const response = await agentService.processChat(request);
} catch (error) {
  console.error('Request failed:', error.message);

  // Check if it's a retryable error
  if (error.retryable) {
    // Implement custom retry logic
  }
}
```

## 📈 Performance Optimization

### Caching

All tools support built-in caching:

```typescript
// Configure cache for a tool
toolManager.updateToolConfig('searchBooks', {
  cacheEnabled: true,
  cacheTTL: 1800000, // 30 minutes
});

// Clear all caches
toolManager.clearAllCaches();
```

### Rate Limiting

Tools support configurable rate limiting:

```typescript
// Update rate limits for a tool
toolManager.updateToolConfig('searchBooks', {
  // Allow 100 requests per hour
  rateLimit: {
    requests: 100,
    window: 3600,
  },
});
```

## 🧪 Testing

### Running Examples

```typescript
import { AdvancedAgentExample } from './examples/advanced-agent-example';

const example = new AdvancedAgentExample();
await example.runAllDemonstrations();
```

### Unit Testing

```typescript
import { BooksTool } from './tools/books-tool';

describe('BooksTool', () => {
  let tool: BooksTool;

  beforeEach(() => {
    tool = new BooksTool();
  });

  it('should search for books', async () => {
    const result = await tool.execute({ query: 'machine learning' });
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});
```

## 🔧 Configuration

### Environment Variables

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Google Books API
GOOGLE_API_KEY=your_google_api_key

# Weather API
WEATHER_API_KEY=your_weather_api_key

# Logging
LOG_LEVEL=info
```

### Configuration Files

```typescript
// agent.config.ts
export const agentConfig = {
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2000,
  memoryEnabled: true,
  maxMemorySize: 100,
  retryEnabled: true,
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000,
  enableMonitoring: true,
  enableMetrics: true,
  sessionTimeout: 3600000,
};
```

## 🚀 Production Deployment

### Docker Configuration

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### Health Checks

```typescript
// Health check endpoint
app.get('/health', (req, res) => {
  const health = agentService.getHealthStatus();
  res.json(health);
});
```

### Monitoring

```typescript
// Metrics endpoint
app.get('/metrics', (req, res) => {
  const metrics = agentService.getMetrics();
  res.json(metrics);
});
```

## 📚 API Reference

### AgentService

- `processChat(request: ChatRequest): Promise<ChatResponse>`
- `processWithRetry(request: ChatRequest, maxRetries?: number): Promise<ChatResponse>`
- `getSession(sessionId: string): AgentSession | undefined`
- `getAllSessions(): AgentSession[]`
- `clearSession(sessionId: string): boolean`
- `getMetrics(): AgentMetrics`
- `getHealthStatus(): HealthStatus`

### ToolManager

- `registerTool(tool: BaseTool): void`
- `unregisterTool(name: string): boolean`
- `getTool(name: string): BaseTool | undefined`
- `getAllTools(): BaseTool[]`
- `getEnabledTools(): BaseTool[]`
- `enableTool(name: string): boolean`
- `disableTool(name: string): boolean`
- `updateToolConfig(name: string, config: Partial<ToolConfig>): boolean`
- `getToolStats(): Record<string, any>`
- `clearAllCaches(): void`

### BaseTool

- `execute(input: any): Promise<ToolResult>`
- `getTool(): DynamicTool`
- `getMetadata(): ToolMetadata`
- `getConfig(): ToolConfig`
- `updateConfig(config: Partial<ToolConfig>): void`
- `isEnabled(): boolean`
- `getStats(): ToolStats`
- `clearCache(): void`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
