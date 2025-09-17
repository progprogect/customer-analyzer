/**
 * Типы для интеграции с Telegram Bot API
 */

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  date: number;
  chat: {
    id: number;
    type: 'private' | 'group' | 'supergroup' | 'channel';
  };
  text?: string;
  entities?: TelegramMessageEntity[];
}

export interface TelegramMessageEntity {
  type: 'mention' | 'hashtag' | 'cashtag' | 'bot_command' | 'url' | 'email' | 'phone_number' | 'bold' | 'italic' | 'code' | 'pre' | 'text_link' | 'text_mention';
  offset: number;
  length: number;
  url?: string;
  user?: TelegramUser;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
  chat_instance: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

// Типы для API эндпоинтов
export interface BotEventRequest {
  update_id: number;
  event_type: 'message' | 'callback_query' | 'command';
  user: TelegramUser;
  data: {
    message?: TelegramMessage;
    callback_query?: TelegramCallbackQuery;
    command?: string;
    text?: string;
  };
  timestamp: string;
}

export interface BotEventResponse {
  success: boolean;
  message?: string;
  event_id?: number;
  error?: string;
}

export interface UserUpsertRequest {
  telegram_id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface EventCreateRequest {
  user_telegram_id: number;
  event_type: 'bot_command' | 'message' | 'callback_query';
  properties?: {
    command?: string;
    text?: string;
    callback_data?: string;
    message_id?: number;
    response_time_ms?: number;
  };
  timestamp?: string;
}

// Типы для валидации
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  data?: any;
}
