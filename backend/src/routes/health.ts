import express from 'express';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * Health check endpoint
 */
router.get('/', (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    memory: process.memoryUsage(),
    pid: process.pid,
  };

  logger.info('Health check requested', { ip: req.ip });
  
  res.status(200).json(healthCheck);
});

export default router;