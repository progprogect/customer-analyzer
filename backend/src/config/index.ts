import dotenv from 'dotenv';
import path from 'path';

// Загружаем .env файл из корневой директории backend
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'customer_analyzer',
    user: process.env.DB_USER || 'app_user',
    password: process.env.DB_PASSWORD || 'app_password',
    ssl: process.env.NODE_ENV === 'production',
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || '',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'development_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // Telegram Bot
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN || '',
    username: process.env.TELEGRAM_BOT_USERNAME || '',
  },

  // ML Services
  ml: {
    apiUrl: process.env.ML_API_URL || 'http://localhost:8000',
    timeout: parseInt(process.env.ML_API_TIMEOUT || '30000'),
  },

  // Server
  server: {
    port: parseInt(process.env.PORT || '3001'),
    host: process.env.HOST || 'localhost',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // Environment
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};