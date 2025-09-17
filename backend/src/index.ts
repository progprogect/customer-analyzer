import { createApp, initializeApp, gracefulShutdown } from './app';
import { config } from './config';
import { logger } from './utils/logger';

/**
 * Главная точка входа приложения
 */
async function startServer(): Promise<void> {
  try {
    // Инициализация приложения
    await initializeApp();
    
    // Создание Express приложения
    const app = createApp();
    
    // Запуск сервера
    const server = app.listen(config.server.port, () => {
      logger.info(`🚀 Server running on port ${config.server.port}`);
      logger.info(`📊 Environment: ${config.env}`);
      logger.info(`🔗 Health check: http://localhost:${config.server.port}/health`);
      logger.info(`📖 API docs: http://localhost:${config.server.port}/api-docs`);
    });

    // Обработка сигналов завершения
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      server.close(() => {
        gracefulShutdown();
      });
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      server.close(() => {
        gracefulShutdown();
      });
    });

    // Обработка необработанных исключений
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown();
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown();
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Запуск сервера
if (require.main === module) {
  startServer();
}

export { startServer };
