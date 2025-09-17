# База данных PostgreSQL

## Описание

Настройка и конфигурация PostgreSQL для системы аналитики и персонализированных рекомендаций.

## Структура

```
database/
├── init/                    # Скрипты инициализации
│   ├── 01-init-db.sql      # Создание пользователей и ролей
│   ├── 02-create-tables.sql # Создание таблиц
│   ├── 03-create-indexes.sql # Создание индексов
│   └── 04-create-functions.sql # Создание функций
├── migrations/             # Миграции (будут добавлены позже)
├── backups/               # Директория для бэкапов
└── README.md             # Этот файл
```

## Быстрый старт

### Запуск с Docker

```bash
# Запуск PostgreSQL
docker-compose up -d postgres

# Проверка подключения
docker exec -it customer-analyzer-postgres psql -U postgres -d customer_analyzer
```

### Подключение к базе

```bash
# Через Docker
docker exec -it customer-analyzer-postgres psql -U postgres -d customer_analyzer

# Локально (если PostgreSQL установлен)
psql -h localhost -p 5432 -U postgres -d customer_analyzer
```

## Пользователи и роли

### app_user
- **Назначение:** Backend API приложения
- **Права:** Полные права на схему `app_schema` (SELECT, INSERT, UPDATE, DELETE)
- **Пароль:** `app_password`

### ml_user
- **Назначение:** ML сервисы (только чтение)
- **Права:** Только SELECT на схему `app_schema`
- **Пароль:** `ml_password`

### admin_user
- **Назначение:** Административные задачи
- **Права:** Полные права на базу данных
- **Пароль:** `admin_password`

## Схема базы данных

### Основные таблицы

1. **users** - Пользователи системы
   - `user_id` (SERIAL PRIMARY KEY)
   - `telegram_id` (BIGINT UNIQUE NOT NULL)
   - `first_name`, `last_name`, `username` (VARCHAR)
   - `registration_date` (TIMESTAMP WITH TIME ZONE)
   - `profile_data` (JSONB)

2. **products** - Каталог продуктов
   - `product_id` (SERIAL PRIMARY KEY)
   - `name` (VARCHAR NOT NULL)
   - `category` (VARCHAR)
   - `price` (NUMERIC)
   - `description` (TEXT)
   - `attributes` (JSONB)

3. **events** - События пользователей
   - `event_id` (BIGSERIAL PRIMARY KEY)
   - `user_id` (INTEGER REFERENCES users)
   - `product_id` (INTEGER REFERENCES products)
   - `event_type` (VARCHAR) - 'view', 'add_to_cart', 'purchase', 'bot_command'
   - `event_timestamp` (TIMESTAMP WITH TIME ZONE)
   - `properties` (JSONB)

4. **user_metrics** - Рассчитанные метрики
   - `user_id` (INTEGER PRIMARY KEY REFERENCES users)
   - `segment_id` (INTEGER)
   - `ltv` (NUMERIC) - Lifetime Value
   - `churn_probability` (REAL 0-1)
   - `purchase_probability_30d` (REAL 0-1)
   - `last_updated` (TIMESTAMP WITH TIME ZONE)

## Полезные функции

### get_user_stats(user_id)
Получение статистики пользователя:
```sql
SELECT * FROM app_schema.get_user_stats(1);
```

### get_active_users(start_date, end_date)
Получение активных пользователей за период:
```sql
SELECT * FROM app_schema.get_active_users('2024-01-01', '2024-01-31');
```

### get_top_products(start_date, end_date, limit)
Получение топ продуктов:
```sql
SELECT * FROM app_schema.get_top_products('2024-01-01', '2024-01-31', 10);
```

## Бэкапы

### Создание бэкапа
```bash
./scripts/backup-db.sh
```

### Восстановление из бэкапа
```bash
./scripts/restore-db.sh ./backups/customer_analyzer_20240120_143022.sql.gz
```

### Автоматические бэкапы
Добавьте в crontab для ежедневных бэкапов:
```bash
# Ежедневно в 2:00
0 2 * * * /path/to/customer-analyzer/scripts/backup-db.sh
```

## Мониторинг

### pgAdmin
- URL: http://localhost:5050
- Email: admin@customer-analyzer.com
- Password: admin

### Подключение к PostgreSQL через pgAdmin
- Host: postgres (или localhost)
- Port: 5432
- Database: customer_analyzer
- Username: postgres
- Password: postgres

## Производительность

### Основные индексы
- `idx_events_user_timestamp` - для поиска событий пользователя
- `idx_events_type_timestamp` - для аналитики по типам событий
- `idx_events_purchases` - частичный индекс для покупок
- `idx_users_profile_data_gin` - GIN индекс для JSONB поиска

### Мониторинг запросов
```sql
-- Включение статистики запросов
SELECT pg_stat_statements_reset();

-- Топ медленных запросов
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

## Безопасность

### Рекомендации для продакшена
1. Измените пароли по умолчанию
2. Используйте SSL соединения
3. Настройте firewall
4. Регулярно обновляйте PostgreSQL
5. Мониторьте логи доступа

### Переменные окружения для продакшена
```bash
POSTGRES_PASSWORD=strong_password_here
POSTGRES_USER=custom_user
POSTGRES_DB=customer_analyzer_prod
```

## Troubleshooting

### Проблемы с подключением
```bash
# Проверка статуса контейнера
docker ps | grep postgres

# Просмотр логов
docker logs customer-analyzer-postgres

# Проверка доступности порта
netstat -an | grep 5432
```

### Проблемы с правами
```sql
-- Проверка прав пользователя
SELECT * FROM information_schema.role_table_grants 
WHERE grantee = 'app_user';

-- Предоставление прав
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app_schema TO app_user;
```
