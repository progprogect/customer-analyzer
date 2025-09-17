"""
Тесты для модели предсказания покупок
"""

import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from ..models.purchase_prediction import PurchasePredictionModel, PurchasePredictionResult, ModelEvaluationMetrics
from ..features.purchase_features import PurchasePredictionFeatures, PurchaseFeatureExtractor, purchase_features_to_dataframe, prepare_purchase_features_for_ml

class TestPurchasePredictionFeatures:
    """Тесты для класса PurchasePredictionFeatures"""
    
    def test_purchase_features_creation(self):
        """Тест создания объекта PurchasePredictionFeatures"""
        features = PurchasePredictionFeatures(
            user_id=1,
            telegram_id=123456789,
            days_since_registration=30,
            total_events=25,
            unique_days_active=15,
            events_last_7_days=5,
            events_last_14_days=10,
            events_last_30_days=25,
            unique_days_active_last_7_days=3,
            unique_days_active_last_14_days=7,
            unique_days_active_last_30_days=15,
            bot_commands_last_7_days=2,
            bot_commands_last_14_days=5,
            bot_commands_last_30_days=10,
            messages_last_7_days=2,
            messages_last_14_days=4,
            messages_last_30_days=8,
            callback_queries_last_7_days=1,
            callback_queries_last_14_days=2,
            callback_queries_last_30_days=5,
            product_views_last_7_days=3,
            product_views_last_14_days=6,
            product_views_last_30_days=12,
            cart_additions_last_7_days=1,
            cart_additions_last_14_days=2,
            cart_additions_last_30_days=3,
            total_purchases=2,
            purchases_last_7_days=0,
            purchases_last_14_days=1,
            purchases_last_30_days=2,
            purchases_last_60_days=2,
            purchases_last_90_days=2,
            total_spent=1000.0,
            avg_order_value=500.0,
            days_since_last_purchase=5,
            avg_session_duration_last_7_days=300.0,
            avg_session_duration_last_14_days=350.0,
            peak_hour=14,
            weekend_activity_ratio_last_7_days=0.3,
            weekend_activity_ratio_last_14_days=0.4,
            activity_trend_7d_vs_14d=0.5,
            activity_trend_14d_vs_30d=0.4,
            purchase_trend_30d_vs_60d=1.0,
            is_weekend=False,
            hour_of_day=10,
            day_of_week=1,
            month=1,
            feature_extraction_date=datetime.now()
        )
        
        assert features.user_id == 1
        assert features.telegram_id == 123456789
        assert features.total_events == 25
        assert features.total_purchases == 2
        assert features.total_spent == 1000.0

class TestPurchaseFeatureExtractor:
    """Тесты для класса PurchaseFeatureExtractor"""
    
    @pytest.fixture
    def mock_db_connection(self):
        """Мок для соединения с БД"""
        mock_conn = Mock()
        return mock_conn
    
    @pytest.fixture
    def sample_user_info(self):
        """Пример информации о пользователе"""
        return {
            'user_id': 1,
            'telegram_id': 123456789,
            'first_name': 'Test',
            'last_name': 'User',
            'username': 'testuser',
            'registration_date': datetime.now() - timedelta(days=30)
        }
    
    @pytest.fixture
    def sample_events(self):
        """Пример событий пользователя"""
        base_time = datetime.now() - timedelta(days=1)
        return [
            {
                'event_id': 1,
                'event_type': 'bot_command',
                'event_timestamp': base_time,
                'properties': '{"command": "/start", "text": "/start"}'
            },
            {
                'event_id': 2,
                'event_type': 'message',
                'event_timestamp': base_time + timedelta(minutes=5),
                'properties': '{"text": "Hello"}'
            },
            {
                'event_id': 3,
                'event_type': 'purchase',
                'event_timestamp': base_time + timedelta(minutes=10),
                'properties': '{"amount": 500}'
            },
            {
                'event_id': 4,
                'event_type': 'view',
                'event_timestamp': base_time + timedelta(minutes=15),
                'properties': '{"product_id": 123}'
            }
        ]
    
    def test_extract_user_purchase_features(self, mock_db_connection, sample_user_info, sample_events):
        """Тест извлечения признаков предсказания покупок"""
        # Настраиваем моки
        mock_db_connection.execute.side_effect = [
            [sample_user_info],  # get_user_info
            sample_events        # get_user_events
        ]
        
        extractor = PurchaseFeatureExtractor(mock_db_connection)
        features = extractor.extract_user_purchase_features(1)
        
        assert features is not None
        assert features.user_id == 1
        assert features.telegram_id == 123456789
        assert features.total_events == 4
        assert features.purchases_last_7_days == 1
        assert features.total_spent == 500.0
    
    def test_count_events_in_window(self, mock_db_connection):
        """Тест подсчета событий в временном окне"""
        extractor = PurchaseFeatureExtractor(mock_db_connection)
        
        events = [
            {'event_timestamp': datetime.now() - timedelta(days=5)},
            {'event_timestamp': datetime.now() - timedelta(days=10)},
            {'event_timestamp': datetime.now() - timedelta(days=15)}
        ]
        
        prediction_date = datetime.now()
        count_7d = extractor._count_events_in_window(events, prediction_date, 7)
        count_14d = extractor._count_events_in_window(events, prediction_date, 14)
        
        assert count_7d == 1
        assert count_14d == 2
    
    def test_count_events_by_type_in_window(self, mock_db_connection):
        """Тест подсчета событий определенного типа в временном окне"""
        extractor = PurchaseFeatureExtractor(mock_db_connection)
        
        events = [
            {
                'event_type': 'purchase',
                'event_timestamp': datetime.now() - timedelta(days=5)
            },
            {
                'event_type': 'view',
                'event_timestamp': datetime.now() - timedelta(days=10)
            },
            {
                'event_type': 'purchase',
                'event_timestamp': datetime.now() - timedelta(days=15)
            }
        ]
        
        prediction_date = datetime.now()
        count_7d = extractor._count_events_by_type_in_window(events, 'purchase', prediction_date, 7)
        count_14d = extractor._count_events_by_type_in_window(events, 'purchase', prediction_date, 14)
        
        assert count_7d == 1
        assert count_14d == 1
    
    def test_calculate_activity_trend(self, mock_db_connection):
        """Тест расчета тренда активности"""
        extractor = PurchaseFeatureExtractor(mock_db_connection)
        
        events = [
            {'event_timestamp': datetime.now() - timedelta(days=5)},
            {'event_timestamp': datetime.now() - timedelta(days=10)},
            {'event_timestamp': datetime.now() - timedelta(days=15)},
            {'event_timestamp': datetime.now() - timedelta(days=20)}
        ]
        
        prediction_date = datetime.now()
        trend = extractor._calculate_activity_trend(events, prediction_date, 7, 14)
        
        assert trend == 1.0  # 1 событие за 7 дней / 2 события за 14 дней = 0.5

class TestPurchasePredictionModel:
    """Тесты для модели предсказания покупок"""
    
    @pytest.fixture
    def sample_training_data(self):
        """Пример данных для обучения"""
        np.random.seed(42)
        data = []
        
        for i in range(200):
            # Создаем пользователей с разными характеристиками
            if i < 100:  # Первая половина - покупатели
                will_purchase = True
                events_last_7d = np.random.randint(5, 20)
                purchases_last_30d = np.random.randint(1, 5)
            else:  # Вторая половина - не покупатели
                will_purchase = False
                events_last_7d = np.random.randint(0, 5)
                purchases_last_30d = 0
            
            data.append({
                'user_id': i,
                'telegram_id': 123456789 + i,
                'days_since_registration': np.random.randint(1, 365),
                'total_events': np.random.randint(0, 100),
                'unique_days_active': np.random.randint(0, 30),
                'events_last_7_days': events_last_7d,
                'events_last_14_days': events_last_7d + np.random.randint(0, 10),
                'events_last_30_days': events_last_7d + np.random.randint(0, 20),
                'unique_days_active_last_7_days': min(events_last_7d, 7),
                'unique_days_active_last_14_days': np.random.randint(0, 14),
                'unique_days_active_last_30_days': np.random.randint(0, 30),
                'bot_commands_last_7_days': np.random.randint(0, 5),
                'bot_commands_last_14_days': np.random.randint(0, 10),
                'bot_commands_last_30_days': np.random.randint(0, 20),
                'messages_last_7_days': np.random.randint(0, 10),
                'messages_last_14_days': np.random.randint(0, 20),
                'messages_last_30_days': np.random.randint(0, 40),
                'callback_queries_last_7_days': np.random.randint(0, 5),
                'callback_queries_last_14_days': np.random.randint(0, 10),
                'callback_queries_last_30_days': np.random.randint(0, 20),
                'product_views_last_7_days': np.random.randint(0, 10),
                'product_views_last_14_days': np.random.randint(0, 20),
                'product_views_last_30_days': np.random.randint(0, 40),
                'cart_additions_last_7_days': np.random.randint(0, 3),
                'cart_additions_last_14_days': np.random.randint(0, 6),
                'cart_additions_last_30_days': np.random.randint(0, 12),
                'total_purchases': purchases_last_30d + np.random.randint(0, 5),
                'purchases_last_7_days': max(0, purchases_last_30d - np.random.randint(0, 3)),
                'purchases_last_14_days': max(0, purchases_last_30d - np.random.randint(0, 2)),
                'purchases_last_30_days': purchases_last_30d,
                'purchases_last_60_days': purchases_last_30d + np.random.randint(0, 3),
                'purchases_last_90_days': purchases_last_30d + np.random.randint(0, 5),
                'total_spent': np.random.uniform(0, 10000),
                'avg_order_value': np.random.uniform(100, 2000),
                'days_since_last_purchase': np.random.randint(0, 30),
                'avg_session_duration_last_7_days': np.random.uniform(0, 1000),
                'avg_session_duration_last_14_days': np.random.uniform(0, 1000),
                'peak_hour': np.random.randint(0, 24),
                'weekend_activity_ratio_last_7_days': np.random.uniform(0, 1),
                'weekend_activity_ratio_last_14_days': np.random.uniform(0, 1),
                'activity_trend_7d_vs_14d': np.random.uniform(0, 2),
                'activity_trend_14d_vs_30d': np.random.uniform(0, 2),
                'purchase_trend_30d_vs_60d': np.random.uniform(0, 2),
                'is_weekend': np.random.choice([True, False]),
                'hour_of_day': np.random.randint(0, 24),
                'day_of_week': np.random.randint(0, 7),
                'month': np.random.randint(1, 13),
                'feature_extraction_date': datetime.now(),
                'will_purchase_in_30d': will_purchase
            })
        
        return pd.DataFrame(data)
    
    def test_model_initialization(self):
        """Тест инициализации модели"""
        model = PurchasePredictionModel()
        
        assert model.model is None
        assert model.scaler is None
        assert model.feature_names is None
        assert model.confidence_thresholds['high'] == 0.8
    
    def test_train_model(self, sample_training_data):
        """Тест обучения модели"""
        model = PurchasePredictionModel()
        
        # Подготавливаем данные
        ml_data = prepare_purchase_features_for_ml(sample_training_data)
        
        # Обучаем модель
        metrics = model.train(ml_data, algorithm='random_forest')
        
        assert isinstance(metrics, ModelEvaluationMetrics)
        assert metrics.auc_roc > 0.5  # Должно быть лучше случайного
        assert model.model is not None
        assert model.feature_names is not None
        assert len(model.feature_names) > 0
    
    def test_predict_purchases(self, sample_training_data):
        """Тест предсказания покупок"""
        model = PurchasePredictionModel()
        
        # Обучаем модель
        ml_data = prepare_purchase_features_for_ml(sample_training_data)
        model.train(ml_data, algorithm='random_forest')
        
        # Предсказываем для части данных
        test_data = ml_data.head(10)
        predictions = model.predict(test_data)
        
        assert len(predictions) == 10
        for prediction in predictions:
            assert isinstance(prediction, PurchasePredictionResult)
            assert 0 <= prediction.purchase_probability <= 1
            assert prediction.prediction_confidence in ['low', 'medium', 'high']
            assert isinstance(prediction.key_factors, list)
    
    def test_predict_user_purchase_probability(self, sample_training_data):
        """Тест предсказания для конкретного пользователя"""
        model = PurchasePredictionModel()
        
        # Обучаем модель
        ml_data = prepare_purchase_features_for_ml(sample_training_data)
        model.train(ml_data, algorithm='random_forest')
        
        # Получаем признаки первого пользователя
        user_features = ml_data.iloc[0].to_dict()
        user_id = user_features['user_id']
        
        # Предсказываем
        result = model.predict_user_purchase_probability(user_id, user_features)
        
        assert isinstance(result, PurchasePredictionResult)
        assert result.user_id == user_id
        assert 0 <= result.purchase_probability <= 1
    
    def test_optimize_hyperparameters(self, sample_training_data):
        """Тест оптимизации гиперпараметров"""
        model = PurchasePredictionModel()
        
        # Подготавливаем данные
        ml_data = prepare_purchase_features_for_ml(sample_training_data)
        
        # Оптимизируем параметры
        optimization_result = model.optimize_hyperparameters(ml_data, 'random_forest')
        
        assert 'best_params' in optimization_result
        assert 'best_score' in optimization_result
        assert 'best_model' in optimization_result
        assert optimization_result['best_score'] > 0
    
    def test_save_load_model(self, sample_training_data, tmp_path):
        """Тест сохранения и загрузки модели"""
        model = PurchasePredictionModel(model_path=str(tmp_path / "test_model.pkl"))
        
        # Обучаем модель
        ml_data = prepare_purchase_features_for_ml(sample_training_data)
        model.train(ml_data, algorithm='random_forest')
        
        # Сохраняем модель
        model.save_model()
        
        # Создаем новую модель и загружаем
        new_model = PurchasePredictionModel(model_path=str(tmp_path / "test_model.pkl"))
        new_model.load_model()
        
        assert new_model.model is not None
        assert new_model.feature_names is not None
        assert new_model.model_version is not None
    
    def test_determine_confidence(self):
        """Тест определения уверенности предсказания"""
        model = PurchasePredictionModel()
        
        assert model._determine_confidence(0.9) == 'high'
        assert model._determine_confidence(0.7) == 'medium'
        assert model._determine_confidence(0.3) == 'low'
    
    def test_get_feature_importance(self, sample_training_data):
        """Тест получения важности признаков"""
        model = PurchasePredictionModel()
        
        # Обучаем модель
        ml_data = prepare_purchase_features_for_ml(sample_training_data)
        model.train(ml_data, algorithm='random_forest')
        
        # Получаем важность признаков
        importance = model._get_feature_importance()
        
        assert isinstance(importance, dict)
        assert len(importance) > 0
        # Проверяем, что сумма важностей близка к 1
        assert abs(sum(importance.values()) - 1.0) < 0.01

class TestFeatureProcessing:
    """Тесты для обработки признаков"""
    
    def test_purchase_features_to_dataframe(self):
        """Тест конвертации признаков в DataFrame"""
        features_list = [
            PurchasePredictionFeatures(
                user_id=1,
                telegram_id=123456789,
                days_since_registration=30,
                total_events=25,
                unique_days_active=15,
                events_last_7_days=5,
                events_last_14_days=10,
                events_last_30_days=25,
                unique_days_active_last_7_days=3,
                unique_days_active_last_14_days=7,
                unique_days_active_last_30_days=15,
                bot_commands_last_7_days=2,
                bot_commands_last_14_days=5,
                bot_commands_last_30_days=10,
                messages_last_7_days=2,
                messages_last_14_days=4,
                messages_last_30_days=8,
                callback_queries_last_7_days=1,
                callback_queries_last_14_days=2,
                callback_queries_last_30_days=5,
                product_views_last_7_days=3,
                product_views_last_14_days=6,
                product_views_last_30_days=12,
                cart_additions_last_7_days=1,
                cart_additions_last_14_days=2,
                cart_additions_last_30_days=3,
                total_purchases=2,
                purchases_last_7_days=0,
                purchases_last_14_days=1,
                purchases_last_30_days=2,
                purchases_last_60_days=2,
                purchases_last_90_days=2,
                total_spent=1000.0,
                avg_order_value=500.0,
                days_since_last_purchase=5,
                avg_session_duration_last_7_days=300.0,
                avg_session_duration_last_14_days=350.0,
                peak_hour=14,
                weekend_activity_ratio_last_7_days=0.3,
                weekend_activity_ratio_last_14_days=0.4,
                activity_trend_7d_vs_14d=0.5,
                activity_trend_14d_vs_30d=0.4,
                purchase_trend_30d_vs_60d=1.0,
                is_weekend=False,
                hour_of_day=10,
                day_of_week=1,
                month=1,
                feature_extraction_date=datetime.now()
            )
        ]
        
        df = purchase_features_to_dataframe(features_list)
        
        assert len(df) == 1
        assert df.iloc[0]['user_id'] == 1
        assert df.iloc[0]['total_events'] == 25
        assert df.iloc[0]['total_purchases'] == 2
    
    def test_prepare_purchase_features_for_ml(self):
        """Тест подготовки признаков для ML"""
        # Создаем DataFrame с различными типами данных
        data = {
            'user_id': [1, 2, 3],
            'telegram_id': [123456789, 987654321, 555666777],
            'total_events': [25, 50, 100],
            'total_purchases': [2, 4, 6],
            'total_spent': [1000.0, 2000.0, 3000.0],
            'is_weekend': [True, False, True],
            'will_purchase_in_30d': [True, False, True]
        }
        
        df = pd.DataFrame(data)
        ml_df = prepare_purchase_features_for_ml(df)
        
        # Проверяем, что булевые признаки преобразованы
        assert ml_df['is_weekend'].dtype == 'int64'
        
        # Проверяем, что числовые признаки остались
        assert 'total_events' in ml_df.columns
        assert 'total_purchases' in ml_df.columns
        
        # Проверяем логарифмическое преобразование
        assert ml_df['total_spent'].min() >= 0

if __name__ == "__main__":
    pytest.main([__file__])
