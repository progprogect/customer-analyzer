"""
Модуль извлечения признаков пользователей для ML-моделей
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class UserFeatures:
    """Структура для хранения признаков пользователя"""
    user_id: int
    telegram_id: int
    
    # Демографические признаки
    days_since_registration: int
    has_username: bool
    has_last_name: bool
    language_code: Optional[str]
    
    # Признаки активности
    total_events: int
    unique_days_active: int
    avg_events_per_day: float
    days_since_last_activity: int
    
    # Признаки поведения
    bot_commands_count: int
    messages_count: int
    callback_queries_count: int
    unique_commands_count: int
    
    # Временные паттерны
    avg_session_duration: float
    peak_hour: int
    weekend_activity_ratio: float
    
    # Признаки покупок (если есть)
    purchase_count: int
    total_spent: float
    avg_order_value: float
    
    # Признаки взаимодействия с продуктами
    product_views_count: int
    cart_additions_count: int
    
    # Метаданные
    feature_extraction_date: datetime

class UserFeatureExtractor:
    """Класс для извлечения признаков пользователей"""
    
    def __init__(self, db_connection):
        self.db_connection = db_connection
        self.logger = logging.getLogger(__name__)
    
    def extract_user_features(self, user_id: int) -> Optional[UserFeatures]:
        """Извлечение признаков для конкретного пользователя"""
        try:
            # Получаем базовую информацию о пользователе
            user_info = self._get_user_info(user_id)
            if not user_info:
                return None
            
            # Получаем события пользователя
            events = self._get_user_events(user_id)
            
            # Извлекаем признаки
            features = UserFeatures(
                user_id=user_id,
                telegram_id=user_info['telegram_id'],
                
                # Демографические признаки
                days_since_registration=self._calculate_days_since_registration(user_info['registration_date']),
                has_username=bool(user_info['username']),
                has_last_name=bool(user_info['last_name']),
                language_code=user_info.get('language_code'),
                
                # Признаки активности
                total_events=len(events),
                unique_days_active=self._calculate_unique_days_active(events),
                avg_events_per_day=self._calculate_avg_events_per_day(events, user_info['registration_date']),
                days_since_last_activity=self._calculate_days_since_last_activity(events),
                
                # Признаки поведения
                bot_commands_count=self._count_event_type(events, 'bot_command'),
                messages_count=self._count_event_type(events, 'message'),
                callback_queries_count=self._count_event_type(events, 'callback_query'),
                unique_commands_count=self._count_unique_commands(events),
                
                # Временные паттерны
                avg_session_duration=self._calculate_avg_session_duration(events),
                peak_hour=self._calculate_peak_hour(events),
                weekend_activity_ratio=self._calculate_weekend_activity_ratio(events),
                
                # Признаки покупок
                purchase_count=self._count_event_type(events, 'purchase'),
                total_spent=self._calculate_total_spent(events),
                avg_order_value=self._calculate_avg_order_value(events),
                
                # Признаки взаимодействия с продуктами
                product_views_count=self._count_event_type(events, 'view'),
                cart_additions_count=self._count_event_type(events, 'add_to_cart'),
                
                # Метаданные
                feature_extraction_date=datetime.now()
            )
            
            return features
            
        except Exception as e:
            self.logger.error(f"Error extracting features for user {user_id}: {e}")
            return None
    
    def extract_all_users_features(self, limit: Optional[int] = None) -> List[UserFeatures]:
        """Извлечение признаков для всех пользователей"""
        try:
            # Получаем список всех пользователей
            users = self._get_all_users(limit)
            
            features_list = []
            for user in users:
                features = self.extract_user_features(user['user_id'])
                if features:
                    features_list.append(features)
            
            self.logger.info(f"Extracted features for {len(features_list)} users")
            return features_list
            
        except Exception as e:
            self.logger.error(f"Error extracting features for all users: {e}")
            return []
    
    def _get_user_info(self, user_id: int) -> Optional[Dict]:
        """Получение базовой информации о пользователе"""
        query = """
        SELECT 
            user_id,
            telegram_id,
            first_name,
            last_name,
            username,
            registration_date,
            profile_data
        FROM app_schema.users 
        WHERE user_id = %s
        """
        
        try:
            result = self.db_connection.execute(query, (user_id,))
            if result:
                user_info = result[0]
                # Извлекаем language_code из profile_data
                profile_data = user_info.get('profile_data', {})
                if isinstance(profile_data, str):
                    import json
                    profile_data = json.loads(profile_data)
                
                user_info['language_code'] = profile_data.get('language_code')
                return user_info
            return None
        except Exception as e:
            self.logger.error(f"Error getting user info: {e}")
            return None
    
    def _get_user_events(self, user_id: int) -> List[Dict]:
        """Получение событий пользователя"""
        query = """
        SELECT 
            event_id,
            event_type,
            event_timestamp,
            properties
        FROM app_schema.events 
        WHERE user_id = %s
        ORDER BY event_timestamp
        """
        
        try:
            result = self.db_connection.execute(query, (user_id,))
            return result if result else []
        except Exception as e:
            self.logger.error(f"Error getting user events: {e}")
            return []
    
    def _get_all_users(self, limit: Optional[int] = None) -> List[Dict]:
        """Получение списка всех пользователей"""
        query = "SELECT user_id FROM app_schema.users ORDER BY user_id"
        if limit:
            query += f" LIMIT {limit}"
        
        try:
            result = self.db_connection.execute(query)
            return result if result else []
        except Exception as e:
            self.logger.error(f"Error getting all users: {e}")
            return []
    
    def _calculate_days_since_registration(self, registration_date: datetime) -> int:
        """Расчет дней с момента регистрации"""
        return (datetime.now() - registration_date).days
    
    def _calculate_unique_days_active(self, events: List[Dict]) -> int:
        """Расчет количества уникальных дней активности"""
        if not events:
            return 0
        
        unique_days = set()
        for event in events:
            event_date = event['event_timestamp'].date()
            unique_days.add(event_date)
        
        return len(unique_days)
    
    def _calculate_avg_events_per_day(self, events: List[Dict], registration_date: datetime) -> float:
        """Расчет среднего количества событий в день"""
        if not events:
            return 0.0
        
        total_days = (datetime.now() - registration_date).days
        if total_days == 0:
            return float(len(events))
        
        return len(events) / total_days
    
    def _calculate_days_since_last_activity(self, events: List[Dict]) -> int:
        """Расчет дней с последней активности"""
        if not events:
            return 0
        
        last_event = max(events, key=lambda x: x['event_timestamp'])
        return (datetime.now() - last_event['event_timestamp']).days
    
    def _count_event_type(self, events: List[Dict], event_type: str) -> int:
        """Подсчет событий определенного типа"""
        return sum(1 for event in events if event['event_type'] == event_type)
    
    def _count_unique_commands(self, events: List[Dict]) -> int:
        """Подсчет уникальных команд"""
        commands = set()
        for event in events:
            if event['event_type'] == 'bot_command':
                properties = event.get('properties', {})
                if isinstance(properties, str):
                    import json
                    properties = json.loads(properties)
                
                command = properties.get('command')
                if command:
                    commands.add(command)
        
        return len(commands)
    
    def _calculate_avg_session_duration(self, events: List[Dict]) -> float:
        """Расчет средней продолжительности сессии"""
        if len(events) < 2:
            return 0.0
        
        # Группируем события по сессиям (события в пределах 30 минут считаются одной сессией)
        sessions = []
        current_session = [events[0]]
        
        for i in range(1, len(events)):
            time_diff = (events[i]['event_timestamp'] - events[i-1]['event_timestamp']).total_seconds()
            
            if time_diff <= 1800:  # 30 минут
                current_session.append(events[i])
            else:
                if len(current_session) > 1:
                    sessions.append(current_session)
                current_session = [events[i]]
        
        if len(current_session) > 1:
            sessions.append(current_session)
        
        if not sessions:
            return 0.0
        
        # Рассчитываем среднюю продолжительность сессий
        total_duration = 0
        for session in sessions:
            duration = (session[-1]['event_timestamp'] - session[0]['event_timestamp']).total_seconds()
            total_duration += duration
        
        return total_duration / len(sessions)
    
    def _calculate_peak_hour(self, events: List[Dict]) -> int:
        """Определение часа пиковой активности"""
        if not events:
            return 12  # По умолчанию полдень
        
        hour_counts = {}
        for event in events:
            hour = event['event_timestamp'].hour
            hour_counts[hour] = hour_counts.get(hour, 0) + 1
        
        return max(hour_counts.items(), key=lambda x: x[1])[0]
    
    def _calculate_weekend_activity_ratio(self, events: List[Dict]) -> float:
        """Расчет доли активности в выходные дни"""
        if not events:
            return 0.0
        
        weekend_events = 0
        for event in events:
            weekday = event['event_timestamp'].weekday()
            if weekday >= 5:  # Суббота и воскресенье
                weekend_events += 1
        
        return weekend_events / len(events)
    
    def _calculate_total_spent(self, events: List[Dict]) -> float:
        """Расчет общей суммы потраченных денег"""
        total = 0.0
        for event in events:
            if event['event_type'] == 'purchase':
                properties = event.get('properties', {})
                if isinstance(properties, str):
                    import json
                    properties = json.loads(properties)
                
                amount = properties.get('amount', 0)
                if isinstance(amount, (int, float)):
                    total += amount
        
        return total
    
    def _calculate_avg_order_value(self, events: List[Dict]) -> float:
        """Расчет средней стоимости заказа"""
        purchases = [event for event in events if event['event_type'] == 'purchase']
        if not purchases:
            return 0.0
        
        total_spent = self._calculate_total_spent(events)
        return total_spent / len(purchases)

def features_to_dataframe(features_list: List[UserFeatures]) -> pd.DataFrame:
    """Конвертация списка признаков в DataFrame"""
    data = []
    for features in features_list:
        data.append({
            'user_id': features.user_id,
            'telegram_id': features.telegram_id,
            'days_since_registration': features.days_since_registration,
            'has_username': features.has_username,
            'has_last_name': features.has_last_name,
            'language_code': features.language_code,
            'total_events': features.total_events,
            'unique_days_active': features.unique_days_active,
            'avg_events_per_day': features.avg_events_per_day,
            'days_since_last_activity': features.days_since_last_activity,
            'bot_commands_count': features.bot_commands_count,
            'messages_count': features.messages_count,
            'callback_queries_count': features.callback_queries_count,
            'unique_commands_count': features.unique_commands_count,
            'avg_session_duration': features.avg_session_duration,
            'peak_hour': features.peak_hour,
            'weekend_activity_ratio': features.weekend_activity_ratio,
            'purchase_count': features.purchase_count,
            'total_spent': features.total_spent,
            'avg_order_value': features.avg_order_value,
            'product_views_count': features.product_views_count,
            'cart_additions_count': features.cart_additions_count,
            'feature_extraction_date': features.feature_extraction_date
        })
    
    return pd.DataFrame(data)

def prepare_features_for_ml(df: pd.DataFrame) -> pd.DataFrame:
    """Подготовка признаков для ML-модели"""
    # Создаем копию DataFrame
    ml_df = df.copy()
    
    # Обрабатываем категориальные признаки
    ml_df['has_username'] = ml_df['has_username'].astype(int)
    ml_df['has_last_name'] = ml_df['has_last_name'].astype(int)
    
    # Обрабатываем language_code (one-hot encoding)
    language_dummies = pd.get_dummies(ml_df['language_code'], prefix='lang')
    ml_df = pd.concat([ml_df, language_dummies], axis=1)
    
    # Удаляем исходный language_code
    ml_df = ml_df.drop('language_code', axis=1)
    
    # Нормализация числовых признаков
    numerical_features = [
        'days_since_registration',
        'total_events',
        'unique_days_active',
        'avg_events_per_day',
        'days_since_last_activity',
        'bot_commands_count',
        'messages_count',
        'callback_queries_count',
        'unique_commands_count',
        'avg_session_duration',
        'peak_hour',
        'weekend_activity_ratio',
        'purchase_count',
        'total_spent',
        'avg_order_value',
        'product_views_count',
        'cart_additions_count'
    ]
    
    # Заполняем NaN значения
    ml_df[numerical_features] = ml_df[numerical_features].fillna(0)
    
    # Логарифмическое преобразование для skewed признаков
    skewed_features = ['total_events', 'total_spent', 'avg_order_value']
    for feature in skewed_features:
        ml_df[feature] = np.log1p(ml_df[feature])
    
    return ml_df
