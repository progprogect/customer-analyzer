/**
 * Тесты для Telegram Bot API
 */

import request from 'supertest';
import express from 'express';
import { telegramRouter } from '../routes/telegram';
import { telegramService } from '../services/telegramService';
import { telegramAuth } from '../middleware/telegramAuth';

// Mock для telegramService
jest.mock('../services/telegramService');
jest.mock('../middleware/telegramAuth');

describe('Telegram Bot API', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/telegram', telegramRouter);
    
    // Сброс моков
    jest.clearAllMocks();
  });

  describe('POST /api/telegram/event', () => {
    const validEvent = {
      user_id: 123456789,
      telegram_id: 987654321,
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      event_type: 'bot_command',
      event_timestamp: new Date().toISOString(),
      properties: {
        command: '/start',
        message_id: 1,
      },
    };

    it('должен успешно обрабатывать валидное событие', async () => {
      (telegramAuth as jest.Mock).mockImplementation((req, res, next) => next());
      (telegramService.processEvent as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Event processed successfully',
      });

      const response = await request(app)
        .post('/api/telegram/event')
        .send(validEvent)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(telegramService.processEvent).toHaveBeenCalledWith(validEvent);
    });

    it('должен возвращать ошибку при невалидных данных', async () => {
      (telegramAuth as jest.Mock).mockImplementation((req, res, next) => next());

      const invalidEvent = {
        // Отсутствует user_id
        telegram_id: 987654321,
        event_type: 'invalid_type',
      };

      const response = await request(app)
        .post('/api/telegram/event')
        .send(invalidEvent)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('должен обрабатывать ошибки сервиса', async () => {
      (telegramAuth as jest.Mock).mockImplementation((req, res, next) => next());
      (telegramService.processEvent as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .post('/api/telegram/event')
        .send(validEvent)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Database connection failed');
    });
  });

  describe('POST /api/telegram/callback', () => {
    const validCallback = {
      user_id: 123456789,
      telegram_id: 987654321,
      callback_data: 'recommendations_123',
      message_id: 1,
      timestamp: new Date().toISOString(),
    };

    it('должен успешно обрабатывать callback запрос', async () => {
      (telegramAuth as jest.Mock).mockImplementation((req, res, next) => next());
      (telegramService.processCallback as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Callback processed successfully',
        response: {
          text: 'Here are your recommendations',
          keyboard: [],
        },
      });

      const response = await request(app)
        .post('/api/telegram/callback')
        .send(validCallback)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response.text).toBe('Here are your recommendations');
      expect(telegramService.processCallback).toHaveBeenCalledWith(validCallback);
    });

    it('должен возвращать ошибку при невалидном callback', async () => {
      (telegramAuth as jest.Mock).mockImplementation((req, res, next) => next());

      const invalidCallback = {
        // Отсутствует callback_data
        user_id: 123456789,
        telegram_id: 987654321,
      };

      const response = await request(app)
        .post('/api/telegram/callback')
        .send(invalidCallback)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/telegram/message', () => {
    const validMessage = {
      user_id: 123456789,
      telegram_id: 987654321,
      message_type: 'text',
      text: 'Hello, bot!',
      message_id: 1,
      timestamp: new Date().toISOString(),
    };

    it('должен успешно обрабатывать текстовое сообщение', async () => {
      (telegramAuth as jest.Mock).mockImplementation((req, res, next) => next());
      (telegramService.processMessage as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Message processed successfully',
        response: {
          text: 'Hello! How can I help you?',
          keyboard: [
            [
              { text: 'Get Recommendations', callback_data: 'recommendations' },
            ],
          ],
        },
      });

      const response = await request(app)
        .post('/api/telegram/message')
        .send(validMessage)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response.text).toBe('Hello! How can I help you?');
      expect(telegramService.processMessage).toHaveBeenCalledWith(validMessage);
    });

    it('должен обрабатывать команды', async () => {
      (telegramAuth as jest.Mock).mockImplementation((req, res, next) => next());
      (telegramService.processMessage as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Command processed successfully',
        response: {
          text: 'Welcome to Customer Analyzer Bot!',
          keyboard: [
            [
              { text: 'Get Recommendations', callback_data: 'recommendations' },
              { text: 'My Profile', callback_data: 'profile' },
            ],
          ],
        },
      });

      const commandMessage = {
        ...validMessage,
        text: '/start',
      };

      const response = await request(app)
        .post('/api/telegram/message')
        .send(commandMessage)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response.text).toBe('Welcome to Customer Analyzer Bot!');
    });
  });

  describe('GET /api/telegram/webhook', () => {
    it('должен возвращать информацию о webhook', async () => {
      (telegramAuth as jest.Mock).mockImplementation((req, res, next) => next());
      (telegramService.getWebhookInfo as jest.Mock).mockResolvedValue({
        success: true,
        webhook_info: {
          url: 'https://example.com/webhook',
          has_custom_certificate: false,
          pending_update_count: 0,
          last_error_date: null,
          last_error_message: null,
          max_connections: 40,
        },
      });

      const response = await request(app)
        .get('/api/telegram/webhook')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.webhook_info).toBeDefined();
      expect(response.body.webhook_info.url).toBe('https://example.com/webhook');
    });
  });

  describe('POST /api/telegram/webhook', () => {
    const validWebhook = {
      url: 'https://example.com/webhook',
      max_connections: 40,
    };

    it('должен успешно устанавливать webhook', async () => {
      (telegramAuth as jest.Mock).mockImplementation((req, res, next) => next());
      (telegramService.setWebhook as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Webhook set successfully',
      });

      const response = await request(app)
        .post('/api/telegram/webhook')
        .send(validWebhook)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Webhook set successfully');
      expect(telegramService.setWebhook).toHaveBeenCalledWith(validWebhook);
    });

    it('должен возвращать ошибку при невалидном URL', async () => {
      (telegramAuth as jest.Mock).mockImplementation((req, res, next) => next());

      const invalidWebhook = {
        url: 'invalid-url',
        max_connections: 40,
      };

      const response = await request(app)
        .post('/api/telegram/webhook')
        .send(invalidWebhook)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid URL');
    });
  });

  describe('DELETE /api/telegram/webhook', () => {
    it('должен успешно удалять webhook', async () => {
      (telegramAuth as jest.Mock).mockImplementation((req, res, next) => next());
      (telegramService.deleteWebhook as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Webhook deleted successfully',
      });

      const response = await request(app)
        .delete('/api/telegram/webhook')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Webhook deleted successfully');
      expect(telegramService.deleteWebhook).toHaveBeenCalled();
    });
  });

  describe('Rate Limiting', () => {
    it('должен ограничивать количество запросов', async () => {
      (telegramAuth as jest.Mock).mockImplementation((req, res, next) => {
        // Имитируем превышение лимита
        res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
        });
      });

      const response = await request(app)
        .post('/api/telegram/event')
        .send(validEvent)
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Rate limit exceeded');
    });
  });

  describe('Authentication', () => {
    it('должен отклонять неавторизованные запросы', async () => {
      (telegramAuth as jest.Mock).mockImplementation((req, res, next) => {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      });

      const response = await request(app)
        .post('/api/telegram/event')
        .send(validEvent)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Unauthorized');
    });
  });
});
