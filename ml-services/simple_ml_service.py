#!/usr/bin/env python3
"""
Упрощенный ML сервис для быстрого запуска реальных прогнозов
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
from sklearn.ensemble import RandomForestClassifier
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv('config.env')

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Создание FastAPI приложения
app = FastAPI(title="Customer Analyzer ML Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Глобальные переменные для моделей
purchase_model = None
churn_model = None
segmentation_model = None
scaler = None
is_trained = False

class DatabaseConnection:
    """Класс для работы с базой данных"""
    
    def __init__(self):
        self.connection_params = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '5432'),
            'database': os.getenv('DB_NAME', 'customer_analyzer'),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', 'app_password')
        }
    
    def get_connection(self):
        """Получение соединения с БД"""
        try:
            return psycopg2.connect(**self.connection_params)
        except Exception as e:
            logger.error(f"Database connection error: {e}")
            raise
    
    def execute_query(self, query: str, params: tuple = None) -> List[Dict]:
        """Выполнение SQL запроса"""
        try:
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute(query, params)
                    if cursor.description:
                        return cursor.fetchall()
                    return []
        except Exception as e:
            logger.error(f"Query execution error: {e}")
            raise

db = DatabaseConnection()

def extract_user_features(user_id: str) -> Dict[str, Any]:
    """Извлечение признаков пользователя"""
    try:
        # Получаем данные пользователя
        user_query = """
        SELECT * FROM users WHERE id = %s
        """
        user_data = db.execute_query(user_query, (user_id,))
        
        if not user_data:
            return None
        
        user = user_data[0]
        
        # Получаем события пользователя
        events_query = """
        SELECT event_type, timestamp, event_data 
        FROM events 
        WHERE user_id = %s 
        ORDER BY timestamp DESC
        """
        events = db.execute_query(events_query, (user_id,))
        
        # Вычисляем признаки
        features = {
            'user_id': user_id,
            'days_since_registration': (datetime.now() - user['registration_date']).days,
            'days_since_last_activity': (datetime.now() - user['last_activity']).days,
            'total_purchases': user['total_purchases'] or 0,
            'total_spent': float(user['total_spent'] or 0),
            'status_active': 1 if user['status'] == 'active' else 0,
        }
        
        # Анализ событий за последние 30 дней
        recent_events = [e for e in events if (datetime.now() - e['timestamp']).days <= 30]
        
        features.update({
            'events_last_30_days': len(recent_events),
            'page_views_last_30_days': len([e for e in recent_events if e['event_type'] == 'page_view']),
            'product_views_last_30_days': len([e for e in recent_events if e['event_type'] == 'product_view']),
            'add_to_cart_last_30_days': len([e for e in recent_events if e['event_type'] == 'add_to_cart']),
            'purchases_last_30_days': len([e for e in recent_events if e['event_type'] == 'purchase']),
        })
        
        # Средний чек
        if features['total_purchases'] > 0:
            features['avg_order_value'] = features['total_spent'] / features['total_purchases']
        else:
            features['avg_order_value'] = 0
        
        # Дни с последней покупки
        if user['last_purchase_date']:
            features['days_since_last_purchase'] = (datetime.now() - user['last_purchase_date']).days
        else:
            features['days_since_last_purchase'] = 999  # Большое число для пользователей без покупок
        
        return features
        
    except Exception as e:
        logger.error(f"Error extracting features for user {user_id}: {e}")
        return None

def prepare_training_data() -> tuple:
    """Подготовка данных для обучения"""
    try:
        # Получаем всех пользователей
        users_query = """
        SELECT id, total_purchases, total_spent, status, registration_date, last_activity, last_purchase_date
        FROM users
        """
        users = db.execute_query(users_query)
        
        # Получаем события
        events_query = """
        SELECT user_id, event_type, timestamp
        FROM events
        """
        events = db.execute_query(events_query)
        
        # Группируем события по пользователям
        events_by_user = {}
        for event in events:
            if event['user_id'] not in events_by_user:
                events_by_user[event['user_id']] = []
            events_by_user[event['user_id']].append(event)
        
        # Создаем признаки для каждого пользователя
        features_list = []
        purchase_targets = []
        churn_targets = []
        
        for user in users:
            user_id = user['id']
            user_events = events_by_user.get(user_id, [])
            
            # Базовые признаки
            features = {
                'days_since_registration': (datetime.now() - user['registration_date']).days,
                'days_since_last_activity': (datetime.now() - user['last_activity']).days,
                'total_purchases': user['total_purchases'] or 0,
                'total_spent': float(user['total_spent'] or 0),
                'status_active': 1 if user['status'] == 'active' else 0,
            }
            
            # События за последние 30 дней
            recent_events = [e for e in user_events if (datetime.now() - e['timestamp']).days <= 30]
            
            features.update({
                'events_last_30_days': len(recent_events),
                'page_views_last_30_days': len([e for e in recent_events if e['event_type'] == 'page_view']),
                'product_views_last_30_days': len([e for e in recent_events if e['event_type'] == 'product_view']),
                'add_to_cart_last_30_days': len([e for e in recent_events if e['event_type'] == 'add_to_cart']),
                'purchases_last_30_days': len([e for e in recent_events if e['event_type'] == 'purchase']),
            })
            
            # Средний чек
            if features['total_purchases'] > 0:
                features['avg_order_value'] = features['total_spent'] / features['total_purchases']
            else:
                features['avg_order_value'] = 0
            
            # Дни с последней покупки
            if user['last_purchase_date']:
                features['days_since_last_purchase'] = (datetime.now() - user['last_purchase_date']).days
            else:
                features['days_since_last_purchase'] = 999
            
            features_list.append(list(features.values()))
            
            # Целевые переменные
            # Покупка: 1 если есть покупки в последние 30 дней
            purchase_targets.append(1 if features['purchases_last_30_days'] > 0 else 0)
            
            # Отток: 1 если нет активности более 30 дней
            churn_targets.append(1 if features['days_since_last_activity'] > 30 else 0)
        
        X = np.array(features_list)
        y_purchase = np.array(purchase_targets)
        y_churn = np.array(churn_targets)
        
        logger.info(f"Prepared training data: {X.shape[0]} samples, {X.shape[1]} features")
        return X, y_purchase, y_churn
        
    except Exception as e:
        logger.error(f"Error preparing training data: {e}")
        raise

def train_models():
    """Обучение всех моделей"""
    global purchase_model, churn_model, segmentation_model, scaler, is_trained
    
    try:
        logger.info("Starting model training...")
        
        # Подготовка данных
        X, y_purchase, y_churn = prepare_training_data()
        
        if len(X) < 10:
            raise ValueError("Not enough data for training (minimum 10 samples required)")
        
        # Нормализация признаков
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Разделение на train/test
        X_train, X_test, y_purchase_train, y_purchase_test = train_test_split(
            X_scaled, y_purchase, test_size=0.2, random_state=42, stratify=y_purchase
        )
        
        _, _, y_churn_train, y_churn_test = train_test_split(
            X_scaled, y_churn, test_size=0.2, random_state=42, stratify=y_churn
        )
        
        # Обучение модели предсказания покупок
        purchase_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            class_weight='balanced'
        )
        purchase_model.fit(X_train, y_purchase_train)
        
        # Обучение модели предсказания оттока
        churn_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            class_weight='balanced'
        )
        churn_model.fit(X_train, y_churn_train)
        
        # Обучение модели сегментации
        segmentation_model = KMeans(n_clusters=4, random_state=42, n_init=10)
        segmentation_model.fit(X_scaled)
        
        # Оценка качества
        purchase_pred = purchase_model.predict(X_test)
        churn_pred = churn_model.predict(X_test)
        
        purchase_accuracy = accuracy_score(y_purchase_test, purchase_pred)
        churn_accuracy = accuracy_score(y_churn_test, churn_pred)
        
        logger.info(f"Purchase prediction accuracy: {purchase_accuracy:.3f}")
        logger.info(f"Churn prediction accuracy: {churn_accuracy:.3f}")
        
        # Сохранение моделей
        os.makedirs('models', exist_ok=True)
        joblib.dump(purchase_model, 'models/purchase_model.pkl')
        joblib.dump(churn_model, 'models/churn_model.pkl')
        joblib.dump(segmentation_model, 'models/segmentation_model.pkl')
        joblib.dump(scaler, 'models/scaler.pkl')
        
        is_trained = True
        logger.info("Models trained and saved successfully!")
        
        return {
            "status": "success",
            "purchase_accuracy": purchase_accuracy,
            "churn_accuracy": churn_accuracy,
            "samples_count": len(X)
        }
        
    except Exception as e:
        logger.error(f"Error training models: {e}")
        raise

def load_models():
    """Загрузка сохраненных моделей"""
    global purchase_model, churn_model, segmentation_model, scaler, is_trained
    
    try:
        if os.path.exists('models/purchase_model.pkl'):
            purchase_model = joblib.load('models/purchase_model.pkl')
            churn_model = joblib.load('models/churn_model.pkl')
            segmentation_model = joblib.load('models/segmentation_model.pkl')
            scaler = joblib.load('models/scaler.pkl')
            is_trained = True
            logger.info("Models loaded successfully!")
        else:
            logger.info("No saved models found, need to train first")
    except Exception as e:
        logger.error(f"Error loading models: {e}")

# API эндпоинты

@app.get("/")
async def root():
    """Корневой эндпоинт"""
    return {
        "message": "Customer Analyzer ML Service",
        "version": "1.0.0",
        "status": "running",
        "models_trained": is_trained
    }

@app.post("/train")
async def train():
    """Обучение всех моделей"""
    try:
        result = train_models()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/predict/purchase/{user_id}")
async def predict_purchase(user_id: str):
    """Предсказание покупки для пользователя"""
    if not is_trained:
        raise HTTPException(status_code=400, detail="Models not trained yet. Please train first.")
    
    try:
        features = extract_user_features(user_id)
        if not features:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Подготавливаем признаки для предсказания
        feature_values = [
            features['days_since_registration'],
            features['days_since_last_activity'],
            features['total_purchases'],
            features['total_spent'],
            features['status_active'],
            features['events_last_30_days'],
            features['page_views_last_30_days'],
            features['product_views_last_30_days'],
            features['add_to_cart_last_30_days'],
            features['purchases_last_30_days'],
            features['avg_order_value'],
            features['days_since_last_purchase']
        ]
        
        X = np.array(feature_values).reshape(1, -1)
        X_scaled = scaler.transform(X)
        
        # Предсказание
        probability = purchase_model.predict_proba(X_scaled)[0][1] * 100
        
        return {
            "user_id": user_id,
            "prediction_type": "purchase",
            "probability": round(probability, 1),
            "features": features,
            "model_version": "1.0.0"
        }
        
    except Exception as e:
        logger.error(f"Error predicting purchase for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/predict/churn/{user_id}")
async def predict_churn(user_id: str):
    """Предсказание оттока для пользователя"""
    if not is_trained:
        raise HTTPException(status_code=400, detail="Models not trained yet. Please train first.")
    
    try:
        features = extract_user_features(user_id)
        if not features:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Подготавливаем признаки для предсказания
        feature_values = [
            features['days_since_registration'],
            features['days_since_last_activity'],
            features['total_purchases'],
            features['total_spent'],
            features['status_active'],
            features['events_last_30_days'],
            features['page_views_last_30_days'],
            features['product_views_last_30_days'],
            features['add_to_cart_last_30_days'],
            features['purchases_last_30_days'],
            features['avg_order_value'],
            features['days_since_last_purchase']
        ]
        
        X = np.array(feature_values).reshape(1, -1)
        X_scaled = scaler.transform(X)
        
        # Предсказание
        probability = churn_model.predict_proba(X_scaled)[0][1] * 100
        
        return {
            "user_id": user_id,
            "prediction_type": "churn",
            "probability": round(probability, 1),
            "features": features,
            "model_version": "1.0.0"
        }
        
    except Exception as e:
        logger.error(f"Error predicting churn for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/predict/segment/{user_id}")
async def predict_segment(user_id: str):
    """Предсказание сегмента для пользователя"""
    if not is_trained:
        raise HTTPException(status_code=400, detail="Models not trained yet. Please train first.")
    
    try:
        features = extract_user_features(user_id)
        if not features:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Подготавливаем признаки для предсказания
        feature_values = [
            features['days_since_registration'],
            features['days_since_last_activity'],
            features['total_purchases'],
            features['total_spent'],
            features['status_active'],
            features['events_last_30_days'],
            features['page_views_last_30_days'],
            features['product_views_last_30_days'],
            features['add_to_cart_last_30_days'],
            features['purchases_last_30_days'],
            features['avg_order_value'],
            features['days_since_last_purchase']
        ]
        
        X = np.array(feature_values).reshape(1, -1)
        X_scaled = scaler.transform(X)
        
        # Предсказание сегмента
        segment = segmentation_model.predict(X_scaled)[0]
        
        segment_names = {
            0: "Новые клиенты",
            1: "Активные покупатели", 
            2: "VIP клиенты",
            3: "Спящие клиенты"
        }
        
        return {
            "user_id": user_id,
            "prediction_type": "segment",
            "segment": segment_names.get(segment, "Неизвестный"),
            "segment_id": int(segment),
            "features": features,
            "model_version": "1.0.0"
        }
        
    except Exception as e:
        logger.error(f"Error predicting segment for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Проверка здоровья сервиса"""
    return {
        "status": "healthy",
        "models_trained": is_trained,
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    
    # Загружаем модели при запуске
    load_models()
    
    # Запускаем сервер
    uvicorn.run(
        "simple_ml_service:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
