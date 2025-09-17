-- Создание полезных функций для работы с данными

-- Функция для получения статистики пользователя
CREATE OR REPLACE FUNCTION app_schema.get_user_stats(p_user_id INTEGER)
RETURNS TABLE(
    total_events BIGINT,
    purchase_count BIGINT,
    total_spent NUMERIC,
    avg_order_value NUMERIC,
    last_activity TIMESTAMP WITH TIME ZONE,
    days_since_last_activity INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE e.event_type = 'purchase') as purchase_count,
        COALESCE(SUM((e.properties->>'amount')::NUMERIC) FILTER (WHERE e.event_type = 'purchase'), 0) as total_spent,
        CASE 
            WHEN COUNT(*) FILTER (WHERE e.event_type = 'purchase') > 0 
            THEN COALESCE(AVG((e.properties->>'amount')::NUMERIC) FILTER (WHERE e.event_type = 'purchase'), 0)
            ELSE 0 
        END as avg_order_value,
        MAX(e.event_timestamp) as last_activity,
        EXTRACT(DAYS FROM NOW() - MAX(e.event_timestamp))::INTEGER as days_since_last_activity
    FROM app_schema.events e
    WHERE e.user_id = p_user_id;
END;
$$;

-- Функция для очистки старых событий (для maintenance)
CREATE OR REPLACE FUNCTION app_schema.cleanup_old_events(days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM app_schema.events 
    WHERE event_timestamp < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Функция для обновления метрик пользователя
CREATE OR REPLACE FUNCTION app_schema.update_user_metrics(p_user_id INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_stats RECORD;
BEGIN
    -- Получаем статистику пользователя
    SELECT * INTO user_stats FROM app_schema.get_user_stats(p_user_id);
    
    -- Обновляем или создаем запись в user_metrics
    INSERT INTO app_schema.user_metrics (
        user_id, 
        ltv, 
        last_updated
    ) VALUES (
        p_user_id, 
        user_stats.total_spent, 
        NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        ltv = user_stats.total_spent,
        last_updated = NOW();
END;
$$;

-- Функция для получения активных пользователей за период
CREATE OR REPLACE FUNCTION app_schema.get_active_users(
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE(
    user_id INTEGER,
    telegram_id BIGINT,
    first_name VARCHAR,
    last_activity TIMESTAMP WITH TIME ZONE,
    event_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.user_id,
        u.telegram_id,
        u.first_name,
        MAX(e.event_timestamp) as last_activity,
        COUNT(e.event_id) as event_count
    FROM app_schema.users u
    INNER JOIN app_schema.events e ON u.user_id = e.user_id
    WHERE e.event_timestamp BETWEEN p_start_date AND p_end_date
    GROUP BY u.user_id, u.telegram_id, u.first_name
    ORDER BY last_activity DESC;
END;
$$;

-- Функция для получения топ продуктов
CREATE OR REPLACE FUNCTION app_schema.get_top_products(
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
    product_id INTEGER,
    product_name VARCHAR,
    category VARCHAR,
    view_count BIGINT,
    purchase_count BIGINT,
    conversion_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.product_id,
        p.name as product_name,
        p.category,
        COUNT(*) FILTER (WHERE e.event_type = 'view') as view_count,
        COUNT(*) FILTER (WHERE e.event_type = 'purchase') as purchase_count,
        CASE 
            WHEN COUNT(*) FILTER (WHERE e.event_type = 'view') > 0 
            THEN (COUNT(*) FILTER (WHERE e.event_type = 'purchase')::NUMERIC / COUNT(*) FILTER (WHERE e.event_type = 'view'))
            ELSE 0 
        END as conversion_rate
    FROM app_schema.products p
    LEFT JOIN app_schema.events e ON p.product_id = e.product_id
        AND e.event_timestamp BETWEEN p_start_date AND p_end_date
    GROUP BY p.product_id, p.name, p.category
    ORDER BY purchase_count DESC, view_count DESC
    LIMIT p_limit;
END;
$$;

-- Предоставление прав на функции
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app_schema TO app_user;
GRANT EXECUTE ON FUNCTION app_schema.get_user_stats(INTEGER) TO ml_user;
GRANT EXECUTE ON FUNCTION app_schema.get_active_users(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO ml_user;
GRANT EXECUTE ON FUNCTION app_schema.get_top_products(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, INTEGER) TO ml_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app_schema TO admin_user;

-- Комментарии к функциям
COMMENT ON FUNCTION app_schema.get_user_stats(INTEGER) IS 'Получение статистики пользователя по событиям';
COMMENT ON FUNCTION app_schema.cleanup_old_events(INTEGER) IS 'Очистка старых событий (maintenance функция)';
COMMENT ON FUNCTION app_schema.update_user_metrics(INTEGER) IS 'Обновление метрик пользователя';
COMMENT ON FUNCTION app_schema.get_active_users(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) IS 'Получение активных пользователей за период';
COMMENT ON FUNCTION app_schema.get_top_products(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, INTEGER) IS 'Получение топ продуктов по продажам и просмотрам';
