import { BaseTool, ToolConfig } from './base-tool';
// import { agentLogger } from '../../shared/utils/agent.logger';

export interface ToolRegistry {
  [category: string]: {
    [name: string]: BaseTool;
  };
}

export interface ToolManagerConfig {
  autoDiscovery: boolean;
  hotReload: boolean;
  defaultConfig: Partial<ToolConfig>;
  categories: string[];
}

export class ToolManager {
  private tools: Map<string, BaseTool> = new Map();
  private registry: ToolRegistry = {};
  private config: ToolManagerConfig;
  private watchers: Set<(tool: BaseTool, action: 'add' | 'remove' | 'update') => void> = new Set();

  constructor(config?: Partial<ToolManagerConfig>) {
    console.log('🔧 [TOOL-MANAGER] Initializing with config:', {
      hasConfig: !!config,
      configKeys: config ? Object.keys(config) : [],
    });

    this.config = {
      autoDiscovery: true,
      hotReload: false,
      defaultConfig: {
        enabled: true,
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 30000,
        cacheEnabled: true,
        cacheTTL: 300000,
      },
      categories: ['search', 'calculation', 'payment', 'weather', 'utility'],
      ...config,
    };

    console.log('✅ [TOOL-MANAGER] Initialized successfully');
  }

  public registerTool(tool: BaseTool): void {
    const metadata = tool.getMetadata();

    if (this.tools.has(metadata.name)) {
      console.log('⚠️ [TOOL-MANAGER] Tool already registered:', { name: metadata.name });
      return;
    }

    // Apply default config
    tool.updateConfig(this.config.defaultConfig);

    // Register in main map
    this.tools.set(metadata.name, tool);

    // Register in category registry
    if (!this.registry[metadata.category]) {
      this.registry[metadata.category] = {};
    }
    this.registry[metadata.category][metadata.name] = tool;

    console.log('✅ [TOOL-MANAGER] Tool registered successfully:', {
      name: metadata.name,
      category: metadata.category,
      version: metadata.version,
      description:
        metadata.description?.substring(0, 50) + (metadata.description?.length > 50 ? '...' : ''),
    });

    this.notifyWatchers(tool, 'add');
  }

  public unregisterTool(name: string): boolean {
    console.log('🗑️ [TOOL-MANAGER] Unregistering tool:', name);

    const tool = this.tools.get(name);
    if (!tool) {
      console.log('❌ [TOOL-MANAGER] Tool not found for unregistration:', name);
      return false;
    }

    const metadata = tool.getMetadata();

    // Remove from main map
    this.tools.delete(name);

    // Remove from category registry
    if (this.registry[metadata.category]) {
      delete this.registry[metadata.category][metadata.name];

      // Clean up empty categories
      if (Object.keys(this.registry[metadata.category]).length === 0) {
        delete this.registry[metadata.category];
      }
    }

    console.log('✅ [TOOL-MANAGER] Tool unregistered successfully:', { name });
    this.notifyWatchers(tool, 'remove');
    return true;
  }

  public getTool(name: string): BaseTool | undefined {
    console.log('🔍 [TOOL-MANAGER] Getting tool:', name);
    const tool = this.tools.get(name);
    if (tool) {
      console.log('✅ [TOOL-MANAGER] Tool found:', { name });
    } else {
      console.log('❌ [TOOL-MANAGER] Tool not found:', { name });
    }
    return tool;
  }

  public getToolsByCategory(category: string): BaseTool[] {
    console.log('📋 [TOOL-MANAGER] Getting tools by category:', category);
    const tools = Object.values(this.registry[category] || {});
    console.log('📋 [TOOL-MANAGER] Found tools:', { category, count: tools.length });
    return tools;
  }

  public getToolsByTag(tag: string): BaseTool[] {
    console.log('🏷️ [TOOL-MANAGER] Getting tools by tag:', tag);
    const tools = Array.from(this.tools.values()).filter((tool) =>
      tool.getMetadata().tags?.includes(tag),
    );
    console.log('🏷️ [TOOL-MANAGER] Found tools with tag:', { tag, count: tools.length });
    return tools;
  }

  public getAllTools(): BaseTool[] {
    console.log('📋 [TOOL-MANAGER] Getting all tools, count:', this.tools.size);
    return Array.from(this.tools.values());
  }

  public getEnabledTools(): BaseTool[] {
    console.log('✅ [TOOL-MANAGER] Getting enabled tools...');
    const enabledTools = Array.from(this.tools.values()).filter((tool) => tool.getConfig().enabled);
    console.log('✅ [TOOL-MANAGER] Enabled tools count:', enabledTools.length);
    return enabledTools;
  }

  public getToolNames(): string[] {
    console.log('📝 [TOOL-MANAGER] Getting tool names, count:', this.tools.size);
    return Array.from(this.tools.keys());
  }

  public getCategories(): string[] {
    console.log('📂 [TOOL-MANAGER] Getting categories');
    const categories = Object.keys(this.registry);
    console.log('📂 [TOOL-MANAGER] Available categories:', categories);
    return categories;
  }

  public updateToolConfig(name: string, config: Partial<ToolConfig>): boolean {
    console.log('⚙️ [TOOL-MANAGER] Updating tool config:', {
      name,
      configKeys: Object.keys(config),
    });

    const tool = this.tools.get(name);
    if (!tool) {
      console.log('❌ [TOOL-MANAGER] Tool not found for config update:', name);
      return false;
    }

    tool.updateConfig(config);
    console.log('✅ [TOOL-MANAGER] Tool config updated successfully:', name);
    this.notifyWatchers(tool, 'update');
    return true;
  }

  public enableTool(name: string): boolean {
    console.log('✅ [TOOL-MANAGER] Enabling tool:', name);
    return this.updateToolConfig(name, { enabled: true });
  }

  public disableTool(name: string): boolean {
    console.log('❌ [TOOL-MANAGER] Disabling tool:', name);
    return this.updateToolConfig(name, { enabled: false });
  }

  public getToolStats(): Record<string, any> {
    console.log('📊 [TOOL-MANAGER] Getting tool stats...');

    const stats: Record<string, any> = {};

    for (const [name, tool] of this.tools.entries()) {
      const metadata = tool.getMetadata();
      const config = tool.getConfig();

      stats[name] = {
        category: metadata.category,
        version: metadata.version,
        enabled: config.enabled,
        maxRetries: config.maxRetries,
        timeout: config.timeout,
        cacheEnabled: config.cacheEnabled,
        cacheTTL: config.cacheTTL,
        description: metadata.description,
        tags: metadata.tags,
      };
    }

    console.log('📊 [TOOL-MANAGER] Tool stats retrieved:', {
      totalTools: Object.keys(stats).length,
      enabledTools: Object.values(stats).filter((stat: any) => stat.enabled).length,
      categories: [...new Set(Object.values(stats).map((stat: any) => stat.category))],
    });

    return stats;
  }

  public clearAllCaches(): void {
    console.log('🗑️ [TOOL-MANAGER] Clearing all tool caches...');
    let clearedCount = 0;

    for (const tool of this.tools.values()) {
      if (tool.clearCache) {
        tool.clearCache();
        clearedCount++;
      }
    }

    console.log('✅ [TOOL-MANAGER] Caches cleared:', { clearedCount });
  }

  public getRegistry(): ToolRegistry {
    console.log('📋 [TOOL-MANAGER] Getting registry');
    return this.registry;
  }

  public addWatcher(watcher: (tool: BaseTool, action: 'add' | 'remove' | 'update') => void): void {
    console.log('👁️ [TOOL-MANAGER] Adding watcher');
    this.watchers.add(watcher);
  }

  public removeWatcher(
    watcher: (tool: BaseTool, action: 'add' | 'remove' | 'update') => void,
  ): void {
    console.log('👁️ [TOOL-MANAGER] Removing watcher');
    this.watchers.delete(watcher);
  }

  private notifyWatchers(tool: BaseTool, action: 'add' | 'remove' | 'update'): void {
    console.log('🔔 [TOOL-MANAGER] Notifying watchers:', {
      toolName: tool.getMetadata().name,
      action,
      watcherCount: this.watchers.size,
    });

    for (const watcher of this.watchers) {
      try {
        watcher(tool, action);
      } catch (error: any) {
        console.log('❌ [TOOL-MANAGER] Watcher notification failed:', {
          error: error.message,
          toolName: tool.getMetadata().name,
          action,
        });
      }
    }
  }

  public validateTool(tool: BaseTool): { valid: boolean; errors: string[] } {
    console.log('🔍 [TOOL-MANAGER] Validating tool:', tool.getMetadata().name);

    const errors: string[] = [];
    const metadata = tool.getMetadata();

    // Check required fields
    if (!metadata.name) {
      errors.push('Tool name is required');
    }
    if (!metadata.category) {
      errors.push('Tool category is required');
    }
    if (!metadata.description) {
      errors.push('Tool description is required');
    }

    // Check for duplicate names
    if (this.tools.has(metadata.name)) {
      errors.push(`Tool with name '${metadata.name}' already exists`);
    }

    // Validate tool implementation
    if (typeof tool.execute !== 'function') {
      errors.push('Tool must implement execute method');
    }

    const valid = errors.length === 0;
    console.log('🔍 [TOOL-MANAGER] Tool validation result:', {
      toolName: metadata.name,
      valid,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });

    return { valid, errors };
  }

  public getSummary(): {
    totalTools: number;
    enabledTools: number;
    categories: string[];
    categoriesCount: Record<string, number>;
  } {
    console.log('📊 [TOOL-MANAGER] Getting summary...');

    const enabledTools = Array.from(this.tools.values()).filter((tool) => tool.getConfig().enabled);

    const categoriesCount: Record<string, number> = {};
    for (const tool of this.tools.values()) {
      const category = tool.getMetadata().category;
      categoriesCount[category] = (categoriesCount[category] || 0) + 1;
    }

    const summary = {
      totalTools: this.tools.size,
      enabledTools: enabledTools.length,
      categories: Object.keys(this.registry),
      categoriesCount,
    };

    console.log('📊 [TOOL-MANAGER] Summary:', summary);
    return summary;
  }
}
