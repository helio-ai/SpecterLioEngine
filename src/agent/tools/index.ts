// Tool Classes
export { BooksTool } from './books-tool';
export { CampaignAnalyzerTool } from './campaign-analyzer-tool';

// Tool Factory
import { BooksTool } from './books-tool';
import { CampaignAnalyzerTool } from './campaign-analyzer-tool';
import { BaseTool } from '../core/base-tool';

export class ToolFactory {
  private static toolClasses = {
    searchBooks: BooksTool,
    analyzeCampaigns: CampaignAnalyzerTool,
  };

  static createTool(toolName: string): BaseTool | null {
    console.log('🔧 [TOOL-FACTORY] Creating tool:', toolName);

    const ToolClass = this.toolClasses[toolName as keyof typeof this.toolClasses];

    if (!ToolClass) {
      console.log('❌ [TOOL-FACTORY] Tool class not found:', toolName);
      return null;
    }

    console.log('✅ [TOOL-FACTORY] Tool created successfully:', toolName);
    return new ToolClass();
  }

  static createAllTools(): BaseTool[] {
    console.log('🔧 [TOOL-FACTORY] Creating all tools...');
    const tools = Object.values(this.toolClasses).map((ToolClass) => new ToolClass());
    console.log('✅ [TOOL-FACTORY] All tools created:', {
      count: tools.length,
      toolNames: tools.map((tool) => tool.getMetadata().name),
    });
    return tools;
  }

  static getAvailableToolNames(): string[] {
    console.log('📝 [TOOL-FACTORY] Getting available tool names');
    const names = Object.keys(this.toolClasses);
    console.log('📝 [TOOL-FACTORY] Available tool names:', names);
    return names;
  }

  static getToolClass(toolName: string): any {
    console.log('🔍 [TOOL-FACTORY] Getting tool class:', toolName);
    const toolClass = this.toolClasses[toolName as keyof typeof this.toolClasses];
    if (toolClass) {
      console.log('✅ [TOOL-FACTORY] Tool class found:', toolName);
    } else {
      console.log('❌ [TOOL-FACTORY] Tool class not found:', toolName);
    }
    return toolClass;
  }
}

// Legacy exports for backward compatibility
console.log('📦 [TOOL-FACTORY] Creating legacy exports...');
export const booksTool = new BooksTool().getTool();
export const campaignAnalyzerTool = new CampaignAnalyzerTool().getTool();

export const availableTools = ['searchBooks', 'analyzeCampaigns'] as const;

export type AvailableTool = (typeof availableTools)[number];
