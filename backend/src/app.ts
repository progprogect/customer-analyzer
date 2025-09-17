import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { globalErrorHandler, notFoundHandler } from '@/middleware/errorHandler';
import healthRouter from '@/routes/health';
import { db } from '@/database/connection';

/**
 * Создание Express приложения
 */
export function createApp(): express.Application {
  const app = express();

  // Базовые middleware
  app.use(helmet()); // Безопасность HTTP заголовков
  app.use(cors({
    origin: config.corsOrigin,
    credentials: true
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 минут
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // 100 запросов за окно
    message: {
      success: false,
      error: 'Too many requests, please try again later',
      timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use('/api/', limiter);

  // Логирование запросов
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    next();
  });

  // Маршруты
  app.use('/health', healthRouter);
  app.use('/api/health', healthRouter);

  // Корневой маршрут
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'Customer Analyzer API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv
    });
  });

  // Обработка несуществующих маршрутов
  app.use(notFoundHandler);

  // Глобальный обработчик ошибок
  app.use(globalErrorHandler);

  return app;
}

/**
 * Инициализация приложения
 */
export async function initializeApp(): Promise<void> {
  try {
    // Тестирование подключения к БД
    logger.info('Testing database connection...');
    const dbConnected = await db.testConnection();
    
    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }
    
    logger.info('✅ Database connection established');
    
    // Вывод статистики пула соединений
    const poolStats = db.getPoolStats();
    logger.info('Database pool stats:', poolStats);
    
  } catch (error) {
    logger.error('❌ App initialization failed:', error);
    throw error;
  }
}

/**
 * Graceful shutdown
 */
export async function gracefulShutdown(): Promise<void> {
  logger.info('Starting graceful shutdown...');
  
  try {
    // Закрытие соединений с БД
    await db.close();
    
    logger.info('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}
