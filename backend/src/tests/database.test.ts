/**
 * Тесты для модуля подключения к базе данных
 */

import { Pool, PoolClient } from 'pg';
import { DatabaseConnection } from '../database/connection';

// Mock для pg модуля
jest.mock('pg', () => ({
  Pool: jest.fn(),
}));

describe('Database Connection', () => {
  let mockPool: jest.Mocked<Pool>;
  let mockClient: jest.Mocked<PoolClient>;

  beforeEach(() => {
    // Создаем mock для Pool
    mockPool = {
      connect: jest.fn(),
      query: jest.fn(),
      end: jest.fn(),
      on: jest.fn(),
      totalCount: 0,
      idleCount: 0,
      waitingCount: 0,
    } as any;

    // Создаем mock для PoolClient
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
      on: jest.fn(),
    } as any;

    // Настраиваем mock для Pool
    (Pool as jest.Mock).mockImplementation(() => mockPool);
    mockPool.connect.mockResolvedValue(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Инициализация подключения', () => {
    it('должен создавать подключение к базе данных', async () => {
      const connection = new DatabaseConnection();
      
      expect(Pool).toHaveBeenCalledWith({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        min: parseInt(process.env.DB_POOL_MIN || '1'),
        max: parseInt(process.env.DB_POOL_MAX || '10'),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    });

    it('должен успешно подключиться к базе данных', async () => {
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });
      
      const connection = new DatabaseConnection();
      const result = await connection.testConnection();
      
      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith('SELECT 1');
    });

    it('должен обрабатывать ошибки подключения', async () => {
      mockPool.query.mockRejectedValue(new Error('Connection failed'));
      
      const connection = new DatabaseConnection();
      const result = await connection.testConnection();
      
      expect(result).toBe(false);
    });
  });

  describe('Выполнение запросов', () => {
    it('должен выполнять SELECT запросы', async () => {
      const mockRows = [
        { id: 1, name: 'Test User' },
        { id: 2, name: 'Another User' },
      ];
      mockPool.query.mockResolvedValue({ rows: mockRows, rowCount: 2 });
      
      const connection = new DatabaseConnection();
      const result = await connection.query('SELECT * FROM users WHERE active = $1', [true]);
      
      expect(result.rows).toEqual(mockRows);
      expect(result.rowCount).toBe(2);
      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM users WHERE active = $1', [true]);
    });

    it('должен выполнять INSERT запросы', async () => {
      const mockInsertResult = { rows: [{ id: 1 }], rowCount: 1 };
      mockPool.query.mockResolvedValue(mockInsertResult);
      
      const connection = new DatabaseConnection();
      const result = await connection.query(
        'INSERT INTO users (first_name, last_name) VALUES ($1, $2) RETURNING id',
        ['Test', 'User']
      );
      
      expect(result.rows[0].id).toBe(1);
      expect(result.rowCount).toBe(1);
    });

    it('должен обрабатывать ошибки запросов', async () => {
      const error = new Error('SQL syntax error');
      mockPool.query.mockRejectedValue(error);
      
      const connection = new DatabaseConnection();
      
      await expect(connection.query('INVALID SQL')).rejects.toThrow('SQL syntax error');
    });
  });

  describe('Транзакции', () => {
    it('должен выполнять транзакции', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 }) // INSERT
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // COMMIT
      
      const connection = new DatabaseConnection();
      
      const result = await connection.transaction(async (client) => {
        const insertResult = await client.query(
          'INSERT INTO users (first_name) VALUES ($1) RETURNING id',
          ['Test']
        );
        return insertResult.rows[0].id;
      });
      
      expect(result).toBe(1);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('должен откатывать транзакции при ошибке', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN
        .mockRejectedValueOnce(new Error('Transaction failed')); // ROLLBACK
      
      const connection = new DatabaseConnection();
      
      await expect(connection.transaction(async (client) => {
        await client.query('INSERT INTO users (invalid_column) VALUES ($1)', ['Test']);
      })).rejects.toThrow('Transaction failed');
      
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('Health Check', () => {
    it('должен возвращать статус здоровья подключения', async () => {
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });
      
      const connection = new DatabaseConnection();
      const health = await connection.getHealthStatus();
      
      expect(health).toEqual({
        connected: true,
        pool: {
          total: 0,
          idle: 0,
          waiting: 0,
        },
      });
    });

    it('должен возвращать статус ошибки при проблемах с подключением', async () => {
      mockPool.query.mockRejectedValue(new Error('Connection lost'));
      
      const connection = new DatabaseConnection();
      const health = await connection.getHealthStatus();
      
      expect(health).toEqual({
        connected: false,
        pool: {
          total: 0,
          idle: 0,
          waiting: 0,
        },
      });
    });
  });

  describe('Закрытие подключения', () => {
    it('должен корректно закрывать подключение', async () => {
      mockPool.end.mockResolvedValue(undefined);
      
      const connection = new DatabaseConnection();
      await connection.close();
      
      expect(mockPool.end).toHaveBeenCalled();
    });
  });
});