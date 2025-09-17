// Backend Jest setup file
// Этот файл выполняется перед каждым тестом

// Увеличиваем timeout для async операций
jest.setTimeout(15000);

// Настройки для тестирования
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Настройки для тестовой базы данных
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'customer_analyzer_test';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_POOL_MIN = '1';
process.env.DB_POOL_MAX = '5';

// Настройки для JWT
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_only';
process.env.JWT_EXPIRES_IN = '1h';

// Настройки для Telegram Bot
process.env.TELEGRAM_BOT_TOKEN = 'test_telegram_bot_token';
process.env.TELEGRAM_WEBHOOK_URL = 'http://localhost:3001/api/telegram/webhook';
process.env.TELEGRAM_API_RATE_LIMIT = '100';

// Настройки для ML сервисов
process.env.ML_API_URL = 'http://localhost:8000';
process.env.ML_API_TIMEOUT = '30000';

// Настройки для сервера
process.env.PORT = '3001';
process.env.HOST = 'localhost';

// Mock для внешних сервисов
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// Mock для Telegram Bot API
jest.mock('node-telegram-bot-api', () => {
  return jest.fn().mockImplementation(() => ({
    sendMessage: jest.fn().mockResolvedValue({ message_id: 1 }),
    answerCallbackQuery: jest.fn().mockResolvedValue(true),
    setWebHook: jest.fn().mockResolvedValue(true),
    getWebHookInfo: jest.fn().mockResolvedValue({ url: '' }),
    on: jest.fn(),
    onText: jest.fn(),
    onCallbackQuery: jest.fn(),
  }));
});

// Глобальные утилиты для Backend тестов
global.backendTestUtils = {
  // Генерация тестовых пользователей
  generateTestUser: (overrides = {}) => ({
    user_id: Math.floor(Math.random() * 1000000),
    telegram_id: Math.floor(Math.random() * 1000000000),
    first_name: 'Test',
    last_name: 'User',
    username: 'testuser',
    registration_date: new Date().toISOString(),
    profile_data: {},
    ...overrides,
  }),
  
  // Генерация тестовых событий
  generateTestEvent: (userId, overrides = {}) => ({
    event_id: Math.floor(Math.random() * 1000000),
    user_id: userId,
    product_id: Math.floor(Math.random() * 1000),
    event_type: 'view',
    event_timestamp: new Date().toISOString(),
    properties: { test: true },
    ...overrides,
  }),
  
  // Генерация тестовых продуктов
  generateTestProduct: (overrides = {}) => ({
    product_id: Math.floor(Math.random() * 1000000),
    name: 'Test Product',
    category: 'test_category',
    price: 100.0,
    description: 'Test product description',
    attributes: { test: true },
    ...overrides,
  }),
  
  // Генерация тестовых метрик пользователя
  generateTestUserMetrics: (userId, overrides = {}) => ({
    user_id: userId,
    segment_id: Math.floor(Math.random() * 10),
    ltv: Math.random() * 1000,
    churn_probability: Math.random(),
    purchase_probability_30d: Math.random(),
    last_updated: new Date().toISOString(),
    ...overrides,
  }),
  
  // Генерация тестовых JWT токенов
  generateTestJWT: (payload = {}) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      {
        user_id: Math.floor(Math.random() * 1000000),
        telegram_id: Math.floor(Math.random() * 1000000000),
        ...payload,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  },
  
  // Ожидание async операций
  waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Очистка тестовой базы данных
  cleanTestDatabase: async () => {
    // Эта функция будет реализована в global setup/teardown
    console.log('Cleaning test database...');
  },
  
  // Проверка валидности API ответа
  validateApiResponse: (response, expectedStructure) => {
    expect(response).toHaveProperty('success');
    expect(response).toHaveProperty('timestamp');
    
    if (expectedStructure) {
      Object.keys(expectedStructure).forEach(key => {
        expect(response).toHaveProperty(key);
        if (expectedStructure[key] !== null) {
          expect(typeof response[key]).toBe(expectedStructure[key]);
        }
      });
    }
  },
};
