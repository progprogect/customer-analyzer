"""
Тесты для модели сегментации пользователей
"""

import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from ..models.user_segmentation import UserSegmentationModel, UserSegment, SegmentationResult
from ..features.user_features import UserFeatures, UserFeatureExtractor, features_to_dataframe, prepare_features_for_ml

class TestUserFeatures:
    """Тесты для класса UserFeatures"""
    
    def test_user_features_creation(self):
        """Тест создания объекта UserFeatures"""
        features = UserFeatures(
            user_id=1,
            telegram_id=123456789,
            days_since_registration=30,
            has_username=True,
            has_last_name=False,
            language_code='ru',
            total_events=25,
            unique_days_active=15,
            avg_events_per_day=0.83,
            days_since_last_activity=2,
            bot_commands_count=10,
            messages_count=10,
            callback_queries_count=5,
            unique_commands_count=5,
            avg_session_duration=300.0,
            peak_hour=14,
            weekend_activity_ratio=0.3,
            purchase_count=2,
            total_spent=1000.0,
            avg_order_value=500.0,
            product_views_count=15,
            cart_additions_count=3,
            feature_extraction_date=datetime.now()
        )
        
        assert features.user_id == 1
        assert features.telegram_id == 123456789
        assert features.total_events == 25
        assert features.purchase_count == 2
        assert features.total_spent == 1000.0

class TestUserFeatureExtractor:
    """Тесты для класса UserFeatureExtractor"""
    
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
            'registration_date': datetime.now() - timedelta(days=30),
            'profile_data': {'language_code': 'ru'}
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
            }
        ]
    
    def test_extract_user_features(self, mock_db_connection, sample_user_info, sample_events):
        """Тест извлечения признаков пользователя"""
        # Настраиваем моки
        mock_db_connection.execute.side_effect = [
            [sample_user_info],  # get_user_info
            sample_events        # get_user_events
        ]
        
        extractor = UserFeatureExtractor(mock_db_connection)
        features = extractor.extract_user_features(1)
        
        assert features is not None
        assert features.user_id == 1
        assert features.telegram_id == 123456789
        assert features.total_events == 3
        assert features.bot_commands_count == 1
        assert features.messages_count == 1
        assert features.purchase_count == 1
        assert features.total_spent == 500.0
    
    def test_calculate_days_since_registration(self, mock_db_connection):
        """Тест расчета дней с регистрации"""
        extractor = UserFeatureExtractor(mock_db_connection)
        
        registration_date = datetime.now() - timedelta(days=30)
        days = extractor._calculate_days_since_registration(registration_date)
        
        assert days == 30
    
    def test_calculate_unique_days_active(self, mock_db_connection):
        """Тест расчета уникальных дней активности"""
        extractor = UserFeatureExtractor(mock_db_connection)
        
        events = [
            {'event_timestamp': datetime(2023, 1, 1, 10, 0)},
            {'event_timestamp': datetime(2023, 1, 1, 15, 0)},
            {'event_timestamp': datetime(2023, 1, 2, 10, 0)}
        ]
        
        unique_days = extractor._calculate_unique_days_active(events)
        assert unique_days == 2
    
    def test_calculate_avg_events_per_day(self, mock_db_connection):
        """Тест расчета среднего количества событий в день"""
        extractor = UserFeatureExtractor(mock_db_connection)
        
        events = [{'event_timestamp': datetime.now()}] * 30
        registration_date = datetime.now() - timedelta(days=30)
        
        avg_events = extractor._calculate_avg_events_per_day(events, registration_date)
        assert avg_events == 1.0
    
    def test_count_event_type(self, mock_db_connection):
        """Тест подсчета событий определенного типа"""
        extractor = UserFeatureExtractor(mock_db_connection)
        
        events = [
            {'event_type': 'bot_command'},
            {'event_type': 'message'},
            {'event_type': 'bot_command'}
        ]
        
        count = extractor._count_event_type(events, 'bot_command')
        assert count == 2

class TestUserSegmentationModel:
    """Тесты для модели сегментации пользователей"""
    
    @pytest.fixture
    def sample_features_df(self):
        """Пример DataFrame с признаками пользователей"""
        data = []
        for i in range(100):
            data.append({
                'user_id': i,
                'telegram_id': 123456789 + i,
                'days_since_registration': np.random.randint(1, 365),
                'has_username': np.random.choice([0, 1]),
                'has_last_name': np.random.choice([0, 1]),
                'total_events': np.random.randint(0, 100),
                'unique_days_active': np.random.randint(0, 30),
                'avg_events_per_day': np.random.uniform(0, 5),
                'days_since_last_activity': np.random.randint(0, 30),
                'bot_commands_count': np.random.randint(0, 20),
                'messages_count': np.random.randint(0, 50),
                'callback_queries_count': np.random.randint(0, 10),
                'unique_commands_count': np.random.randint(0, 10),
                'avg_session_duration': np.random.uniform(0, 1000),
                'peak_hour': np.random.randint(0, 24),
                'weekend_activity_ratio': np.random.uniform(0, 1),
                'purchase_count': np.random.randint(0, 5),
                'total_spent': np.random.uniform(0, 10000),
                'avg_order_value': np.random.uniform(0, 2000),
                'product_views_count': np.random.randint(0, 50),
                'cart_additions_count': np.random.randint(0, 10),
                'feature_extraction_date': datetime.now()
            })
        
        return pd.DataFrame(data)
    
    def test_model_initialization(self):
        """Тест инициализации модели"""
        model = UserSegmentationModel()
        
        assert model.model is None
        assert model.scaler is None
        assert model.pca is None
        assert len(model.segment_names) == 5
    
    def test_train_model(self, sample_features_df):
        """Тест обучения модели"""
        model = UserSegmentationModel()
        
        # Подготавливаем признаки
        ml_features_df = prepare_features_for_ml(sample_features_df)
        
        # Обучаем модель
        result = model.train(ml_features_df, n_clusters=3, algorithm='kmeans')
        
        assert isinstance(result, SegmentationResult)
        assert len(result.segments) <= 3  # Может быть меньше из-за пустых кластеров
        assert len(result.user_segments) == 100
        assert 'silhouette_score' in result.model_metrics
        assert model.model is not None
        assert model.scaler is not None
    
    def test_predict_segments(self, sample_features_df):
        """Тест предсказания сегментов"""
        model = UserSegmentationModel()
        
        # Обучаем модель
        ml_features_df = prepare_features_for_ml(sample_features_df)
        model.train(ml_features_df, n_clusters=3)
        
        # Предсказываем сегменты
        predictions = model.predict(ml_features_df)
        
        assert len(predictions) == 100
        assert all(isinstance(segment_id, (int, np.integer)) for segment_id in predictions.values())
        assert all(segment_id >= 0 for segment_id in predictions.values())
    
    def test_get_user_segment(self, sample_features_df):
        """Тест получения сегмента для конкретного пользователя"""
        model = UserSegmentationModel()
        
        # Обучаем модель
        ml_features_df = prepare_features_for_ml(sample_features_df)
        model.train(ml_features_df, n_clusters=3)
        
        # Получаем сегмент для первого пользователя
        user_features = sample_features_df.iloc[0].to_dict()
        user_id = user_features['user_id']
        
        segment_id, segment_name = model.get_user_segment(user_id, user_features)
        
        assert isinstance(segment_id, (int, np.integer))
        assert isinstance(segment_name, str)
        assert segment_id >= 0
    
    def test_create_segments(self, sample_features_df):
        """Тест создания описаний сегментов"""
        model = UserSegmentationModel()
        
        # Обучаем модель
        ml_features_df = prepare_features_for_ml(sample_features_df)
        result = model.train(ml_features_df, n_clusters=3)
        
        segments = result.segments
        
        assert len(segments) <= 3
        for segment in segments:
            assert isinstance(segment, UserSegment)
            assert segment.segment_id >= 0
            assert segment.size > 0
            assert segment.percentage > 0
            assert isinstance(segment.characteristics, dict)
    
    def test_calculate_metrics(self, sample_features_df):
        """Тест расчета метрик модели"""
        model = UserSegmentationModel()
        
        # Обучаем модель
        ml_features_df = prepare_features_for_ml(sample_features_df)
        result = model.train(ml_features_df, n_clusters=3)
        
        metrics = result.model_metrics
        
        assert 'silhouette_score' in metrics
        assert 'calinski_harabasz_score' in metrics
        assert 'n_clusters' in metrics
        assert isinstance(metrics['silhouette_score'], float)
        assert isinstance(metrics['calinski_harabasz_score'], float)
    
    def test_optimize_parameters(self, sample_features_df):
        """Тест оптимизации параметров модели"""
        model = UserSegmentationModel()
        
        # Подготавливаем признаки
        ml_features_df = prepare_features_for_ml(sample_features_df)
        
        # Оптимизируем параметры
        optimization_result = model.optimize_parameters(ml_features_df)
        
        assert 'best_params' in optimization_result
        assert 'best_score' in optimization_result
        assert 'best_model' in optimization_result
        assert optimization_result['best_score'] > 0
    
    def test_save_load_model(self, sample_features_df, tmp_path):
        """Тест сохранения и загрузки модели"""
        model = UserSegmentationModel(model_path=str(tmp_path / "test_model.pkl"))
        
        # Обучаем модель
        ml_features_df = prepare_features_for_ml(sample_features_df)
        model.train(ml_features_df, n_clusters=3)
        
        # Сохраняем модель
        model.save_model()
        
        # Создаем новую модель и загружаем
        new_model = UserSegmentationModel(model_path=str(tmp_path / "test_model.pkl"))
        new_model.load_model()
        
        assert new_model.model is not None
        assert new_model.scaler is not None

class TestFeatureProcessing:
    """Тесты для обработки признаков"""
    
    def test_features_to_dataframe(self):
        """Тест конвертации признаков в DataFrame"""
        features_list = [
            UserFeatures(
                user_id=1,
                telegram_id=123456789,
                days_since_registration=30,
                has_username=True,
                has_last_name=False,
                language_code='ru',
                total_events=25,
                unique_days_active=15,
                avg_events_per_day=0.83,
                days_since_last_activity=2,
                bot_commands_count=10,
                messages_count=10,
                callback_queries_count=5,
                unique_commands_count=5,
                avg_session_duration=300.0,
                peak_hour=14,
                weekend_activity_ratio=0.3,
                purchase_count=2,
                total_spent=1000.0,
                avg_order_value=500.0,
                product_views_count=15,
                cart_additions_count=3,
                feature_extraction_date=datetime.now()
            )
        ]
        
        df = features_to_dataframe(features_list)
        
        assert len(df) == 1
        assert df.iloc[0]['user_id'] == 1
        assert df.iloc[0]['total_events'] == 25
        assert df.iloc[0]['purchase_count'] == 2
    
    def test_prepare_features_for_ml(self):
        """Тест подготовки признаков для ML"""
        # Создаем DataFrame с различными типами данных
        data = {
            'user_id': [1, 2, 3],
            'telegram_id': [123456789, 987654321, 555666777],
            'days_since_registration': [30, 60, 90],
            'has_username': [True, False, True],
            'has_last_name': [False, True, True],
            'language_code': ['ru', 'en', 'ru'],
            'total_events': [25, 50, 100],
            'unique_days_active': [15, 30, 45],
            'avg_events_per_day': [0.83, 1.67, 3.33],
            'days_since_last_activity': [2, 5, 10],
            'bot_commands_count': [10, 20, 30],
            'messages_count': [10, 20, 40],
            'callback_queries_count': [5, 10, 15],
            'unique_commands_count': [5, 8, 12],
            'avg_session_duration': [300.0, 600.0, 900.0],
            'peak_hour': [14, 16, 18],
            'weekend_activity_ratio': [0.3, 0.5, 0.7],
            'purchase_count': [2, 4, 6],
            'total_spent': [1000.0, 2000.0, 3000.0],
            'avg_order_value': [500.0, 500.0, 500.0],
            'product_views_count': [15, 30, 60],
            'cart_additions_count': [3, 6, 9],
            'feature_extraction_date': [datetime.now()] * 3
        }
        
        df = pd.DataFrame(data)
        ml_df = prepare_features_for_ml(df)
        
        # Проверяем, что категориальные признаки преобразованы
        assert 'has_username' in ml_df.columns
        assert 'has_last_name' in ml_df.columns
        assert ml_df['has_username'].dtype == 'int64'
        assert ml_df['has_last_name'].dtype == 'int64'
        
        # Проверяем, что language_code преобразован в dummy переменные
        lang_columns = [col for col in ml_df.columns if col.startswith('lang_')]
        assert len(lang_columns) > 0
        
        # Проверяем, что language_code удален
        assert 'language_code' not in ml_df.columns
        
        # Проверяем, что числовые признаки остались
        assert 'total_events' in ml_df.columns
        assert 'purchase_count' in ml_df.columns

if __name__ == "__main__":
    pytest.main([__file__])
