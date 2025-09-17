import { Router, Request, Response } from 'express';
import { db } from '@/database/connection';
import { logger } from '@/utils/logger';
import { HealthCheck, ApiResponse } from '@/types';

const router = Router();

/**
 * Health check endpoint
 */
router.get('/', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    // Проверка подключения к базе данных
    const dbHealthy = await db.testConnection();
    const dbResponseTime = Date.now() - startTime;
    
    // Информация о памяти
    const memoryUsage = process.memoryUsage();
    const memoryUsed = Math.round(memoryUsage.heapUsed / 1024 / 1024); // MB
    const memoryTotal = Math.round(memoryUsage.heapTotal / 1024 / 1024); // MB
    const memoryPercentage = Math.round((memoryUsed / memoryTotal) * 100);
    
    // Статистика пула соединений
    const poolStats = db.getPoolStats();
    
    const healthCheck: HealthCheck = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbHealthy ? 'connected' : 'disconnected',
        responseTime: dbResponseTime,
        ...(dbHealthy ? {} : { lastError: 'Connection failed' })
      },
      memory: {
        used: memoryUsed,
        total: memoryTotal,
        percentage: memoryPercentage
      }
    };

    const response: ApiResponse<HealthCheck> = {
      success: true,
      data: healthCheck,
      timestamp: new Date().toISOString()
    };

    const statusCode = dbHealthy ? 200 : 503;
    res.status(statusCode).json(response);

  } catch (error) {
    logger.error('Health check failed:', error);
    
    const response: ApiResponse = {
      success: false,
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    };

    res.status(503).json(response);
  }
});

/**
 * Database connection test endpoint
 */
router.get('/db', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const isConnected = await db.testConnection();
    const responseTime = Date.now() - startTime;
    
    const poolStats = db.getPoolStats();
    
    const response: ApiResponse = {
      success: true,
      data: {
        connected: isConnected,
        responseTime,
        poolStats
      },
      timestamp: new Date().toISOString()
    };

    res.status(isConnected ? 200 : 503).json(response);
  } catch (error) {
    logger.error('Database health check failed:', error);
    
    const response: ApiResponse = {
      success: false,
      error: 'Database connection failed',
      timestamp: new Date().toISOString()
    };

    res.status(503).json(response);
  }
});

export default router;
