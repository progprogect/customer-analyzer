// Jest setup file
// Этот файл выполняется перед каждым тестом

// Увеличиваем timeout для async операций
jest.setTimeout(10000);

// Настройки для тестирования
process.env.NODE_ENV = 'test';

// Mock для console.log в тестах (опционально)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Настройки для тестирования с базой данных
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'customer_analyzer_test';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';

// Настройки для ML сервисов
process.env.ML_API_URL = 'http://localhost:8000';
process.env.ML_API_KEY = 'test_key';

// Настройки для Telegram Bot
process.env.TELEGRAM_BOT_TOKEN = 'test_token';
process.env.TELEGRAM_WEBHOOK_URL = 'http://localhost:3001/api/telegram/webhook';

// Настройки для JWT
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.JWT_EXPIRES_IN = '1h';

// Настройки для логирования
process.env.LOG_LEVEL = 'error';

// Глобальные утилиты для тестов
global.testUtils = {
  // Генерация тестовых данных
  generateTestUser: () => ({
    user_id: Math.floor(Math.random() * 1000000),
    telegram_id: Math.floor(Math.random() * 1000000000),
    first_name: 'Test',
    last_name: 'User',
    username: 'testuser',
    registration_date: new Date().toISOString(),
  }),
  
  generateTestEvent: (userId) => ({
    user_id: userId,
    product_id: Math.floor(Math.random() * 1000),
    event_type: 'view',
    event_timestamp: new Date().toISOString(),
    properties: { test: true },
  }),
  
  // Ожидание async операций
  waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Проверка валидности UUID
  isValidUUID: (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },
};
