/**
 * Утилиты для ETL процесса
 */

import fs from 'fs/promises';
import path from 'path';
import { Pool } from 'pg';

export interface DataValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ETLProgress {
  totalRecords: number;
  processedRecords: number;
  percentage: number;
  currentBatch: number;
  totalBatches: number;
}

/**
 * Утилиты для работы с файлами
 */
export class FileUtils {
  /**
   * Проверка существования файла
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Создание директории если не существует
   */
  static async ensureDir(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }

  /**
   * Получение размера файла
   */
  static async getFileSize(filePath: string): Promise<number> {
    const stats = await fs.stat(filePath);
    return stats.size;
  }

  /**
   * Подсчет строк в CSV файле
   */
  static async countCSVLines(filePath: string): Promise<number> {
    const content = await fs.readFile(filePath, 'utf-8');
    return content.split('\n').length - 1; // -1 для заголовка
  }
}

/**
 * Утилиты для валидации данных
 */
export class DataValidator {
  /**
   * Валидация email адреса
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Валидация телефона
   */
  static validatePhone(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Валидация Telegram ID
   */
  static validateTelegramId(telegramId: string): boolean {
    const id = parseInt(telegramId);
    return !isNaN(id) && id > 0 && id.toString().length >= 8;
  }

  /**
   * Валидация даты
   */
  static validateDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  /**
   * Валидация JSON строки
   */
  static validateJSON(jsonString: string): boolean {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Валидация цены
   */
  static validatePrice(price: string): boolean {
    const priceNum = parseFloat(price);
    return !isNaN(priceNum) && priceNum >= 0;
  }

  /**
   * Комплексная валидация пользователя
   */
  static validateUser(userData: any): DataValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!userData.telegram_id) {
      errors.push('telegram_id is required');
    } else if (!this.validateTelegramId(userData.telegram_id)) {
      errors.push('telegram_id must be a valid positive number');
    }

    if (!userData.first_name) {
      errors.push('first_name is required');
    } else if (userData.first_name.length < 2) {
      warnings.push('first_name is too short');
    }

    if (userData.registration_date && !this.validateDate(userData.registration_date)) {
      errors.push('registration_date must be a valid date');
    }

    if (userData.profile_data && !this.validateJSON(userData.profile_data)) {
      errors.push('profile_data must be valid JSON');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Комплексная валидация продукта
   */
  static validateProduct(productData: any): DataValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!productData.name) {
      errors.push('name is required');
    } else if (productData.name.length < 2) {
      warnings.push('name is too short');
    }

    if (!productData.category) {
      errors.push('category is required');
    }

    if (!productData.price) {
      errors.push('price is required');
    } else if (!this.validatePrice(productData.price)) {
      errors.push('price must be a valid positive number');
    }

    if (productData.attributes && !this.validateJSON(productData.attributes)) {
      errors.push('attributes must be valid JSON');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Комплексная валидация события
   */
  static validateEvent(eventData: any): DataValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const validEventTypes = ['view', 'add_to_cart', 'purchase', 'bot_command', 'click', 'scroll'];

    if (!eventData.user_telegram_id) {
      errors.push('user_telegram_id is required');
    } else if (!this.validateTelegramId(eventData.user_telegram_id)) {
      errors.push('user_telegram_id must be a valid positive number');
    }

    if (!eventData.event_type) {
      errors.push('event_type is required');
    } else if (!validEventTypes.includes(eventData.event_type)) {
      errors.push(`event_type must be one of: ${validEventTypes.join(', ')}`);
    }

    if (!eventData.event_timestamp) {
      errors.push('event_timestamp is required');
    } else if (!this.validateDate(eventData.event_timestamp)) {
      errors.push('event_timestamp must be a valid date');
    }

    if (eventData.properties && !this.validateJSON(eventData.properties)) {
      errors.push('properties must be valid JSON');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

/**
 * Утилиты для работы с базой данных
 */
export class DatabaseUtils {
  /**
   * Проверка подключения к БД
   */
  static async testConnection(pool: Pool): Promise<boolean> {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  /**
   * Получение статистики таблицы
   */
  static async getTableStats(pool: Pool, schema: string, table: string): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as row_count,
        pg_size_pretty(pg_total_relation_size($1)) as table_size
      FROM ${schema}.${table}
    `;
    
    const result = await pool.query(query, [`${schema}.${table}`]);
    return result.rows[0];
  }

  /**
   * Очистка таблицы
   */
  static async truncateTable(pool: Pool, schema: string, table: string): Promise<void> {
    await pool.query(`TRUNCATE TABLE ${schema}.${table} RESTART IDENTITY CASCADE`);
  }

  /**
   * Проверка существования записи
   */
  static async recordExists(
    pool: Pool, 
    schema: string, 
    table: string, 
    whereClause: string, 
    params: any[]
  ): Promise<boolean> {
    const query = `SELECT 1 FROM ${schema}.${table} WHERE ${whereClause} LIMIT 1`;
    const result = await pool.query(query, params);
    return result.rows.length > 0;
  }
}

/**
 * Утилиты для форматирования
 */
export class FormatUtils {
  /**
   * Форматирование размера файла
   */
  static formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Форматирование времени
   */
  static formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Форматирование прогресса
   */
  static formatProgress(progress: ETLProgress): string {
    return `${progress.processedRecords}/${progress.totalRecords} (${progress.percentage.toFixed(1)}%) - Batch ${progress.currentBatch}/${progress.totalBatches}`;
  }
}

/**
 * Утилиты для логирования
 */
export class LogUtils {
  /**
   * Создание логгера с контекстом
   */
  static createLogger(context: string) {
    return {
      info: (message: string, data?: any) => {
        console.log(`[${new Date().toISOString()}] [INFO] [${context}] ${message}`, data || '');
      },
      warn: (message: string, data?: any) => {
        console.warn(`[${new Date().toISOString()}] [WARN] [${context}] ${message}`, data || '');
      },
      error: (message: string, data?: any) => {
        console.error(`[${new Date().toISOString()}] [ERROR] [${context}] ${message}`, data || '');
      },
      debug: (message: string, data?: any) => {
        if (process.env.LOG_LEVEL === 'debug') {
          console.log(`[${new Date().toISOString()}] [DEBUG] [${context}] ${message}`, data || '');
        }
      }
    };
  }

  /**
   * Создание прогресс-бара в консоли
   */
  static createProgressBar(total: number): (current: number) => void {
    return (current: number) => {
      const percentage = (current / total) * 100;
      const filled = Math.floor(percentage / 2);
      const empty = 50 - filled;
      const bar = '█'.repeat(filled) + '░'.repeat(empty);
      process.stdout.write(`\r[${bar}] ${percentage.toFixed(1)}% (${current}/${total})`);
    };
  }
}
