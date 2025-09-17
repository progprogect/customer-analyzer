"""
Тесты для модуля сегментации пользователей
"""

import pytest
import numpy as np
import pandas as pd
from unittest.mock import Mock, patch, MagicMock
from sklearn.cluster import KMeans
from sklearn.datasets import make_blobs

from src.models.user_segmentation import UserSegmentationModel
from src.features.user_features import UserFeatureExtractor


class TestUserFeatureExtractor:
    """Тесты для извлечения признаков пользователей"""
    
    @pytest.fixture
    def sample_user_data(self):
        """Фикстура с тестовыми данными пользователей"""
        return pd.DataFrame({
            'user_id': [1, 2, 3, 4, 5],
            'telegram_id': [111, 222, 333, 444, 555],
            'first_name': ['John', 'Jane', 'Bob', 'Alice', 'Charlie'],
            'registration_date': [
                '2023-01-01', '2023-01-15', '2023-02-01', 
                '2023-02-15', '2023-03-01'
            ],
            'profile_data': [
                {'age': 25, 'city': 'Moscow'},
                {'age': 30, 'city': 'SPB'},
                {'age': 22, 'city': 'Moscow'},
                {'age': 35, 'city': 'Kazan'},
                {'age': 28, 'city': 'Moscow'}
            ]
        })
    
    @pytest.fixture
    def sample_event_data(self):
        """Фикстура с тестовыми данными событий"""
        return pd.DataFrame({
            'user_id': [1, 1, 2, 2, 3, 4, 5] * 10,
            'event_type': ['view', 'purchase', 'view', 'add_to_cart', 'view', 'view', 'purchase'] * 10,
            'event_timestamp': pd.date_range('2023-01-01', periods=70, freq='D'),
            'product_id': [100, 101, 102, 103, 104, 105, 106] * 10
        })
    
    def test_extract_user_features_basic(self, sample_user_data, sample_event_data):
        """Тест извлечения базовых признаков пользователей"""
        extractor = UserFeatureExtractor()
        
        with patch('src.features.user_features.get_user_data') as mock_user_data, \
             patch('src.features.user_features.get_event_data') as mock_event_data:
            
            mock_user_data.return_value = sample_user_data
            mock_event_data.return_value = sample_event_data
            
            features = extractor.extract_features(user_ids=[1, 2, 3, 4, 5])
            
            assert isinstance(features, pd.DataFrame)
            assert len(features) == 5
            assert 'user_id' in features.columns
            assert 'total_events' in features.columns
            assert 'event_frequency' in features.columns
            assert 'days_since_registration' in features.columns
    
    def test_extract_user_features_activity_patterns(self, sample_event_data):
        """Тест извлечения паттернов активности"""
        extractor = UserFeatureExtractor()
        
        with patch('src.features.user_features.get_event_data') as mock_event_data:
            mock_event_data.return_value = sample_event_data
            
            features = extractor.extract_activity_patterns([1, 2, 3])
            
            assert isinstance(features, pd.DataFrame)
            assert 'user_id' in features.columns
            assert 'avg_events_per_day' in features.columns
            assert 'activity_consistency' in features.columns
    
    def test_extract_user_features_temporal_patterns(self, sample_event_data):
        """Тест извлечения временных паттернов"""
        extractor = UserFeatureExtractor()
        
        with patch('src.features.user_features.get_event_data') as mock_event_data:
            mock_event_data.return_value = sample_event_data
            
            features = extractor.extract_temporal_patterns([1, 2, 3])
            
            assert isinstance(features, pd.DataFrame)
            assert 'user_id' in features.columns
            assert 'preferred_hour' in features.columns
            assert 'preferred_day_of_week' in features.columns
    
    def test_extract_user_features_behavioral_patterns(self, sample_event_data):
        """Тест извлечения поведенческих паттернов"""
        extractor = UserFeatureExtractor()
        
        with patch('src.features.user_features.get_event_data') as mock_event_data:
            mock_event_data.return_value = sample_event_data
            
            features = extractor.extract_behavioral_patterns([1, 2, 3])
            
            assert isinstance(features, pd.DataFrame)
            assert 'user_id' in features.columns
            assert 'purchase_rate' in features.columns
            assert 'cart_abandonment_rate' in features.columns


class TestUserSegmentationModel:
    """Тесты для модели сегментации пользователей"""
    
    @pytest.fixture
    def sample_features(self):
        """Фикстура с тестовыми признаками"""
        np.random.seed(42)
        X, _ = make_blobs(n_samples=100, centers=4, n_features=10, random_state=42)
        
        features_df = pd.DataFrame(X, columns=[f'feature_{i}' for i in range(10)])
        features_df['user_id'] = range(1, 101)
        
        return features_df
    
    def test_kmeans_segmentation(self, sample_features):
        """Тест кластеризации K-means"""
        model = UserSegmentationModel()
        
        features = sample_features.drop('user_id', axis=1).values
        
        segments = model.kmeans_clustering(features, n_clusters=4)
        
        assert isinstance(segments, np.ndarray)
        assert len(segments) == len(features)
        assert len(np.unique(segments)) <= 4
        assert all(0 <= segment < 4 for segment in segments)
    
    def test_dbscan_segmentation(self, sample_features):
        """Тест кластеризации DBSCAN"""
        model = UserSegmentationModel()
        
        features = sample_features.drop('user_id', axis=1).values
        
        segments = model.dbscan_clustering(features, eps=0.5, min_samples=5)
        
        assert isinstance(segments, np.ndarray)
        assert len(segments) == len(features)
        # DBSCAN может помечать точки как шум (-1)
        assert all(segment >= -1 for segment in segments)
    
    def test_agglomerative_segmentation(self, sample_features):
        """Тест иерархической кластеризации"""
        model = UserSegmentationModel()
        
        features = sample_features.drop('user_id', axis=1).values
        
        segments = model.agglomerative_clustering(features, n_clusters=4)
        
        assert isinstance(segments, np.ndarray)
        assert len(segments) == len(features)
        assert len(np.unique(segments)) <= 4
        assert all(0 <= segment < 4 for segment in segments)
    
    def test_evaluate_clustering_quality(self, sample_features):
        """Тест оценки качества кластеризации"""
        model = UserSegmentationModel()
        
        features = sample_features.drop('user_id', axis=1).values
        segments = model.kmeans_clustering(features, n_clusters=4)
        
        metrics = model.evaluate_clustering_quality(features, segments)
        
        assert isinstance(metrics, dict)
        assert 'silhouette_score' in metrics
        assert 'inertia' in metrics
        assert 'calinski_harabasz_score' in metrics
        assert 'davies_bouldin_score' in metrics
        
        # Проверяем, что метрики в разумных пределах
        assert 0 <= metrics['silhouette_score'] <= 1
        assert metrics['inertia'] >= 0
    
    def test_get_segment_characteristics(self, sample_features):
        """Тест получения характеристик сегментов"""
        model = UserSegmentationModel()
        
        features = sample_features.drop('user_id', axis=1)
        segments = model.kmeans_clustering(features.values, n_clusters=4)
        
        characteristics = model.get_segment_characteristics(features, segments)
        
        assert isinstance(characteristics, dict)
        assert len(characteristics) == len(np.unique(segments))
        
        for segment_id, char in characteristics.items():
            assert isinstance(char, dict)
            assert 'size' in char
            assert 'avg_features' in char
            assert 'feature_importance' in char
    
    def test_find_optimal_clusters(self, sample_features):
        """Тест поиска оптимального количества кластеров"""
        model = UserSegmentationModel()
        
        features = sample_features.drop('user_id', axis=1).values
        
        optimal_k = model.find_optimal_clusters(features, max_k=10)
        
        assert isinstance(optimal_k, int)
        assert 2 <= optimal_k <= 10
    
    @patch('src.models.user_segmentation.get_user_features')
    def test_train_model(self, mock_get_features, sample_features):
        """Тест обучения модели"""
        model = UserSegmentationModel()
        mock_get_features.return_value = sample_features
        
        result = model.train(algorithm='kmeans', n_clusters=4)
        
        assert result['success'] is True
        assert 'model' in result
        assert 'segments' in result
        assert 'metrics' in result
        assert 'feature_importance' in result
    
    @patch('src.models.user_segmentation.get_user_features')
    def test_predict_segments(self, mock_get_features, sample_features):
        """Тест предсказания сегментов"""
        model = UserSegmentationModel()
        mock_get_features.return_value = sample_features
        
        # Сначала обучаем модель
        train_result = model.train(algorithm='kmeans', n_clusters=4)
        
        # Затем предсказываем сегменты
        user_ids = [1, 2, 3, 4, 5]
        mock_get_features.return_value = sample_features.head(5)
        
        predictions = model.predict(user_ids)
        
        assert isinstance(predictions, dict)
        assert len(predictions) == len(user_ids)
        
        for user_id in user_ids:
            assert user_id in predictions
            assert isinstance(predictions[user_id], int)
            assert 0 <= predictions[user_id] < 4
    
    def test_save_and_load_model(self, tmp_path):
        """Тест сохранения и загрузки модели"""
        model = UserSegmentationModel()
        
        # Создаем тестовую модель
        test_model = KMeans(n_clusters=4, random_state=42)
        test_features = np.random.rand(100, 10)
        test_model.fit(test_features)
        
        model_path = tmp_path / "test_model.pkl"
        
        # Сохраняем модель
        model.save_model(test_model, model_path)
        assert model_path.exists()
        
        # Загружаем модель
        loaded_model = model.load_model(model_path)
        assert isinstance(loaded_model, KMeans)
        assert loaded_model.n_clusters == 4
    
    def test_model_validation(self):
        """Тест валидации модели"""
        model = UserSegmentationModel()
        
        # Тест с невалидными параметрами
        with pytest.raises(ValueError):
            model.kmeans_clustering(np.random.rand(10, 5), n_clusters=0)
        
        with pytest.raises(ValueError):
            model.dbscan_clustering(np.random.rand(10, 5), eps=-1)
        
        with pytest.raises(ValueError):
            model.agglomerative_clustering(np.random.rand(10, 5), n_clusters=1)


class TestSegmentationIntegration:
    """Интеграционные тесты для сегментации"""
    
    @pytest.fixture
    def mock_database_data(self):
        """Фикстура с данными из базы"""
        users_df = pd.DataFrame({
            'user_id': range(1, 101),
            'telegram_id': range(1000000000, 1000000100),
            'first_name': [f'User{i}' for i in range(1, 101)],
            'registration_date': pd.date_range('2023-01-01', periods=100, freq='D')
        })
        
        events_df = pd.DataFrame({
            'user_id': np.random.randint(1, 101, 1000),
            'event_type': np.random.choice(['view', 'purchase', 'add_to_cart'], 1000),
            'event_timestamp': pd.date_range('2023-01-01', periods=1000, freq='H'),
            'product_id': np.random.randint(1, 50, 1000)
        })
        
        return users_df, events_df
    
    @patch('src.features.user_features.get_user_data')
    @patch('src.features.user_features.get_event_data')
    def test_end_to_end_segmentation(self, mock_events, mock_users, mock_database_data):
        """Тест полного процесса сегментации"""
        users_df, events_df = mock_database_data
        mock_users.return_value = users_df
        mock_events.return_value = events_df
        
        # Извлекаем признаки
        extractor = UserFeatureExtractor()
        features = extractor.extract_features(user_ids=users_df['user_id'].tolist())
        
        # Обучаем модель
        model = UserSegmentationModel()
        result = model.train(
            features=features,
            algorithm='kmeans',
            n_clusters=4
        )
        
        assert result['success'] is True
        assert 'model' in result
        assert 'segments' in result
        assert 'metrics' in result
        
        # Проверяем качество сегментации
        assert result['metrics']['silhouette_score'] > 0.3
        
        # Предсказываем сегменты для новых пользователей
        new_user_ids = [1, 2, 3, 4, 5]
        predictions = model.predict(new_user_ids)
        
        assert len(predictions) == len(new_user_ids)
        assert all(isinstance(seg, int) for seg in predictions.values())
