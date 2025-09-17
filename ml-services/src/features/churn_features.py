"""
Модуль извлечения признаков для предсказания оттока пользователей
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class ChurnPredictionFeatures:
    """Структура для хранения признаков предсказания оттока"""
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
    events_last_60_days: int
    unique_days_active_last_7_days: int
    unique_days_active_last_14_days: int
    unique_days_active_last_30_days: int
    unique_days_active_last_60_days: int
    
    # Признаки снижения активности
    activity_drop_7d_vs_14d: float
    activity_drop_14d_vs_30d: float
    activity_drop_30d_vs_60d: float
    
    # Признаки интервалов между активностью
    avg_days_between_sessions: float
    max_days_between_sessions: float
    days_since_last_activity: int
    
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
    
    # Признаки покупок
    total_purchases: int
    purchases_last_7_days: int
    purchases_last_14_days: int
    purchases_last_30_days: int
    purchases_last_60_days: int
    total_spent: float
    avg_order_value: float
    days_since_last_purchase: int
    
    # Признаки сессий
    avg_session_duration_last_7_days: float
    avg_session_duration_last_14_days: float
    avg_session_duration_last_30_days: float
    session_count_last_7_days: int
    session_count_last_14_days: int
    session_count_last_30_days: int
    
    # Признаки трендов
    session_duration_trend: float
    engagement_trend: float
    purchase_trend: float
    
    # Признаки сезонности и времени
    peak_hour: int
    weekend_activity_ratio: float
    weekday_activity_ratio: float
    
    # Признаки лояльности
    repeat_purchase_ratio: float
    avg_days_between_purchases: float
    customer_lifetime_value: float
    
    # Метаданные
    feature_extraction_date: datetime
    churn_definition_days: int = 30

class ChurnFeatureExtractor:
    """Класс для извлечения признаков предсказания оттока"""
    
    def __init__(self, db_connection, churn_definition_days: int = 30):
        self.db_connection = db_connection
        self.logger = logging.getLogger(__name__)
        self.churn_definition_days = churn_definition_days
    
    def extract_user_churn_features(self, user_id: int, prediction_date: datetime = None) -> Optional[ChurnPredictionFeatures]:
        """Извлечение признаков для предсказания оттока конкретного пользователя"""
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
            features = ChurnPredictionFeatures(
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
                events_last_60_days=self._count_events_in_window(events, prediction_date, 60),
                unique_days_active_last_7_days=self._count_unique_days_in_window(events, prediction_date, 7),
                unique_days_active_last_14_days=self._count_unique_days_in_window(events, prediction_date, 14),
                unique_days_active_last_30_days=self._count_unique_days_in_window(events, prediction_date, 30),
                unique_days_active_last_60_days=self._count_unique_days_in_window(events, prediction_date, 60),
                
                # Признаки снижения активности
                activity_drop_7d_vs_14d=self._calculate_activity_drop(events, prediction_date, 7, 14),
                activity_drop_14d_vs_30d=self._calculate_activity_drop(events, prediction_date, 14, 30),
                activity_drop_30d_vs_60d=self._calculate_activity_drop(events, prediction_date, 30, 60),
                
                # Признаки интервалов между активностью
                avg_days_between_sessions=self._calculate_avg_days_between_sessions(events),
                max_days_between_sessions=self._calculate_max_days_between_sessions(events),
                days_since_last_activity=self._calculate_days_since_last_activity(events, prediction_date),
                
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
                total_spent=self._calculate_total_spent(events),
                avg_order_value=self._calculate_avg_order_value(events),
                days_since_last_purchase=self._calculate_days_since_last_purchase(events, prediction_date),
                
                # Признаки сессий
                avg_session_duration_last_7_days=self._calculate_avg_session_duration_in_window(events, prediction_date, 7),
                avg_session_duration_last_14_days=self._calculate_avg_session_duration_in_window(events, prediction_date, 14),
                avg_session_duration_last_30_days=self._calculate_avg_session_duration_in_window(events, prediction_date, 30),
                session_count_last_7_days=self._count_sessions_in_window(events, prediction_date, 7),
                session_count_last_14_days=self._count_sessions_in_window(events, prediction_date, 14),
                session_count_last_30_days=self._count_sessions_in_window(events, prediction_date, 30),
                
                # Признаки трендов
                session_duration_trend=self._calculate_session_duration_trend(events, prediction_date),
                engagement_trend=self._calculate_engagement_trend(events, prediction_date),
                purchase_trend=self._calculate_purchase_trend(events, prediction_date),
                
                # Признаки сезонности и времени
                peak_hour=self._calculate_peak_hour(events),
                weekend_activity_ratio=self._calculate_weekend_activity_ratio(events),
                weekday_activity_ratio=self._calculate_weekday_activity_ratio(events),
                
                # Признаки лояльности
                repeat_purchase_ratio=self._calculate_repeat_purchase_ratio(events),
                avg_days_between_purchases=self._calculate_avg_days_between_purchases(events),
                customer_lifetime_value=self._calculate_customer_lifetime_value(events),
                
                # Метаданные
                feature_extraction_date=prediction_date,
                churn_definition_days=self.churn_definition_days
            )
            
            return features
            
        except Exception as e:
            self.logger.error(f"Error extracting churn features for user {user_id}: {e}")
            return None
    
    def extract_training_data(self, start_date: datetime, end_date: datetime, limit: Optional[int] = None) -> List[ChurnPredictionFeatures]:
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
                    features = self.extract_user_churn_features(user_id, current_date)
                    if features:
                        # Добавляем целевую переменную
                        features = self._add_target_variable(features, user_id, current_date)
                        features_list.append(features)
                    
                    current_date += timedelta(days=1)
            
            self.logger.info(f"Extracted {len(features_list)} churn training samples")
            return features_list
            
        except Exception as e:
            self.logger.error(f"Error extracting churn training data: {e}")
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
    
    def _calculate_activity_drop(self, events: List[Dict], prediction_date: datetime, short_window: int, long_window: int) -> float:
        """Расчет снижения активности"""
        short_count = self._count_events_in_window(events, prediction_date, short_window)
        long_count = self._count_events_in_window(events, prediction_date, long_window)
        
        if long_count == 0:
            return 0.0
        
        # Нормализуем на количество дней
        short_normalized = short_count / short_window
        long_normalized = long_count / long_window
        
        return 1 - (short_normalized / long_normalized) if long_normalized > 0 else 0.0
    
    def _calculate_avg_days_between_sessions(self, events: List[Dict]) -> float:
        """Расчет среднего количества дней между сессиями"""
        if len(events) < 2:
            return 0.0
        
        # Группируем события по дням
        days = sorted(set(event['event_timestamp'].date() for event in events))
        
        if len(days) < 2:
            return 0.0
        
        # Рассчитываем интервалы между днями активности
        intervals = []
        for i in range(1, len(days)):
            interval = (days[i] - days[i-1]).days
            intervals.append(interval)
        
        return sum(intervals) / len(intervals)
    
    def _calculate_max_days_between_sessions(self, events: List[Dict]) -> int:
        """Расчет максимального количества дней между сессиями"""
        if len(events) < 2:
            return 0
        
        # Группируем события по дням
        days = sorted(set(event['event_timestamp'].date() for event in events))
        
        if len(days) < 2:
            return 0
        
        # Рассчитываем максимальный интервал
        max_interval = 0
        for i in range(1, len(days)):
            interval = (days[i] - days[i-1]).days
            max_interval = max(max_interval, interval)
        
        return max_interval
    
    def _calculate_days_since_last_activity(self, events: List[Dict], prediction_date: datetime) -> int:
        """Расчет дней с последней активности"""
        if not events:
            return 999  # Большое число для пользователей без активности
        
        last_event = max(events, key=lambda x: x['event_timestamp'])
        return (prediction_date - last_event['event_timestamp']).days
    
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
        sessions = self._group_events_into_sessions(window_events)
        
        if not sessions:
            return 0.0
        
        # Рассчитываем среднюю продолжительность сессий
        total_duration = 0
        for session in sessions:
            duration = (session[-1]['event_timestamp'] - session[0]['event_timestamp']).total_seconds()
            total_duration += duration
        
        return total_duration / len(sessions)
    
    def _count_sessions_in_window(self, events: List[Dict], prediction_date: datetime, days: int) -> int:
        """Подсчет количества сессий в временном окне"""
        start_date = prediction_date - timedelta(days=days)
        window_events = [event for event in events 
                        if start_date <= event['event_timestamp'] <= prediction_date]
        
        if len(window_events) < 2:
            return len(window_events)
        
        # Группируем события по сессиям
        sessions = self._group_events_into_sessions(window_events)
        return len(sessions)
    
    def _group_events_into_sessions(self, events: List[Dict]) -> List[List[Dict]]:
        """Группировка событий по сессиям"""
        if len(events) < 2:
            return [events] if events else []
        
        sessions = []
        current_session = [events[0]]
        
        for i in range(1, len(events)):
            time_diff = (events[i]['event_timestamp'] - events[i-1]['event_timestamp']).total_seconds()
            
            if time_diff <= 1800:  # 30 минут
                current_session.append(events[i])
            else:
                sessions.append(current_session)
                current_session = [events[i]]
        
        sessions.append(current_session)
        return sessions
    
    def _calculate_session_duration_trend(self, events: List[Dict], prediction_date: datetime) -> float:
        """Расчет тренда продолжительности сессий"""
        duration_7d = self._calculate_avg_session_duration_in_window(events, prediction_date, 7)
        duration_14d = self._calculate_avg_session_duration_in_window(events, prediction_date, 14)
        
        if duration_14d == 0:
            return 0.0
        
        return (duration_7d - duration_14d) / duration_14d
    
    def _calculate_engagement_trend(self, events: List[Dict], prediction_date: datetime) -> float:
        """Расчет тренда вовлеченности"""
        events_7d = self._count_events_in_window(events, prediction_date, 7)
        events_14d = self._count_events_in_window(events, prediction_date, 14)
        
        if events_14d == 0:
            return 0.0
        
        return (events_7d - events_14d) / events_14d
    
    def _calculate_purchase_trend(self, events: List[Dict], prediction_date: datetime) -> float:
        """Расчет тренда покупок"""
        purchases_7d = self._count_events_by_type_in_window(events, 'purchase', prediction_date, 7)
        purchases_14d = self._count_events_by_type_in_window(events, 'purchase', prediction_date, 14)
        
        if purchases_14d == 0:
            return 0.0
        
        return (purchases_7d - purchases_14d) / purchases_14d
    
    def _calculate_peak_hour(self, events: List[Dict]) -> int:
        """Определение часа пиковой активности"""
        if not events:
            return 12
        
        hour_counts = {}
        for event in events:
            hour = event['event_timestamp'].hour
            hour_counts[hour] = hour_counts.get(hour, 0) + 1
        
        return max(hour_counts.items(), key=lambda x: x[1])[0] if hour_counts else 12
    
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
    
    def _calculate_weekday_activity_ratio(self, events: List[Dict]) -> float:
        """Расчет доли активности в рабочие дни"""
        return 1.0 - self._calculate_weekend_activity_ratio(events)
    
    def _calculate_repeat_purchase_ratio(self, events: List[Dict]) -> float:
        """Расчет доли повторных покупок"""
        purchases = [event for event in events if event['event_type'] == 'purchase']
        if len(purchases) <= 1:
            return 0.0
        
        return (len(purchases) - 1) / len(purchases)
    
    def _calculate_avg_days_between_purchases(self, events: List[Dict]) -> float:
        """Расчет среднего количества дней между покупками"""
        purchases = [event for event in events if event['event_type'] == 'purchase']
        if len(purchases) < 2:
            return 999.0
        
        # Сортируем покупки по времени
        purchases.sort(key=lambda x: x['event_timestamp'])
        
        intervals = []
        for i in range(1, len(purchases)):
            interval = (purchases[i]['event_timestamp'] - purchases[i-1]['event_timestamp']).days
            intervals.append(interval)
        
        return sum(intervals) / len(intervals)
    
    def _calculate_customer_lifetime_value(self, events: List[Dict]) -> float:
        """Расчет жизненной ценности клиента"""
        total_spent = self._calculate_total_spent(events)
        total_events = len(events)
        
        # Простая формула CLV (можно усложнить)
        return total_spent + (total_events * 0.1)  # Бонус за активность
    
    def _add_target_variable(self, features: ChurnPredictionFeatures, user_id: int, prediction_date: datetime) -> ChurnPredictionFeatures:
        """Добавление целевой переменной (отток в течение следующих 30 дней)"""
        try:
            # Получаем события пользователя после даты предсказания
            end_date = prediction_date + timedelta(days=self.churn_definition_days)
            
            query = """
            SELECT COUNT(*) as event_count
            FROM app_schema.events 
            WHERE user_id = %s 
            AND event_timestamp > %s 
            AND event_timestamp <= %s
            """
            
            result = self.db_connection.execute(query, (user_id, prediction_date, end_date))
            event_count = result[0]['event_count'] if result else 0
            
            # Отток = отсутствие активности в течение периода
            features.will_churn = event_count == 0
            
            return features
            
        except Exception as e:
            self.logger.error(f"Error adding target variable: {e}")
            features.will_churn = False
            return features

def churn_features_to_dataframe(features_list: List[ChurnPredictionFeatures]) -> pd.DataFrame:
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
            'events_last_60_days': features.events_last_60_days,
            'unique_days_active_last_7_days': features.unique_days_active_last_7_days,
            'unique_days_active_last_14_days': features.unique_days_active_last_14_days,
            'unique_days_active_last_30_days': features.unique_days_active_last_30_days,
            'unique_days_active_last_60_days': features.unique_days_active_last_60_days,
            'activity_drop_7d_vs_14d': features.activity_drop_7d_vs_14d,
            'activity_drop_14d_vs_30d': features.activity_drop_14d_vs_30d,
            'activity_drop_30d_vs_60d': features.activity_drop_30d_vs_60d,
            'avg_days_between_sessions': features.avg_days_between_sessions,
            'max_days_between_sessions': features.max_days_between_sessions,
            'days_since_last_activity': features.days_since_last_activity,
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
            'total_spent': features.total_spent,
            'avg_order_value': features.avg_order_value,
            'days_since_last_purchase': features.days_since_last_purchase,
            'avg_session_duration_last_7_days': features.avg_session_duration_last_7_days,
            'avg_session_duration_last_14_days': features.avg_session_duration_last_14_days,
            'avg_session_duration_last_30_days': features.avg_session_duration_last_30_days,
            'session_count_last_7_days': features.session_count_last_7_days,
            'session_count_last_14_days': features.session_count_last_14_days,
            'session_count_last_30_days': features.session_count_last_30_days,
            'session_duration_trend': features.session_duration_trend,
            'engagement_trend': features.engagement_trend,
            'purchase_trend': features.purchase_trend,
            'peak_hour': features.peak_hour,
            'weekend_activity_ratio': features.weekend_activity_ratio,
            'weekday_activity_ratio': features.weekday_activity_ratio,
            'repeat_purchase_ratio': features.repeat_purchase_ratio,
            'avg_days_between_purchases': features.avg_days_between_purchases,
            'customer_lifetime_value': features.customer_lifetime_value,
            'feature_extraction_date': features.feature_extraction_date,
            'will_churn': getattr(features, 'will_churn', False)
        })
    
    return pd.DataFrame(data)

def prepare_churn_features_for_ml(df: pd.DataFrame) -> pd.DataFrame:
    """Подготовка признаков для ML-модели"""
    # Создаем копию DataFrame
    ml_df = df.copy()
    
    # Нормализация числовых признаков
    numerical_features = [
        'days_since_registration',
        'total_events',
        'unique_days_active',
        'events_last_7_days',
        'events_last_14_days',
        'events_last_30_days',
        'events_last_60_days',
        'unique_days_active_last_7_days',
        'unique_days_active_last_14_days',
        'unique_days_active_last_30_days',
        'unique_days_active_last_60_days',
        'activity_drop_7d_vs_14d',
        'activity_drop_14d_vs_30d',
        'activity_drop_30d_vs_60d',
        'avg_days_between_sessions',
        'max_days_between_sessions',
        'days_since_last_activity',
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
        'total_spent',
        'avg_order_value',
        'days_since_last_purchase',
        'avg_session_duration_last_7_days',
        'avg_session_duration_last_14_days',
        'avg_session_duration_last_30_days',
        'session_count_last_7_days',
        'session_count_last_14_days',
        'session_count_last_30_days',
        'session_duration_trend',
        'engagement_trend',
        'purchase_trend',
        'peak_hour',
        'weekend_activity_ratio',
        'weekday_activity_ratio',
        'repeat_purchase_ratio',
        'avg_days_between_purchases',
        'customer_lifetime_value'
    ]
    
    # Заполняем NaN значения
    ml_df[numerical_features] = ml_df[numerical_features].fillna(0)
    
    # Обрабатываем специальные случаи
    ml_df['days_since_last_activity'] = ml_df['days_since_last_activity'].replace(999, 365)
    ml_df['days_since_last_purchase'] = ml_df['days_since_last_purchase'].replace(999, 365)
    ml_df['avg_days_between_purchases'] = ml_df['avg_days_between_purchases'].replace(999, 365)
    
    # Логарифмическое преобразование для skewed признаков
    skewed_features = ['total_events', 'total_spent', 'customer_lifetime_value']
    for feature in skewed_features:
        ml_df[feature] = np.log1p(ml_df[feature])
    
    return ml_df
