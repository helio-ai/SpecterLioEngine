import { DynamicTool } from '@langchain/core/tools';
import { OpenAIToolDef } from '../../core/openai/openai-client';
// import { agentLogger } from '../../shared/utils/agent.logger';

export interface ToolMetadata {
  name: string;
  description: string;
  version: string;
  category: string;
  tags: string[];
  rateLimit?: {
    requests: number;
    window: number; // in seconds
  };
  timeout?: number; // in milliseconds
}

export interface ToolConfig {
  enabled: boolean;
  maxRetries: number;
  retryDelay: number;
  timeout: number;
  cacheEnabled: boolean;
  cacheTTL: number;
}

export interface ToolResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    executionTime: number;
    cacheHit?: boolean;
    retries?: number;
  };
}

export abstract class BaseTool {
  protected metadata: ToolMetadata;
  protected config: ToolConfig;
  protected lastCallTime: number = 0;
  protected callCount: number = 0;
  protected cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(metadata: ToolMetadata, config?: Partial<ToolConfig>) {
    console.log('🔧 [BASE-TOOL] init start');

    this.metadata = metadata;
    this.config = {
      enabled: true,
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 30000,
      cacheEnabled: true,
      cacheTTL: 300000, // 5 minutes
      ...config,
    };

    console.log('🔧 [BASE-TOOL] init end');
  }

  abstract execute(input: any): Promise<ToolResult>;

  protected async executeWithRetry(input: any): Promise<ToolResult> {
    let lastError: Error | undefined;
    const startTime = Date.now();

    console.log('🔄 [BASE-TOOL] execute start');

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log('🔄 [BASE-TOOL] Attempt', {
          attempt,
          maxRetries: this.config.maxRetries,
        });

        // Check rate limiting
        if (this.metadata.rateLimit) {
          const now = Date.now();
          const windowStart = now - this.metadata.rateLimit.window * 1000;

          if (
            this.lastCallTime > windowStart &&
            this.callCount >= this.metadata.rateLimit.requests
          ) {
            const waitTime = this.metadata.rateLimit.window * 1000 - (now - this.lastCallTime);
            console.log('⏳ [BASE-TOOL] rate limit wait');
            await new Promise((resolve) => setTimeout(resolve, waitTime));
          }
        }

        // Check cache
        if (this.config.cacheEnabled) {
          const cacheKey = this.generateCacheKey(input);
          const cached = this.cache.get(cacheKey);

          if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
            console.log('💾 [BASE-TOOL] cache hit');
            return {
              success: true,
              data: cached.data,
              metadata: {
                executionTime: Date.now() - startTime,
                cacheHit: true,
              },
            };
          }
        }

        // Execute tool
        this.lastCallTime = Date.now();
        this.callCount++;

        console.log('🚀 [BASE-TOOL] exec');
        const result = await this.execute(input);

        // Cache successful results
        if (result.success && this.config.cacheEnabled) {
          const cacheKey = this.generateCacheKey(input);
          this.cache.set(cacheKey, {
            data: result.data,
            timestamp: Date.now(),
          });
          console.log('💾 [BASE-TOOL] cached');
        }

        const executionTime = Date.now() - startTime;
        console.log('✅ [BASE-TOOL] execute end');

        return {
          ...result,
          metadata: {
            ...result.metadata,
            executionTime,
            retries: attempt - 1,
          },
        };
      } catch (error: any) {
        lastError = error;
        console.log('⚠️ [BASE-TOOL] exec attempt failed');

        if (attempt < this.config.maxRetries) {
          const delay = this.config.retryDelay * attempt;
          console.log('⏳ [BASE-TOOL] retry wait');
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    console.log('❌ [BASE-TOOL] all retries failed');
    throw lastError!;
  }

  protected generateCacheKey(input: any): string {
    const cacheKey = `${this.metadata.name}_${JSON.stringify(input)}`;
    console.log('🔑 [BASE-TOOL] cache key');
    return cacheKey;
  }

  public getTool(): DynamicTool {
    console.log('🔧 [BASE-TOOL] dynamic tool start');

    return new DynamicTool({
      name: this.metadata.name,
      description: this.metadata.description,
      func: async (input: string) => {
        try {
          console.log('🔄 [BASE-TOOL] dynamic call start');

          const parsedInput = this.parseInput(input);
          const result = await this.executeWithRetry(parsedInput);

          if (!result.success) {
            console.log('❌ [BASE-TOOL] Tool execution failed:', {
              toolName: this.metadata.name,
              error: result.error,
            });
            throw new Error(result.error || 'Tool execution failed');
          }

          console.log('✅ [BASE-TOOL] dynamic call end');

          return JSON.stringify(result.data, null, 2);
        } catch (error: any) {
          console.log('❌ [BASE-TOOL] dynamic call error');
          throw error;
        }
      },
    });
  }

  protected parseInput(input: string): any {
    try {
      console.log('🔍 [BASE-TOOL] parse input');
      return JSON.parse(input);
    } catch {
      console.log('📝 [BASE-TOOL] input not JSON');
      return { query: input };
    }
  }

  public getMetadata(): ToolMetadata {
    console.log('📋 [BASE-TOOL] get metadata');
    return { ...this.metadata };
  }

  public getConfig(): ToolConfig {
    console.log('⚙️ [BASE-TOOL] get config');
    return { ...this.config };
  }

  public updateConfig(config: Partial<ToolConfig>): void {
    console.log('⚙️ [BASE-TOOL] update config');
    this.config = { ...this.config, ...config };
  }

  public isEnabled(): boolean {
    console.log('✅ [BASE-TOOL] is enabled');
    return this.config.enabled;
  }

  // Default OpenAI function spec; tools can override for stricter schemas
  public getOpenAIFunctionSpec(): OpenAIToolDef {
    return {
      type: 'function',
      function: {
        name: this.metadata.name,
        description: this.metadata.description,
        parameters: {
          type: 'object',
          properties: {},
          additionalProperties: true,
        },
      },
    } as OpenAIToolDef;
  }

  public getStats(): {
    callCount: number;
    lastCallTime: number;
    cacheSize: number;
  } {
    const stats = {
      callCount: this.callCount,
      lastCallTime: this.lastCallTime,
      cacheSize: this.cache.size,
    };

    console.log('📊 [BASE-TOOL] get stats');

    return stats;
  }

  public clearCache(): void {
    console.log('🗑️ [BASE-TOOL] clear cache');
    this.cache.clear();
  }
}
