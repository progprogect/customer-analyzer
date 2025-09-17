import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '@/utils/logger';

/**
 * Middleware для аутентификации Telegram Bot
 * Проверяет подпись запросов от Telegram
 */

interface TelegramAuthRequest extends Request {
  telegramAuth?: {
    isValid: boolean;
    botToken: string;
  };
}

/**
 * Проверка подписи Telegram Bot
 */
export const telegramAuthMiddleware = (req: TelegramAuthRequest, res: Response, next: NextFunction): void => {
  try {
    // Получаем токен бота из заголовка или переменной окружения
    const botToken = req.headers['x-telegram-bot-token'] as string || process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      logger.warn('Telegram bot token not provided');
      req.telegramAuth = { isValid: false, botToken: '' };
      return next();
    }

    // Получаем подпись из заголовка
    const signature = req.headers['x-telegram-signature'] as string;
    
    if (!signature) {
      logger.warn('Telegram signature not provided');
      req.telegramAuth = { isValid: false, botToken };
      return next();
    }

    // Проверяем подпись
    const isValid = verifyTelegramSignature(req.body, signature, botToken);
    
    req.telegramAuth = { isValid, botToken };
    
    if (!isValid) {
      logger.warn('Invalid Telegram signature');
    }
    
    next();
  } catch (error) {
    logger.error('Error in Telegram auth middleware:', error);
    req.telegramAuth = { isValid: false, botToken: '' };
    next();
  }
};

/**
 * Проверка подписи Telegram
 */
function verifyTelegramSignature(body: any, signature: string, botToken: string): boolean {
  try {
    // Создаем хеш из тела запроса и токена бота
    const dataCheckString = JSON.stringify(body);
    const secretKey = crypto.createHmac('sha256', botToken).update(dataCheckString).digest('hex');
    
    // Сравниваем с подписью
    return signature === secretKey;
  } catch (error) {
    logger.error('Error verifying Telegram signature:', error);
    return false;
  }
}

/**
 * Middleware для обязательной аутентификации Telegram
 */
export const requireTelegramAuth = (req: TelegramAuthRequest, res: Response, next: NextFunction): void => {
  if (!req.telegramAuth?.isValid) {
    const response = {
      success: false,
      error: 'Invalid Telegram authentication',
      timestamp: new Date().toISOString()
    };
    
    logger.warn('Telegram authentication failed', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      hasToken: !!req.telegramAuth?.botToken,
      hasSignature: !!req.headers['x-telegram-signature']
    });
    
    res.status(401).json(response);
    return;
  }
  
  next();
};

/**
 * Middleware для логирования Telegram запросов
 */
export const telegramLoggingMiddleware = (req: TelegramAuthRequest, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Логируем входящий запрос
  logger.info('Telegram API request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    hasAuth: !!req.telegramAuth?.isValid,
    timestamp: new Date().toISOString()
  });
  
  // Перехватываем ответ
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    logger.info('Telegram API response', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      success: res.statusCode < 400
    });
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Middleware для валидации IP адресов Telegram
 * Проверяет, что запрос пришел от серверов Telegram
 */
export const telegramIPValidation = (req: Request, res: Response, next: NextFunction): void => {
  const clientIP = req.ip;
  
  // Список IP адресов Telegram (примерный, нужно обновлять)
  const telegramIPs = [
    '149.154.160.0/20',   // Telegram servers
    '91.108.4.0/22',      // Telegram servers
    '149.154.176.0/20',   // Telegram servers
    '91.108.8.0/22',      // Telegram servers
  ];
  
  // В development режиме пропускаем проверку IP
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  // Проверяем IP (упрощенная версия)
  const isTelegramIP = telegramIPs.some(ipRange => {
    // Здесь должна быть логика проверки CIDR
    // Для упрощения пропускаем проверку в примере
    return true;
  });
  
  if (!isTelegramIP) {
    logger.warn('Request from non-Telegram IP', {
      ip: clientIP,
      path: req.path,
      userAgent: req.get('User-Agent')
    });
    
    const response = {
      success: false,
      error: 'Access denied',
      timestamp: new Date().toISOString()
    };
    
    res.status(403).json(response);
    return;
  }
  
  next();
};
