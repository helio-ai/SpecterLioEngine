// Temporarily disabled base logger for detailed flow analysis
// import { logger as baseLogger } from '../../utils/logger';

// Detailed chat-specific logger for agentic flow analysis
export const agentLogger = {
  info: (message: string, meta?: Record<string, any>) => {
    const emoji = getEmojiForMessage(message);
    console.log(`${emoji} [SERVICE] ${message}...`);

    if (meta) {
      Object.entries(meta).forEach(([key, value]) => {
        if (typeof value === 'string' && value.length > 50) {
          console.log(`📝 [SERVICE] ${key}: "${value.substring(0, 50)}..."`);
        } else if (typeof value === 'string') {
          console.log(`📝 [SERVICE] ${key}: "${value}"`);
        } else if (Array.isArray(value)) {
          console.log(`📋 [SERVICE] ${key}: ${value.join(', ')}`);
        } else {
          console.log(`📊 [SERVICE] ${key}: ${value}`);
        }
      });
    }
  },

  error: (message: string, meta?: Record<string, any>) => {
    const emoji = '❌';
    console.log(`${emoji} [SERVICE] ${message}`);

    if (meta) {
      Object.entries(meta).forEach(([key, value]) => {
        console.log(`❌ [SERVICE] ${key}: ${value}`);
      });
    }
  },

  warn: (message: string, meta?: Record<string, any>) => {
    const emoji = '⚠️';
    console.log(`${emoji} [SERVICE] ${message}`);

    if (meta) {
      Object.entries(meta).forEach(([key, value]) => {
        console.log(`⚠️ [SERVICE] ${key}: ${value}`);
      });
    }
  },

  debug: (message: string, meta?: Record<string, any>) => {
    const emoji = '🔧';
    console.log(`${emoji} [SERVICE] ${message}`);

    if (meta) {
      Object.entries(meta).forEach(([key, value]) => {
        console.log(`🔧 [SERVICE] ${key}: ${value}`);
      });
    }
  },

  // Special methods for detailed flow logging
  service: (message: string, meta?: Record<string, any>) => {
    const emoji = '🔄';
    console.log(`${emoji} [SERVICE] ${message}...`);

    if (meta) {
      Object.entries(meta).forEach(([key, value]) => {
        if (typeof value === 'string' && value.length > 50) {
          console.log(`📝 [SERVICE] ${key}: "${value.substring(0, 50)}..."`);
        } else if (typeof value === 'string') {
          console.log(`📝 [SERVICE] ${key}: "${value}"`);
        } else if (Array.isArray(value)) {
          console.log(`📋 [SERVICE] ${key}: ${value.join(', ')}`);
        } else {
          console.log(`📊 [SERVICE] ${key}: ${value}`);
        }
      });
    }
  },

  agent: (message: string, meta?: Record<string, any>) => {
    const emoji = '🚀';
    console.log(`${emoji} [AGENT] ${message}...`);

    if (meta) {
      Object.entries(meta).forEach(([key, value]) => {
        if (typeof value === 'string' && value.length > 50) {
          console.log(`📝 [AGENT] ${key}: "${value.substring(0, 50)}..."`);
        } else if (typeof value === 'string') {
          console.log(`📝 [AGENT] ${key}: "${value}"`);
        } else if (Array.isArray(value)) {
          console.log(`📋 [AGENT] ${key}: ${value.join(', ')}`);
        } else {
          console.log(`📊 [AGENT] ${key}: ${value}`);
        }
      });
    }
  },

  graph: (message: string, meta?: Record<string, any>) => {
    const emoji = '📥';
    console.log(`${emoji} [GRAPH] ${message}...`);

    if (meta) {
      Object.entries(meta).forEach(([key, value]) => {
        if (typeof value === 'string' && value.length > 50) {
          console.log(`📝 [GRAPH] ${key}: "${value.substring(0, 50)}..."`);
        } else if (typeof value === 'string') {
          console.log(`📝 [GRAPH] ${key}: "${value}"`);
        } else if (Array.isArray(value)) {
          console.log(`📋 [GRAPH] ${key}: ${value.join(', ')}`);
        } else {
          console.log(`📊 [GRAPH] ${key}: ${value}`);
        }
      });
    }
  },

  tool: (toolName: string, message: string, meta?: Record<string, any>) => {
    const emoji = '🔧';
    console.log(`${emoji} [${toolName.toUpperCase()}-TOOL] ${message}...`);

    if (meta) {
      Object.entries(meta).forEach(([key, value]) => {
        if (typeof value === 'string' && value.length > 50) {
          console.log(`📝 [${toolName.toUpperCase()}-TOOL] ${key}: "${value.substring(0, 50)}..."`);
        } else if (typeof value === 'string') {
          console.log(`📝 [${toolName.toUpperCase()}-TOOL] ${key}: "${value}"`);
        } else if (Array.isArray(value)) {
          console.log(`📋 [${toolName.toUpperCase()}-TOOL] ${key}: ${value.join(', ')}`);
        } else {
          console.log(`📊 [${toolName.toUpperCase()}-TOOL] ${key}: ${value}`);
        }
      });
    }
  },

  success: (message: string, meta?: Record<string, any>) => {
    const emoji = '✅';
    console.log(`${emoji} [SERVICE] ${message}!`);

    if (meta) {
      Object.entries(meta).forEach(([key, value]) => {
        if (typeof value === 'string' && value.length > 50) {
          console.log(`📝 [SERVICE] ${key}: "${value.substring(0, 50)}..."`);
        } else if (typeof value === 'string') {
          console.log(`📝 [SERVICE] ${key}: "${value}"`);
        } else if (Array.isArray(value)) {
          console.log(`📋 [SERVICE] ${key}: ${value.join(', ')}`);
        } else {
          console.log(`📊 [SERVICE] ${key}: ${value}`);
        }
      });
    }
  },

  memory: (message: string, meta?: Record<string, any>) => {
    const emoji = '🧠';
    console.log(`${emoji} [AGENT] ${message}...`);

    if (meta) {
      Object.entries(meta).forEach(([key, value]) => {
        if (typeof value === 'string' && value.length > 50) {
          console.log(`📝 [AGENT] ${key}: "${value.substring(0, 50)}..."`);
        } else if (typeof value === 'string') {
          console.log(`📝 [AGENT] ${key}: "${value}"`);
        } else if (Array.isArray(value)) {
          console.log(`📋 [AGENT] ${key}: ${value.join(', ')}`);
        } else {
          console.log(`📊 [AGENT] ${key}: ${value}`);
        }
      });
    }
  },
};

function getEmojiForMessage(message: string): string {
  if (message.includes('Processing')) return '🔄';
  if (message.includes('Request')) return '📝';
  if (message.includes('sessionId')) return '🆔';
  if (message.includes('Looking')) return '🔍';
  if (message.includes('Creating')) return '🆕';
  if (message.includes('Initializing')) return '🚀';
  if (message.includes('LLM')) return '🔧';
  if (message.includes('Tools')) return '🔧';
  if (message.includes('Prompt')) return '🔧';
  if (message.includes('Memory')) return '🔧';
  if (message.includes('Agent')) return '🔧';
  if (message.includes('Executor')) return '🔧';
  if (message.includes('Graph')) return '🔧';
  if (message.includes('complete')) return '✅';
  if (message.includes('stored')) return '✅';
  if (message.includes('Starting')) return '🚀';
  if (message.includes('Attempt')) return '🔄';
  if (message.includes('Input')) return '📝';
  if (message.includes('Invoking')) return '🚀';
  if (message.includes('Echoing')) return '📥';
  if (message.includes('Calling')) return '🤖';
  if (message.includes('execution')) return '✅';
  if (message.includes('Returning')) return '📤';
  if (message.includes('processed')) return '✅';
  if (message.includes('Response')) return '📤';
  if (message.includes('Getting')) return '📊';
  if (message.includes('Retrieving')) return '🧠';
  if (message.includes('contains')) return '📚';
  if (message.includes('Getting')) return '🔧';
  if (message.includes('Available')) return '📋';
  if (message.includes('processed')) return '✅';
  if (message.includes('Response')) return '📤';
  if (message.includes('Memory')) return '📊';
  if (message.includes('Tools')) return '🔧';
  if (message.includes('Timestamp')) return '⏰';
  return '📝';
}
