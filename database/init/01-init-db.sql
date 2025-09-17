-- Инициализация базы данных для системы аналитики и рекомендаций
-- Создание пользователей и ролей

-- Создание роли для backend API
CREATE ROLE app_user WITH LOGIN PASSWORD 'app_password';

-- Создание роли для ML сервисов (только чтение)
CREATE ROLE ml_user WITH LOGIN PASSWORD 'ml_password';

-- Создание роли для административных задач
CREATE ROLE admin_user WITH LOGIN PASSWORD 'admin_password' CREATEDB CREATEROLE;

-- Предоставление базовых привилегий
GRANT CONNECT ON DATABASE customer_analyzer TO app_user;
GRANT CONNECT ON DATABASE customer_analyzer TO ml_user;
GRANT CONNECT ON DATABASE customer_analyzer TO admin_user;

-- Создание схемы для приложения
CREATE SCHEMA IF NOT EXISTS app_schema;

-- Предоставление прав на схему
GRANT USAGE ON SCHEMA app_schema TO app_user;
GRANT USAGE ON SCHEMA app_schema TO ml_user;
GRANT ALL PRIVILEGES ON SCHEMA app_schema TO admin_user;

-- Предоставление прав на создание таблиц
GRANT CREATE ON SCHEMA app_schema TO app_user;

-- Настройка поиска по умолчанию
ALTER ROLE app_user SET search_path TO app_schema, public;
ALTER ROLE ml_user SET search_path TO app_schema, public;
ALTER ROLE admin_user SET search_path TO app_schema, public;

-- Создание расширений
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Настройка логирования для отладки
ALTER SYSTEM SET log_statement = 'mod';
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';

-- Перезагрузка конфигурации
SELECT pg_reload_conf();

-- Создание индексов для производительности (будут применены после создания таблиц)
-- Эти индексы будут созданы в миграциях

COMMENT ON SCHEMA app_schema IS 'Основная схема приложения для системы аналитики и рекомендаций';
COMMENT ON ROLE app_user IS 'Пользователь для backend API - полные права на данные приложения';
COMMENT ON ROLE ml_user IS 'Пользователь для ML сервисов - только чтение данных';
COMMENT ON ROLE admin_user IS 'Администратор базы данных - полные права';
