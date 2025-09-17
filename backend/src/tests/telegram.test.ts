import request from 'supertest';
import { app } from '../app';
import { db } from '@/database/connection';

describe('Telegram API', () => {
  beforeAll(async () => {
    // Подготовка тестовой БД
    await db.testConnection();
  });

  afterAll(async () => {
    await db.close();
  });

  describe('POST /api/telegram/events', () => {
    it('should create a bot command event successfully', async () => {
      const botEvent = {
        update_id: 123456789,
        event_type: 'command',
        user: {
          id: 987654321,
          is_bot: false,
          first_name: 'Test',
          last_name: 'User',
          username: 'testuser'
        },
        data: {
          command: '/start',
          text: '/start'
        },
        timestamp: new Date().toISOString()
      };

      const response = await request(app)
        .post('/api/telegram/events')
        .send(botEvent)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.event_id).toBeDefined();
    });

    it('should create a callback query event successfully', async () => {
      const botEvent = {
        update_id: 123456790,
        event_type: 'callback_query',
        user: {
          id: 987654322,
          is_bot: false,
          first_name: 'Test2',
          last_name: 'User2'
        },
        data: {
          callback_query: {
            id: 'callback123',
            from: {
              id: 987654322,
              is_bot: false,
              first_name: 'Test2',
              last_name: 'User2'
            },
            data: 'button_clicked',
            chat_instance: 'chat123'
          }
        },
        timestamp: new Date().toISOString()
      };

      const response = await request(app)
        .post('/api/telegram/events')
        .send(botEvent)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.event_id).toBeDefined();
    });

    it('should return 400 for invalid request', async () => {
      const invalidEvent = {
        update_id: 'invalid',
        event_type: 'unknown',
        user: {
          id: 'invalid'
        }
      };

      const response = await request(app)
        .post('/api/telegram/events')
        .send(invalidEvent)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Validation failed');
    });
  });

  describe('POST /api/telegram/users', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        telegram_id: 111222333,
        first_name: 'New',
        last_name: 'User',
        username: 'newuser',
        language_code: 'en'
      };

      const response = await request(app)
        .post('/api/telegram/users')
        .send(userData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.is_new).toBe(true);
      expect(response.body.data.user_id).toBeDefined();
    });

    it('should update existing user successfully', async () => {
      const userData = {
        telegram_id: 111222333, // Тот же ID что и выше
        first_name: 'Updated',
        last_name: 'User',
        username: 'updateduser'
      };

      const response = await request(app)
        .post('/api/telegram/users')
        .send(userData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.is_new).toBe(false);
    });

    it('should return 400 for invalid user data', async () => {
      const invalidUser = {
        telegram_id: 'invalid',
        first_name: '', // Пустое имя
      };

      const response = await request(app)
        .post('/api/telegram/users')
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Validation failed');
    });
  });

  describe('POST /api/telegram/events/create', () => {
    it('should create an event successfully', async () => {
      const eventData = {
        user_telegram_id: 111222333,
        event_type: 'bot_command',
        properties: {
          command: '/help',
          text: '/help',
          response_time_ms: 150
        },
        timestamp: new Date().toISOString()
      };

      const response = await request(app)
        .post('/api/telegram/events/create')
        .send(eventData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.event_id).toBeDefined();
    });

    it('should return 400 for invalid event data', async () => {
      const invalidEvent = {
        user_telegram_id: 'invalid',
        event_type: 'unknown_type',
        properties: {
          invalid_property: 'value'
        }
      };

      const response = await request(app)
        .post('/api/telegram/events/create')
        .send(invalidEvent)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Validation failed');
    });

    it('should return 500 for non-existent user', async () => {
      const eventData = {
        user_telegram_id: 999999999, // Несуществующий пользователь
        event_type: 'bot_command',
        properties: {
          command: '/test'
        }
      };

      const response = await request(app)
        .post('/api/telegram/events/create')
        .send(eventData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('GET /api/telegram/users/:telegramId/stats', () => {
    it('should return user stats successfully', async () => {
      const response = await request(app)
        .get('/api/telegram/users/111222333/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total_events');
      expect(response.body.data).toHaveProperty('purchase_count');
    });

    it('should return 400 for invalid telegram_id', async () => {
      const response = await request(app)
        .get('/api/telegram/users/invalid/stats')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid telegram_id format');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/telegram/users/999999999/stats')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('User not found');
    });
  });

  describe('GET /api/telegram/users/:telegramId/events', () => {
    it('should return user events successfully', async () => {
      const response = await request(app)
        .get('/api/telegram/users/111222333/events?limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should return 400 for invalid limit', async () => {
      const response = await request(app)
        .get('/api/telegram/users/111222333/events?limit=200')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Limit must be between 1 and 100');
    });
  });

  describe('GET /api/telegram/users/:telegramId/active', () => {
    it('should return user activity status', async () => {
      const response = await request(app)
        .get('/api/telegram/users/111222333/active?days=30')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('is_active');
      expect(response.body.data).toHaveProperty('days_checked');
      expect(response.body.data.days_checked).toBe(30);
    });

    it('should return 400 for invalid days parameter', async () => {
      const response = await request(app)
        .get('/api/telegram/users/111222333/active?days=500')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Days must be between 1 and 365');
    });
  });

  describe('POST /api/telegram/webhook', () => {
    it('should process message webhook successfully', async () => {
      const webhookData = {
        update_id: 123456791,
        message: {
          message_id: 123,
          from: {
            id: 987654323,
            is_bot: false,
            first_name: 'Webhook',
            last_name: 'Test'
          },
          date: Date.now(),
          chat: {
            id: 987654323,
            type: 'private'
          },
          text: 'Hello bot!'
        }
      };

      const response = await request(app)
        .post('/api/telegram/webhook')
        .send(webhookData)
        .expect(200);

      expect(response.body).toEqual({ ok: true });
    });

    it('should process callback query webhook successfully', async () => {
      const webhookData = {
        update_id: 123456792,
        callback_query: {
          id: 'callback456',
          from: {
            id: 987654324,
            is_bot: false,
            first_name: 'Callback',
            last_name: 'Test'
          },
          data: 'button_pressed',
          chat_instance: 'chat456'
        }
      };

      const response = await request(app)
        .post('/api/telegram/webhook')
        .send(webhookData)
        .expect(200);

      expect(response.body).toEqual({ ok: true });
    });
  });

  describe('GET /api/telegram/info', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/api/telegram/info')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('version');
      expect(response.body.data).toHaveProperty('endpoints');
      expect(response.body.data).toHaveProperty('rate_limits');
      expect(Array.isArray(response.body.data.endpoints)).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting', async () => {
      // Делаем много запросов подряд
      const promises = Array(10).fill(null).map(() =>
        request(app).get('/api/telegram/info')
      );

      const responses = await Promise.all(promises);
      
      // Все запросы должны пройти (лимит 1000 за 15 минут)
      responses.forEach(response => {
        expect(response.status).toBeLessThan(429);
      });
    });
  });
});
