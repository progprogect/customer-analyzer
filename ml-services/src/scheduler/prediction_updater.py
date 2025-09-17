"""
Система автоматического обновления прогнозов покупок
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
import schedule
import time
from threading import Thread

from ..models.purchase_prediction import PurchasePredictionModel
from ..features.purchase_features import PurchaseFeatureExtractor, purchase_features_to_dataframe, prepare_purchase_features_for_ml
from ..database.connection import get_db_connection

logger = logging.getLogger(__name__)

class PredictionUpdater:
    """Планировщик для автоматического обновления прогнозов покупок"""
    
    def __init__(self):
        self.purchase_prediction_model = None
        self.db_connection = None
        self.is_running = False
        self.updater_thread = None
        self.logger = logging.getLogger(__name__)
        
        # Настройки обновления
        self.update_config = {
            'enabled': True,
            'schedule': 'daily',  # daily, hourly, weekly
            'time': '03:00',  # Время выполнения (для daily)
            'batch_size': 1000,  # Размер батча для обработки
            'update_threshold_days': 1,  # Обновлять если прогноз старше N дней
            'max_users_per_update': 10000,  # Максимальное количество пользователей за обновление
            'backup_predictions': True
        }
    
    def start(self):
        """Запуск планировщика"""
        if self.is_running:
            self.logger.warning("Prediction updater is already running")
            return
        
        self.is_running = True
        self.updater_thread = Thread(target=self._run_scheduler, daemon=True)
        self.updater_thread.start()
        
        self.logger.info("Prediction updater started")
    
    def stop(self):
        """Остановка планировщика"""
        self.is_running = False
        if self.updater_thread:
            self.updater_thread.join(timeout=5)
        
        self.logger.info("Prediction updater stopped")
    
    def _run_scheduler(self):
        """Основной цикл планировщика"""
        # Настраиваем расписание
        self._setup_schedule()
        
        while self.is_running:
            try:
                schedule.run_pending()
                time.sleep(60)  # Проверяем каждую минуту
            except Exception as e:
                self.logger.error(f"Error in prediction updater loop: {e}")
                time.sleep(60)
    
    def _setup_schedule(self):
        """Настройка расписания задач"""
        # Очищаем существующие задачи
        schedule.clear()
        
        # Настраиваем обновление прогнозов
        if self.update_config['enabled']:
            schedule_type = self.update_config['schedule']
            
            if schedule_type == 'daily':
                schedule.every().day.at(self.update_config['time']).do(self._update_predictions)
            elif schedule_type == 'hourly':
                schedule.every().hour.do(self._update_predictions)
            elif schedule_type == 'weekly':
                schedule.every().week.do(self._update_predictions)
    
    def _update_predictions(self):
        """Обновление прогнозов покупок"""
        try:
            self.logger.info("Starting prediction update")
            
            # Загружаем модель
            if self.purchase_prediction_model is None:
                self.purchase_prediction_model = PurchasePredictionModel()
                try:
                    self.purchase_prediction_model.load_model()
                except FileNotFoundError:
                    self.logger.error("Purchase prediction model not found. Skipping update.")
                    return
            
            # Получаем соединение с БД
            db_connection = get_db_connection()
            
            # Получаем пользователей для обновления
            users_to_update = self._get_users_for_update(db_connection)
            
            if not users_to_update:
                self.logger.info("No users need prediction update")
                return
            
            self.logger.info(f"Updating predictions for {len(users_to_update)} users")
            
            # Обрабатываем пользователей батчами
            batch_size = self.update_config['batch_size']
            total_updated = 0
            
            for i in range(0, len(users_to_update), batch_size):
                batch = users_to_update[i:i + batch_size]
                updated_count = self._update_batch_predictions(db_connection, batch)
                total_updated += updated_count
                
                self.logger.info(f"Updated batch {i//batch_size + 1}: {updated_count} users")
            
            self.logger.info(f"Prediction update completed. Total updated: {total_updated}")
            
            # Сохраняем статистику обновления
            self._save_update_stats(total_updated, len(users_to_update))
            
        except Exception as e:
            self.logger.error(f"Error updating predictions: {e}")
    
    def _get_users_for_update(self, db_connection) -> List[Dict]:
        """Получение пользователей для обновления прогнозов"""
        try:
            # Определяем пороговую дату
            threshold_date = datetime.now() - timedelta(days=self.update_config['update_threshold_days'])
            
            query = """
            SELECT DISTINCT u.user_id, u.telegram_id
            FROM app_schema.users u
            LEFT JOIN app_schema.user_metrics um ON u.user_id = um.user_id
            WHERE (
                um.last_updated IS NULL 
                OR um.last_updated < %s
                OR um.purchase_probability_30d IS NULL
            )
            AND EXISTS (
                SELECT 1 FROM app_schema.events e 
                WHERE e.user_id = u.user_id 
                AND e.event_timestamp > NOW() - INTERVAL '30 days'
            )
            ORDER BY u.user_id
            LIMIT %s
            """
            
            result = db_connection.execute(query, (threshold_date, self.update_config['max_users_per_update']))
            return result if result else []
            
        except Exception as e:
            self.logger.error(f"Error getting users for update: {e}")
            return []
    
    def _update_batch_predictions(self, db_connection, user_batch: List[Dict]) -> int:
        """Обновление прогнозов для батча пользователей"""
        try:
            # Извлекаем признаки для батча
            feature_extractor = PurchaseFeatureExtractor(db_connection)
            features_list = []
            
            for user in user_batch:
                features = feature_extractor.extract_user_purchase_features(user['user_id'])
                if features:
                    features_list.append(features)
            
            if not features_list:
                return 0
            
            # Конвертируем в DataFrame
            features_df = purchase_features_to_dataframe(features_list)
            ml_features_df = prepare_purchase_features_for_ml(features_df)
            
            # Предсказываем
            predictions = self.purchase_prediction_model.predict(ml_features_df)
            
            # Обновляем БД
            updated_count = self._update_database_predictions(db_connection, predictions)
            
            return updated_count
            
        except Exception as e:
            self.logger.error(f"Error updating batch predictions: {e}")
            return 0
    
    def _update_database_predictions(self, db_connection, predictions: List) -> int:
        """Обновление прогнозов в базе данных"""
        try:
            updated_count = 0
            
            for prediction in predictions:
                # Проверяем, существует ли запись в user_metrics
                check_query = "SELECT user_id FROM app_schema.user_metrics WHERE user_id = %s"
                existing = db_connection.execute(check_query, (prediction.user_id,))
                
                if existing:
                    # Обновляем существующую запись
                    update_query = """
                    UPDATE app_schema.user_metrics 
                    SET 
                        purchase_probability_30d = %s,
                        last_updated = NOW()
                    WHERE user_id = %s
                    """
                    db_connection.execute(update_query, (prediction.purchase_probability, prediction.user_id))
                else:
                    # Создаем новую запись
                    insert_query = """
                    INSERT INTO app_schema.user_metrics (
                        user_id, 
                        purchase_probability_30d, 
                        last_updated
                    ) VALUES (%s, %s, NOW())
                    """
                    db_connection.execute(insert_query, (prediction.user_id, prediction.purchase_probability))
                
                updated_count += 1
            
            return updated_count
            
        except Exception as e:
            self.logger.error(f"Error updating database predictions: {e}")
            return 0
    
    def _save_update_stats(self, updated_count: int, total_users: int):
        """Сохранение статистики обновления"""
        try:
            stats_data = {
                'timestamp': datetime.now().isoformat(),
                'updated_count': updated_count,
                'total_users_processed': total_users,
                'success_rate': updated_count / total_users if total_users > 0 else 0
            }
            
            # Сохраняем в файл (в продакшене лучше в БД)
            import json
            with open(f"logs/prediction_update_stats_{datetime.now().strftime('%Y%m%d')}.json", "a") as f:
                f.write(json.dumps(stats_data) + "\n")
            
            self.logger.info(f"Update stats saved: {stats_data}")
            
        except Exception as e:
            self.logger.error(f"Error saving update stats: {e}")
    
    def trigger_update(self):
        """Принудительное обновление прогнозов"""
        try:
            self._update_predictions()
        except Exception as e:
            self.logger.error(f"Error in manual prediction update: {e}")
    
    def update_config(self, config: Dict[str, Any]):
        """Обновление конфигурации обновления"""
        try:
            self.update_config.update(config)
            self._setup_schedule()  # Пересоздаем расписание
            self.logger.info("Prediction update configuration updated")
        except Exception as e:
            self.logger.error(f"Error updating prediction update config: {e}")
    
    def get_update_status(self) -> Dict[str, Any]:
        """Получение статуса обновления прогнозов"""
        try:
            return {
                'is_running': self.is_running,
                'next_update': str(schedule.next_run()) if schedule.jobs else None,
                'config': self.update_config,
                'model_status': {
                    'purchase_prediction_model_loaded': self.purchase_prediction_model is not None and self.purchase_prediction_model.model is not None
                }
            }
        except Exception as e:
            self.logger.error(f"Error getting prediction update status: {e}")
            return {'error': str(e)}

# Глобальный экземпляр планировщика
prediction_updater = PredictionUpdater()

def start_prediction_updater():
    """Запуск планировщика обновления прогнозов"""
    prediction_updater.start()

def stop_prediction_updater():
    """Остановка планировщика обновления прогнозов"""
    prediction_updater.stop()

def get_prediction_updater():
    """Получение экземпляра планировщика"""
    return prediction_updater
