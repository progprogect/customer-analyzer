"""
Модуль извлечения признаков для предсказания покупок
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class PurchasePredictionFeatures:
    """Структура для хранения признаков предсказания покупок"""
    user_id: int
    telegram_id: int
    
    # Базовые признаки пользователя
    days_since_registration: int
    total_events: int
    unique_days_active: int
    
    # Признаки активности за временные окна
    events_last_7_days: int
    events_last_14_days: int
    events_last_30_days: int
    unique_days_active_last_7_days: int
    unique_days_active_last_14_days: int
    unique_days_active_last_30_days: int
    
    # Признаки поведения за временные окна
    bot_commands_last_7_days: int
    bot_commands_last_14_days: int
    bot_commands_last_30_days: int
    messages_last_7_days: int
    messages_last_14_days: int
    messages_last_30_days: int
    callback_queries_last_7_days: int
    callback_queries_last_14_days: int
    callback_queries_last_30_days: int
    
    # Признаки взаимодействия с продуктами
    product_views_last_7_days: int
    product_views_last_14_days: int
    product_views_last_30_days: int
    cart_additions_last_7_days: int
    cart_additions_last_14_days: int
    cart_additions_last_30_days: int
    
    # Признаки покупок (исторические)
    total_purchases: int
    purchases_last_7_days: int
    purchases_last_14_days: int
    purchases_last_30_days: int
    purchases_last_60_days: int
    purchases_last_90_days: int
    total_spent: float
    avg_order_value: float
    days_since_last_purchase: int
    
    # Временные паттерны
    avg_session_duration_last_7_days: float
    avg_session_duration_last_14_days: float
    peak_hour: int
    weekend_activity_ratio_last_7_days: float
    weekend_activity_ratio_last_14_days: float
    
    # Признаки трендов
    activity_trend_7d_vs_14d: float  # Отношение активности за 7 дней к 14 дням
    activity_trend_14d_vs_30d: float  # Отношение активности за 14 дней к 30 дням
    purchase_trend_30d_vs_60d: float  # Отношение покупок за 30 дней к 60 дням
    
    # Признаки сезонности
    is_weekend: bool
    hour_of_day: int
    day_of_week: int
    month: int
    
    # Метаданные
    feature_extraction_date: datetime
    prediction_horizon_days: int = 30

class PurchaseFeatureExtractor:
    """Класс для извлечения признаков предсказания покупок"""
    
    def __init__(self, db_connection):
        self.db_connection = db_connection
        self.logger = logging.getLogger(__name__)
        self.prediction_horizon_days = 30
    
    def extract_user_purchase_features(self, user_id: int, prediction_date: datetime = None) -> Optional[PurchasePredictionFeatures]:
        """Извлечение признаков для предсказания покупок конкретного пользователя"""
        try:
            if prediction_date is None:
                prediction_date = datetime.now()
            
            # Получаем базовую информацию о пользователе
            user_info = self._get_user_info(user_id)
            if not user_info:
                return None
            
            # Получаем события пользователя
            events = self._get_user_events(user_id)
            
            # Извлекаем признаки
            features = PurchasePredictionFeatures(
                user_id=user_id,
                telegram_id=user_info['telegram_id'],
                
                # Базовые признаки
                days_since_registration=self._calculate_days_since_registration(user_info['registration_date'], prediction_date),
                total_events=len(events),
                unique_days_active=self._calculate_unique_days_active(events),
                
                # Признаки активности за временные окна
                events_last_7_days=self._count_events_in_window(events, prediction_date, 7),
                events_last_14_days=self._count_events_in_window(events, prediction_date, 14),
                events_last_30_days=self._count_events_in_window(events, prediction_date, 30),
                unique_days_active_last_7_days=self._count_unique_days_in_window(events, prediction_date, 7),
                unique_days_active_last_14_days=self._count_unique_days_in_window(events, prediction_date, 14),
                unique_days_active_last_30_days=self._count_unique_days_in_window(events, prediction_date, 30),
                
                # Признаки поведения за временные окна
                bot_commands_last_7_days=self._count_events_by_type_in_window(events, 'bot_command', prediction_date, 7),
                bot_commands_last_14_days=self._count_events_by_type_in_window(events, 'bot_command', prediction_date, 14),
                bot_commands_last_30_days=self._count_events_by_type_in_window(events, 'bot_command', prediction_date, 30),
                messages_last_7_days=self._count_events_by_type_in_window(events, 'message', prediction_date, 7),
                messages_last_14_days=self._count_events_by_type_in_window(events, 'message', prediction_date, 14),
                messages_last_30_days=self._count_events_by_type_in_window(events, 'message', prediction_date, 30),
                callback_queries_last_7_days=self._count_events_by_type_in_window(events, 'callback_query', prediction_date, 7),
                callback_queries_last_14_days=self._count_events_by_type_in_window(events, 'callback_query', prediction_date, 14),
                callback_queries_last_30_days=self._count_events_by_type_in_window(events, 'callback_query', prediction_date, 30),
                
                # Признаки взаимодействия с продуктами
                product_views_last_7_days=self._count_events_by_type_in_window(events, 'view', prediction_date, 7),
                product_views_last_14_days=self._count_events_by_type_in_window(events, 'view', prediction_date, 14),
                product_views_last_30_days=self._count_events_by_type_in_window(events, 'view', prediction_date, 30),
                cart_additions_last_7_days=self._count_events_by_type_in_window(events, 'add_to_cart', prediction_date, 7),
                cart_additions_last_14_days=self._count_events_by_type_in_window(events, 'add_to_cart', prediction_date, 14),
                cart_additions_last_30_days=self._count_events_by_type_in_window(events, 'add_to_cart', prediction_date, 30),
                
                # Признаки покупок
                total_purchases=self._count_events_by_type(events, 'purchase'),
                purchases_last_7_days=self._count_events_by_type_in_window(events, 'purchase', prediction_date, 7),
                purchases_last_14_days=self._count_events_by_type_in_window(events, 'purchase', prediction_date, 14),
                purchases_last_30_days=self._count_events_by_type_in_window(events, 'purchase', prediction_date, 30),
                purchases_last_60_days=self._count_events_by_type_in_window(events, 'purchase', prediction_date, 60),
                purchases_last_90_days=self._count_events_by_type_in_window(events, 'purchase', prediction_date, 90),
                total_spent=self._calculate_total_spent(events),
                avg_order_value=self._calculate_avg_order_value(events),
                days_since_last_purchase=self._calculate_days_since_last_purchase(events, prediction_date),
                
                # Временные паттерны
                avg_session_duration_last_7_days=self._calculate_avg_session_duration_in_window(events, prediction_date, 7),
                avg_session_duration_last_14_days=self._calculate_avg_session_duration_in_window(events, prediction_date, 14),
                peak_hour=self._calculate_peak_hour(events),
                weekend_activity_ratio_last_7_days=self._calculate_weekend_activity_ratio_in_window(events, prediction_date, 7),
                weekend_activity_ratio_last_14_days=self._calculate_weekend_activity_ratio_in_window(events, prediction_date, 14),
                
                # Признаки трендов
                activity_trend_7d_vs_14d=self._calculate_activity_trend(events, prediction_date, 7, 14),
                activity_trend_14d_vs_30d=self._calculate_activity_trend(events, prediction_date, 14, 30),
                purchase_trend_30d_vs_60d=self._calculate_purchase_trend(events, prediction_date, 30, 60),
                
                # Признаки сезонности
                is_weekend=prediction_date.weekday() >= 5,
                hour_of_day=prediction_date.hour,
                day_of_week=prediction_date.weekday(),
                month=prediction_date.month,
                
                # Метаданные
                feature_extraction_date=prediction_date,
                prediction_horizon_days=self.prediction_horizon_days
            )
            
            return features
            
        except Exception as e:
            self.logger.error(f"Error extracting purchase features for user {user_id}: {e}")
            return None
    
    def extract_training_data(self, start_date: datetime, end_date: datetime, limit: Optional[int] = None) -> List[PurchasePredictionFeatures]:
        """Извлечение данных для обучения модели"""
        try:
            # Получаем пользователей, которые были активны в указанный период
            users = self._get_users_for_training(start_date, end_date, limit)
            
            features_list = []
            for user in users:
                user_id = user['user_id']
                
                # Извлекаем признаки для каждого дня в периоде обучения
                current_date = start_date
                while current_date <= end_date:
                    features = self.extract_user_purchase_features(user_id, current_date)
                    if features:
                        # Добавляем целевую переменную
                        features = self._add_target_variable(features, user_id, current_date)
                        features_list.append(features)
                    
                    current_date += timedelta(days=1)
            
            self.logger.info(f"Extracted {len(features_list)} training samples")
            return features_list
            
        except Exception as e:
            self.logger.error(f"Error extracting training data: {e}")
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
            registration_date
        FROM app_schema.users 
        WHERE user_id = %s
        """
        
        try:
            result = self.db_connection.execute(query, (user_id,))
            return result[0] if result else None
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
    
    def _get_users_for_training(self, start_date: datetime, end_date: datetime, limit: Optional[int] = None) -> List[Dict]:
        """Получение пользователей для обучения"""
        query = """
        SELECT DISTINCT u.user_id
        FROM app_schema.users u
        JOIN app_schema.events e ON u.user_id = e.user_id
        WHERE e.event_timestamp BETWEEN %s AND %s
        ORDER BY u.user_id
        """
        
        if limit:
            query += f" LIMIT {limit}"
        
        try:
            result = self.db_connection.execute(query, (start_date, end_date))
            return result if result else []
        except Exception as e:
            self.logger.error(f"Error getting users for training: {e}")
            return []
    
    def _calculate_days_since_registration(self, registration_date: datetime, prediction_date: datetime) -> int:
        """Расчет дней с момента регистрации"""
        return (prediction_date - registration_date).days
    
    def _count_events_in_window(self, events: List[Dict], prediction_date: datetime, days: int) -> int:
        """Подсчет событий в временном окне"""
        start_date = prediction_date - timedelta(days=days)
        return sum(1 for event in events 
                  if start_date <= event['event_timestamp'] <= prediction_date)
    
    def _count_unique_days_in_window(self, events: List[Dict], prediction_date: datetime, days: int) -> int:
        """Подсчет уникальных дней активности в временном окне"""
        start_date = prediction_date - timedelta(days=days)
        unique_days = set()
        for event in events:
            if start_date <= event['event_timestamp'] <= prediction_date:
                unique_days.add(event['event_timestamp'].date())
        return len(unique_days)
    
    def _count_events_by_type_in_window(self, events: List[Dict], event_type: str, prediction_date: datetime, days: int) -> int:
        """Подсчет событий определенного типа в временном окне"""
        start_date = prediction_date - timedelta(days=days)
        return sum(1 for event in events 
                  if event['event_type'] == event_type and 
                  start_date <= event['event_timestamp'] <= prediction_date)
    
    def _count_events_by_type(self, events: List[Dict], event_type: str) -> int:
        """Подсчет событий определенного типа"""
        return sum(1 for event in events if event['event_type'] == event_type)
    
    def _calculate_unique_days_active(self, events: List[Dict]) -> int:
        """Расчет количества уникальных дней активности"""
        if not events:
            return 0
        
        unique_days = set()
        for event in events:
            unique_days.add(event['event_timestamp'].date())
        
        return len(unique_days)
    
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
    
    def _calculate_days_since_last_purchase(self, events: List[Dict], prediction_date: datetime) -> int:
        """Расчет дней с последней покупки"""
        purchases = [event for event in events if event['event_type'] == 'purchase']
        if not purchases:
            return 999  # Большое число для пользователей без покупок
        
        last_purchase = max(purchases, key=lambda x: x['event_timestamp'])
        return (prediction_date - last_purchase['event_timestamp']).days
    
    def _calculate_avg_session_duration_in_window(self, events: List[Dict], prediction_date: datetime, days: int) -> float:
        """Расчет средней продолжительности сессии в временном окне"""
        start_date = prediction_date - timedelta(days=days)
        window_events = [event for event in events 
                        if start_date <= event['event_timestamp'] <= prediction_date]
        
        if len(window_events) < 2:
            return 0.0
        
        # Группируем события по сессиям
        sessions = []
        current_session = [window_events[0]]
        
        for i in range(1, len(window_events)):
            time_diff = (window_events[i]['event_timestamp'] - window_events[i-1]['event_timestamp']).total_seconds()
            
            if time_diff <= 1800:  # 30 минут
                current_session.append(window_events[i])
            else:
                if len(current_session) > 1:
                    sessions.append(current_session)
                current_session = [window_events[i]]
        
        if len(current_session) > 1:
            sessions.append(current_session)
        
        if not sessions:
            return 0.0
        
        # Рассчитываем среднюю продолжительность
        total_duration = 0
        for session in sessions:
            duration = (session[-1]['event_timestamp'] - session[0]['event_timestamp']).total_seconds()
            total_duration += duration
        
        return total_duration / len(sessions)
    
    def _calculate_peak_hour(self, events: List[Dict]) -> int:
        """Определение часа пиковой активности"""
        if not events:
            return 12
        
        hour_counts = {}
        for event in events:
            hour = event['event_timestamp'].hour
            hour_counts[hour] = hour_counts.get(hour, 0) + 1
        
        return max(hour_counts.items(), key=lambda x: x[1])[0] if hour_counts else 12
    
    def _calculate_weekend_activity_ratio_in_window(self, events: List[Dict], prediction_date: datetime, days: int) -> float:
        """Расчет доли активности в выходные в временном окне"""
        start_date = prediction_date - timedelta(days=days)
        window_events = [event for event in events 
                        if start_date <= event['event_timestamp'] <= prediction_date]
        
        if not window_events:
            return 0.0
        
        weekend_events = 0
        for event in window_events:
            weekday = event['event_timestamp'].weekday()
            if weekday >= 5:  # Суббота и воскресенье
                weekend_events += 1
        
        return weekend_events / len(window_events)
    
    def _calculate_activity_trend(self, events: List[Dict], prediction_date: datetime, short_window: int, long_window: int) -> float:
        """Расчет тренда активности"""
        short_count = self._count_events_in_window(events, prediction_date, short_window)
        long_count = self._count_events_in_window(events, prediction_date, long_window)
        
        if long_count == 0:
            return 0.0
        
        return short_count / long_count
    
    def _calculate_purchase_trend(self, events: List[Dict], prediction_date: datetime, short_window: int, long_window: int) -> float:
        """Расчет тренда покупок"""
        short_count = self._count_events_by_type_in_window(events, 'purchase', prediction_date, short_window)
        long_count = self._count_events_by_type_in_window(events, 'purchase', prediction_date, long_window)
        
        if long_count == 0:
            return 0.0
        
        return short_count / long_count
    
    def _add_target_variable(self, features: PurchasePredictionFeatures, user_id: int, prediction_date: datetime) -> PurchasePredictionFeatures:
        """Добавление целевой переменной (покупка в течение следующих 30 дней)"""
        try:
            # Получаем события пользователя после даты предсказания
            end_date = prediction_date + timedelta(days=self.prediction_horizon_days)
            
            query = """
            SELECT COUNT(*) as purchase_count
            FROM app_schema.events 
            WHERE user_id = %s 
            AND event_type = 'purchase'
            AND event_timestamp > %s 
            AND event_timestamp <= %s
            """
            
            result = self.db_connection.execute(query, (user_id, prediction_date, end_date))
            purchase_count = result[0]['purchase_count'] if result else 0
            
            # Добавляем целевую переменную как атрибут
            features.will_purchase_in_30d = purchase_count > 0
            features.purchase_count_in_30d = purchase_count
            
            return features
            
        except Exception as e:
            self.logger.error(f"Error adding target variable: {e}")
            features.will_purchase_in_30d = False
            features.purchase_count_in_30d = 0
            return features

def purchase_features_to_dataframe(features_list: List[PurchasePredictionFeatures]) -> pd.DataFrame:
    """Конвертация списка признаков в DataFrame"""
    data = []
    for features in features_list:
        data.append({
            'user_id': features.user_id,
            'telegram_id': features.telegram_id,
            'days_since_registration': features.days_since_registration,
            'total_events': features.total_events,
            'unique_days_active': features.unique_days_active,
            'events_last_7_days': features.events_last_7_days,
            'events_last_14_days': features.events_last_14_days,
            'events_last_30_days': features.events_last_30_days,
            'unique_days_active_last_7_days': features.unique_days_active_last_7_days,
            'unique_days_active_last_14_days': features.unique_days_active_last_14_days,
            'unique_days_active_last_30_days': features.unique_days_active_last_30_days,
            'bot_commands_last_7_days': features.bot_commands_last_7_days,
            'bot_commands_last_14_days': features.bot_commands_last_14_days,
            'bot_commands_last_30_days': features.bot_commands_last_30_days,
            'messages_last_7_days': features.messages_last_7_days,
            'messages_last_14_days': features.messages_last_14_days,
            'messages_last_30_days': features.messages_last_30_days,
            'callback_queries_last_7_days': features.callback_queries_last_7_days,
            'callback_queries_last_14_days': features.callback_queries_last_14_days,
            'callback_queries_last_30_days': features.callback_queries_last_30_days,
            'product_views_last_7_days': features.product_views_last_7_days,
            'product_views_last_14_days': features.product_views_last_14_days,
            'product_views_last_30_days': features.product_views_last_30_days,
            'cart_additions_last_7_days': features.cart_additions_last_7_days,
            'cart_additions_last_14_days': features.cart_additions_last_14_days,
            'cart_additions_last_30_days': features.cart_additions_last_30_days,
            'total_purchases': features.total_purchases,
            'purchases_last_7_days': features.purchases_last_7_days,
            'purchases_last_14_days': features.purchases_last_14_days,
            'purchases_last_30_days': features.purchases_last_30_days,
            'purchases_last_60_days': features.purchases_last_60_days,
            'purchases_last_90_days': features.purchases_last_90_days,
            'total_spent': features.total_spent,
            'avg_order_value': features.avg_order_value,
            'days_since_last_purchase': features.days_since_last_purchase,
            'avg_session_duration_last_7_days': features.avg_session_duration_last_7_days,
            'avg_session_duration_last_14_days': features.avg_session_duration_last_14_days,
            'peak_hour': features.peak_hour,
            'weekend_activity_ratio_last_7_days': features.weekend_activity_ratio_last_7_days,
            'weekend_activity_ratio_last_14_days': features.weekend_activity_ratio_last_14_days,
            'activity_trend_7d_vs_14d': features.activity_trend_7d_vs_14d,
            'activity_trend_14d_vs_30d': features.activity_trend_14d_vs_30d,
            'purchase_trend_30d_vs_60d': features.purchase_trend_30d_vs_60d,
            'is_weekend': features.is_weekend,
            'hour_of_day': features.hour_of_day,
            'day_of_week': features.day_of_week,
            'month': features.month,
            'feature_extraction_date': features.feature_extraction_date,
            'will_purchase_in_30d': getattr(features, 'will_purchase_in_30d', False),
            'purchase_count_in_30d': getattr(features, 'purchase_count_in_30d', 0)
        })
    
    return pd.DataFrame(data)

def prepare_purchase_features_for_ml(df: pd.DataFrame) -> pd.DataFrame:
    """Подготовка признаков для ML-модели"""
    # Создаем копию DataFrame
    ml_df = df.copy()
    
    # Обрабатываем булевые признаки
    ml_df['is_weekend'] = ml_df['is_weekend'].astype(int)
    
    # Нормализация числовых признаков
    numerical_features = [
        'days_since_registration',
        'total_events',
        'unique_days_active',
        'events_last_7_days',
        'events_last_14_days',
        'events_last_30_days',
        'unique_days_active_last_7_days',
        'unique_days_active_last_14_days',
        'unique_days_active_last_30_days',
        'bot_commands_last_7_days',
        'bot_commands_last_14_days',
        'bot_commands_last_30_days',
        'messages_last_7_days',
        'messages_last_14_days',
        'messages_last_30_days',
        'callback_queries_last_7_days',
        'callback_queries_last_14_days',
        'callback_queries_last_30_days',
        'product_views_last_7_days',
        'product_views_last_14_days',
        'product_views_last_30_days',
        'cart_additions_last_7_days',
        'cart_additions_last_14_days',
        'cart_additions_last_30_days',
        'total_purchases',
        'purchases_last_7_days',
        'purchases_last_14_days',
        'purchases_last_30_days',
        'purchases_last_60_days',
        'purchases_last_90_days',
        'total_spent',
        'avg_order_value',
        'days_since_last_purchase',
        'avg_session_duration_last_7_days',
        'avg_session_duration_last_14_days',
        'peak_hour',
        'weekend_activity_ratio_last_7_days',
        'weekend_activity_ratio_last_14_days',
        'activity_trend_7d_vs_14d',
        'activity_trend_14d_vs_30d',
        'purchase_trend_30d_vs_60d',
        'hour_of_day',
        'day_of_week',
        'month'
    ]
    
    # Заполняем NaN значения
    ml_df[numerical_features] = ml_df[numerical_features].fillna(0)
    
    # Логарифмическое преобразование для skewed признаков
    skewed_features = ['total_events', 'total_spent', 'avg_order_value']
    for feature in skewed_features:
        ml_df[feature] = np.log1p(ml_df[feature])
    
    # Обработка days_since_last_purchase (заменяем 999 на большое число)
    ml_df['days_since_last_purchase'] = ml_df['days_since_last_purchase'].replace(999, 365)
    
    return ml_df
