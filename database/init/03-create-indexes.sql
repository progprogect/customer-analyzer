-- Создание индексов для оптимизации производительности
-- Эти индексы создаются после создания таблиц

-- Индексы для таблицы users
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON app_schema.users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_registration_date ON app_schema.users(registration_date);
CREATE INDEX IF NOT EXISTS idx_users_username ON app_schema.users(username) WHERE username IS NOT NULL;

-- Индексы для таблицы products
CREATE INDEX IF NOT EXISTS idx_products_category ON app_schema.products(category);
CREATE INDEX IF NOT EXISTS idx_products_price ON app_schema.products(price);
CREATE INDEX IF NOT EXISTS idx_products_name_gin ON app_schema.products USING gin(to_tsvector('english', name));

-- Индексы для таблицы events (критически важны для производительности)
CREATE INDEX IF NOT EXISTS idx_events_user_id ON app_schema.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_product_id ON app_schema.events(product_id);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON app_schema.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON app_schema.events(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_events_user_timestamp ON app_schema.events(user_id, event_timestamp);
CREATE INDEX IF NOT EXISTS idx_events_type_timestamp ON app_schema.events(event_type, event_timestamp);

-- Составные индексы для частых запросов
CREATE INDEX IF NOT EXISTS idx_events_user_type_timestamp ON app_schema.events(user_id, event_type, event_timestamp);
CREATE INDEX IF NOT EXISTS idx_events_product_type_timestamp ON app_schema.events(product_id, event_type, event_timestamp);

-- Частичные индексы для специфических случаев
CREATE INDEX IF NOT EXISTS idx_events_purchases ON app_schema.events(user_id, event_timestamp) 
    WHERE event_type = 'purchase';
CREATE INDEX IF NOT EXISTS idx_events_views ON app_schema.events(user_id, product_id, event_timestamp) 
    WHERE event_type = 'view';
CREATE INDEX IF NOT EXISTS idx_events_bot_commands ON app_schema.events(user_id, event_timestamp) 
    WHERE event_type = 'bot_command';

-- Индексы для таблицы user_metrics
CREATE INDEX IF NOT EXISTS idx_user_metrics_segment_id ON app_schema.user_metrics(segment_id);
CREATE INDEX IF NOT EXISTS idx_user_metrics_churn_probability ON app_schema.user_metrics(churn_probability);
CREATE INDEX IF NOT EXISTS idx_user_metrics_purchase_probability ON app_schema.user_metrics(purchase_probability_30d);
CREATE INDEX IF NOT EXISTS idx_user_metrics_ltv ON app_schema.user_metrics(ltv);
CREATE INDEX IF NOT EXISTS idx_user_metrics_last_updated ON app_schema.user_metrics(last_updated);

-- Индексы для JSONB полей (GIN индексы)
CREATE INDEX IF NOT EXISTS idx_users_profile_data_gin ON app_schema.users USING gin(profile_data);
CREATE INDEX IF NOT EXISTS idx_products_attributes_gin ON app_schema.products USING gin(attributes);
CREATE INDEX IF NOT EXISTS idx_events_properties_gin ON app_schema.events USING gin(properties);

-- Индексы для временных запросов (по дням/месяцам)
CREATE INDEX IF NOT EXISTS idx_events_date_trunc_day ON app_schema.events(date_trunc('day', event_timestamp));
CREATE INDEX IF NOT EXISTS idx_events_date_trunc_month ON app_schema.events(date_trunc('month', event_timestamp));

-- Статистика для оптимизатора запросов
ALTER TABLE app_schema.users ALTER COLUMN user_id SET STATISTICS 1000;
ALTER TABLE app_schema.events ALTER COLUMN event_id SET STATISTICS 1000;
ALTER TABLE app_schema.events ALTER COLUMN user_id SET STATISTICS 1000;
ALTER TABLE app_schema.events ALTER COLUMN product_id SET STATISTICS 1000;

-- Комментарии к индексам
COMMENT ON INDEX app_schema.idx_events_user_timestamp IS 'Основной индекс для поиска событий пользователя по времени';
COMMENT ON INDEX app_schema.idx_events_type_timestamp IS 'Индекс для аналитики по типам событий';
COMMENT ON INDEX app_schema.idx_events_purchases IS 'Частичный индекс только для событий покупки';
COMMENT ON INDEX app_schema.idx_users_profile_data_gin IS 'GIN индекс для поиска в JSONB профиле пользователя';
