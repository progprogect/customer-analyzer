# Скрипты для генерации тестовых данных

## Описание

Скрипты для генерации синтетических тестовых данных для системы аналитики и персонализированных рекомендаций.

## Установка зависимостей

```bash
# Установка Python зависимостей
pip install -r scripts/requirements.txt

# Или через pipenv/poetry
pipenv install -r scripts/requirements.txt
```

## Использование

### Генерация всех тестовых данных

```bash
# Запуск генерации (требует подключения к PostgreSQL)
python scripts/generate-test-data.py
```

### Переменные окружения

Скрипт использует следующие переменные окружения:

```bash
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_DB=customer_analyzer
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=postgres
```

### Запуск через Docker

```bash
# Запуск PostgreSQL
docker-compose up -d postgres

# Запуск генерации данных
docker-compose exec postgres python /app/scripts/generate-test-data.py
```

## Генерируемые данные

### Пользователи (1000+)
- Уникальные Telegram ID
- Реалистичные имена и фамилии
- Даты регистрации за последние 2 года
- Профильные данные (возраст, город, интересы)

### Продукты (150)
- 12 категорий товаров
- Реалистичные названия и цены
- Атрибуты для content-based рекомендаций
- Рейтинги и теги

### События (50,000+)
- Реалистичные паттерны поведения пользователей
- Воронка: просмотр → корзина → покупка
- События бота (команды)
- Временные паттерны и сессии

## Статистика генерации

Скрипт генерирует данные со следующими характеристиками:

- **70% активных пользователей** (события за последние 2 года)
- **15% конверсия** просмотров в покупки
- **30% конверсия** просмотров в корзину
- **40% пользователей** используют Telegram бота
- **3-25 событий** в сессии
- **5-45 минут** длительность сессии

## Валидация данных

Скрипт автоматически проверяет:

- Консистентность связей между таблицами
- Отсутствие "осиротевших" событий
- Корректность типов событий
- Валидность JSON данных

## Примеры использования

### Просмотр статистики после генерации

```sql
-- Количество пользователей по активности
SELECT 
    CASE 
        WHEN last_activity > NOW() - INTERVAL '30 days' THEN 'Активные'
        WHEN last_activity > NOW() - INTERVAL '90 days' THEN 'Неактивные'
        ELSE 'Забытые'
    END as user_status,
    COUNT(*) as count
FROM (
    SELECT user_id, MAX(event_timestamp) as last_activity
    FROM app_schema.events
    GROUP BY user_id
) user_activity
GROUP BY user_status;

-- Топ продуктов по продажам
SELECT 
    p.name,
    p.category,
    COUNT(*) as purchases,
    SUM((e.properties->>'amount')::numeric) as revenue
FROM app_schema.events e
JOIN app_schema.products p ON e.product_id = p.product_id
WHERE e.event_type = 'purchase'
GROUP BY p.product_id, p.name, p.category
ORDER BY purchases DESC
LIMIT 10;

-- Распределение событий по типам
SELECT 
    event_type,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM app_schema.events
GROUP BY event_type
ORDER BY count DESC;
```

## Troubleshooting

### Ошибки подключения к БД

```bash
# Проверка доступности PostgreSQL
docker ps | grep postgres

# Проверка подключения
psql -h localhost -p 5432 -U postgres -d customer_analyzer
```

### Ошибки памяти

При генерации большого количества данных:

```bash
# Уменьшение размера пакета
export BATCH_SIZE=500

# Генерация меньшего количества данных
export USERS_COUNT=500
export EVENTS_COUNT=25000
```

### Очистка данных

```bash
# Очистка всех тестовых данных
psql -h localhost -p 5432 -U postgres -d customer_analyzer -c "
DELETE FROM app_schema.events;
DELETE FROM app_schema.user_metrics;
DELETE FROM app_schema.users;
DELETE FROM app_schema.products;
"
```

## Кастомизация

Для изменения параметров генерации отредактируйте конфигурацию в классе `TestDataGenerator`:

```python
self.config = {
    'users_count': 2000,        # Количество пользователей
    'products_count': 300,      # Количество продуктов
    'events_count': 100000,     # Количество событий
    # ... другие параметры
}
```
