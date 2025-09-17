"""
Интеграционные тесты для API
"""

import pytest
import requests
import json
from unittest.mock import patch, MagicMock
import time

# Конфигурация для тестов
BASE_URL = "http://localhost:3001"
ML_BASE_URL = "http://localhost:8000"


class TestBackendAPI:
    """Тесты для Backend API"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Настройка для каждого теста"""
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
    
    def test_health_check(self):
        """Тест проверки здоровья сервиса"""
        response = self.session.get(f"{BASE_URL}/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'healthy'
        assert 'timestamp' in data
    
    def test_database_health_check(self):
        """Тест проверки здоровья базы данных"""
        response = self.session.get(f"{BASE_URL}/api/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert 'database' in data['data']
        assert data['data']['database']['connected'] is True
    
    def test_telegram_event_endpoint(self):
        """Тест эндпоинта для событий Telegram"""
        event_data = {
            "user_id": 123456789,
            "telegram_id": 987654321,
            "first_name": "Test",
            "last_name": "User",
            "username": "testuser",
            "event_type": "bot_command",
            "event_timestamp": "2023-01-01T12:00:00Z",
            "properties": {
                "command": "/start",
                "message_id": 1
            }
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/telegram/event",
            json=event_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
    
    def test_telegram_callback_endpoint(self):
        """Тест эндпоинта для callback запросов"""
        callback_data = {
            "user_id": 123456789,
            "telegram_id": 987654321,
            "callback_data": "recommendations_123",
            "message_id": 1,
            "timestamp": "2023-01-01T12:00:00Z"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/telegram/callback",
            json=callback_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
    
    def test_telegram_webhook_endpoints(self):
        """Тест эндпоинтов для webhook"""
        # Получение информации о webhook
        response = self.session.get(f"{BASE_URL}/api/telegram/webhook")
        assert response.status_code == 200
        
        # Установка webhook
        webhook_data = {
            "url": "https://example.com/webhook",
            "max_connections": 40
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/telegram/webhook",
            json=webhook_data
        )
        assert response.status_code == 200
        
        # Удаление webhook
        response = self.session.delete(f"{BASE_URL}/api/telegram/webhook")
        assert response.status_code == 200


class TestMLServicesAPI:
    """Тесты для ML Services API"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Настройка для каждого теста"""
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
    
    def test_ml_health_check(self):
        """Тест проверки здоровья ML сервисов"""
        response = self.session.get(f"{ML_BASE_URL}/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'healthy'
        assert 'services' in data
    
    def test_segmentation_endpoints(self):
        """Тест эндпоинтов сегментации"""
        # Получение сегментов
        response = self.session.get(f"{ML_BASE_URL}/api/segmentation/segments")
        assert response.status_code == 200
        
        # Получение метрик модели
        response = self.session.get(f"{ML_BASE_URL}/api/segmentation/metrics")
        assert response.status_code == 200
        
        # Получение важности признаков
        response = self.session.get(f"{ML_BASE_URL}/api/segmentation/feature-importance")
        assert response.status_code == 200
    
    def test_purchase_prediction_endpoints(self):
        """Тест эндпоинтов прогноза покупок"""
        # Получение прогнозов
        response = self.session.get(f"{ML_BASE_URL}/api/purchase-prediction/predictions")
        assert response.status_code == 200
        
        # Получение топ прогнозов
        response = self.session.get(f"{ML_BASE_URL}/api/purchase-prediction/top-predictions")
        assert response.status_code == 200
        
        # Получение метрик модели
        response = self.session.get(f"{ML_BASE_URL}/api/purchase-prediction/metrics")
        assert response.status_code == 200
    
    def test_churn_prediction_endpoints(self):
        """Тест эндпоинтов прогноза оттока"""
        # Получение прогнозов оттока
        response = self.session.get(f"{ML_BASE_URL}/api/churn-prediction/predictions")
        assert response.status_code == 200
        
        # Получение пользователей высокого риска
        response = self.session.get(f"{ML_BASE_URL}/api/churn-prediction/high-risk")
        assert response.status_code == 200
        
        # Получение метрик модели
        response = self.session.get(f"{ML_BASE_URL}/api/churn-prediction/metrics")
        assert response.status_code == 200
    
    def test_model_retraining_endpoints(self):
        """Тест эндпоинтов переобучения моделей"""
        # Получение статуса переобучения
        response = self.session.get(f"{ML_BASE_URL}/api/retraining/status")
        assert response.status_code == 200
        
        # Запуск переобучения всех моделей
        response = self.session.post(f"{ML_BASE_URL}/api/retraining/retrain-all")
        assert response.status_code == 200
        
        # Получение истории переобучения
        response = self.session.get(f"{ML_BASE_URL}/api/retraining/history")
        assert response.status_code == 200


class TestFrontendIntegration:
    """Интеграционные тесты для Frontend"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Настройка для каждого теста"""
        self.session = requests.Session()
    
    def test_frontend_serves_static_files(self):
        """Тест обслуживания статических файлов Frontend"""
        frontend_url = "http://localhost:3000"
        
        # Проверяем главную страницу
        response = self.session.get(frontend_url)
        assert response.status_code == 200
        assert 'text/html' in response.headers.get('content-type', '')
        
        # Проверяем, что загружается React приложение
        assert 'root' in response.text or 'div' in response.text
    
    def test_frontend_api_proxy(self):
        """Тест проксирования API запросов"""
        # Этот тест проверяет, что Frontend корректно проксирует запросы к Backend
        # В реальном проекте это может быть настроено через webpack dev server
        pass


class TestEndToEndWorkflow:
    """End-to-end тесты для полного рабочего процесса"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Настройка для каждого теста"""
        self.backend_session = requests.Session()
        self.backend_session.headers.update({'Content-Type': 'application/json'})
        
        self.ml_session = requests.Session()
        self.ml_session.headers.update({'Content-Type': 'application/json'})
    
    def test_user_journey_workflow(self):
        """Тест полного пути пользователя"""
        # 1. Пользователь регистрируется через Telegram
        user_data = {
            "user_id": 123456789,
            "telegram_id": 987654321,
            "first_name": "Test",
            "last_name": "User",
            "username": "testuser"
        }
        
        event_data = {
            **user_data,
            "event_type": "bot_command",
            "event_timestamp": "2023-01-01T12:00:00Z",
            "properties": {"command": "/start"}
        }
        
        response = self.backend_session.post(
            f"{BASE_URL}/api/telegram/event",
            json=event_data
        )
        assert response.status_code == 200
        
        # 2. Пользователь совершает различные действия
        actions = [
            {"event_type": "view", "properties": {"product_id": 100}},
            {"event_type": "add_to_cart", "properties": {"product_id": 100}},
            {"event_type": "purchase", "properties": {"product_id": 100, "amount": 1500}}
        ]
        
        for action in actions:
            action_data = {
                **user_data,
                "event_type": action["event_type"],
                "event_timestamp": "2023-01-01T12:00:00Z",
                "properties": action["properties"]
            }
            
            response = self.backend_session.post(
                f"{BASE_URL}/api/telegram/event",
                json=action_data
            )
            assert response.status_code == 200
        
        # 3. Ждем обработки данных ML моделями
        time.sleep(2)
        
        # 4. Проверяем, что пользователь появился в сегментации
        response = self.ml_session.get(f"{ML_BASE_URL}/api/segmentation/segments")
        assert response.status_code == 200
        
        # 5. Проверяем прогнозы покупок
        response = self.ml_session.get(f"{ML_BASE_URL}/api/purchase-prediction/predictions")
        assert response.status_code == 200
        
        # 6. Проверяем прогнозы оттока
        response = self.ml_session.get(f"{ML_BASE_URL}/api/churn-prediction/predictions")
        assert response.status_code == 200
    
    def test_ml_model_retraining_workflow(self):
        """Тест рабочего процесса переобучения ML моделей"""
        # 1. Запускаем переобучение всех моделей
        response = self.ml_session.post(f"{ML_BASE_URL}/api/retraining/retrain-all")
        assert response.status_code == 200
        
        # 2. Проверяем статус переобучения
        max_attempts = 30
        for attempt in range(max_attempts):
            response = self.ml_session.get(f"{ML_BASE_URL}/api/retraining/status")
            assert response.status_code == 200
            
            data = response.json()
            if data['success'] and data['data']['status'] == 'completed':
                break
            
            time.sleep(2)
        else:
            pytest.fail("Model retraining did not complete within expected time")
        
        # 3. Проверяем, что модели обновились
        response = self.ml_session.get(f"{ML_BASE_URL}/api/segmentation/metrics")
        assert response.status_code == 200
        
        response = self.ml_session.get(f"{ML_BASE_URL}/api/purchase-prediction/metrics")
        assert response.status_code == 200
        
        response = self.ml_session.get(f"{ML_BASE_URL}/api/churn-prediction/metrics")
        assert response.status_code == 200
    
    def test_error_handling_workflow(self):
        """Тест обработки ошибок в системе"""
        # 1. Отправляем невалидные данные
        invalid_data = {
            "invalid_field": "invalid_value"
        }
        
        response = self.backend_session.post(
            f"{BASE_URL}/api/telegram/event",
            json=invalid_data
        )
        assert response.status_code == 400
        
        # 2. Проверяем, что система остается стабильной
        response = self.backend_session.get(f"{BASE_URL}/health")
        assert response.status_code == 200
        
        # 3. Отправляем запрос к несуществующему эндпоинту
        response = self.backend_session.get(f"{BASE_URL}/api/nonexistent")
        assert response.status_code == 404
        
        # 4. Проверяем, что основные сервисы работают
        response = self.ml_session.get(f"{ML_BASE_URL}/health")
        assert response.status_code == 200


@pytest.mark.integration
class TestPerformanceIntegration:
    """Тесты производительности системы"""
    
    def test_concurrent_requests(self):
        """Тест обработки множественных одновременных запросов"""
        import threading
        import time
        
        results = []
        errors = []
        
        def make_request():
            try:
                session = requests.Session()
                response = session.get(f"{BASE_URL}/health")
                results.append(response.status_code)
            except Exception as e:
                errors.append(str(e))
        
        # Создаем 10 одновременных запросов
        threads = []
        for _ in range(10):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Ждем завершения всех потоков
        for thread in threads:
            thread.join()
        
        # Проверяем результаты
        assert len(errors) == 0, f"Errors occurred: {errors}"
        assert len(results) == 10
        assert all(status == 200 for status in results)
    
    def test_response_times(self):
        """Тест времени ответа API"""
        import time
        
        endpoints = [
            f"{BASE_URL}/health",
            f"{BASE_URL}/api/health",
            f"{ML_BASE_URL}/health",
            f"{ML_BASE_URL}/api/segmentation/segments"
        ]
        
        for endpoint in endpoints:
            start_time = time.time()
            response = requests.get(endpoint)
            end_time = time.time()
            
            response_time = end_time - start_time
            
            assert response.status_code == 200
            assert response_time < 5.0, f"Response time too slow for {endpoint}: {response_time}s"
