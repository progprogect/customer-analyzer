#!/usr/bin/env python3
"""
Скрипт для генерации тестовых данных для системы аналитики и рекомендаций
Генерирует пользователей, продукты и события с реалистичными паттернами поведения
"""

import os
import sys
import json
import random
import psycopg2
from datetime import datetime, timedelta
from typing import List, Dict, Any
import numpy as np
from faker import Faker

# Настройка Faker для русских имен
fake = Faker('ru_RU')
Faker.seed(42)  # Для воспроизводимости результатов
np.random.seed(42)
random.seed(42)

class TestDataGenerator:
    def __init__(self, db_config: Dict[str, str]):
        self.db_config = db_config
        self.connection = None
        self.cursor = None
        
        # Конфигурация генерации данных
        self.config = {
            'users_count': 1000,
            'products_count': 150,
            'events_count': 50000,
            'categories': [
                'Электроника', 'Одежда', 'Книги', 'Дом и сад', 'Спорт',
                'Красота', 'Автотовары', 'Детские товары', 'Продукты питания',
                'Здоровье', 'Развлечения', 'Канцтовары'
            ],
            'event_types': ['view', 'add_to_cart', 'purchase', 'bot_command', 'click', 'scroll'],
            'bot_commands': ['/start', '/help', '/recommendations', '/profile', '/settings']
        }
        
        # Статистика для реалистичных паттернов
        self.user_behavior_stats = {
            'active_users_ratio': 0.7,  # 70% активных пользователей
            'purchase_conversion_rate': 0.15,  # 15% просмотров → покупка
            'cart_conversion_rate': 0.3,  # 30% просмотров → корзина
            'bot_usage_rate': 0.4,  # 40% пользователей используют бота
            'session_duration_minutes': (5, 45),  # Длительность сессии
            'events_per_session': (3, 25)  # События в сессии
        }

    def connect_to_db(self):
        """Подключение к базе данных"""
        try:
            self.connection = psycopg2.connect(**self.db_config)
            self.cursor = self.connection.cursor()
            print("✅ Подключение к базе данных установлено")
        except Exception as e:
            print(f"❌ Ошибка подключения к БД: {e}")
            sys.exit(1)

    def disconnect_from_db(self):
        """Отключение от базы данных"""
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
        print("✅ Подключение к базе данных закрыто")

    def generate_users(self) -> List[Dict[str, Any]]:
        """Генерация пользователей"""
        print(f"🔄 Генерация {self.config['users_count']} пользователей...")
        
        users = []
        used_telegram_ids = set()
        
        for i in range(self.config['users_count']):
            # Генерация уникального Telegram ID
            while True:
                telegram_id = fake.random_int(min=100000000, max=999999999)
                if telegram_id not in used_telegram_ids:
                    used_telegram_ids.add(telegram_id)
                    break
            
            # Генерация имени пользователя Telegram (опционально)
            username = fake.user_name() if random.random() < 0.6 else None
            
            # Генерация даты регистрации (последние 2 года)
            registration_date = fake.date_time_between(
                start_date='-2y',
                end_date='now'
            )
            
            # Дополнительные данные профиля
            profile_data = {
                'age': fake.random_int(min=18, max=65),
                'city': fake.city(),
                'interests': random.sample(
                    self.config['categories'], 
                    k=random.randint(1, 4)
                ),
                'preferred_price_range': random.choice([
                    'budget', 'mid-range', 'premium'
                ]),
                'notification_preferences': {
                    'email': random.choice([True, False]),
                    'telegram': True,  # Все пользователи получают уведомления в Telegram
                    'sms': random.choice([True, False])
                }
            }
            
            user = {
                'telegram_id': telegram_id,
                'first_name': fake.first_name(),
                'last_name': fake.last_name(),
                'username': username,
                'registration_date': registration_date,
                'profile_data': json.dumps(profile_data, ensure_ascii=False)
            }
            users.append(user)
        
        print(f"✅ Сгенерировано {len(users)} пользователей")
        return users

    def generate_products(self) -> List[Dict[str, Any]]:
        """Генерация продуктов"""
        print(f"🔄 Генерация {self.config['products_count']} продуктов...")
        
        products = []
        
        for i in range(self.config['products_count']):
            category = random.choice(self.config['categories'])
            
            # Генерация названия продукта в зависимости от категории
            product_names = {
                'Электроника': ['Смартфон', 'Планшет', 'Ноутбук', 'Наушники', 'Камера'],
                'Одежда': ['Футболка', 'Джинсы', 'Платье', 'Куртка', 'Обувь'],
                'Книги': ['Роман', 'Учебник', 'Детектив', 'Фантастика', 'Биография'],
                'Дом и сад': ['Стол', 'Стул', 'Диван', 'Лампа', 'Горшок'],
                'Спорт': ['Кроссовки', 'Мяч', 'Гантели', 'Велосипед', 'Лыжи'],
                'Красота': ['Крем', 'Шампунь', 'Помада', 'Духи', 'Маска'],
                'Автотовары': ['Масло', 'Фильтр', 'Шины', 'Аккумулятор', 'Фары'],
                'Детские товары': ['Игрушка', 'Коляска', 'Пеленки', 'Питание', 'Одежда'],
                'Продукты питания': ['Хлеб', 'Молоко', 'Мясо', 'Овощи', 'Фрукты'],
                'Здоровье': ['Витамины', 'Термометр', 'Тонометр', 'Маска', 'Спрей'],
                'Развлечения': ['Игра', 'Пазл', 'Книга', 'Фильм', 'Музыка'],
                'Канцтовары': ['Ручка', 'Блокнот', 'Папка', 'Скобы', 'Степлер']
            }
            
            base_name = random.choice(product_names.get(category, ['Товар']))
            name = f"{base_name} {fake.word().capitalize()} {fake.random_int(min=1, max=999)}"
            
            # Генерация цены в зависимости от категории
            price_ranges = {
                'Электроника': (5000, 150000),
                'Одежда': (500, 15000),
                'Книги': (100, 2000),
                'Дом и сад': (1000, 50000),
                'Спорт': (800, 25000),
                'Красота': (200, 8000),
                'Автотовары': (500, 30000),
                'Детские товары': (300, 12000),
                'Продукты питания': (50, 2000),
                'Здоровье': (100, 5000),
                'Развлечения': (200, 5000),
                'Канцтовары': (50, 1500)
            }
            
            min_price, max_price = price_ranges.get(category, (100, 5000))
            price = round(random.uniform(min_price, max_price), 2)
            
            # Генерация описания
            description = fake.text(max_nb_chars=200)
            
            # Атрибуты для content-based рекомендаций
            attributes = {
                'brand': fake.company(),
                'color': random.choice(['Красный', 'Синий', 'Зеленый', 'Черный', 'Белый', 'Серый']),
                'material': random.choice(['Пластик', 'Металл', 'Ткань', 'Кожа', 'Стекло', 'Дерево']),
                'size': random.choice(['XS', 'S', 'M', 'L', 'XL', 'XXL']) if category == 'Одежда' else None,
                'weight': round(random.uniform(0.1, 50), 2),
                'rating': round(random.uniform(3.0, 5.0), 1),
                'in_stock': random.choice([True, False]),
                'tags': random.sample([
                    'популярный', 'новинка', 'скидка', 'премиум', 'эко', 'стильный',
                    'удобный', 'качественный', 'доступный', 'модный'
                ], k=random.randint(1, 3))
            }
            
            # Удаляем None значения
            attributes = {k: v for k, v in attributes.items() if v is not None}
            
            product = {
                'name': name,
                'category': category,
                'price': price,
                'description': description,
                'attributes': json.dumps(attributes, ensure_ascii=False)
            }
            products.append(product)
        
        print(f"✅ Сгенерировано {len(products)} продуктов")
        return products

    def generate_events(self, users: List[Dict], products: List[Dict]) -> List[Dict[str, Any]]:
        """Генерация событий с реалистичными паттернами поведения"""
        print(f"🔄 Генерация {self.config['events_count']} событий...")
        
        events = []
        active_users = random.sample(
            users, 
            int(len(users) * self.user_behavior_stats['active_users_ratio'])
        )
        
        event_id = 1
        current_date = datetime.now()
        
        for user in active_users:
            # Генерация сессий для каждого активного пользователя
            num_sessions = random.randint(1, 15)  # Количество сессий за последние 2 года
            
            for session in range(num_sessions):
                # Дата сессии (равномерно распределена за последние 2 года)
                session_date = fake.date_time_between(
                    start_date=user['registration_date'],
                    end_date=current_date
                )
                
                # Количество событий в сессии
                events_in_session = random.randint(*self.user_behavior_stats['events_per_session'])
                
                # Выбор продуктов для этой сессии
                session_products = random.sample(products, min(events_in_session, len(products)))
                
                # Генерация событий в сессии
                session_events = []
                cart_items = []  # Товары в корзине
                purchased_items = []  # Купленные товары
                
                for i, product in enumerate(session_products):
                    # Время события в рамках сессии
                    event_time = session_date + timedelta(
                        minutes=random.randint(0, self.user_behavior_stats['session_duration_minutes'][1])
                    )
                    
                    # Определение типа события на основе предыдущих событий
                    if i == 0:
                        event_type = 'view'  # Первое событие - всегда просмотр
                    else:
                        # Вероятности перехода между состояниями
                        if random.random() < self.user_behavior_stats['cart_conversion_rate']:
                            if product not in cart_items:
                                event_type = 'add_to_cart'
                                cart_items.append(product)
                            else:
                                event_type = 'view'  # Повторный просмотр товара в корзине
                        elif random.random() < self.user_behavior_stats['purchase_conversion_rate']:
                            if product in cart_items:
                                event_type = 'purchase'
                                purchased_items.append(product)
                                cart_items.remove(product)
                            else:
                                event_type = 'view'
                        else:
                            event_type = random.choice(['view', 'click', 'scroll'])
                    
                    # Генерация свойств события
                    properties = {}
                    
                    if event_type == 'purchase':
                        properties = {
                            'amount': product['price'],
                            'quantity': random.randint(1, 3),
                            'payment_method': random.choice(['card', 'cash', 'online']),
                            'discount': round(random.uniform(0, 0.3), 2) if random.random() < 0.3 else 0
                        }
                    elif event_type == 'view':
                        properties = {
                            'duration_seconds': random.randint(5, 300),
                            'scroll_depth': random.uniform(0, 1),
                            'source': random.choice(['search', 'recommendation', 'category', 'direct'])
                        }
                    elif event_type == 'add_to_cart':
                        properties = {
                            'quantity': random.randint(1, 5),
                            'source': random.choice(['product_page', 'search_results', 'recommendations'])
                        }
                    
                    event = {
                        'user_id': user['user_id'],  # Будет заполнено после вставки пользователей
                        'product_id': product['product_id'],  # Будет заполнено после вставки продуктов
                        'event_type': event_type,
                        'event_timestamp': event_time,
                        'properties': json.dumps(properties, ensure_ascii=False) if properties else None
                    }
                    
                    session_events.append(event)
                    events.append(event)
                
                # Добавление событий бота для некоторых пользователей
                if random.random() < self.user_behavior_stats['bot_usage_rate']:
                    bot_commands_count = random.randint(1, 5)
                    for _ in range(bot_commands_count):
                        command = random.choice(self.config['bot_commands'])
                        bot_event_time = session_date + timedelta(minutes=random.randint(0, 30))
                        
                        bot_event = {
                            'user_id': user['user_id'],
                            'product_id': None,
                            'event_type': 'bot_command',
                            'event_timestamp': bot_event_time,
                            'properties': json.dumps({
                                'command': command,
                                'response_time_ms': random.randint(100, 2000)
                            }, ensure_ascii=False)
                        }
                        events.append(bot_event)
        
        print(f"✅ Сгенерировано {len(events)} событий")
        return events

    def insert_users(self, users: List[Dict[str, Any]]):
        """Вставка пользователей в базу данных"""
        print("🔄 Вставка пользователей в базу данных...")
        
        insert_query = """
        INSERT INTO app_schema.users (telegram_id, first_name, last_name, username, registration_date, profile_data)
        VALUES (%(telegram_id)s, %(first_name)s, %(last_name)s, %(username)s, %(registration_date)s, %(profile_data)s)
        RETURNING user_id;
        """
        
        for user in users:
            self.cursor.execute(insert_query, user)
            user_id = self.cursor.fetchone()[0]
            user['user_id'] = user_id
        
        self.connection.commit()
        print(f"✅ Вставлено {len(users)} пользователей")

    def insert_products(self, products: List[Dict[str, Any]]):
        """Вставка продуктов в базу данных"""
        print("🔄 Вставка продуктов в базу данных...")
        
        insert_query = """
        INSERT INTO app_schema.products (name, category, price, description, attributes)
        VALUES (%(name)s, %(category)s, %(price)s, %(description)s, %(attributes)s)
        RETURNING product_id;
        """
        
        for product in products:
            self.cursor.execute(insert_query, product)
            product_id = self.cursor.fetchone()[0]
            product['product_id'] = product_id
        
        self.connection.commit()
        print(f"✅ Вставлено {len(products)} продуктов")

    def insert_events(self, events: List[Dict[str, Any]]):
        """Вставка событий в базу данных"""
        print("🔄 Вставка событий в базу данных...")
        
        insert_query = """
        INSERT INTO app_schema.events (user_id, product_id, event_type, event_timestamp, properties)
        VALUES (%(user_id)s, %(product_id)s, %(event_type)s, %(event_timestamp)s, %(properties)s);
        """
        
        # Вставка пакетами для производительности
        batch_size = 1000
        for i in range(0, len(events), batch_size):
            batch = events[i:i + batch_size]
            self.cursor.executemany(insert_query, batch)
            self.connection.commit()
            print(f"   Вставлено {min(i + batch_size, len(events))}/{len(events)} событий")
        
        print(f"✅ Вставлено {len(events)} событий")

    def validate_data(self):
        """Валидация сгенерированных данных"""
        print("🔄 Валидация данных...")
        
        # Проверка количества записей
        self.cursor.execute("SELECT COUNT(*) FROM app_schema.users;")
        users_count = self.cursor.fetchone()[0]
        
        self.cursor.execute("SELECT COUNT(*) FROM app_schema.products;")
        products_count = self.cursor.fetchone()[0]
        
        self.cursor.execute("SELECT COUNT(*) FROM app_schema.events;")
        events_count = self.cursor.fetchone()[0]
        
        print(f"📊 Статистика данных:")
        print(f"   Пользователи: {users_count}")
        print(f"   Продукты: {products_count}")
        print(f"   События: {events_count}")
        
        # Проверка консистентности
        self.cursor.execute("""
            SELECT COUNT(*) FROM app_schema.events e 
            LEFT JOIN app_schema.users u ON e.user_id = u.user_id 
            WHERE u.user_id IS NULL;
        """)
        orphan_events = self.cursor.fetchone()[0]
        
        self.cursor.execute("""
            SELECT COUNT(*) FROM app_schema.events e 
            LEFT JOIN app_schema.products p ON e.product_id = p.product_id 
            WHERE e.product_id IS NOT NULL AND p.product_id IS NULL;
        """)
        orphan_product_events = self.cursor.fetchone()[0]
        
        if orphan_events == 0 and orphan_product_events == 0:
            print("✅ Данные консистентны")
        else:
            print(f"⚠️  Найдены неконсистентные данные: {orphan_events} событий без пользователей, {orphan_product_events} событий без продуктов")

    def generate_all_data(self):
        """Генерация всех тестовых данных"""
        print("🚀 Начинаем генерацию тестовых данных...")
        
        self.connect_to_db()
        
        try:
            # Очистка существующих данных
            print("🔄 Очистка существующих данных...")
            self.cursor.execute("DELETE FROM app_schema.events;")
            self.cursor.execute("DELETE FROM app_schema.user_metrics;")
            self.cursor.execute("DELETE FROM app_schema.users;")
            self.cursor.execute("DELETE FROM app_schema.products;")
            self.connection.commit()
            print("✅ Данные очищены")
            
            # Генерация и вставка данных
            users = self.generate_users()
            self.insert_users(users)
            
            products = self.generate_products()
            self.insert_products(products)
            
            events = self.generate_events(users, products)
            self.insert_events(events)
            
            # Валидация
            self.validate_data()
            
            print("🎉 Генерация тестовых данных завершена успешно!")
            
        except Exception as e:
            print(f"❌ Ошибка при генерации данных: {e}")
            self.connection.rollback()
            raise
        finally:
            self.disconnect_from_db()


def main():
    """Основная функция"""
    # Конфигурация подключения к БД
    db_config = {
        'host': os.getenv('POSTGRES_HOST', 'localhost'),
        'port': os.getenv('POSTGRES_PORT', '5432'),
        'database': os.getenv('POSTGRES_DB', 'customer_analyzer'),
        'user': os.getenv('POSTGRES_USER', 'postgres'),
        'password': os.getenv('POSTGRES_PASSWORD', 'postgres')
    }
    
    # Создание генератора и запуск
    generator = TestDataGenerator(db_config)
    generator.generate_all_data()


if __name__ == "__main__":
    main()
