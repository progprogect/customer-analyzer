import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { telegramService } from '@/services/telegramService';
import { logger } from '@/utils/logger';
import { asyncHandler } from '@/middleware/errorHandler';
import { 
  validateBotEventRequest, 
  validateUserUpsertRequest, 
  validateEventCreateRequest,
  validateWebhookRequest 
} from '@/validation/telegramSchemas';
import { ApiResponse, BotEventResponse } from '@/types';

const router = Router();

// Rate limiting для Telegram API (более строгий)
const telegramLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 1000, // 1000 запросов за окно
  message: {
    success: false,
    error: 'Too many requests from Telegram Bot',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Эндпоинт для приема событий от Telegram Bot
 * POST /api/telegram/events
 */
router.post('/events', telegramLimiter, asyncHandler(async (req: Request, res: Response) => {
  const validation = validateBotEventRequest(req.body);
  
  if (!validation.success) {
    logger.warn('Invalid bot event request:', validation.error);
    const response: ApiResponse = {
      success: false,
      error: `Validation failed: ${validation.error}`,
      timestamp: new Date().toISOString()
    };
    return res.status(400).json(response);
  }

  try {
    const result = await telegramService.processBotEvent(validation.data!);
    
    const response: ApiResponse<BotEventResponse> = {
      success: result.success,
      data: result,
      timestamp: new Date().toISOString()
    };

    const statusCode = result.success ? 200 : 500;
    res.status(statusCode).json(response);

  } catch (error) {
    logger.error('Error processing bot event:', error);
    
    const response: ApiResponse = {
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    };
    
    res.status(500).json(response);
  }
}));

/**
 * Эндпоинт для создания/обновления пользователя
 * POST /api/telegram/users
 */
router.post('/users', telegramLimiter, asyncHandler(async (req: Request, res: Response) => {
  const validation = validateUserUpsertRequest(req.body);
  
  if (!validation.success) {
    logger.warn('Invalid user upsert request:', validation.error);
    const response: ApiResponse = {
      success: false,
      error: `Validation failed: ${validation.error}`,
      timestamp: new Date().toISOString()
    };
    return res.status(400).json(response);
  }

  try {
    const result = await telegramService.upsertUser(validation.data!);
    
    const response: ApiResponse = {
      success: true,
      data: result,
      message: result.is_new ? 'User created successfully' : 'User updated successfully',
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);

  } catch (error) {
    logger.error('Error upserting user:', error);
    
    const response: ApiResponse = {
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    };
    
    res.status(500).json(response);
  }
}));

/**
 * Эндпоинт для создания события
 * POST /api/telegram/events/create
 */
router.post('/events/create', telegramLimiter, asyncHandler(async (req: Request, res: Response) => {
  const validation = validateEventCreateRequest(req.body);
  
  if (!validation.success) {
    logger.warn('Invalid event create request:', validation.error);
    const response: ApiResponse = {
      success: false,
      error: `Validation failed: ${validation.error}`,
      timestamp: new Date().toISOString()
    };
    return res.status(400).json(response);
  }

  try {
    const eventId = await telegramService.createEvent(validation.data!);
    
    const response: ApiResponse = {
      success: true,
      data: { event_id: eventId },
      message: 'Event created successfully',
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);

  } catch (error) {
    logger.error('Error creating event:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    };
    
    res.status(500).json(response);
  }
}));

/**
 * Эндпоинт для получения статистики пользователя
 * GET /api/telegram/users/:telegramId/stats
 */
router.get('/users/:telegramId/stats', asyncHandler(async (req: Request, res: Response) => {
  const telegramId = parseInt(req.params.telegramId);
  
  if (isNaN(telegramId)) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid telegram_id format',
      timestamp: new Date().toISOString()
    };
    return res.status(400).json(response);
  }

  try {
    const stats = await telegramService.getUserStats(telegramId);
    
    const response: ApiResponse = {
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);

  } catch (error) {
    logger.error('Error getting user stats:', error);
    
    const response: ApiResponse = {
      success: false,
      error: 'User not found or internal server error',
      timestamp: new Date().toISOString()
    };
    
    res.status(404).json(response);
  }
}));

/**
 * Эндпоинт для получения последних событий пользователя
 * GET /api/telegram/users/:telegramId/events
 */
router.get('/users/:telegramId/events', asyncHandler(async (req: Request, res: Response) => {
  const telegramId = parseInt(req.params.telegramId);
  const limit = parseInt(req.query.limit as string) || 10;
  
  if (isNaN(telegramId)) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid telegram_id format',
      timestamp: new Date().toISOString()
    };
    return res.status(400).json(response);
  }

  if (limit < 1 || limit > 100) {
    const response: ApiResponse = {
      success: false,
      error: 'Limit must be between 1 and 100',
      timestamp: new Date().toISOString()
    };
    return res.status(400).json(response);
  }

  try {
    const events = await telegramService.getUserRecentEvents(telegramId, limit);
    
    const response: ApiResponse = {
      success: true,
      data: events,
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);

  } catch (error) {
    logger.error('Error getting user events:', error);
    
    const response: ApiResponse = {
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    };
    
    res.status(500).json(response);
  }
}));

/**
 * Эндпоинт для проверки активности пользователя
 * GET /api/telegram/users/:telegramId/active
 */
router.get('/users/:telegramId/active', asyncHandler(async (req: Request, res: Response) => {
  const telegramId = parseInt(req.params.telegramId);
  const days = parseInt(req.query.days as string) || 30;
  
  if (isNaN(telegramId)) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid telegram_id format',
      timestamp: new Date().toISOString()
    };
    return res.status(400).json(response);
  }

  if (days < 1 || days > 365) {
    const response: ApiResponse = {
      success: false,
      error: 'Days must be between 1 and 365',
      timestamp: new Date().toISOString()
    };
    return res.status(400).json(response);
  }

  try {
    const isActive = await telegramService.isUserActive(telegramId, days);
    
    const response: ApiResponse = {
      success: true,
      data: { is_active: isActive, days_checked: days },
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);

  } catch (error) {
    logger.error('Error checking user activity:', error);
    
    const response: ApiResponse = {
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    };
    
    res.status(500).json(response);
  }
}));

/**
 * Webhook эндпоинт для Telegram Bot API
 * POST /api/telegram/webhook
 */
router.post('/webhook', telegramLimiter, asyncHandler(async (req: Request, res: Response) => {
  const validation = validateWebhookRequest(req.body);
  
  if (!validation.success) {
    logger.warn('Invalid webhook request:', validation.error);
    const response: ApiResponse = {
      success: false,
      error: `Validation failed: ${validation.error}`,
      timestamp: new Date().toISOString()
    };
    return res.status(400).json(response);
  }

  try {
    const update = validation.data;
    
    // Обрабатываем сообщение
    if (update.message) {
      const botEvent = {
        update_id: update.update_id,
        event_type: 'message' as const,
        user: update.message.from!,
        data: {
          message: update.message,
          text: update.message.text
        },
        timestamp: new Date().toISOString()
      };

      const result = await telegramService.processBotEvent(botEvent);
      
      if (!result.success) {
        logger.error('Failed to process message event:', result.error);
      }
    }
    
    // Обрабатываем callback query
    if (update.callback_query) {
      const botEvent = {
        update_id: update.update_id,
        event_type: 'callback_query' as const,
        user: update.callback_query.from,
        data: {
          callback_query: update.callback_query
        },
        timestamp: new Date().toISOString()
      };

      const result = await telegramService.processBotEvent(botEvent);
      
      if (!result.success) {
        logger.error('Failed to process callback query event:', result.error);
      }
    }

    // Telegram ожидает OK ответ
    res.status(200).json({ ok: true });

  } catch (error) {
    logger.error('Error processing webhook:', error);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}));

/**
 * Эндпоинт для получения информации о Telegram API
 * GET /api/telegram/info
 */
router.get('/info', asyncHandler(async (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    data: {
      version: '1.0.0',
      endpoints: [
        'POST /api/telegram/events - Create bot event',
        'POST /api/telegram/users - Upsert user',
        'POST /api/telegram/events/create - Create event',
        'GET /api/telegram/users/:telegramId/stats - Get user stats',
        'GET /api/telegram/users/:telegramId/events - Get user events',
        'GET /api/telegram/users/:telegramId/active - Check user activity',
        'POST /api/telegram/webhook - Telegram webhook'
      ],
      rate_limits: {
        window: '15 minutes',
        max_requests: 1000
      }
    },
    timestamp: new Date().toISOString()
  };

  res.status(200).json(response);
}));

export default router;
