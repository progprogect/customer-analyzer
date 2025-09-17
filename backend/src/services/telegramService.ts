import { db } from '@/database/connection';
import { logger } from '@/utils/logger';
import { TelegramUser, BotEventRequest, UserUpsertRequest, EventCreateRequest, BotEventResponse } from '@/types/telegram';

/**
 * Сервис для работы с Telegram Bot API
 */
export class TelegramService {
  
  /**
   * Создание или обновление пользователя
   */
  async upsertUser(userData: UserUpsertRequest): Promise<{ user_id: number; is_new: boolean }> {
    try {
      const client = await db.getClient();
      
      // Проверяем, существует ли пользователь
      const existingUser = await client.query(
        'SELECT user_id FROM app_schema.users WHERE telegram_id = $1',
        [userData.telegram_id]
      );
      
      if (existingUser.rows.length > 0) {
        // Обновляем существующего пользователя
        await client.query(`
          UPDATE app_schema.users 
          SET 
            first_name = $2,
            last_name = $3,
            username = $4,
            profile_data = COALESCE(profile_data, '{}') || $5::jsonb
          WHERE telegram_id = $1
        `, [
          userData.telegram_id,
          userData.first_name,
          userData.last_name,
          userData.username,
          JSON.stringify({
            language_code: userData.language_code,
            last_seen: new Date().toISOString()
          })
        ]);
        
        client.release();
        return { user_id: existingUser.rows[0].user_id, is_new: false };
      } else {
        // Создаем нового пользователя
        const newUser = await client.query(`
          INSERT INTO app_schema.users (
            telegram_id, 
            first_name, 
            last_name, 
            username, 
            registration_date,
            profile_data
          ) VALUES ($1, $2, $3, $4, NOW(), $5)
          RETURNING user_id
        `, [
          userData.telegram_id,
          userData.first_name,
          userData.last_name,
          userData.username,
          JSON.stringify({
            language_code: userData.language_code,
            registration_source: 'telegram_bot'
          })
        ]);
        
        client.release();
        return { user_id: newUser.rows[0].user_id, is_new: true };
      }
    } catch (error) {
      logger.error('Error upserting user:', error);
      throw error;
    }
  }

  /**
   * Создание события
   */
  async createEvent(eventData: EventCreateRequest): Promise<number> {
    try {
      const client = await db.getClient();
      
      // Проверяем, существует ли пользователь
      const user = await client.query(
        'SELECT user_id FROM app_schema.users WHERE telegram_id = $1',
        [eventData.user_telegram_id]
      );
      
      if (user.rows.length === 0) {
        throw new Error(`User with telegram_id ${eventData.user_telegram_id} not found`);
      }
      
      const userId = user.rows[0].user_id;
      
      // Создаем событие
      const event = await client.query(`
        INSERT INTO app_schema.events (
          user_id,
          product_id,
          event_type,
          event_timestamp,
          properties
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING event_id
      `, [
        userId,
        null, // product_id для событий бота всегда null
        eventData.event_type,
        eventData.timestamp || new Date().toISOString(),
        eventData.properties ? JSON.stringify(eventData.properties) : null
      ]);
      
      client.release();
      return event.rows[0].event_id;
    } catch (error) {
      logger.error('Error creating event:', error);
      throw error;
    }
  }

  /**
   * Обработка события от бота
   */
  async processBotEvent(botEvent: BotEventRequest): Promise<BotEventResponse> {
    try {
      // Сначала создаем/обновляем пользователя
      const userResult = await this.upsertUser({
        telegram_id: botEvent.user.id,
        first_name: botEvent.user.first_name,
        last_name: botEvent.user.last_name,
        username: botEvent.user.username,
        language_code: botEvent.user.language_code
      });

      // Определяем тип события и его свойства
      let eventType: 'bot_command' | 'message' | 'callback_query';
      let properties: any = {};

      if (botEvent.event_type === 'command') {
        eventType = 'bot_command';
        properties = {
          command: botEvent.data.command,
          text: botEvent.data.text,
          response_time_ms: Date.now() - new Date(botEvent.timestamp).getTime()
        };
      } else if (botEvent.event_type === 'callback_query') {
        eventType = 'callback_query';
        properties = {
          callback_data: botEvent.data.callback_query?.data,
          message_id: botEvent.data.callback_query?.message?.message_id,
          response_time_ms: Date.now() - new Date(botEvent.timestamp).getTime()
        };
      } else {
        eventType = 'message';
        properties = {
          text: botEvent.data.text,
          message_id: botEvent.data.message?.message_id,
          response_time_ms: Date.now() - new Date(botEvent.timestamp).getTime()
        };
      }

      // Создаем событие
      const eventId = await this.createEvent({
        user_telegram_id: botEvent.user.id,
        event_type: eventType,
        properties: properties,
        timestamp: botEvent.timestamp
      });

      logger.info(`Bot event processed: user_id=${userResult.user_id}, event_id=${eventId}, type=${eventType}`, {
        telegram_id: botEvent.user.id,
        event_type: eventType,
        is_new_user: userResult.is_new
      });

      return {
        success: true,
        message: 'Event processed successfully',
        event_id: eventId
      };

    } catch (error) {
      logger.error('Error processing bot event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Получение статистики пользователя
   */
  async getUserStats(telegramId: number): Promise<any> {
    try {
      const result = await db.query(`
        SELECT * FROM app_schema.get_user_stats(
          (SELECT user_id FROM app_schema.users WHERE telegram_id = $1)
        )
      `, [telegramId]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error getting user stats:', error);
      throw error;
    }
  }

  /**
   * Получение последних событий пользователя
   */
  async getUserRecentEvents(telegramId: number, limit: number = 10): Promise<any[]> {
    try {
      const result = await db.query(`
        SELECT 
          e.event_type,
          e.event_timestamp,
          e.properties
        FROM app_schema.events e
        JOIN app_schema.users u ON e.user_id = u.user_id
        WHERE u.telegram_id = $1
        ORDER BY e.event_timestamp DESC
        LIMIT $2
      `, [telegramId, limit]);

      return result.rows;
    } catch (error) {
      logger.error('Error getting user recent events:', error);
      throw error;
    }
  }

  /**
   * Проверка активности пользователя
   */
  async isUserActive(telegramId: number, days: number = 30): Promise<boolean> {
    try {
      const result = await db.query(`
        SELECT COUNT(*) as event_count
        FROM app_schema.events e
        JOIN app_schema.users u ON e.user_id = u.user_id
        WHERE u.telegram_id = $1 
        AND e.event_timestamp > NOW() - INTERVAL '${days} days'
      `, [telegramId]);

      return parseInt(result.rows[0].event_count) > 0;
    } catch (error) {
      logger.error('Error checking user activity:', error);
      return false;
    }
  }
}

export const telegramService = new TelegramService();
