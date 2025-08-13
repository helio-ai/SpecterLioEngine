// Tool Configuration Constants
export const AVAILABLE_TOOLS = {
  DEFAULT_CHAT: 'defaultChat',
  TRACK_ORDER: 'trackOrder',
  RECOMMEND_PRODUCTS: 'recommendProducts',
  EDIT_ORDER: 'editOrder',
  CANCEL_ORDER: 'cancelOrder',
} as const;

export type AvailableTool = (typeof AVAILABLE_TOOLS)[keyof typeof AVAILABLE_TOOLS];

// Tool metadata with descriptions and requirements
export const TOOL_METADATA = {
  [AVAILABLE_TOOLS.DEFAULT_CHAT]: {
    name: 'Default Chat',
    description: 'General conversation and FAQ handling',
    category: 'core',
    requiresAuth: false,
    requiresShopify: false,
    defaultEnabled: true,
  },
  [AVAILABLE_TOOLS.TRACK_ORDER]: {
    name: 'Track Order',
    description: 'Track order status and shipping information',
    category: 'order',
    requiresAuth: false,
    requiresShopify: true,
    defaultEnabled: true,
  },
  [AVAILABLE_TOOLS.RECOMMEND_PRODUCTS]: {
    name: 'Product Recommendations',
    description: 'Recommend products based on user preferences',
    category: 'product',
    requiresAuth: false,
    requiresShopify: true,
    defaultEnabled: true,
  },
  [AVAILABLE_TOOLS.EDIT_ORDER]: {
    name: 'Edit Order',
    description: 'Modify existing order details',
    category: 'order',
    requiresAuth: true,
    requiresShopify: true,
    defaultEnabled: false,
  },
  [AVAILABLE_TOOLS.CANCEL_ORDER]: {
    name: 'Cancel Order',
    description: 'Cancel existing orders',
    category: 'order',
    requiresAuth: true,
    requiresShopify: true,
    defaultEnabled: false,
  },
} as const;

// Tool categories for grouping
export const TOOL_CATEGORIES = {
  CORE: 'core',
  ORDER: 'order',
  PRODUCT: 'product',
} as const;

// Default tool configurations for different widget types
export const DEFAULT_TOOL_CONFIGS = {
  BASIC: {
    enabledTools: [
      AVAILABLE_TOOLS.DEFAULT_CHAT,
      AVAILABLE_TOOLS.TRACK_ORDER,
      AVAILABLE_TOOLS.RECOMMEND_PRODUCTS,
    ],
    disabledTools: [AVAILABLE_TOOLS.EDIT_ORDER, AVAILABLE_TOOLS.CANCEL_ORDER],
  },
  STANDARD: {
    enabledTools: [
      AVAILABLE_TOOLS.DEFAULT_CHAT,
      AVAILABLE_TOOLS.TRACK_ORDER,
      AVAILABLE_TOOLS.RECOMMEND_PRODUCTS,
      AVAILABLE_TOOLS.EDIT_ORDER,
    ],
    disabledTools: [AVAILABLE_TOOLS.CANCEL_ORDER],
  },
  PREMIUM: {
    enabledTools: Object.values(AVAILABLE_TOOLS),
    disabledTools: [],
  },
} as const;

// Tool-specific prompt templates
export const TOOL_PROMPT_TEMPLATES = {
  [AVAILABLE_TOOLS.DEFAULT_CHAT]: {
    description:
      "general questions, FAQs, company info, policies, customer service, returns, refunds, shipping info, or ANY question that doesn't specifically match other tools",
    examples: [
      'How do I contact support?',
      'What are your return policies?',
      'Tell me about your company',
      'How do I get a refund?',
      'What are your shipping options?',
    ],
  },
  [AVAILABLE_TOOLS.RECOMMEND_PRODUCTS]: {
    description:
      'users specifically ask for product recommendations, suggestions, product search, or want to see products',
    examples: [
      'Recommend me a gift',
      'What products do you have?',
      'Show me best sellers',
      'I need a recommendation',
      'What should I buy?',
    ],
  },
  [AVAILABLE_TOOLS.TRACK_ORDER]: {
    description:
      'users specifically ask about order status, tracking, or shipping information with an order number. But if orderId is not provided ask for orderId.',
    examples: [
      'Where is my order?',
      'Track order #1234',
      'When will my package arrive?',
      'What is the status of order #5678?',
    ],
  },
  [AVAILABLE_TOOLS.EDIT_ORDER]: {
    description:
      'users specifically want to modify their existing order details like address, phone, or contact info. But if orderId is not provided ask for orderId and updates.',
    examples: [
      'Change my shipping address',
      'Update my phone number',
      'Edit order #1234',
      'I need to change my order',
    ],
  },
  [AVAILABLE_TOOLS.CANCEL_ORDER]: {
    description:
      'users specifically want to cancel their existing order. But if orderId is not provided ask for orderId and reason for cancellation.',
    examples: [
      'Cancel my order',
      'I want to cancel #1234',
      'Cancel order',
      'I need to cancel my purchase',
    ],
  },
} as const;

// Helper functions
export const getToolMetadata = (toolName: AvailableTool) => {
  return TOOL_METADATA[toolName];
};

export const getEnabledTools = (toolConfig: any): AvailableTool[] => {
  if (!toolConfig || !toolConfig.enabledTools) {
    return [...DEFAULT_TOOL_CONFIGS.BASIC.enabledTools];
  }
  return toolConfig.enabledTools.filter((tool: string) =>
    Object.values(AVAILABLE_TOOLS).includes(tool as AvailableTool),
  );
};

export const getDisabledTools = (toolConfig: any): AvailableTool[] => {
  if (!toolConfig || !toolConfig.disabledTools) {
    return [...DEFAULT_TOOL_CONFIGS.BASIC.disabledTools];
  }
  return toolConfig.disabledTools.filter((tool: string) =>
    Object.values(AVAILABLE_TOOLS).includes(tool as AvailableTool),
  );
};

export const isToolEnabled = (toolName: AvailableTool, toolConfig: any): boolean => {
  const enabledTools = getEnabledTools(toolConfig);
  return enabledTools.includes(toolName);
};

export const getToolPromptInstructions = (enabledTools: AvailableTool[]): string => {
  const instructions = enabledTools.map((tool) => {
    const template = TOOL_PROMPT_TEMPLATES[tool];
    return `**${tool}**: Use ONLY when ${template.description.toLowerCase()}. Examples: ${template.examples
      .map((ex) => `"${ex}"`)
      .join(', ')}`;
  });

  return instructions.join('\n');
};
