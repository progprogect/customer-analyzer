import { db } from '@/database/connection';
import { config } from '@/config';

describe('Database Connection', () => {
  beforeAll(async () => {
    // Инициализация подключения к тестовой БД
  });

  afterAll(async () => {
    // Закрытие соединений
    await db.close();
  });

  describe('Connection Test', () => {
    it('should connect to database successfully', async () => {
      const isConnected = await db.testConnection();
      expect(isConnected).toBe(true);
    });

    it('should execute simple query', async () => {
      const result = await db.query('SELECT NOW() as current_time');
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].current_time).toBeDefined();
    });

    it('should execute parameterized query', async () => {
      const result = await db.query('SELECT $1 as test_value', ['test']);
      expect(result.rows[0].test_value).toBe('test');
    });
  });

  describe('Connection Pool', () => {
    it('should provide pool statistics', () => {
      const stats = db.getPoolStats();
      expect(stats).toHaveProperty('totalCount');
      expect(stats).toHaveProperty('idleCount');
      expect(stats).toHaveProperty('waitingCount');
      expect(stats).toHaveProperty('isConnected');
    });

    it('should be healthy when connected', () => {
      const isHealthy = db.isHealthy();
      expect(typeof isHealthy).toBe('boolean');
    });
  });

  describe('Transaction Support', () => {
    it('should execute transaction successfully', async () => {
      const result = await db.transaction(async (client) => {
        const queryResult = await client.query('SELECT $1 as value', ['transaction_test']);
        return queryResult.rows[0].value;
      });

      expect(result).toBe('transaction_test');
    });

    it('should rollback transaction on error', async () => {
      await expect(
        db.transaction(async (client) => {
          await client.query('SELECT $1 as value', ['before_error']);
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');
    });
  });

  describe('Database Schema', () => {
    it('should have app_schema', async () => {
      const result = await db.query(`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name = 'app_schema'
      `);
      expect(result.rows).toHaveLength(1);
    });

    it('should have all required tables', async () => {
      const result = await db.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'app_schema'
        ORDER BY table_name
      `);
      
      const tableNames = result.rows.map(row => row.table_name);
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('products');
      expect(tableNames).toContain('events');
      expect(tableNames).toContain('user_metrics');
    });

    it('should have proper table structures', async () => {
      // Проверка структуры таблицы users
      const usersResult = await db.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'app_schema' AND table_name = 'users'
        ORDER BY ordinal_position
      `);
      
      const userColumns = usersResult.rows.map(row => row.column_name);
      expect(userColumns).toContain('user_id');
      expect(userColumns).toContain('telegram_id');
      expect(userColumns).toContain('first_name');
      expect(userColumns).toContain('last_name');
      expect(userColumns).toContain('username');
      expect(userColumns).toContain('registration_date');
      expect(userColumns).toContain('profile_data');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid queries gracefully', async () => {
      await expect(
        db.query('SELECT * FROM non_existent_table')
      ).rejects.toThrow();
    });

    it('should handle connection errors', async () => {
      // Этот тест требует настройки неправильных параметров подключения
      // В реальном тестировании можно использовать мок
      const originalConfig = { ...config.database };
      
      // Временно изменяем конфигурацию на неверную
      config.database.host = 'invalid_host';
      
      try {
        await expect(db.testConnection()).resolves.toBe(false);
      } finally {
        // Восстанавливаем оригинальную конфигурацию
        Object.assign(config.database, originalConfig);
      }
    });
  });
});
