#!/usr/bin/env python3
"""
Демо ML сервис для показа работы реальных прогнозов
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
from sklearn.ensemble import RandomForestClassifier
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Создание FastAPI приложения
app = FastAPI(title="Customer Analyzer Demo ML Service", version="1.0.0")

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

# Демо данные пользователей (имитация реальных данных)
DEMO_USERS = {
    "user_001": {
        "id": "user_001",
        "days_since_registration": 45,
        "days_since_last_activity": 2,
        "total_purchases": 3,
        "total_spent": 1500.0,
        "status_active": 1,
        "events_last_30_days": 15,
        "page_views_last_30_days": 8,
        "product_views_last_30_days": 5,
        "add_to_cart_last_30_days": 2,
        "purchases_last_30_days": 1,
        "avg_order_value": 500.0,
        "days_since_last_purchase": 5
    },
    "user_002": {
        "id": "user_002",
        "days_since_registration": 120,
        "days_since_last_activity": 45,
        "total_purchases": 1,
        "total_spent": 300.0,
        "status_active": 0,
        "events_last_30_days": 2,
        "page_views_last_30_days": 1,
        "product_views_last_30_days": 1,
        "add_to_cart_last_30_days": 0,
        "purchases_last_30_days": 0,
        "avg_order_value": 300.0,
        "days_since_last_purchase": 45
    },
    "user_003": {
        "id": "user_003",
        "days_since_registration": 200,
        "days_since_last_activity": 1,
        "total_purchases": 8,
        "total_spent": 4500.0,
        "status_active": 1,
        "events_last_30_days": 25,
        "page_views_last_30_days": 15,
        "product_views_last_30_days": 12,
        "add_to_cart_last_30_days": 4,
        "purchases_last_30_days": 2,
        "avg_order_value": 562.5,
        "days_since_last_purchase": 3
    },
    "user_004": {
        "id": "user_004",
        "days_since_registration": 30,
        "days_since_last_activity": 60,
        "total_purchases": 0,
        "total_spent": 0.0,
        "status_active": 0,
        "events_last_30_days": 0,
        "page_views_last_30_days": 0,
        "product_views_last_30_days": 0,
        "add_to_cart_last_30_days": 0,
        "purchases_last_30_days": 0,
        "avg_order_value": 0.0,
        "days_since_last_purchase": 999
    },
    "user_005": {
        "id": "user_005",
        "days_since_registration": 90,
        "days_since_last_activity": 3,
        "total_purchases": 5,
        "total_spent": 2800.0,
        "status_active": 1,
        "events_last_30_days": 18,
        "page_views_last_30_days": 10,
        "product_views_last_30_days": 7,
        "add_to_cart_last_30_days": 3,
        "purchases_last_30_days": 1,
        "avg_order_value": 560.0,
        "days_since_last_purchase": 8
    }
}

def generate_demo_data() -> tuple:
    """Генерация демо данных для обучения"""
    np.random.seed(42)
    
    # Создаем 100 синтетических пользователей
    n_samples = 100
    
    # Генерируем признаки
    data = []
    purchase_targets = []
    churn_targets = []
    
    for i in range(n_samples):
        # Генерируем реалистичные данные
        days_reg = np.random.randint(1, 365)
        days_activity = np.random.randint(1, min(days_reg + 1, 60))
        total_purchases = np.random.poisson(3) if np.random.random() > 0.3 else 0
        total_spent = total_purchases * np.random.uniform(200, 1000)
        status_active = 1 if days_activity < 30 else 0
        events_30 = np.random.poisson(10) if status_active else np.random.poisson(2)
        page_views = int(events_30 * np.random.uniform(0.4, 0.8))
        product_views = int(events_30 * np.random.uniform(0.2, 0.5))
        add_to_cart = int(events_30 * np.random.uniform(0.05, 0.2))
        purchases_30 = int(events_30 * np.random.uniform(0.01, 0.1))
        avg_order = total_spent / max(total_purchases, 1)
        days_last_purchase = np.random.randint(1, 90) if total_purchases > 0 else 999
        
        features = [
            days_reg, days_activity, total_purchases, total_spent, status_active,
            events_30, page_views, product_views, add_to_cart, purchases_30,
            avg_order, days_last_purchase
        ]
        
        data.append(features)
        
        # Целевые переменные
        purchase_prob = 0.7 if purchases_30 > 0 else 0.3 if add_to_cart > 0 else 0.1
        purchase_targets.append(1 if np.random.random() < purchase_prob else 0)
        
        churn_prob = 0.8 if days_activity > 30 else 0.3 if days_activity > 14 else 0.1
        churn_targets.append(1 if np.random.random() < churn_prob else 0)
    
    X = np.array(data)
    y_purchase = np.array(purchase_targets)
    y_churn = np.array(churn_targets)
    
    logger.info(f"Generated demo data: {X.shape[0]} samples, {X.shape[1]} features")
    return X, y_purchase, y_churn

def train_models():
    """Обучение всех моделей на демо данных"""
    global purchase_model, churn_model, segmentation_model, scaler, is_trained
    
    try:
        logger.info("Starting demo model training...")
        
        # Подготовка данных
        X, y_purchase, y_churn = generate_demo_data()
        
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
        joblib.dump(purchase_model, 'models/demo_purchase_model.pkl')
        joblib.dump(churn_model, 'models/demo_churn_model.pkl')
        joblib.dump(segmentation_model, 'models/demo_segmentation_model.pkl')
        joblib.dump(scaler, 'models/demo_scaler.pkl')
        
        is_trained = True
        logger.info("Demo models trained and saved successfully!")
        
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
        if os.path.exists('models/demo_purchase_model.pkl'):
            purchase_model = joblib.load('models/demo_purchase_model.pkl')
            churn_model = joblib.load('models/demo_churn_model.pkl')
            segmentation_model = joblib.load('models/demo_segmentation_model.pkl')
            scaler = joblib.load('models/demo_scaler.pkl')
            is_trained = True
            logger.info("Demo models loaded successfully!")
        else:
            logger.info("No saved demo models found, need to train first")
    except Exception as e:
        logger.error(f"Error loading models: {e}")

def get_user_features(user_id: str) -> Dict[str, Any]:
    """Получение признаков пользователя из демо данных"""
    if user_id in DEMO_USERS:
        return DEMO_USERS[user_id]
    else:
        # Возвращаем данные для неизвестного пользователя
        return {
            "id": user_id,
            "days_since_registration": 30,
            "days_since_last_activity": 15,
            "total_purchases": 1,
            "total_spent": 500.0,
            "status_active": 1,
            "events_last_30_days": 5,
            "page_views_last_30_days": 3,
            "product_views_last_30_days": 2,
            "add_to_cart_last_30_days": 1,
            "purchases_last_30_days": 0,
            "avg_order_value": 500.0,
            "days_since_last_purchase": 15
        }

# API эндпоинты

@app.get("/")
async def root():
    """Корневой эндпоинт"""
    return {
        "message": "Customer Analyzer Demo ML Service",
        "version": "1.0.0",
        "status": "running",
        "models_trained": is_trained,
        "demo_users": list(DEMO_USERS.keys())
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
        features = get_user_features(user_id)
        
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
            "model_version": "demo-1.0.0",
            "explanation": generate_purchase_explanation(features, probability)
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
        features = get_user_features(user_id)
        
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
            "model_version": "demo-1.0.0",
            "explanation": generate_churn_explanation(features, probability)
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
        features = get_user_features(user_id)
        
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
            "model_version": "demo-1.0.0",
            "explanation": generate_segment_explanation(features, segment)
        }
        
    except Exception as e:
        logger.error(f"Error predicting segment for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def generate_purchase_explanation(features: Dict, probability: float) -> Dict:
    """Генерация объяснения прогноза покупки"""
    factors = []
    
    if features['purchases_last_30_days'] > 0:
        factors.append({
            "factor": "Недавние покупки",
            "impact": "positive",
            "description": f"Совершил {features['purchases_last_30_days']} покупок за 30 дней",
            "weight": 0.3
        })
    
    if features['add_to_cart_last_30_days'] > 0:
        factors.append({
            "factor": "Добавление в корзину",
            "impact": "positive", 
            "description": f"Добавил {features['add_to_cart_last_30_days']} товаров в корзину",
            "weight": 0.25
        })
    
    if features['product_views_last_30_days'] > 5:
        factors.append({
            "factor": "Активный просмотр",
            "impact": "positive",
            "description": f"Просмотрел {features['product_views_last_30_days']} товаров",
            "weight": 0.2
        })
    
    if features['days_since_last_activity'] > 14:
        factors.append({
            "factor": "Низкая активность",
            "impact": "negative",
            "description": f"Последняя активность {features['days_since_last_activity']} дней назад",
            "weight": 0.25
        })
    
    return {
        "key_factors": factors,
        "recommendation": get_purchase_recommendation(probability),
        "confidence": "high" if probability > 70 else "medium" if probability > 40 else "low"
    }

def generate_churn_explanation(features: Dict, probability: float) -> Dict:
    """Генерация объяснения прогноза оттока"""
    factors = []
    
    if features['days_since_last_activity'] > 30:
        factors.append({
            "factor": "Длительное отсутствие",
            "impact": "negative",
            "description": f"Нет активности {features['days_since_last_activity']} дней",
            "weight": 0.4
        })
    
    if features['total_purchases'] < 2:
        factors.append({
            "factor": "Мало покупок",
            "impact": "negative",
            "description": f"Всего {features['total_purchases']} покупок",
            "weight": 0.3
        })
    
    if features['days_since_last_purchase'] > 60:
        factors.append({
            "factor": "Давняя покупка",
            "impact": "negative",
            "description": f"Последняя покупка {features['days_since_last_purchase']} дней назад",
            "weight": 0.3
        })
    
    if features['events_last_30_days'] > 10:
        factors.append({
            "factor": "Активность",
            "impact": "positive",
            "description": f"Активен: {features['events_last_30_days']} событий за 30 дней",
            "weight": 0.2
        })
    
    return {
        "key_factors": factors,
        "recommendation": get_churn_recommendation(probability),
        "confidence": "high" if probability > 60 else "medium" if probability > 30 else "low"
    }

def generate_segment_explanation(features: Dict, segment: int) -> Dict:
    """Генерация объяснения сегментации"""
    explanations = {
        0: {
            "name": "Новые клиенты",
            "description": "Недавно зарегистрированные пользователи с низкой активностью",
            "characteristics": ["Мало покупок", "Недавняя регистрация", "Изучают ассортимент"]
        },
        1: {
            "name": "Активные покупатели", 
            "description": "Регулярно совершающие покупки клиенты",
            "characteristics": ["Регулярные покупки", "Высокая активность", "Средний чек"]
        },
        2: {
            "name": "VIP клиенты",
            "description": "Высокоценные клиенты с большими тратами",
            "characteristics": ["Высокие траты", "Много покупок", "Лояльность"]
        },
        3: {
            "name": "Спящие клиенты",
            "description": "Неактивные клиенты с риском оттока",
            "characteristics": ["Низкая активность", "Давние покупки", "Риск оттока"]
        }
    }
    
    return explanations.get(segment, {"name": "Неизвестный", "description": "Не удалось определить сегмент"})

def get_purchase_recommendation(probability: float) -> str:
    """Получение рекомендации по покупке"""
    if probability > 70:
        return "Высокая вероятность покупки. Отправить персональное предложение с эксклюзивной скидкой."
    elif probability > 40:
        return "Умеренная вероятность покупки. Настроить таргетированную рекламу с интересными товарами."
    else:
        return "Низкая вероятность покупки. Запустить образовательную кампанию о преимуществах товаров."

def get_churn_recommendation(probability: float) -> str:
    """Получение рекомендации по оттоку"""
    if probability > 60:
        return "Высокий риск оттока. Немедленно отправить персональное предложение с бонусами."
    elif probability > 30:
        return "Средний риск оттока. Улучшить качество сервиса и отправить опрос удовлетворенности."
    else:
        return "Низкий риск оттока. Поддерживать текущий уровень сервиса."

@app.get("/health")
async def health_check():
    """Проверка здоровья сервиса"""
    return {
        "status": "healthy",
        "models_trained": is_trained,
        "timestamp": datetime.now().isoformat(),
        "demo_mode": True
    }

@app.get("/demo/users")
async def get_demo_users():
    """Получение списка демо пользователей"""
    return {
        "users": list(DEMO_USERS.keys()),
        "total": len(DEMO_USERS)
    }

if __name__ == "__main__":
    import uvicorn
    
    # Загружаем модели при запуске
    load_models()
    
    # Запускаем сервер
    uvicorn.run(
        "demo_ml_service:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
