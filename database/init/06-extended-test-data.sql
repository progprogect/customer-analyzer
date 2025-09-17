-- Расширенные тестовые данные для более реалистичных прогнозов

-- Добавляем больше пользователей
INSERT INTO users (id, telegram_id, username, first_name, last_name, email, phone, registration_date, last_activity, status) VALUES
('user_011', 1234567890, 'alexandra_ivanova', 'Александра', 'Иванова', 'alexandra@example.com', '+7-900-111-2222', '2024-01-10', '2024-09-16', 'active'),
('user_012', 2345678901, 'vladimir_petrov', 'Владимир', 'Петров', 'vladimir@example.com', '+7-900-222-3333', '2024-02-15', '2024-09-15', 'active'),
('user_013', 3456789012, 'natalia_sidorova', 'Наталья', 'Сидорова', 'natalia@example.com', '+7-900-333-4444', '2024-03-05', '2024-09-14', 'active'),
('user_014', 4567890123, 'andrey_kuznetsov', 'Андрей', 'Кузнецов', 'andrey@example.com', '+7-900-444-5555', '2024-04-12', '2024-09-13', 'active'),
('user_015', 5678901234, 'elena_morozova', 'Елена', 'Морозова', 'elena2@example.com', '+7-900-555-6666', '2024-05-20', '2024-09-12', 'active'),
('user_016', 6789012345, 'dmitry_volkov', 'Дмитрий', 'Волков', 'dmitry2@example.com', '+7-900-666-7777', '2024-01-08', '2024-08-20', 'inactive'),
('user_017', 7890123456, 'maria_novikova', 'Мария', 'Новикова', 'maria2@example.com', '+7-900-777-8888', '2024-02-18', '2024-08-15', 'inactive'),
('user_018', 8901234567, 'sergey_fedorov', 'Сергей', 'Федоров', 'sergey2@example.com', '+7-900-888-9999', '2024-03-25', '2024-09-11', 'active'),
('user_019', 9012345678, 'tatyana_romanova', 'Татьяна', 'Романова', 'tatyana2@example.com', '+7-900-999-0000', '2024-04-30', '2024-09-10', 'active'),
('user_020', 1122334455, 'pavel_kozlov', 'Павел', 'Козлов', 'pavel@example.com', '+7-900-000-1111', '2024-05-15', '2024-09-09', 'active');

-- Добавляем больше продуктов
INSERT INTO products (id, name, category, price, description) VALUES
('prod_011', 'iPad Pro 12.9"', 'Electronics', 1099.99, 'Professional tablet for creative work'),
('prod_012', 'Sony PlayStation 5', 'Electronics', 499.99, 'Next-gen gaming console'),
('prod_013', 'Dyson V15 Vacuum', 'Home', 749.99, 'Cordless vacuum cleaner with laser'),
('prod_014', 'Nike Air Jordan 1', 'Fashion', 170.00, 'Classic basketball sneakers'),
('prod_015', 'Apple Watch Series 9', 'Electronics', 399.99, 'Smartwatch with health monitoring'),
('prod_016', 'Tesla Model Y', 'Automotive', 49990.00, 'Electric SUV'),
('prod_017', 'MacBook Pro M3', 'Electronics', 1999.99, 'Professional laptop for creators'),
('prod_018', 'Rolex Submariner', 'Luxury', 8950.00, 'Luxury diving watch'),
('prod_019', 'Canon EOS R5', 'Electronics', 3899.99, 'Professional mirrorless camera'),
('prod_020', 'Louis Vuitton Bag', 'Fashion', 2100.00, 'Luxury handbag');

-- Расширенные события для более реалистичных паттернов поведения
INSERT INTO events (id, user_id, event_type, event_data, timestamp, session_id, ip_address, user_agent) VALUES
-- Александра Иванова (VIP клиент - много покупок)
('event_033', 'user_011', 'page_view', '{"page": "/products/electronics"}', '2024-09-16 09:00:00', 'sess_013', '192.168.1.11', 'Mozilla/5.0...'),
('event_034', 'user_011', 'product_view', '{"product_id": "prod_017", "product_name": "MacBook Pro M3"}', '2024-09-16 09:05:00', 'sess_013', '192.168.1.11', 'Mozilla/5.0...'),
('event_035', 'user_011', 'add_to_cart', '{"product_id": "prod_017", "quantity": 1, "price": 1999.99}', '2024-09-16 09:10:00', 'sess_013', '192.168.1.11', 'Mozilla/5.0...'),
('event_036', 'user_011', 'purchase', '{"order_id": "order_006", "total": 1999.99, "products": [{"id": "prod_017", "quantity": 1}]}', '2024-09-16 09:15:00', 'sess_013', '192.168.1.11', 'Mozilla/5.0...'),
('event_037', 'user_011', 'page_view', '{"page": "/products/fashion"}', '2024-09-15 14:00:00', 'sess_014', '192.168.1.11', 'Mozilla/5.0...'),
('event_038', 'user_011', 'product_view', '{"product_id": "prod_020", "product_name": "Louis Vuitton Bag"}', '2024-09-15 14:05:00', 'sess_014', '192.168.1.11', 'Mozilla/5.0...'),
('event_039', 'user_011', 'purchase', '{"order_id": "order_007", "total": 2100.00, "products": [{"id": "prod_020", "quantity": 1}]}', '2024-09-15 14:10:00', 'sess_014', '192.168.1.11', 'Mozilla/5.0...'),

-- Владимир Петров (активный покупатель)
('event_040', 'user_012', 'page_view', '{"page": "/products/electronics"}', '2024-09-15 16:30:00', 'sess_015', '192.168.1.12', 'Mozilla/5.0...'),
('event_041', 'user_012', 'product_view', '{"product_id": "prod_012", "product_name": "Sony PlayStation 5"}', '2024-09-15 16:35:00', 'sess_015', '192.168.1.12', 'Mozilla/5.0...'),
('event_042', 'user_012', 'add_to_cart', '{"product_id": "prod_012", "quantity": 1, "price": 499.99}', '2024-09-15 16:40:00', 'sess_015', '192.168.1.12', 'Mozilla/5.0...'),
('event_043', 'user_012', 'purchase', '{"order_id": "order_008", "total": 499.99, "products": [{"id": "prod_012", "quantity": 1}]}', '2024-09-15 16:45:00', 'sess_015', '192.168.1.12', 'Mozilla/5.0...'),

-- Наталья Сидорова (новый клиент, смотрит но не покупает)
('event_044', 'user_013', 'page_view', '{"page": "/products/home"}', '2024-09-14 11:20:00', 'sess_016', '192.168.1.13', 'Mozilla/5.0...'),
('event_045', 'user_013', 'product_view', '{"product_id": "prod_013", "product_name": "Dyson V15 Vacuum"}', '2024-09-14 11:25:00', 'sess_016', '192.168.1.13', 'Mozilla/5.0...'),
('event_046', 'user_013', 'add_to_cart', '{"product_id": "prod_013", "quantity": 1, "price": 749.99}', '2024-09-14 11:30:00', 'sess_016', '192.168.1.13', 'Mozilla/5.0...'),
('event_047', 'user_013', 'page_view', '{"page": "/products/fashion"}', '2024-09-14 11:35:00', 'sess_016', '192.168.1.13', 'Mozilla/5.0...'),
('event_048', 'user_013', 'product_view', '{"product_id": "prod_014", "product_name": "Nike Air Jordan 1"}', '2024-09-14 11:40:00', 'sess_016', '192.168.1.13', 'Mozilla/5.0...'),

-- Андрей Кузнецов (средний покупатель)
('event_049', 'user_014', 'page_view', '{"page": "/products/electronics"}', '2024-09-13 15:45:00', 'sess_017', '192.168.1.14', 'Mozilla/5.0...'),
('event_050', 'user_014', 'product_view', '{"product_id": "prod_015", "product_name": "Apple Watch Series 9"}', '2024-09-13 15:50:00', 'sess_017', '192.168.1.14', 'Mozilla/5.0...'),
('event_051', 'user_014', 'purchase', '{"order_id": "order_009", "total": 399.99, "products": [{"id": "prod_015", "quantity": 1}]}', '2024-09-13 15:55:00', 'sess_017', '192.168.1.14', 'Mozilla/5.0...'),

-- Елена Морозова (спящий клиент)
('event_052', 'user_015', 'page_view', '{"page": "/products"}', '2024-09-12 10:15:00', 'sess_018', '192.168.1.15', 'Mozilla/5.0...'),
('event_053', 'user_015', 'product_view', '{"product_id": "prod_016", "product_name": "Tesla Model Y"}', '2024-09-12 10:20:00', 'sess_018', '192.168.1.15', 'Mozilla/5.0...'),

-- Дмитрий Волков (высокий риск оттока)
('event_054', 'user_016', 'page_view', '{"page": "/products/electronics"}', '2024-08-20 13:30:00', 'sess_019', '192.168.1.16', 'Mozilla/5.0...'),
('event_055', 'user_016', 'product_view', '{"product_id": "prod_019", "product_name": "Canon EOS R5"}', '2024-08-20 13:35:00', 'sess_019', '192.168.1.16', 'Mozilla/5.0...'),

-- Мария Новикова (высокий риск оттока)
('event_056', 'user_017', 'page_view', '{"page": "/products/luxury"}', '2024-08-15 16:00:00', 'sess_020', '192.168.1.17', 'Mozilla/5.0...'),
('event_057', 'user_017', 'product_view', '{"product_id": "prod_018", "product_name": "Rolex Submariner"}', '2024-08-15 16:05:00', 'sess_020', '192.168.1.17', 'Mozilla/5.0...'),

-- Сергей Федоров (средний риск)
('event_058', 'user_018', 'page_view', '{"page": "/products/home"}', '2024-09-11 12:45:00', 'sess_021', '192.168.1.18', 'Mozilla/5.0...'),
('event_059', 'user_018', 'product_view', '{"product_id": "prod_013", "product_name": "Dyson V15 Vacuum"}', '2024-09-11 12:50:00', 'sess_021', '192.168.1.18', 'Mozilla/5.0...'),
('event_060', 'user_018', 'add_to_cart', '{"product_id": "prod_013", "quantity": 1, "price": 749.99}', '2024-09-11 12:55:00', 'sess_021', '192.168.1.18', 'Mozilla/5.0...'),

-- Татьяна Романова (низкий риск)
('event_061', 'user_019', 'page_view', '{"page": "/products/fashion"}', '2024-09-10 17:30:00', 'sess_022', '192.168.1.19', 'Mozilla/5.0...'),
('event_062', 'user_019', 'product_view', '{"product_id": "prod_014", "product_name": "Nike Air Jordan 1"}', '2024-09-10 17:35:00', 'sess_022', '192.168.1.19', 'Mozilla/5.0...'),
('event_063', 'user_019', 'purchase', '{"order_id": "order_010", "total": 170.00, "products": [{"id": "prod_014", "quantity": 1}]}', '2024-09-10 17:40:00', 'sess_022', '192.168.1.19', 'Mozilla/5.0...'),

-- Павел Козлов (низкий риск)
('event_064', 'user_020', 'page_view', '{"page": "/products/electronics"}', '2024-09-09 14:20:00', 'sess_023', '192.168.1.20', 'Mozilla/5.0...'),
('event_065', 'user_020', 'product_view', '{"product_id": "prod_011", "product_name": "iPad Pro 12.9\""}', '2024-09-09 14:25:00', 'sess_023', '192.168.1.20', 'Mozilla/5.0...'),
('event_066', 'user_020', 'add_to_cart', '{"product_id": "prod_011", "quantity": 1, "price": 1099.99}', '2024-09-09 14:30:00', 'sess_023', '192.168.1.20', 'Mozilla/5.0...'),
('event_067', 'user_020', 'purchase', '{"order_id": "order_011", "total": 1099.99, "products": [{"id": "prod_011", "quantity": 1}]}', '2024-09-09 14:35:00', 'sess_023', '192.168.1.20', 'Mozilla/5.0...');

-- Добавляем исторические события для более реалистичных трендов
INSERT INTO events (id, user_id, event_type, event_data, timestamp, session_id, ip_address, user_agent) VALUES
-- Исторические покупки для VIP клиентов
('event_068', 'user_001', 'purchase', '{"order_id": "order_012", "total": 2499.99, "products": [{"id": "prod_002", "quantity": 1}]}', '2024-08-15 10:00:00', 'sess_024', '192.168.1.1', 'Mozilla/5.0...'),
('event_069', 'user_011', 'purchase', '{"order_id": "order_013", "total": 899.99, "products": [{"id": "prod_006", "quantity": 1}]}', '2024-08-10 15:30:00', 'sess_025', '192.168.1.11', 'Mozilla/5.0...'),
('event_070', 'user_011', 'purchase', '{"order_id": "order_014", "total": 399.99, "products": [{"id": "prod_007", "quantity": 1}]}', '2024-07-20 11:45:00', 'sess_026', '192.168.1.11', 'Mozilla/5.0...'),

-- Активность для анализа трендов
('event_071', 'user_002', 'page_view', '{"page": "/products/fashion"}', '2024-09-01 14:00:00', 'sess_027', '192.168.1.2', 'Mozilla/5.0...'),
('event_072', 'user_002', 'product_view', '{"product_id": "prod_008", "product_name": "Levi Jeans"}', '2024-09-01 14:05:00', 'sess_027', '192.168.1.2', 'Mozilla/5.0...'),
('event_073', 'user_003', 'page_view', '{"page": "/products/electronics"}', '2024-09-05 16:30:00', 'sess_028', '192.168.1.3', 'Mozilla/5.0...'),
('event_074', 'user_003', 'product_view', '{"product_id": "prod_001", "product_name": "iPhone 15 Pro"}', '2024-09-05 16:35:00', 'sess_028', '192.168.1.3', 'Mozilla/5.0...'),
('event_075', 'user_003', 'add_to_cart', '{"product_id": "prod_001", "quantity": 1, "price": 999.99}', '2024-09-05 16:40:00', 'sess_028', '192.168.1.3', 'Mozilla/5.0...');

-- Обновляем статистику пользователей
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
WHERE id IN ('user_011', 'user_012', 'user_013', 'user_014', 'user_015', 'user_016', 'user_017', 'user_018', 'user_019', 'user_020');

-- Статистика обновленных данных
SELECT 
    'Total users' as metric, 
    COUNT(*) as count 
FROM users
UNION ALL
SELECT 
    'Total products' as metric, 
    COUNT(*) as count 
FROM products
UNION ALL
SELECT 
    'Total events' as metric, 
    COUNT(*) as count 
FROM events
UNION ALL
SELECT 
    'Total purchases' as metric, 
    COUNT(*) as count 
FROM events 
WHERE event_type = 'purchase'
UNION ALL
SELECT 
    'VIP users (>$1000 spent)' as metric, 
    COUNT(*) as count 
FROM users 
WHERE total_spent > 1000;
