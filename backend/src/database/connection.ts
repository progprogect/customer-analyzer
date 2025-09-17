import { Pool } from 'pg';
import { config } from '../config';
import { logger } from '../utils/logger';

export const db = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  ssl: config.database.ssl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

db.on('connect', () => {
  logger.info('Database connected successfully');
});

db.on('error', (err: Error) => {
  logger.error('Database connection error:', err);
});

export const testConnection = async () => {
  try {
    const client = await db.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connection test successful');
    return true;
  } catch (error) {
    logger.error('Database connection test failed:', error);
    return false;
  }
};