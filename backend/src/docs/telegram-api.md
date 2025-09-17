# Telegram Bot API Documentation

## Обзор

API для интеграции с Telegram Bot, обеспечивающий прием событий от бота, создание/обновление пользователей и логирование взаимодействий.

## Базовый URL

```
http://localhost:8000/api/telegram
```

## Аутентификация

API использует следующие методы аутентификации:

1. **Rate Limiting**: 1000 запросов за 15 минут
2. **Telegram Signature**: Проверка подписи запросов (опционально)
3. **IP Validation**: Проверка IP адресов Telegram серверов

## Эндпоинты

### 1. Создание события от бота

**POST** `/api/telegram/events`

Создает событие от Telegram Bot и автоматически создает/обновляет пользователя.

#### Запрос

```json
{
  "update_id": 123456789,
  "event_type": "command",
  "user": {
    "id": 987654321,
    "is_bot": false,
    "first_name": "Иван",
    "last_name": "Петров",
    "username": "ivan_petrov",
    "language_code": "ru"
  },
  "data": {
    "command": "/start",
    "text": "/start"
  },
  "timestamp": "2023-01-20T10:30:00Z"
}
```

#### Ответ

```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Event processed successfully",
    "event_id": 12345
  },
  "timestamp": "2023-01-20T10:30:01Z"
}
```

#### Типы событий

- `command` - Команда бота (например, `/start`, `/help`)
- `message` - Обычное сообщение
- `callback_query` - Нажатие inline-кнопки

### 2. Создание/обновление пользователя

**POST** `/api/telegram/users`

Создает нового пользователя или обновляет существующего.

#### Запрос

```json
{
  "telegram_id": 987654321,
  "first_name": "Иван",
  "last_name": "Петров",
  "username": "ivan_petrov",
  "language_code": "ru"
}
```

#### Ответ

```json
{
  "success": true,
  "data": {
    "user_id": 123,
    "is_new": true
  },
  "message": "User created successfully",
  "timestamp": "2023-01-20T10:30:01Z"
}
```

### 3. Создание события

**POST** `/api/telegram/events/create`

Создает событие для существующего пользователя.

#### Запрос

```json
{
  "user_telegram_id": 987654321,
  "event_type": "bot_command",
  "properties": {
    "command": "/recommendations",
    "text": "/recommendations",
    "response_time_ms": 150
  },
  "timestamp": "2023-01-20T10:30:00Z"
}
```

#### Ответ

```json
{
  "success": true,
  "data": {
    "event_id": 12346
  },
  "message": "Event created successfully",
  "timestamp": "2023-01-20T10:30:01Z"
}
```

### 4. Статистика пользователя

**GET** `/api/telegram/users/:telegramId/stats`

Возвращает статистику пользователя.

#### Ответ

```json
{
  "success": true,
  "data": {
    "total_events": 25,
    "purchase_count": 3,
    "total_spent": 15000,
    "avg_order_value": 5000,
    "last_activity": "2023-01-20T10:30:00Z",
    "days_since_last_activity": 0
  },
  "timestamp": "2023-01-20T10:30:01Z"
}
```

### 5. Последние события пользователя

**GET** `/api/telegram/users/:telegramId/events?limit=10`

Возвращает последние события пользователя.

#### Параметры запроса

- `limit` (optional): Количество событий (1-100, по умолчанию 10)

#### Ответ

```json
{
  "success": true,
  "data": [
    {
      "event_type": "bot_command",
      "event_timestamp": "2023-01-20T10:30:00Z",
      "properties": {
        "command": "/start",
        "response_time_ms": 150
      }
    }
  ],
  "timestamp": "2023-01-20T10:30:01Z"
}
```

### 6. Проверка активности пользователя

**GET** `/api/telegram/users/:telegramId/active?days=30`

Проверяет активность пользователя за указанный период.

#### Параметры запроса

- `days` (optional): Количество дней для проверки (1-365, по умолчанию 30)

#### Ответ

```json
{
  "success": true,
  "data": {
    "is_active": true,
    "days_checked": 30
  },
  "timestamp": "2023-01-20T10:30:01Z"
}
```

### 7. Webhook для Telegram

**POST** `/api/telegram/webhook`

Эндпоинт для получения webhook от Telegram Bot API.

#### Запрос (сообщение)

```json
{
  "update_id": 123456789,
  "message": {
    "message_id": 123,
    "from": {
      "id": 987654321,
      "is_bot": false,
      "first_name": "Иван"
    },
    "date": 1674207000,
    "chat": {
      "id": 987654321,
      "type": "private"
    },
    "text": "Привет!"
  }
}
```

#### Запрос (callback query)

```json
{
  "update_id": 123456790,
  "callback_query": {
    "id": "callback123",
    "from": {
      "id": 987654321,
      "is_bot": false,
      "first_name": "Иван"
    },
    "data": "button_clicked",
    "chat_instance": "chat123"
  }
}
```

#### Ответ

```json
{
  "ok": true
}
```

### 8. Информация об API

**GET** `/api/telegram/info`

Возвращает информацию об API и доступных эндпоинтах.

#### Ответ

```json
{
  "success": true,
  "data": {
    "version": "1.0.0",
    "endpoints": [
      "POST /api/telegram/events - Create bot event",
      "POST /api/telegram/users - Upsert user",
      "POST /api/telegram/events/create - Create event",
      "GET /api/telegram/users/:telegramId/stats - Get user stats",
      "GET /api/telegram/users/:telegramId/events - Get user events",
      "GET /api/telegram/users/:telegramId/active - Check user activity",
      "POST /api/telegram/webhook - Telegram webhook"
    ],
    "rate_limits": {
      "window": "15 minutes",
      "max_requests": 1000
    }
  },
  "timestamp": "2023-01-20T10:30:01Z"
}
```

## Коды ошибок

### 400 Bad Request
- Неверный формат данных
- Ошибки валидации
- Неверные параметры запроса

### 401 Unauthorized
- Неверная аутентификация Telegram
- Отсутствие подписи

### 403 Forbidden
- Запрос не от серверов Telegram
- Превышен лимит запросов

### 404 Not Found
- Пользователь не найден
- Неверный telegram_id

### 500 Internal Server Error
- Ошибка сервера
- Ошибка базы данных

## Примеры использования

### JavaScript/Node.js

```javascript
const axios = require('axios');

// Создание события от бота
const createBotEvent = async (botEvent) => {
  try {
    const response = await axios.post('http://localhost:8000/api/telegram/events', botEvent);
    console.log('Event created:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};

// Получение статистики пользователя
const getUserStats = async (telegramId) => {
  try {
    const response = await axios.get(`http://localhost:8000/api/telegram/users/${telegramId}/stats`);
    return response.data.data;
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};
```

### Python

```python
import requests

# Создание события от бота
def create_bot_event(bot_event):
    try:
        response = requests.post('http://localhost:8000/api/telegram/events', json=bot_event)
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Error: {e}')

# Получение статистики пользователя
def get_user_stats(telegram_id):
    try:
        response = requests.get(f'http://localhost:8000/api/telegram/users/{telegram_id}/stats')
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Error: {e}')
```

### cURL

```bash
# Создание события от бота
curl -X POST http://localhost:8000/api/telegram/events \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 123456789,
    "event_type": "command",
    "user": {
      "id": 987654321,
      "is_bot": false,
      "first_name": "Test"
    },
    "data": {
      "command": "/start",
      "text": "/start"
    },
    "timestamp": "2023-01-20T10:30:00Z"
  }'

# Получение статистики пользователя
curl http://localhost:8000/api/telegram/users/987654321/stats
```

## Интеграция с Telegram Bot

### Настройка webhook

```javascript
const axios = require('axios');

const setWebhook = async (botToken, webhookUrl) => {
  try {
    const response = await axios.post(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      url: webhookUrl,
      allowed_updates: ['message', 'callback_query']
    });
    console.log('Webhook set:', response.data);
  } catch (error) {
    console.error('Error setting webhook:', error.response.data);
  }
};

// Установка webhook
setWebhook('YOUR_BOT_TOKEN', 'https://yourdomain.com/api/telegram/webhook');
```

### Обработка обновлений в боте

```javascript
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Обработка webhook от Telegram
app.post('/webhook', async (req, res) => {
  const update = req.body;
  
  // Отправляем событие в наш API
  try {
    await axios.post('http://localhost:8000/api/telegram/webhook', update);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ ok: false });
  }
});

app.listen(3000, () => {
  console.log('Bot webhook server running on port 3000');
});
```

## Мониторинг и логирование

API автоматически логирует:

- Все входящие запросы
- Ошибки валидации
- Ошибки базы данных
- Статистику использования

Логи доступны в формате JSON с метаданными:

```json
{
  "timestamp": "2023-01-20T10:30:00Z",
  "level": "info",
  "message": "Telegram API request",
  "method": "POST",
  "path": "/api/telegram/events",
  "ip": "127.0.0.1",
  "userAgent": "TelegramBot/1.0",
  "hasAuth": true
}
```
