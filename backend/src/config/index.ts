import dotenv from 'dotenv';
import { AppConfig, DatabaseConfig } from '@/types';

// Загрузка переменных окружения
dotenv.config();

/**
 * Валидация обязательных переменных окружения
 */
function validateEnv() {
  const required = [
    'POSTGRES_HOST',
    'POSTGRES_PORT',
    'POSTGRES_DB',
    'POSTGRES_USER',
    'POSTGRES_PASSWORD',
    'JWT_SECRET'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Конфигурация базы данных
 */
const databaseConfig: DatabaseConfig = {
  host: process.env.POSTGRES_HOST!,
  port: parseInt(process.env.POSTGRES_PORT!, 10),
  database: process.env.POSTGRES_DB!,
  user: process.env.POSTGRES_USER!,
  password: process.env.POSTGRES_PASSWORD!,
  ssl: process.env.NODE_ENV === 'production',
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
  max: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10)
};

/**
 * Основная конфигурация приложения
 */
export const config: AppConfig = {
  port: parseInt(process.env.API_PORT || '8000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  logLevel: process.env.LOG_LEVEL || 'info',
  database: databaseConfig
};

/**
 * Инициализация конфигурации
 */
export function initializeConfig(): AppConfig {
  try {
    validateEnv();
    console.log('✅ Configuration loaded successfully');
    return config;
  } catch (error) {
    console.error('❌ Configuration error:', error);
    process.exit(1);
  }
}

export default config;
