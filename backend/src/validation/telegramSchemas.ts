import { z } from 'zod';
import { TelegramUser, BotEventRequest, UserUpsertRequest, EventCreateRequest } from '@/types/telegram';

/**
 * Схемы валидации для Telegram Bot API
 */

// Схема валидации Telegram пользователя
export const telegramUserSchema = z.object({
  id: z.number().int().positive(),
  is_bot: z.boolean(),
  first_name: z.string().min(1).max(255),
  last_name: z.string().max(255).optional(),
  username: z.string().max(255).optional(),
  language_code: z.string().length(2).optional()
});

// Схема валидации сообщения Telegram
export const telegramMessageSchema = z.object({
  message_id: z.number().int().positive(),
  from: telegramUserSchema.optional(),
  date: z.number().int().positive(),
  chat: z.object({
    id: z.number().int(),
    type: z.enum(['private', 'group', 'supergroup', 'channel'])
  }),
  text: z.string().optional(),
  entities: z.array(z.object({
    type: z.enum(['mention', 'hashtag', 'cashtag', 'bot_command', 'url', 'email', 'phone_number', 'bold', 'italic', 'code', 'pre', 'text_link', 'text_mention']),
    offset: z.number().int().min(0),
    length: z.number().int().positive(),
    url: z.string().url().optional(),
    user: telegramUserSchema.optional()
  })).optional()
});

// Схема валидации callback query
export const telegramCallbackQuerySchema = z.object({
  id: z.string().min(1),
  from: telegramUserSchema,
  message: telegramMessageSchema.optional(),
  data: z.string().optional(),
  chat_instance: z.string().min(1)
});

// Схема валидации update
export const telegramUpdateSchema = z.object({
  update_id: z.number().int().positive(),
  message: telegramMessageSchema.optional(),
  callback_query: telegramCallbackQuerySchema.optional()
});

// Схема валидации запроса на создание события бота
export const botEventRequestSchema = z.object({
  update_id: z.number().int().positive(),
  event_type: z.enum(['message', 'callback_query', 'command']),
  user: telegramUserSchema,
  data: z.object({
    message: telegramMessageSchema.optional(),
    callback_query: telegramCallbackQuerySchema.optional(),
    command: z.string().optional(),
    text: z.string().optional()
  }),
  timestamp: z.string().datetime()
});

// Схема валидации запроса на создание/обновление пользователя
export const userUpsertRequestSchema = z.object({
  telegram_id: z.number().int().positive(),
  first_name: z.string().min(1).max(255),
  last_name: z.string().max(255).optional(),
  username: z.string().max(255).optional(),
  language_code: z.string().length(2).optional()
});

// Схема валидации запроса на создание события
export const eventCreateRequestSchema = z.object({
  user_telegram_id: z.number().int().positive(),
  event_type: z.enum(['bot_command', 'message', 'callback_query']),
  properties: z.object({
    command: z.string().optional(),
    text: z.string().optional(),
    callback_data: z.string().optional(),
    message_id: z.number().int().positive().optional(),
    response_time_ms: z.number().int().positive().optional()
  }).optional(),
  timestamp: z.string().datetime().optional()
});

// Схема валидации для webhook
export const webhookRequestSchema = z.object({
  update_id: z.number().int().positive(),
  message: telegramMessageSchema.optional(),
  callback_query: telegramCallbackQuerySchema.optional()
});

/**
 * Функции валидации
 */
export function validateTelegramUser(data: unknown): { success: boolean; data?: TelegramUser; error?: string } {
  try {
    const result = telegramUserSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}

export function validateBotEventRequest(data: unknown): { success: boolean; data?: BotEventRequest; error?: string } {
  try {
    const result = botEventRequestSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}

export function validateUserUpsertRequest(data: unknown): { success: boolean; data?: UserUpsertRequest; error?: string } {
  try {
    const result = userUpsertRequestSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}

export function validateEventCreateRequest(data: unknown): { success: boolean; data?: EventCreateRequest; error?: string } {
  try {
    const result = eventCreateRequestSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}

export function validateWebhookRequest(data: unknown): { success: boolean; data?: any; error?: string } {
  try {
    const result = webhookRequestSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}
