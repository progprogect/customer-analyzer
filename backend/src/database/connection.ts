import { Pool, PoolClient, PoolConfig } from 'pg';
import { config } from '@/config';
import { logger } from '@/utils/logger';

/**
 * Пул соединений PostgreSQL
 */
class DatabaseConnection {
  private pool: Pool;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 1 секунда

  constructor() {
    this.pool = this.createPool();
    this.setupEventHandlers();
  }

  /**
   * Создание пула соединений
   */
  private createPool(): Pool {
    const poolConfig: PoolConfig = {
      host: config.database.host,
      port: config.database.port,
      database: config.database.database,
      user: config.database.user,
      password: config.database.password,
      ssl: config.database.ssl,
      connectionTimeoutMillis: config.database.connectionTimeoutMillis,
      idleTimeoutMillis: config.database.idleTimeoutMillis,
      max: config.database.max,
      // Дополнительные настройки для надежности
      allowExitOnIdle: false,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000
    };

    return new Pool(poolConfig);
  }

  /**
   * Настройка обработчиков событий пула
   */
  private setupEventHandlers(): void {
    this.pool.on('connect', (client: PoolClient) => {
      logger.info('New client connected to database');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.pool.on('error', (err: Error, client: PoolClient) => {
      logger.error('Database pool error:', err);
      this.isConnected = false;
      this.handleConnectionError(err);
    });

    this.pool.on('remove', (client: PoolClient) => {
      logger.info('Client removed from pool');
    });

    // Graceful shutdown при завершении процесса
    process.on('SIGINT', () => this.close());
    process.on('SIGTERM', () => this.close());
  }

  /**
   * Обработка ошибок подключения
   */
  private async handleConnectionError(error: Error): Promise<void> {
    logger.error('Database connection error:', error);
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
      
      logger.info(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.reconnect();
      }, delay);
    } else {
      logger.error('Max reconnection attempts reached. Database connection failed.');
    }
  }

  /**
   * Переподключение к базе данных
   */
  private async reconnect(): Promise<void> {
    try {
      logger.info('Attempting to reconnect to database...');
      
      // Закрываем старый пул
      await this.pool.end();
      
      // Создаем новый пул
      this.pool = this.createPool();
      this.setupEventHandlers();
      
      // Тестируем подключение
      await this.testConnection();
      
      logger.info('✅ Database reconnected successfully');
    } catch (error) {
      logger.error('❌ Database reconnection failed:', error);
      this.handleConnectionError(error as Error);
    }
  }

  /**
   * Тестирование подключения к базе данных
   */
  public async testConnection(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      return true;
    } catch (error) {
      logger.error('Database connection test failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Получение клиента из пула
   */
  public async getClient(): Promise<PoolClient> {
    try {
      const client = await this.pool.connect();
      return client;
    } catch (error) {
      logger.error('Failed to get database client:', error);
      throw new Error('Database connection failed');
    }
  }

  /**
   * Выполнение запроса
   */
  public async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      if (duration > 1000) { // Логируем медленные запросы
        logger.warn(`Slow query detected: ${duration}ms - ${text.substring(0, 100)}...`);
      }
      
      return result;
    } catch (error) {
      logger.error('Database query error:', error);
      throw error;
    }
  }

  /**
   * Выполнение транзакции
   */
  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction failed, rolled back:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Получение статистики пула соединений
   */
  public getPoolStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Проверка состояния подключения
   */
  public isHealthy(): boolean {
    return this.isConnected && this.reconnectAttempts < this.maxReconnectAttempts;
  }

  /**
   * Закрытие всех соединений
   */
  public async close(): Promise<void> {
    try {
      logger.info('Closing database connections...');
      await this.pool.end();
      logger.info('✅ Database connections closed');
    } catch (error) {
      logger.error('Error closing database connections:', error);
    }
  }
}

// Создаем единственный экземпляр подключения
export const db = new DatabaseConnection();

// Экспортируем типы для удобства
export { PoolClient } from 'pg';
