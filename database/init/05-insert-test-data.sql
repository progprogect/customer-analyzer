-- Вставка тестовых данных для демонстрации системы

-- Очистка существующих данных (для демо)
DELETE FROM events WHERE true;
DELETE FROM products WHERE true;
DELETE FROM users WHERE true;

-- Вставка тестовых пользователей
INSERT INTO users (id, telegram_id, username, first_name, last_name, email, phone, registration_date, last_activity, status) VALUES
('user_001', 123456789, 'anna_smirnova', 'Анна', 'Смирнова', 'anna@example.com', '+7-900-123-4567', '2024-01-15', '2024-09-15', 'active'),
('user_002', 234567890, 'dmitry_kozlov', 'Дмитрий', 'Козлов', 'dmitry@example.com', '+7-900-234-5678', '2024-02-20', '2024-09-14', 'active'),
('user_003', 345678901, 'elena_petrova', 'Елена', 'Петрова', 'elena@example.com', '+7-900-345-6789', '2024-03-10', '2024-09-16', 'active'),
('user_004', 456789012, 'mikhail_volkov', 'Михаил', 'Волков', 'mikhail@example.com', '+7-900-456-7890', '2024-04-05', '2024-09-10', 'active'),
('user_005', 567890123, 'olga_sidorova', 'Ольга', 'Сидорова', 'olga@example.com', '+7-900-567-8901', '2024-05-12', '2024-09-08', 'active'),
('user_006', 678901234, 'ivan_novikov', 'Иван', 'Новиков', 'ivan@example.com', '+7-900-678-9012', '2024-01-25', '2024-08-15', 'inactive'),
('user_007', 789012345, 'maria_kozlova', 'Мария', 'Козлова', 'maria@example.com', '+7-900-789-0123', '2024-02-14', '2024-08-10', 'inactive'),
('user_008', 890123456, 'alexey_sokolov', 'Алексей', 'Соколов', 'alexey@example.com', '+7-900-890-1234', '2024-03-18', '2024-08-20', 'active'),
('user_009', 901234567, 'tatyana_morozova', 'Татьяна', 'Морозова', 'tatyana@example.com', '+7-900-901-2345', '2024-04-22', '2024-09-12', 'active'),
('user_010', 112233445, 'sergey_lebedev', 'Сергей', 'Лебедев', 'sergey@example.com', '+7-900-112-2334', '2024-05-30', '2024-09-14', 'active');

-- Вставка тестовых продуктов
INSERT INTO products (id, name, category, price, description, created_at, updated_at) VALUES
('prod_001', 'iPhone 15 Pro', 'Electronics', 999.99, 'Latest iPhone with advanced features', NOW(), NOW()),
('prod_002', 'MacBook Air M2', 'Electronics', 1299.99, 'Powerful laptop for work and creativity', NOW(), NOW()),
('prod_003', 'AirPods Pro', 'Electronics', 249.99, 'Wireless earbuds with noise cancellation', NOW(), NOW()),
('prod_004', 'Nike Air Max', 'Fashion', 129.99, 'Comfortable running shoes', NOW(), NOW()),
('prod_005', 'Adidas T-Shirt', 'Fashion', 29.99, 'Premium quality cotton t-shirt', NOW(), NOW()),
('prod_006', 'Samsung Galaxy S24', 'Electronics', 899.99, 'Android smartphone with great camera', NOW(), NOW()),
('prod_007', 'Sony WH-1000XM5', 'Electronics', 399.99, 'Industry-leading noise canceling headphones', NOW(), NOW()),
('prod_008', 'Levi''s Jeans', 'Fashion', 89.99, 'Classic denim jeans', NOW(), NOW()),
('prod_009', 'Coffee Maker', 'Home', 149.99, 'Automatic coffee maker for home', NOW(), NOW()),
('prod_010', 'Yoga Mat', 'Sports', 39.99, 'Non-slip yoga mat for fitness', NOW(), NOW());

-- Вставка тестовых событий (последние 3 месяца)
INSERT INTO events (id, user_id, event_type, event_data, timestamp, session_id, ip_address, user_agent) VALUES
-- Анна Смирнова (VIP клиент)
('event_001', 'user_001', 'page_view', '{"page": "/products/electronics"}', '2024-09-15 10:30:00', 'sess_001', '192.168.1.1', 'Mozilla/5.0...'),
('event_002', 'user_001', 'product_view', '{"product_id": "prod_001", "product_name": "iPhone 15 Pro"}', '2024-09-15 10:32:00', 'sess_001', '192.168.1.1', 'Mozilla/5.0...'),
('event_003', 'user_001', 'add_to_cart', '{"product_id": "prod_001", "quantity": 1, "price": 999.99}', '2024-09-15 10:35:00', 'sess_001', '192.168.1.1', 'Mozilla/5.0...'),
('event_004', 'user_001', 'purchase', '{"order_id": "order_001", "total": 999.99, "products": [{"id": "prod_001", "quantity": 1}]}', '2024-09-15 10:40:00', 'sess_001', '192.168.1.1', 'Mozilla/5.0...'),

-- Дмитрий Козлов (активный покупатель)
('event_005', 'user_002', 'page_view', '{"page": "/products/fashion"}', '2024-09-14 14:20:00', 'sess_002', '192.168.1.2', 'Mozilla/5.0...'),
('event_006', 'user_002', 'product_view', '{"product_id": "prod_004", "product_name": "Nike Air Max"}', '2024-09-14 14:22:00', 'sess_002', '192.168.1.2', 'Mozilla/5.0...'),
('event_007', 'user_002', 'add_to_cart', '{"product_id": "prod_004", "quantity": 1, "price": 129.99}', '2024-09-14 14:25:00', 'sess_002', '192.168.1.2', 'Mozilla/5.0...'),
('event_008', 'user_002', 'purchase', '{"order_id": "order_002", "total": 129.99, "products": [{"id": "prod_004", "quantity": 1}]}', '2024-09-14 14:30:00', 'sess_002', '192.168.1.2', 'Mozilla/5.0...'),

-- Елена Петрова (новый клиент)
('event_009', 'user_003', 'page_view', '{"page": "/products/electronics"}', '2024-09-16 09:15:00', 'sess_003', '192.168.1.3', 'Mozilla/5.0...'),
('event_010', 'user_003', 'product_view', '{"product_id": "prod_003", "product_name": "AirPods Pro"}', '2024-09-16 09:17:00', 'sess_003', '192.168.1.3', 'Mozilla/5.0...'),
('event_011', 'user_003', 'add_to_cart', '{"product_id": "prod_003", "quantity": 1, "price": 249.99}', '2024-09-16 09:20:00', 'sess_003', '192.168.1.3', 'Mozilla/5.0...'),

-- Михаил Волков (спящий клиент)
('event_012', 'user_004', 'page_view', '{"page": "/products"}', '2024-09-10 16:45:00', 'sess_004', '192.168.1.4', 'Mozilla/5.0...'),
('event_013', 'user_004', 'product_view', '{"product_id": "prod_006", "product_name": "Samsung Galaxy S24"}', '2024-09-10 16:47:00', 'sess_004', '192.168.1.4', 'Mozilla/5.0...'),

-- Ольга Сидорова (спящий клиент)
('event_014', 'user_005', 'page_view', '{"page": "/products/fashion"}', '2024-09-08 11:30:00', 'sess_005', '192.168.1.5', 'Mozilla/5.0...'),
('event_015', 'user_005', 'product_view', '{"product_id": "prod_005", "product_name": "Adidas T-Shirt"}', '2024-09-08 11:32:00', 'sess_005', '192.168.1.5', 'Mozilla/5.0...'),

-- Иван Новиков (высокий риск оттока)
('event_016', 'user_006', 'page_view', '{"page": "/products"}', '2024-08-15 13:20:00', 'sess_006', '192.168.1.6', 'Mozilla/5.0...'),
('event_017', 'user_006', 'product_view', '{"product_id": "prod_002", "product_name": "MacBook Air M2"}', '2024-08-15 13:22:00', 'sess_006', '192.168.1.6', 'Mozilla/5.0...'),

-- Мария Козлова (высокий риск оттока)
('event_018', 'user_007', 'page_view', '{"page": "/products/fashion"}', '2024-08-10 15:10:00', 'sess_007', '192.168.1.7', 'Mozilla/5.0...'),
('event_019', 'user_007', 'product_view', '{"product_id": "prod_008", "product_name": "Levi''s Jeans"}', '2024-08-10 15:12:00', 'sess_007', '192.168.1.7', 'Mozilla/5.0...'),

-- Алексей Соколов (средний риск)
('event_020', 'user_008', 'page_view', '{"page": "/products/sports"}', '2024-08-20 12:00:00', 'sess_008', '192.168.1.8', 'Mozilla/5.0...'),
('event_021', 'user_008', 'product_view', '{"product_id": "prod_010", "product_name": "Yoga Mat"}', '2024-08-20 12:02:00', 'sess_008', '192.168.1.8', 'Mozilla/5.0...'),
('event_022', 'user_008', 'add_to_cart', '{"product_id": "prod_010", "quantity": 1, "price": 39.99}', '2024-08-20 12:05:00', 'sess_008', '192.168.1.8', 'Mozilla/5.0...'),

-- Татьяна Морозова (средний риск)
('event_023', 'user_009', 'page_view', '{"page": "/products/home"}', '2024-09-12 10:30:00', 'sess_009', '192.168.1.9', 'Mozilla/5.0...'),
('event_024', 'user_009', 'product_view', '{"product_id": "prod_009", "product_name": "Coffee Maker"}', '2024-09-12 10:32:00', 'sess_009', '192.168.1.9', 'Mozilla/5.0...'),

-- Сергей Лебедев (низкий риск)
('event_025', 'user_010', 'page_view', '{"page": "/products/electronics"}', '2024-09-14 17:45:00', 'sess_010', '192.168.1.10', 'Mozilla/5.0...'),
('event_026', 'user_010', 'product_view', '{"product_id": "prod_007", "product_name": "Sony WH-1000XM5"}', '2024-09-14 17:47:00', 'sess_010', '192.168.1.10', 'Mozilla/5.0...'),
('event_027', 'user_010', 'add_to_cart', '{"product_id": "prod_007", "quantity": 1, "price": 399.99}', '2024-09-14 17:50:00', 'sess_010', '192.168.1.10', 'Mozilla/5.0...'),
('event_028', 'user_010', 'purchase', '{"order_id": "order_003", "total": 399.99, "products": [{"id": "prod_007", "quantity": 1}]}', '2024-09-14 17:55:00', 'sess_010', '192.168.1.10', 'Mozilla/5.0...'),

-- Дополнительные события для истории
('event_029', 'user_001', 'page_view', '{"page": "/products"}', '2024-09-01 10:00:00', 'sess_011', '192.168.1.1', 'Mozilla/5.0...'),
('event_030', 'user_001', 'purchase', '{"order_id": "order_004", "total": 1299.99, "products": [{"id": "prod_002", "quantity": 1}]}', '2024-09-01 10:30:00', 'sess_011', '192.168.1.1', 'Mozilla/5.0...'),
('event_031', 'user_002', 'page_view', '{"page": "/products/fashion"}', '2024-08-15 14:00:00', 'sess_012', '192.168.1.2', 'Mozilla/5.0...'),
('event_032', 'user_002', 'purchase', '{"order_id": "order_005", "total": 89.99, "products": [{"id": "prod_008", "quantity": 1}]}', '2024-08-15 14:30:00', 'sess_012', '192.168.1.2', 'Mozilla/5.0...');

-- Обновление статистики пользователей
UPDATE users SET 
    total_purchases = (
        SELECT COUNT(*) 
        FROM events 
        WHERE user_id = users.id AND event_type = 'purchase'
    ),
    total_spent = (
        SELECT COALESCE(SUM((event_data->>'total')::numeric), 0)
        FROM events 
        WHERE user_id = users.id AND event_type = 'purchase'
    ),
    last_purchase_date = (
        SELECT MAX(timestamp)
        FROM events 
        WHERE user_id = users.id AND event_type = 'purchase'
    )
WHERE id IN ('user_001', 'user_002', 'user_003', 'user_004', 'user_005', 'user_006', 'user_007', 'user_008', 'user_009', 'user_010');

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_events_user_timestamp ON events(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_events_type_timestamp ON events(event_type, timestamp);
CREATE INDEX IF NOT EXISTS idx_users_status_activity ON users(status, last_activity);

-- Статистика вставленных данных
SELECT 
    'users' as table_name, 
    COUNT(*) as count 
FROM users
UNION ALL
SELECT 
    'products' as table_name, 
    COUNT(*) as count 
FROM products
UNION ALL
SELECT 
    'events' as table_name, 
    COUNT(*) as count 
FROM events;
