"""
Модуль подключения к базе данных для ML-сервисов
"""

import psycopg2
import psycopg2.extras
from typing import List, Dict, Any, Optional
import logging
import os

logger = logging.getLogger(__name__)

class DatabaseConnection:
    """Класс для работы с базой данных PostgreSQL"""
    
    def __init__(self):
        self.connection = None
        self.config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '5432'),
            'database': os.getenv('DB_NAME', 'customer_analyzer'),
            'user': os.getenv('DB_USER', 'ml_user'),
            'password': os.getenv('DB_PASSWORD', 'ml_password')
        }
    
    def connect(self):
        """Установка соединения с базой данных"""
        try:
            self.connection = psycopg2.connect(**self.config)
            self.connection.autocommit = True
            logger.info("Database connection established")
        except Exception as e:
            logger.error(f"Error connecting to database: {e}")
            raise
    
    def disconnect(self):
        """Закрытие соединения с базой данных"""
        if self.connection:
            self.connection.close()
            self.connection = None
            logger.info("Database connection closed")
    
    def execute(self, query: str, params: Optional[tuple] = None) -> List[Dict[str, Any]]:
        """Выполнение SQL запроса с возвратом результатов"""
        if not self.connection:
            self.connect()
        
        try:
            with self.connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                cursor.execute(query, params)
                
                if cursor.description:
                    results = cursor.fetchall()
                    return [dict(row) for row in results]
                else:
                    return []
                    
        except Exception as e:
            logger.error(f"Error executing query: {e}")
            logger.error(f"Query: {query}")
            logger.error(f"Params: {params}")
            raise
    
    def execute_many(self, query: str, params_list: List[tuple]) -> None:
        """Выполнение SQL запроса для множества параметров"""
        if not self.connection:
            self.connect()
        
        try:
            with self.connection.cursor() as cursor:
                cursor.executemany(query, params_list)
                self.connection.commit()
                
        except Exception as e:
            logger.error(f"Error executing batch query: {e}")
            raise
    
    def test_connection(self) -> bool:
        """Тестирование соединения с базой данных"""
        try:
            result = self.execute("SELECT 1 as test")
            return len(result) > 0 and result[0]['test'] == 1
        except Exception as e:
            logger.error(f"Database connection test failed: {e}")
            return False

# Глобальный экземпляр соединения
_db_connection = None

def get_db_connection() -> DatabaseConnection:
    """Получение экземпляра соединения с базой данных"""
    global _db_connection
    
    if _db_connection is None:
        _db_connection = DatabaseConnection()
        _db_connection.connect()
    
    return _db_connection

def close_db_connection():
    """Закрытие соединения с базой данных"""
    global _db_connection
    
    if _db_connection:
        _db_connection.disconnect()
        _db_connection = None
