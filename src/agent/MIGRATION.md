# Migration Guide: Old Architecture to New Class-Based Architecture

This guide helps you migrate from the old agent architecture to the new class-based architecture.

## 🚀 Quick Migration

### Before (Old Architecture)

```typescript
import { agentService } from './agent';

const response = await agentService.processChat({
  message: 'Find books about AI',
  sessionId: 'user-123',
});
```

### After (New Architecture)

```typescript
import { AgentService, ChatRequest } from './agent';

const agentService = new AgentService();
const request: ChatRequest = {
  message: 'Find books about AI',
  sessionId: 'user-123',
};

const response = await agentService.processChat(request);
```

## 📋 Detailed Migration Steps

### 1. Update Imports

#### Old Imports

```typescript
import { agentService } from './agent';
import { booksTool, weatherTool, calculatorTool, refundTool } from './agent';
import { Agent } from './agent';
```

#### New Imports

```typescript
import { AgentService, ChatRequest, ChatResponse } from './agent';
import { BooksTool, WeatherTool, CalculatorTool, RefundTool } from './agent';
import { AgentEngine, ToolManager } from './agent';
```

### 2. Service Initialization

#### Old Way

```typescript
// Service was pre-initialized
import { agentService } from './agent';
```

#### New Way

```typescript
// Create service instance with custom configuration
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
    timeout: 3600000,
    maxSessions: 1000,
    cleanupInterval: 300000,
  },
};

const agentService = new AgentService(config);
```

### 3. Tool Usage

#### Old Way

```typescript
import { booksTool, weatherTool } from './agent';

// Tools were pre-created
const result = await booksTool.func('{"query": "machine learning"}');
```

#### New Way

```typescript
import { BooksTool, WeatherTool } from './agent';

// Create tool instances
const booksTool = new BooksTool();
const weatherTool = new WeatherTool();

// Use tools directly
const result = await booksTool.execute({ query: 'machine learning' });

// Or get LangChain tool
const langchainTool = booksTool.getTool();
```

### 4. Tool Management

#### Old Way

```typescript
// Tools were static
const availableTools = ['searchBooks', 'getWeather', 'calculate', 'refundPayment'];
```

#### New Way

```typescript
import { ToolManager } from './agent';

const toolManager = new ToolManager();

// Register tools
const booksTool = new BooksTool();
toolManager.registerTool(booksTool);

// Get available tools
const availableTools = toolManager.getToolNames();
const enabledTools = toolManager.getEnabledTools();

// Manage tools
toolManager.disableTool('getWeather');
toolManager.enableTool('getWeather');
toolManager.updateToolConfig('searchBooks', { maxRetries: 5 });
```

### 5. Session Management

#### Old Way

```typescript
import { agentService } from './agent';

const response = await agentService.processChat({
  message: 'Hello',
  sessionId: 'user-123',
});
```

#### New Way

```typescript
import { AgentService, ChatRequest } from './agent';

const agentService = new AgentService();

const request: ChatRequest = {
  message: 'Hello',
  sessionId: 'user-123',
  context: { userId: 'user-123', preferences: {} },
  options: {
    retryCount: 3,
    timeout: 30000,
    enableMonitoring: true,
  },
};

const response = await agentService.processChat(request);

// Additional session operations
const session = agentService.getSession('user-123');
const allSessions = agentService.getAllSessions();
agentService.clearSession('user-123');
```

### 6. Error Handling

#### Old Way

```typescript
try {
  const response = await agentService.processChat(request);
} catch (error) {
  console.error('Error:', error.message);
}
```

#### New Way

```typescript
try {
  const response = await agentService.processChat(request);
} catch (error) {
  console.error('Error:', error.message);

  // Retry with custom logic
  const retryResponse = await agentService.processWithRetry(request, 3);
}
```

### 7. Metrics and Monitoring

#### Old Way

```typescript
// Limited metrics available
const stats = await agentService.getSessionStats();
```

#### New Way

```typescript
// Comprehensive metrics
const metrics = agentService.getMetrics();
console.log('Total requests:', metrics.totalRequests);
console.log('Success rate:', metrics.successfulRequests / metrics.totalRequests);
console.log('Average response time:', metrics.averageResponseTime);
console.log('Tool usage:', metrics.engine.toolUsage);

// Health status
const health = agentService.getHealthStatus();
console.log('Status:', health.status);
console.log('Error rate:', health.details.errorRate);
```

### 8. Custom Tool Development

#### Old Way

```typescript
import { DynamicTool } from '@langchain/core/tools';

export const customTool = new DynamicTool({
  name: 'customTool',
  description: 'Custom tool description',
  func: async (input: string) => {
    // Tool logic
    return JSON.stringify(result);
  },
});
```

#### New Way

```typescript
import { BaseTool, ToolResult, ToolMetadata } from './core/base-tool';

export class CustomTool extends BaseTool {
  constructor() {
    const metadata: ToolMetadata = {
      name: 'customTool',
      description: 'Custom tool description',
      version: '1.0.0',
      category: 'utility',
      tags: ['custom', 'utility'],
      rateLimit: {
        requests: 100,
        window: 3600,
      },
      timeout: 10000,
    };

    super(metadata, {
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 10000,
      cacheEnabled: true,
      cacheTTL: 300000,
    });
  }

  async execute(input: any): Promise<ToolResult> {
    try {
      // Tool logic
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

  private async performOperation(input: any): Promise<any> {
    // Implementation
    return { data: 'result' };
  }
}
```

## 🔄 Backward Compatibility

The new architecture maintains backward compatibility through:

### Legacy Exports

```typescript
// These still work for existing code
import { agentService } from './agent';
import { booksTool, weatherTool, calculatorTool, refundTool } from './agent';
import { Agent } from './agent';
```

### Default Service Instance

```typescript
import { defaultAgentService } from './agent';

// Use the default instance (equivalent to old agentService)
const response = await defaultAgentService.processChat(request);
```

## 🆕 New Features

### 1. Enhanced Tool Management

- Dynamic tool registration/unregistration
- Tool categorization and tagging
- Configurable rate limiting and caching
- Tool statistics and monitoring

### 2. Improved Session Management

- Automatic session cleanup
- Session timeout configuration
- Session statistics and metrics
- Memory management

### 3. Better Error Handling

- Comprehensive retry mechanisms
- Detailed error reporting
- Health status monitoring
- Graceful degradation

### 4. Advanced Monitoring

- Real-time metrics collection
- Performance monitoring
- Tool usage analytics
- Health status checks

### 5. Production Features

- Built-in caching with TTL
- Rate limiting per tool
- Comprehensive logging
- Scalable architecture

## 🧪 Testing Migration

### Test Your Migration

```typescript
import { AdvancedAgentExample } from './examples/advanced-agent-example';

// Run comprehensive tests
const example = new AdvancedAgentExample();
await example.runAllDemonstrations();
```

### Verify Functionality

```typescript
// Test basic functionality
const agentService = new AgentService();
const response = await agentService.processChat({
  message: 'Find books about AI and calculate 2 + 2',
  sessionId: 'test-session',
});

console.log('Response:', response.response);
console.log('Tools used:', response.metadata.toolsUsed);
```

## 🚨 Breaking Changes

### 1. Service Initialization

- Service must be explicitly created
- Configuration is now required
- No more global singleton

### 2. Tool Access

- Tools are now class instances
- Direct tool execution requires instantiation
- Tool management is more explicit

### 3. Error Handling

- More detailed error objects
- Retry logic is more configurable
- Health status monitoring

### 4. Metrics

- Metrics are now more comprehensive
- Real-time monitoring capabilities
- Health status checks

## 📞 Support

If you encounter issues during migration:

1. Check the [README.md](./README.md) for detailed documentation
2. Review the [examples](./examples/advanced-agent-example.ts) for usage patterns
3. Use the backward compatibility features for gradual migration
4. Test thoroughly with the provided examples

## 🎯 Migration Checklist

- [ ] Update imports to use new class-based exports
- [ ] Replace global service with instance creation
- [ ] Update tool usage to use class instances
- [ ] Implement new error handling patterns
- [ ] Add monitoring and metrics collection
- [ ] Test with comprehensive examples
- [ ] Update configuration for production deployment
- [ ] Verify backward compatibility if needed
