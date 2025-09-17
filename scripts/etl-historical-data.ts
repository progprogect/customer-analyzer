#!/usr/bin/env npx ts-node

/**
 * ETL-скрипт для загрузки исторических данных
 * Поддерживает загрузку из CSV, JSON файлов и SQL dumps
 */

import fs from 'fs/promises';
import path from 'path';
import csv from 'csv-parser';
import { createReadStream } from 'fs';
import { Pool } from 'pg';
import { config } from '../backend/src/config';

interface ETLConfig {
  inputDir: string;
  outputDir: string;
  batchSize: number;
  validateData: boolean;
  skipDuplicates: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

interface ETLStats {
  users: {
    processed: number;
    inserted: number;
    skipped: number;
    errors: number;
  };
  products: {
    processed: number;
    inserted: number;
    skipped: number;
    errors: number;
  };
  events: {
    processed: number;
    inserted: number;
    skipped: number;
    errors: number;
  };
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

interface UserData {
  telegram_id: string;
  first_name: string;
  last_name?: string;
  username?: string;
  registration_date: string;
  profile_data?: any;
}

interface ProductData {
  name: string;
  category: string;
  price: string;
  description?: string;
  attributes?: any;
}

interface EventData {
  user_telegram_id: string;
  product_name?: string;
  event_type: string;
  event_timestamp: string;
  properties?: any;
}

class HistoricalDataETL {
  private pool: Pool;
  private config: ETLConfig;
  private stats: ETLStats;

  constructor(config: ETLConfig) {
    this.config = config;
    this.pool = new Pool(config.database);
    this.stats = {
      users: { processed: 0, inserted: 0, skipped: 0, errors: 0 },
      products: { processed: 0, inserted: 0, skipped: 0, errors: 0 },
      events: { processed: 0, inserted: 0, skipped: 0, errors: 0 },
      startTime: new Date()
    };
  }

  /**
   * Основной метод запуска ETL процесса
   */
  async run(): Promise<void> {
    console.log('🚀 Starting historical data ETL process...');
    console.log(`📁 Input directory: ${this.config.inputDir}`);
    console.log(`📊 Batch size: ${this.config.batchSize}`);
    console.log(`✅ Validation: ${this.config.validateData ? 'enabled' : 'disabled'}`);

    try {
      // Проверка подключения к БД
      await this.testConnection();

      // Создание выходной директории
      await this.ensureOutputDir();

      // Загрузка данных в правильном порядке
      await this.loadUsers();
      await this.loadProducts();
      await this.loadEvents();

      // Генерация отчета
      await this.generateReport();

      console.log('✅ ETL process completed successfully!');

    } catch (error) {
      console.error('❌ ETL process failed:', error);
      throw error;
    } finally {
      await this.pool.end();
    }
  }

  /**
   * Тестирование подключения к БД
   */
  private async testConnection(): Promise<void> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      console.log('✅ Database connection established');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  /**
   * Создание выходной директории
   */
  private async ensureOutputDir(): Promise<void> {
    try {
      await fs.mkdir(this.config.outputDir, { recursive: true });
    } catch (error) {
      console.error('❌ Failed to create output directory:', error);
      throw error;
    }
  }

  /**
   * Загрузка пользователей
   */
  private async loadUsers(): Promise<void> {
    console.log('\n👥 Loading users...');
    
    const usersFile = path.join(this.config.inputDir, 'users.csv');
    
    try {
      await fs.access(usersFile);
    } catch {
      console.log('⚠️  Users file not found, skipping users import');
      return;
    }

    const users: UserData[] = [];
    
    await new Promise<void>((resolve, reject) => {
      createReadStream(usersFile)
        .pipe(csv())
        .on('data', (row) => {
          this.stats.users.processed++;
          
          if (this.config.validateData && !this.validateUserData(row)) {
            this.stats.users.errors++;
            console.warn(`⚠️  Invalid user data: ${JSON.stringify(row)}`);
            return;
          }
          
          users.push({
            telegram_id: row.telegram_id,
            first_name: row.first_name,
            last_name: row.last_name || null,
            username: row.username || null,
            registration_date: row.registration_date || new Date().toISOString(),
            profile_data: row.profile_data ? JSON.parse(row.profile_data) : null
          });
        })
        .on('end', () => resolve())
        .on('error', reject);
    });

    // Вставка пользователей батчами
    await this.insertUsersBatch(users);
    
    console.log(`✅ Users loaded: ${this.stats.users.inserted} inserted, ${this.stats.users.skipped} skipped, ${this.stats.users.errors} errors`);
  }

  /**
   * Загрузка продуктов
   */
  private async loadProducts(): Promise<void> {
    console.log('\n🛍️ Loading products...');
    
    const productsFile = path.join(this.config.inputDir, 'products.csv');
    
    try {
      await fs.access(productsFile);
    } catch {
      console.log('⚠️  Products file not found, skipping products import');
      return;
    }

    const products: ProductData[] = [];
    
    await new Promise<void>((resolve, reject) => {
      createReadStream(productsFile)
        .pipe(csv())
        .on('data', (row) => {
          this.stats.products.processed++;
          
          if (this.config.validateData && !this.validateProductData(row)) {
            this.stats.products.errors++;
            console.warn(`⚠️  Invalid product data: ${JSON.stringify(row)}`);
            return;
          }
          
          products.push({
            name: row.name,
            category: row.category,
            price: row.price,
            description: row.description || null,
            attributes: row.attributes ? JSON.parse(row.attributes) : null
          });
        })
        .on('end', () => resolve())
        .on('error', reject);
    });

    // Вставка продуктов батчами
    await this.insertProductsBatch(products);
    
    console.log(`✅ Products loaded: ${this.stats.products.inserted} inserted, ${this.stats.products.skipped} skipped, ${this.stats.products.errors} errors`);
  }

  /**
   * Загрузка событий
   */
  private async loadEvents(): Promise<void> {
    console.log('\n📊 Loading events...');
    
    const eventsFile = path.join(this.config.inputDir, 'events.csv');
    
    try {
      await fs.access(eventsFile);
    } catch {
      console.log('⚠️  Events file not found, skipping events import');
      return;
    }

    const events: EventData[] = [];
    
    await new Promise<void>((resolve, reject) => {
      createReadStream(eventsFile)
        .pipe(csv())
        .on('data', (row) => {
          this.stats.events.processed++;
          
          if (this.config.validateData && !this.validateEventData(row)) {
            this.stats.events.errors++;
            console.warn(`⚠️  Invalid event data: ${JSON.stringify(row)}`);
            return;
          }
          
          events.push({
            user_telegram_id: row.user_telegram_id,
            product_name: row.product_name || null,
            event_type: row.event_type,
            event_timestamp: row.event_timestamp,
            properties: row.properties ? JSON.parse(row.properties) : null
          });
        })
        .on('end', () => resolve())
        .on('error', reject);
    });

    // Вставка событий батчами
    await this.insertEventsBatch(events);
    
    console.log(`✅ Events loaded: ${this.stats.events.inserted} inserted, ${this.stats.events.skipped} skipped, ${this.stats.events.errors} errors`);
  }

  /**
   * Вставка пользователей батчами
   */
  private async insertUsersBatch(users: UserData[]): Promise<void> {
    const insertQuery = `
      INSERT INTO app_schema.users (telegram_id, first_name, last_name, username, registration_date, profile_data)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (telegram_id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        username = EXCLUDED.username,
        profile_data = EXCLUDED.profile_data
    `;

    for (let i = 0; i < users.length; i += this.config.batchSize) {
      const batch = users.slice(i, i + this.config.batchSize);
      
      try {
        const client = await this.pool.connect();
        
        for (const user of batch) {
          await client.query(insertQuery, [
            user.telegram_id,
            user.first_name,
            user.last_name,
            user.username,
            user.registration_date,
            user.profile_data ? JSON.stringify(user.profile_data) : null
          ]);
          this.stats.users.inserted++;
        }
        
        client.release();
        console.log(`   Processed users batch: ${i + batch.length}/${users.length}`);
        
      } catch (error) {
        console.error(`❌ Error inserting users batch:`, error);
        this.stats.users.errors += batch.length;
      }
    }
  }

  /**
   * Вставка продуктов батчами
   */
  private async insertProductsBatch(products: ProductData[]): Promise<void> {
    const insertQuery = `
      INSERT INTO app_schema.products (name, category, price, description, attributes)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (name) DO UPDATE SET
        category = EXCLUDED.category,
        price = EXCLUDED.price,
        description = EXCLUDED.description,
        attributes = EXCLUDED.attributes
    `;

    for (let i = 0; i < products.length; i += this.config.batchSize) {
      const batch = products.slice(i, i + this.config.batchSize);
      
      try {
        const client = await this.pool.connect();
        
        for (const product of batch) {
          await client.query(insertQuery, [
            product.name,
            product.category,
            parseFloat(product.price),
            product.description,
            product.attributes ? JSON.stringify(product.attributes) : null
          ]);
          this.stats.products.inserted++;
        }
        
        client.release();
        console.log(`   Processed products batch: ${i + batch.length}/${products.length}`);
        
      } catch (error) {
        console.error(`❌ Error inserting products batch:`, error);
        this.stats.products.errors += batch.length;
      }
    }
  }

  /**
   * Вставка событий батчами
   */
  private async insertEventsBatch(events: EventData[]): Promise<void> {
    const insertQuery = `
      INSERT INTO app_schema.events (user_id, product_id, event_type, event_timestamp, properties)
      VALUES (
        (SELECT user_id FROM app_schema.users WHERE telegram_id = $1),
        (SELECT product_id FROM app_schema.products WHERE name = $2),
        $3, $4, $5
      )
    `;

    for (let i = 0; i < events.length; i += this.config.batchSize) {
      const batch = events.slice(i, i + this.config.batchSize);
      
      try {
        const client = await this.pool.connect();
        
        for (const event of batch) {
          if (!event.user_telegram_id) {
            this.stats.events.errors++;
            continue;
          }
          
          await client.query(insertQuery, [
            event.user_telegram_id,
            event.product_name,
            event.event_type,
            event.event_timestamp,
            event.properties ? JSON.stringify(event.properties) : null
          ]);
          this.stats.events.inserted++;
        }
        
        client.release();
        console.log(`   Processed events batch: ${i + batch.length}/${events.length}`);
        
      } catch (error) {
        console.error(`❌ Error inserting events batch:`, error);
        this.stats.events.errors += batch.length;
      }
    }
  }

  /**
   * Валидация данных пользователя
   */
  private validateUserData(data: any): boolean {
    return !!(
      data.telegram_id &&
      data.first_name &&
      !isNaN(parseInt(data.telegram_id))
    );
  }

  /**
   * Валидация данных продукта
   */
  private validateProductData(data: any): boolean {
    return !!(
      data.name &&
      data.category &&
      data.price &&
      !isNaN(parseFloat(data.price))
    );
  }

  /**
   * Валидация данных события
   */
  private validateEventData(data: any): boolean {
    const validEventTypes = ['view', 'add_to_cart', 'purchase', 'bot_command', 'click', 'scroll'];
    
    return !!(
      data.user_telegram_id &&
      data.event_type &&
      validEventTypes.includes(data.event_type) &&
      data.event_timestamp
    );
  }

  /**
   * Генерация отчета о загрузке
   */
  private async generateReport(): Promise<void> {
    this.stats.endTime = new Date();
    this.stats.duration = this.stats.endTime.getTime() - this.stats.startTime.getTime();

    const report = {
      summary: {
        startTime: this.stats.startTime.toISOString(),
        endTime: this.stats.endTime.toISOString(),
        duration: `${(this.stats.duration / 1000).toFixed(2)} seconds`
      },
      statistics: this.stats,
      recommendations: this.generateRecommendations()
    };

    const reportPath = path.join(this.config.outputDir, `etl-report-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 ETL Report Summary:');
    console.log(`   Duration: ${report.summary.duration}`);
    console.log(`   Users: ${this.stats.users.inserted} inserted, ${this.stats.users.errors} errors`);
    console.log(`   Products: ${this.stats.products.inserted} inserted, ${this.stats.products.errors} errors`);
    console.log(`   Events: ${this.stats.events.inserted} inserted, ${this.stats.events.errors} errors`);
    console.log(`   Report saved to: ${reportPath}`);
  }

  /**
   * Генерация рекомендаций
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.stats.users.errors > 0) {
      recommendations.push('Review and fix invalid user data');
    }
    
    if (this.stats.products.errors > 0) {
      recommendations.push('Review and fix invalid product data');
    }
    
    if (this.stats.events.errors > 0) {
      recommendations.push('Review and fix invalid event data');
    }
    
    if (this.stats.users.skipped > 0 || this.stats.products.skipped > 0) {
      recommendations.push('Review skipped records for potential duplicates');
    }
    
    return recommendations;
  }
}

/**
 * Основная функция
 */
async function main() {
  const config: ETLConfig = {
    inputDir: process.env.ETL_INPUT_DIR || './data/input',
    outputDir: process.env.ETL_OUTPUT_DIR || './data/output',
    batchSize: parseInt(process.env.ETL_BATCH_SIZE || '1000', 10),
    validateData: process.env.ETL_VALIDATE === 'true',
    skipDuplicates: process.env.ETL_SKIP_DUPLICATES === 'true',
    logLevel: (process.env.ETL_LOG_LEVEL as any) || 'info'
  };

  const etl = new HistoricalDataETL(config);
  await etl.run();
}

// Запуск если файл выполняется напрямую
if (require.main === module) {
  main().catch(console.error);
}

export { HistoricalDataETL, ETLConfig };
