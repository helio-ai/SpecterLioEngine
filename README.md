# Helio AI Agent v2

A professional AI agent system built with Node.js, TypeScript, and LangChain, featuring advanced tool calling, memory management, and graph-based execution.

## 🚀 Features

### Core AI Agent Capabilities

- **Multi-Tool Support**: Books search, payment refunds, weather info, calculations
- **Memory Management**: Conversation history with BufferMemory
- **Retry Logic**: Automatic retry with exponential backoff
- **Graph Execution**: StateGraph-based workflow orchestration
- **Session Management**: Multi-session support with automatic cleanup
- **RESTful API**: Complete chat API with session management

### Available Tools

- 📚 **Books Tool**: Search Google Books API (example)
- 📊 **Campaign Analyzer Tool**: Deep analytics for campaigns, templates, messages, and attribution

## 📁 Project Structure

```
helio-ai-agentv2/
├── src/
│   ├── agent/                 # AI Agent System
│   │   ├── config/           # Configuration files
│   │   ├── core/             # Core agent implementation
│   │   ├── services/         # Business logic services
│   │   ├── tools/            # Available tools
│   │   ├── types/            # TypeScript definitions
│   │   ├── utils/            # Utility functions
│   │   ├── examples/         # Usage examples
│   │   ├── test/             # Test files
│   │   └── README.md         # Agent documentation
│   ├── routes/               # API routes
│   ├── core/                 # Core application logic
│   ├── database/             # Database schemas
│   ├── utils/                # Shared utilities
│   └── index.ts              # Application entry point
├── scripts/                  # Utility scripts
├── dist/                     # Compiled output
└── README.md                 # This file
```

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd helio-ai-agentv2
   ```

2. **Install dependencies**

   ```bash
   yarn install
   ```

3. **Set up environment variables**

   ```bash
   cp env.example .env
   # Edit .env with your API keys and configuration
   ```

4. **Start the development server**
   ```bash
   yarn dev
   ```

## 🔧 Configuration

### Required Environment Variables

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5-mini
OPENAI_ORG_ID=your_openai_org_id

# Agent Configuration
AGENT_TEMPERATURE=0
AGENT_MAX_TOKENS=4000
AGENT_MEMORY_ENABLED=true
AGENT_RETRY_ENABLED=true
AGENT_MAX_RETRIES=3

# External APIs
GOOGLE_API_KEY=your_google_api_key
STRIPE_API_KEY=your_stripe_api_key

# Session Configuration
MAX_SESSIONS=1000
SESSION_TIMEOUT=3600000
MEMORY_LIMIT=50

# Database & Redis
MONGO_URI=your_mongodb_uri
REDIS_HOST=your_redis_host
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

## 📡 API Endpoints

### Chat API

#### `POST /api/chat`

Main chat endpoint for interacting with the AI agent.

**Request:**

```json
{
  "message": "Analyze last 7 days of campaigns for widgetId 507f1f77bcf86cd799439011",
  "sessionId": "optional-session-id",
  "context": {}
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "response": "I found these books about AI...",
    "sessionId": "session_1234567890_abc123",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "metadata": {
      "toolsUsed": ["searchBooks"],
      "memorySize": 5
    }
  }
}
```

#### `GET /api/chat/session/:sessionId`

Get session information and memory.

#### `DELETE /api/chat/session/:sessionId`

Clear session and memory.

#### `GET /api/chat/stats`

Get agent statistics and session information.

#### `GET /api/chat/health`

Health check for the chat service.

### Health Check

- `GET /health` - Application health check

## 🧪 Testing

### Run Agent Tests

```bash
yarn test:agent
```

### Manual Testing with curl

```bash
# Basic chat
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Search for books about machine learning"
  }'

# Session management
curl http://localhost:8080/api/chat/session/session_123
curl -X DELETE http://localhost:8080/api/chat/session/session_123
curl http://localhost:8080/api/chat/stats
```

## 🔄 Development

### Adding New Tools

1. Create a new tool file in `src/agent/tools/`
2. Export the tool from `src/agent/tools/index.ts`
3. Add the tool to the agent in `src/agent/core/agent.ts`

Example:

```typescript
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export const myTool = tool(
  async (input: unknown) => {
    const { param } = input as { param: string };
    // Tool logic here
    return JSON.stringify(result);
  },
  {
    name: 'myTool',
    description: 'Description of what this tool does',
    schema: z.object({
      param: z.string().describe('Parameter description'),
    }),
  },
);
```

### Project Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn test:agent` - Run agent tests

## 🏗️ Architecture

### Agent System Components

1. **Core Agent** (`src/agent/core/agent.ts`)
   - LLM initialization and configuration
   - Tool integration and management
   - Memory and retry logic
   - Graph-based execution

2. **Tools** (`src/agent/tools/`)
   - Modular tool implementations
   - Error handling and logging
   - Type-safe schemas

3. **Services** (`src/agent/services/`)
   - Business logic layer
   - Session management
   - Agent lifecycle management

4. **API Layer** (`src/routes/`)
   - RESTful endpoints
   - Request/response handling
   - Error management

### Data Flow

```
User Request → API Route → Agent Service → Core Agent → Tools → Response
     ↓              ↓           ↓            ↓         ↓        ↓
Session Mgmt → Validation → Processing → Execution → Results → Format
```

## 🔒 Security

- **Input Validation**: All inputs are validated
- **API Key Management**: Secure environment variable usage
- **Session Isolation**: Sessions are isolated from each other
- **Error Sanitization**: Sensitive information is not exposed
- **Rate Limiting**: Built-in rate limiting support

## 📊 Monitoring

- **Structured Logging**: All operations are logged
- **Health Checks**: Built-in health monitoring
- **Session Statistics**: Real-time session monitoring
- **Error Tracking**: Comprehensive error handling

## 🚀 Deployment

### Docker

```bash
docker build -t helio-ai-agent .
docker run -p 8080:8080 helio-ai-agent
```

### Environment Setup

1. Set all required environment variables
2. Ensure external APIs are accessible
3. Configure database and Redis connections
4. Set up monitoring and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Check the [Agent Documentation](src/agent/README.md)
- Review the API documentation
- Check the example files in `src/agent/examples/`
