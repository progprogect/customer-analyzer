-- Создание таблиц согласно схеме из Functional Requirements
-- Приложение А: Примерная структура данных (PostgreSQL)

-- 1. Таблица пользователей
CREATE TABLE IF NOT EXISTS app_schema.users (
    user_id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    username VARCHAR(255),
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Дополнительные демографические данные
    profile_data JSONB,
    
    -- Индексы
    CONSTRAINT users_telegram_id_unique UNIQUE (telegram_id)
);

-- 2. Каталог продуктов/услуг
CREATE TABLE IF NOT EXISTS app_schema.products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price NUMERIC(10, 2),
    description TEXT,
    -- Атрибуты для content-based рекомендаций
    attributes JSONB,
    
    -- Ограничения
    CONSTRAINT products_price_positive CHECK (price >= 0)
);

-- 3. События пользователей
CREATE TABLE IF NOT EXISTS app_schema.events (
    event_id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES app_schema.users(user_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES app_schema.products(product_id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL, -- 'view', 'add_to_cart', 'purchase', 'bot_command'
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Дополнительные параметры события (сумма покупки, текст команды)
    properties JSONB,
    
    -- Ограничения
    CONSTRAINT events_type_check CHECK (event_type IN ('view', 'add_to_cart', 'purchase', 'bot_command', 'click', 'scroll', 'session_start', 'session_end'))
);

-- 4. Рассчитанные метрики и прогнозы
CREATE TABLE IF NOT EXISTS app_schema.user_metrics (
    user_id INTEGER PRIMARY KEY REFERENCES app_schema.users(user_id) ON DELETE CASCADE,
    segment_id INTEGER,
    ltv NUMERIC(12, 2) DEFAULT 0,
    churn_probability REAL DEFAULT 0, -- от 0 до 1
    purchase_probability_30d REAL DEFAULT 0, -- от 0 до 1
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ограничения
    CONSTRAINT user_metrics_churn_probability_check CHECK (churn_probability >= 0 AND churn_probability <= 1),
    CONSTRAINT user_metrics_purchase_probability_check CHECK (purchase_probability_30d >= 0 AND purchase_probability_30d <= 1),
    CONSTRAINT user_metrics_ltv_check CHECK (ltv >= 0)
);

-- Предоставление прав на таблицы
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app_schema TO app_user;
GRANT SELECT ON ALL TABLES IN SCHEMA app_schema TO ml_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA app_schema TO admin_user;

-- Предоставление прав на последовательности
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA app_schema TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA app_schema TO ml_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA app_schema TO admin_user;

-- Комментарии к таблицам
COMMENT ON TABLE app_schema.users IS 'Пользователи системы';
COMMENT ON TABLE app_schema.products IS 'Каталог продуктов/услуг';
COMMENT ON TABLE app_schema.events IS 'События пользователей';
COMMENT ON TABLE app_schema.user_metrics IS 'Рассчитанные метрики и прогнозы для пользователей';

-- Комментарии к полям
COMMENT ON COLUMN app_schema.users.telegram_id IS 'Уникальный ID пользователя в Telegram';
COMMENT ON COLUMN app_schema.users.profile_data IS 'Дополнительные данные профиля в формате JSON';
COMMENT ON COLUMN app_schema.products.attributes IS 'Атрибуты товара для content-based рекомендаций';
COMMENT ON COLUMN app_schema.events.event_type IS 'Тип события: view, add_to_cart, purchase, bot_command, etc.';
COMMENT ON COLUMN app_schema.events.properties IS 'Дополнительные свойства события в формате JSON';
COMMENT ON COLUMN app_schema.user_metrics.segment_id IS 'ID сегмента пользователя после кластеризации';
COMMENT ON COLUMN app_schema.user_metrics.ltv IS 'Lifetime Value - пожизненная ценность клиента';
COMMENT ON COLUMN app_schema.user_metrics.churn_probability IS 'Вероятность оттока (0-1)';
COMMENT ON COLUMN app_schema.user_metrics.purchase_probability_30d IS 'Вероятность покупки в течение 30 дней (0-1)';
