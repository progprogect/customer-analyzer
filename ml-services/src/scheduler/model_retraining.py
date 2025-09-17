"""
Система автоматического переобучения ML-моделей
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import schedule
import time
from threading import Thread

from ..models.user_segmentation import UserSegmentationModel
from ..features.user_features import UserFeatureExtractor, features_to_dataframe, prepare_features_for_ml
from ..database.connection import get_db_connection

logger = logging.getLogger(__name__)

class ModelRetrainingScheduler:
    """Планировщик для автоматического переобучения ML-моделей"""
    
    def __init__(self):
        self.segmentation_model = None
        self.db_connection = None
        self.is_running = False
        self.retraining_thread = None
        self.logger = logging.getLogger(__name__)
        
        # Настройки переобучения
        self.retraining_config = {
            'segmentation': {
                'enabled': True,
                'schedule': 'daily',  # daily, weekly, monthly, custom
                'time': '02:00',  # Время выполнения (для daily/weekly)
                'day_of_week': 1,  # День недели (для weekly, 1=понедельник)
                'day_of_month': 1,  # День месяца (для monthly)
                'min_users_for_retraining': 100,
                'auto_optimize_params': True,
                'backup_previous_model': True
            }
        }
    
    def start(self):
        """Запуск планировщика"""
        if self.is_running:
            self.logger.warning("Scheduler is already running")
            return
        
        self.is_running = True
        self.retraining_thread = Thread(target=self._run_scheduler, daemon=True)
        self.retraining_thread.start()
        
        self.logger.info("Model retraining scheduler started")
    
    def stop(self):
        """Остановка планировщика"""
        self.is_running = False
        if self.retraining_thread:
            self.retraining_thread.join(timeout=5)
        
        self.logger.info("Model retraining scheduler stopped")
    
    def _run_scheduler(self):
        """Основной цикл планировщика"""
        # Настраиваем расписание
        self._setup_schedule()
        
        while self.is_running:
            try:
                schedule.run_pending()
                time.sleep(60)  # Проверяем каждую минуту
            except Exception as e:
                self.logger.error(f"Error in scheduler loop: {e}")
                time.sleep(60)
    
    def _setup_schedule(self):
        """Настройка расписания задач"""
        # Очищаем существующие задачи
        schedule.clear()
        
        # Настраиваем переобучение модели сегментации
        if self.retraining_config['segmentation']['enabled']:
            schedule_type = self.retraining_config['segmentation']['schedule']
            
            if schedule_type == 'daily':
                schedule.every().day.at(
                    self.retraining_config['segmentation']['time']
                ).do(self._retrain_segmentation_model)
                
            elif schedule_type == 'weekly':
                day_of_week = self.retraining_config['segmentation']['day_of_week']
                schedule.every().week.at(
                    self.retraining_config['segmentation']['time']
                ).do(self._retrain_segmentation_model)
                
            elif schedule_type == 'monthly':
                day_of_month = self.retraining_config['segmentation']['day_of_month']
                schedule.every().month.do(self._retrain_segmentation_model)
                
            elif schedule_type == 'custom':
                # Для custom расписания можно добавить более сложную логику
                schedule.every().day.at("02:00").do(self._retrain_segmentation_model)
        
        self.logger.info(f"Schedule configured: {schedule.jobs}")
    
    def _retrain_segmentation_model(self):
        """Переобучение модели сегментации"""
        try:
            self.logger.info("Starting segmentation model retraining")
            
            # Получаем соединение с БД
            db_connection = get_db_connection()
            
            # Проверяем количество пользователей
            feature_extractor = UserFeatureExtractor(db_connection)
            features_list = feature_extractor.extract_all_users_features()
            
            min_users = self.retraining_config['segmentation']['min_users_for_retraining']
            if len(features_list) < min_users:
                self.logger.warning(
                    f"Not enough users for retraining. Required: {min_users}, Available: {len(features_list)}"
                )
                return
            
            # Создаем резервную копию текущей модели
            if self.retraining_config['segmentation']['backup_previous_model']:
                self._backup_current_model()
            
            # Инициализируем модель
            if self.segmentation_model is None:
                self.segmentation_model = UserSegmentationModel()
            
            # Конвертируем в DataFrame
            features_df = features_to_dataframe(features_list)
            ml_features_df = prepare_features_for_ml(features_df)
            
            # Оптимизируем параметры, если включено
            if self.retraining_config['segmentation']['auto_optimize_params']:
                optimization_result = self.segmentation_model.optimize_parameters(ml_features_df)
                best_params = optimization_result['best_params']
                
                # Обучаем с оптимальными параметрами
                result = self.segmentation_model.train(
                    features_df=ml_features_df,
                    n_clusters=best_params['n_clusters'],
                    algorithm=best_params['algorithm'],
                    use_pca=True
                )
            else:
                # Обучаем с параметрами по умолчанию
                result = self.segmentation_model.train(
                    features_df=ml_features_df,
                    n_clusters=5,
                    algorithm='kmeans',
                    use_pca=True
                )
            
            # Логируем результат
            self.logger.info(f"Segmentation model retrained successfully")
            self.logger.info(f"Model metrics: {result.model_metrics}")
            self.logger.info(f"Created {len(result.segments)} segments")
            
            # Сохраняем метрики в БД или файл для мониторинга
            self._save_retraining_metrics(result)
            
        except Exception as e:
            self.logger.error(f"Error retraining segmentation model: {e}")
            # В случае ошибки можно восстановить предыдущую модель
            self._restore_backup_model()
    
    def _backup_current_model(self):
        """Создание резервной копии текущей модели"""
        try:
            if self.segmentation_model and self.segmentation_model.model:
                backup_path = f"models/backup/user_segmentation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pkl"
                self.segmentation_model.model_path = backup_path
                self.segmentation_model.save_model()
                self.logger.info(f"Model backup created: {backup_path}")
        except Exception as e:
            self.logger.error(f"Error creating model backup: {e}")
    
    def _restore_backup_model(self):
        """Восстановление резервной копии модели"""
        try:
            # Здесь можно реализовать логику восстановления последней резервной копии
            self.logger.info("Restoring backup model...")
            # Пока что просто логируем
        except Exception as e:
            self.logger.error(f"Error restoring backup model: {e}")
    
    def _save_retraining_metrics(self, result):
        """Сохранение метрик переобучения"""
        try:
            metrics_data = {
                'timestamp': datetime.now().isoformat(),
                'model_version': result.model_version,
                'segments_count': len(result.segments),
                'silhouette_score': result.model_metrics.get('silhouette_score', 0),
                'calinski_harabasz_score': result.model_metrics.get('calinski_harabasz_score', 0),
                'n_clusters': result.model_metrics.get('n_clusters', 0)
            }
            
            # Сохраняем в файл (в продакшене лучше в БД)
            import json
            with open(f"logs/retraining_metrics_{datetime.now().strftime('%Y%m%d')}.json", "a") as f:
                f.write(json.dumps(metrics_data) + "\n")
            
            self.logger.info(f"Retraining metrics saved: {metrics_data}")
            
        except Exception as e:
            self.logger.error(f"Error saving retraining metrics: {e}")
    
    def trigger_retraining(self, model_type: str = 'segmentation'):
        """Принудительное переобучение модели"""
        try:
            if model_type == 'segmentation':
                self._retrain_segmentation_model()
            else:
                self.logger.warning(f"Unknown model type: {model_type}")
        except Exception as e:
            self.logger.error(f"Error in manual retraining: {e}")
    
    def update_retraining_config(self, config: Dict[str, Any]):
        """Обновление конфигурации переобучения"""
        try:
            self.retraining_config.update(config)
            self._setup_schedule()  # Пересоздаем расписание
            self.logger.info("Retraining configuration updated")
        except Exception as e:
            self.logger.error(f"Error updating retraining config: {e}")
    
    def get_retraining_status(self) -> Dict[str, Any]:
        """Получение статуса переобучения"""
        try:
            return {
                'is_running': self.is_running,
                'next_retraining': str(schedule.next_run()) if schedule.jobs else None,
                'config': self.retraining_config,
                'model_status': {
                    'segmentation_model_loaded': self.segmentation_model is not None and self.segmentation_model.model is not None
                }
            }
        except Exception as e:
            self.logger.error(f"Error getting retraining status: {e}")
            return {'error': str(e)}

# Глобальный экземпляр планировщика
retraining_scheduler = ModelRetrainingScheduler()

def start_retraining_scheduler():
    """Запуск планировщика переобучения"""
    retraining_scheduler.start()

def stop_retraining_scheduler():
    """Остановка планировщика переобучения"""
    retraining_scheduler.stop()

def get_retraining_scheduler():
    """Получение экземпляра планировщика"""
    return retraining_scheduler
