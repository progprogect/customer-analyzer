#!/usr/bin/env python3
"""
Скрипт для валидации тестовых данных
Проверяет консистентность, качество и статистику сгенерированных данных
"""

import os
import sys
import psycopg2
from datetime import datetime, timedelta
import json

class DataValidator:
    def __init__(self, db_config):
        self.db_config = db_config
        self.connection = None
        self.cursor = None

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

    def validate_basic_counts(self):
        """Проверка базовых счетчиков"""
        print("\n📊 Проверка количества записей...")
        
        queries = {
            'users': "SELECT COUNT(*) FROM app_schema.users;",
            'products': "SELECT COUNT(*) FROM app_schema.products;",
            'events': "SELECT COUNT(*) FROM app_schema.events;",
            'user_metrics': "SELECT COUNT(*) FROM app_schema.user_metrics;"
        }
        
        results = {}
        for table, query in queries.items():
            self.cursor.execute(query)
            count = self.cursor.fetchone()[0]
            results[table] = count
            print(f"   {table}: {count}")
        
        # Проверка минимальных требований
        if results['users'] < 100:
            print("⚠️  Мало пользователей (меньше 100)")
        if results['products'] < 50:
            print("⚠️  Мало продуктов (меньше 50)")
        if results['events'] < 10000:
            print("⚠️  Мало событий (меньше 10,000)")
        
        return results

    def validate_data_consistency(self):
        """Проверка консистентности данных"""
        print("\n🔍 Проверка консистентности данных...")
        
        # Проверка событий без пользователей
        self.cursor.execute("""
            SELECT COUNT(*) FROM app_schema.events e 
            LEFT JOIN app_schema.users u ON e.user_id = u.user_id 
            WHERE u.user_id IS NULL;
        """)
        orphan_events = self.cursor.fetchone()[0]
        
        # Проверка событий без продуктов (кроме bot_command)
        self.cursor.execute("""
            SELECT COUNT(*) FROM app_schema.events e 
            LEFT JOIN app_schema.products p ON e.product_id = p.product_id 
            WHERE e.product_id IS NOT NULL 
            AND e.event_type != 'bot_command'
            AND p.product_id IS NULL;
        """)
        orphan_product_events = self.cursor.fetchone()[0]
        
        # Проверка bot_command событий с product_id
        self.cursor.execute("""
            SELECT COUNT(*) FROM app_schema.events 
            WHERE event_type = 'bot_command' AND product_id IS NOT NULL;
        """)
        invalid_bot_events = self.cursor.fetchone()[0]
        
        print(f"   События без пользователей: {orphan_events}")
        print(f"   События без продуктов: {orphan_product_events}")
        print(f"   Bot команды с product_id: {invalid_bot_events}")
        
        if orphan_events == 0 and orphan_product_events == 0 and invalid_bot_events == 0:
            print("✅ Данные консистентны")
            return True
        else:
            print("❌ Найдены неконсистентные данные")
            return False

    def validate_data_quality(self):
        """Проверка качества данных"""
        print("\n🎯 Проверка качества данных...")
        
        # Проверка уникальности telegram_id
        self.cursor.execute("""
            SELECT COUNT(*) FROM (
                SELECT telegram_id, COUNT(*) 
                FROM app_schema.users 
                GROUP BY telegram_id 
                HAVING COUNT(*) > 1
            ) duplicates;
        """)
        duplicate_telegram_ids = self.cursor.fetchone()[0]
        
        # Проверка валидности JSON данных
        self.cursor.execute("""
            SELECT COUNT(*) FROM app_schema.users 
            WHERE profile_data IS NOT NULL 
            AND NOT (profile_data::text ~ '^[{}]');
        """)
        invalid_user_json = self.cursor.fetchone()[0]
        
        self.cursor.execute("""
            SELECT COUNT(*) FROM app_schema.products 
            WHERE attributes IS NOT NULL 
            AND NOT (attributes::text ~ '^[{}]');
        """)
        invalid_product_json = self.cursor.fetchone()[0]
        
        # Проверка цен продуктов
        self.cursor.execute("""
            SELECT COUNT(*) FROM app_schema.products 
            WHERE price < 0 OR price IS NULL;
        """)
        invalid_prices = self.cursor.fetchone()[0]
        
        # Проверка вероятностей в user_metrics
        self.cursor.execute("""
            SELECT COUNT(*) FROM app_schema.user_metrics 
            WHERE churn_probability < 0 OR churn_probability > 1
            OR purchase_probability_30d < 0 OR purchase_probability_30d > 1;
        """)
        invalid_probabilities = self.cursor.fetchone()[0]
        
        print(f"   Дублирующиеся telegram_id: {duplicate_telegram_ids}")
        print(f"   Некорректные JSON в users: {invalid_user_json}")
        print(f"   Некорректные JSON в products: {invalid_product_json}")
        print(f"   Некорректные цены: {invalid_prices}")
        print(f"   Некорректные вероятности: {invalid_probabilities}")
        
        quality_issues = (duplicate_telegram_ids + invalid_user_json + 
                         invalid_product_json + invalid_prices + invalid_probabilities)
        
        if quality_issues == 0:
            print("✅ Качество данных отличное")
            return True
        else:
            print(f"⚠️  Найдено {quality_issues} проблем с качеством данных")
            return False

    def analyze_user_behavior(self):
        """Анализ поведения пользователей"""
        print("\n👥 Анализ поведения пользователей...")
        
        # Активные пользователи
        self.cursor.execute("""
            SELECT 
                CASE 
                    WHEN last_activity > NOW() - INTERVAL '30 days' THEN 'Активные (30 дней)'
                    WHEN last_activity > NOW() - INTERVAL '90 days' THEN 'Неактивные (90 дней)'
                    ELSE 'Забытые (>90 дней)'
                END as user_status,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
            FROM (
                SELECT user_id, MAX(event_timestamp) as last_activity
                FROM app_schema.events
                GROUP BY user_id
            ) user_activity
            GROUP BY user_status
            ORDER BY count DESC;
        """)
        
        print("   Статус пользователей:")
        for row in self.cursor.fetchall():
            print(f"     {row[0]}: {row[1]} ({row[2]}%)")
        
        # Конверсионная воронка
        self.cursor.execute("""
            SELECT 
                event_type,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
            FROM app_schema.events
            WHERE event_type IN ('view', 'add_to_cart', 'purchase')
            GROUP BY event_type
            ORDER BY count DESC;
        """)
        
        print("   Конверсионная воронка:")
        for row in self.cursor.fetchall():
            print(f"     {row[0]}: {row[1]} ({row[2]}%)")

    def analyze_products(self):
        """Анализ продуктов"""
        print("\n🛍️ Анализ продуктов...")
        
        # Распределение по категориям
        self.cursor.execute("""
            SELECT 
                category,
                COUNT(*) as count,
                ROUND(AVG(price), 2) as avg_price,
                ROUND(MIN(price), 2) as min_price,
                ROUND(MAX(price), 2) as max_price
            FROM app_schema.products
            GROUP BY category
            ORDER BY count DESC;
        """)
        
        print("   Распределение по категориям:")
        for row in self.cursor.fetchall():
            print(f"     {row[0]}: {row[1]} товаров, цена {row[2]}₽ ({row[3]}-{row[4]}₽)")
        
        # Топ продуктов по продажам
        self.cursor.execute("""
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
            LIMIT 5;
        """)
        
        print("   Топ-5 продуктов по продажам:")
        for row in self.cursor.fetchall():
            print(f"     {row[0]} ({row[1]}): {row[2]} покупок, {row[3]}₽")

    def analyze_temporal_patterns(self):
        """Анализ временных паттернов"""
        print("\n📅 Анализ временных паттернов...")
        
        # События по месяцам
        self.cursor.execute("""
            SELECT 
                DATE_TRUNC('month', event_timestamp) as month,
                COUNT(*) as events,
                COUNT(DISTINCT user_id) as unique_users
            FROM app_schema.events
            GROUP BY month
            ORDER BY month DESC
            LIMIT 12;
        """)
        
        print("   События по месяцам:")
        for row in self.cursor.fetchall():
            print(f"     {row[0].strftime('%Y-%m')}: {row[1]} событий, {row[2]} пользователей")
        
        # События по дням недели
        self.cursor.execute("""
            SELECT 
                EXTRACT(dow FROM event_timestamp) as day_of_week,
                CASE EXTRACT(dow FROM event_timestamp)
                    WHEN 0 THEN 'Воскресенье'
                    WHEN 1 THEN 'Понедельник'
                    WHEN 2 THEN 'Вторник'
                    WHEN 3 THEN 'Среда'
                    WHEN 4 THEN 'Четверг'
                    WHEN 5 THEN 'Пятница'
                    WHEN 6 THEN 'Суббота'
                END as day_name,
                COUNT(*) as events
            FROM app_schema.events
            GROUP BY day_of_week, day_name
            ORDER BY day_of_week;
        """)
        
        print("   События по дням недели:")
        for row in self.cursor.fetchall():
            print(f"     {row[1]}: {row[2]} событий")

    def generate_report(self):
        """Генерация отчета о валидации"""
        print("\n📋 Генерация отчета...")
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'basic_counts': {},
            'consistency': {},
            'quality': {},
            'recommendations': []
        }
        
        # Сбор статистики
        self.cursor.execute("SELECT COUNT(*) FROM app_schema.users;")
        report['basic_counts']['users'] = self.cursor.fetchone()[0]
        
        self.cursor.execute("SELECT COUNT(*) FROM app_schema.products;")
        report['basic_counts']['products'] = self.cursor.fetchone()[0]
        
        self.cursor.execute("SELECT COUNT(*) FROM app_schema.events;")
        report['basic_counts']['events'] = self.cursor.fetchone()[0]
        
        # Рекомендации
        if report['basic_counts']['events'] < 10000:
            report['recommendations'].append("Увеличить количество событий для лучшего тестирования ML моделей")
        
        if report['basic_counts']['users'] < 500:
            report['recommendations'].append("Добавить больше пользователей для тестирования сегментации")
        
        # Сохранение отчета
        with open('data-validation-report.json', 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        print("✅ Отчет сохранен в data-validation-report.json")
        
        if report['recommendations']:
            print("\n💡 Рекомендации:")
            for rec in report['recommendations']:
                print(f"   • {rec}")

    def run_validation(self):
        """Запуск полной валидации"""
        print("🚀 Запуск валидации тестовых данных...")
        
        self.connect_to_db()
        
        try:
            # Выполнение всех проверок
            counts = self.validate_basic_counts()
            consistency = self.validate_data_consistency()
            quality = self.validate_data_quality()
            
            # Анализ данных
            self.analyze_user_behavior()
            self.analyze_products()
            self.analyze_temporal_patterns()
            
            # Генерация отчета
            self.generate_report()
            
            # Итоговая оценка
            print("\n🎯 Итоговая оценка:")
            if consistency and quality:
                print("✅ Данные готовы для разработки и тестирования")
            else:
                print("⚠️  Данные требуют доработки")
            
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
    
    # Создание валидатора и запуск
    validator = DataValidator(db_config)
    validator.run_validation()


if __name__ == "__main__":
    main()
