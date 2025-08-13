import { Router, Request, Response } from 'express';
import { defaultAgentService, ChatRequest } from '../agent';
import { logger } from '../shared/utils/logger';

const router = Router();

// POST /chat - Main chat endpoint
router.post('/chat', async (req: Request, res: Response) => {
  const startTime = Date.now();
  logger.info('POST /api/chat start');

  try {
    const { message, sessionId, context } = req.body;
    logger.debug('chat payload received');

    if (!message || typeof message !== 'string') {
      logger.warn('invalid message');
      return res.status(400).json({
        success: false,
        error: {
          message: 'Message is required and must be a string',
          code: 'INVALID_MESSAGE',
        },
      });
    }

    // Add widgetId to context if provided
    const enhancedContext = {
      ...context,
    };

    const chatRequest: ChatRequest = {
      message,
      sessionId,
      context: enhancedContext,
    };

    logger.info('calling agent service');

    const response = await defaultAgentService.processChat(chatRequest);
    // ensure we persist context to session immediately for history-aware behavior
    await defaultAgentService
      .getEngine()
      .processMessage('', response.sessionId, enhancedContext)
      .catch(() => {});
    const responseTime = Date.now() - startTime;

    logger.info('chat handled', { responseTime });

    // Allow empty output when no valid route/context; client can decide UX
    res.status(200).json({ success: true, data: response });
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    logger.error('chat error', { error: error.message, responseTime });

    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: error.message,
      },
    });
  }
});

// GET /chat/session/:sessionId - Get session information
router.get('/chat/session/:sessionId', async (req: Request, res: Response) => {
  logger.info('GET /api/chat/session');

  try {
    const { sessionId } = req.params;

    const session = defaultAgentService.getSession(sessionId);

    if (!session) {
      logger.warn('session not found');
      return res.status(404).json({
        success: false,
        error: {
          message: 'Session not found',
          code: 'SESSION_NOT_FOUND',
        },
      });
    }

    logger.info('session found');

    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    logger.error('session get error', { error: error.message });

    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    });
  }
});

// DELETE /chat/session/:sessionId - Clear session
router.delete('/chat/session/:sessionId', async (req: Request, res: Response) => {
  logger.info('DELETE /api/chat/session');

  try {
    const { sessionId } = req.params;

    const deleted = defaultAgentService.clearSession(sessionId);

    if (!deleted) {
      logger.warn('session not found for deletion');
      return res.status(404).json({
        success: false,
        error: {
          message: 'Session not found',
          code: 'SESSION_NOT_FOUND',
        },
      });
    }

    logger.info('session cleared');

    res.status(200).json({
      success: true,
      message: 'Session cleared successfully',
    });
  } catch (error: any) {
    logger.error('session clear error', { error: error.message });

    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    });
  }
});

// GET /chat/stats - Get agent statistics
router.get('/chat/stats', async (req: Request, res: Response) => {
  logger.info('GET /api/chat/stats');

  try {
    const stats = defaultAgentService.getMetrics();

    logger.info('stats retrieved');

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error('stats error', { error: error.message });

    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    });
  }
});

// GET /chat/health - Health check for chat service
router.get('/chat/health', (req: Request, res: Response) => {
  logger.info('GET /api/chat/health');

  res.status(200).json({
    success: true,
    message: 'Chat service is healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;
