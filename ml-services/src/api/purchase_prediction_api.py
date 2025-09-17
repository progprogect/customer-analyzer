"""
API для работы с предсказанием покупок
"""

from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from typing import Dict, List, Optional, Any
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging

from ..models.purchase_prediction import PurchasePredictionModel, PurchasePredictionResult, ModelEvaluationMetrics
from ..features.purchase_features import PurchaseFeatureExtractor, purchase_features_to_dataframe, prepare_purchase_features_for_ml
from ..database.connection import get_db_connection

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/purchase-prediction", tags=["purchase-prediction"])

# Глобальная переменная для модели
purchase_prediction_model = None

@router.on_event("startup")
async def load_model():
    """Загрузка модели при запуске приложения"""
    global purchase_prediction_model
    try:
        purchase_prediction_model = PurchasePredictionModel()
        purchase_prediction_model.load_model()
        logger.info("Purchase prediction model loaded successfully")
    except FileNotFoundError:
        logger.warning("Purchase prediction model not found. Will need to train first.")
        purchase_prediction_model = PurchasePredictionModel()
    except Exception as e:
        logger.error(f"Error loading purchase prediction model: {e}")
        purchase_prediction_model = PurchasePredictionModel()

@router.post("/train")
async def train_purchase_prediction_model(
    algorithm: str = Query("xgboost", regex="^(random_forest|xgboost|gradient_boosting)$", description="Алгоритм ML"),
    test_size: float = Query(0.2, ge=0.1, le=0.5, description="Доля тестовой выборки"),
    days_back: int = Query(90, ge=30, le=365, description="Количество дней назад для обучения"),
    limit: Optional[int] = Query(None, ge=1, le=10000, description="Ограничение количества пользователей")
):
    """
    Обучение модели предсказания покупок
    
    Args:
        algorithm: Алгоритм машинного обучения
        test_size: Доля тестовой выборки
        days_back: Количество дней назад для обучения
        limit: Ограничение количества пользователей
    
    Returns:
        ModelEvaluationMetrics: Результат обучения модели
    """
    try:
        global purchase_prediction_model
        
        if purchase_prediction_model is None:
            purchase_prediction_model = PurchasePredictionModel()
        
        # Получаем соединение с БД
        db_connection = get_db_connection()
        
        # Определяем временной период для обучения
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        # Извлекаем данные для обучения
        feature_extractor = PurchaseFeatureExtractor(db_connection)
        features_list = feature_extractor.extract_training_data(start_date, end_date, limit)
        
        if len(features_list) < 100:
            raise HTTPException(
                status_code=400,
                detail=f"Недостаточно данных для обучения. Требуется минимум 100 образцов, получено {len(features_list)}"
            )
        
        # Конвертируем в DataFrame
        features_df = purchase_features_to_dataframe(features_list)
        
        # Проверяем наличие целевой переменной
        if 'will_purchase_in_30d' not in features_df.columns:
            raise HTTPException(
                status_code=400,
                detail="Целевая переменная 'will_purchase_in_30d' не найдена в данных"
            )
        
        # Подготавливаем признаки для ML
        ml_features_df = prepare_purchase_features_for_ml(features_df)
        
        # Обучаем модель
        metrics = purchase_prediction_model.train(
            features_df=ml_features_df,
            algorithm=algorithm,
            test_size=test_size
        )
        
        logger.info(f"Purchase prediction model trained successfully. AUC-ROC: {metrics.auc_roc:.3f}")
        
        return {
            "success": True,
            "message": "Model trained successfully",
            "data": {
                "metrics": {
                    "accuracy": metrics.accuracy,
                    "precision": metrics.precision,
                    "recall": metrics.recall,
                    "f1_score": metrics.f1_score,
                    "auc_roc": metrics.auc_roc,
                    "confusion_matrix": metrics.confusion_matrix.tolist(),
                    "cross_val_scores": metrics.cross_val_scores,
                    "model_version": metrics.model_version
                },
                "feature_importance": metrics.feature_importance,
                "training_samples": len(features_list),
                "positive_samples": features_df['will_purchase_in_30d'].sum(),
                "negative_samples": (features_df['will_purchase_in_30d'] == False).sum()
            }
        }
        
    except Exception as e:
        logger.error(f"Error training purchase prediction model: {e}")
        raise HTTPException(status_code=500, detail=f"Error training model: {str(e)}")

@router.post("/predict/{user_id}")
async def predict_user_purchase(
    user_id: int,
    prediction_date: Optional[str] = Query(None, description="Дата предсказания (YYYY-MM-DD)")
):
    """
    Предсказание вероятности покупки для конкретного пользователя
    
    Args:
        user_id: ID пользователя
        prediction_date: Дата предсказания (опционально)
    
    Returns:
        PurchasePredictionResult: Результат предсказания
    """
    try:
        global purchase_prediction_model
        
        if purchase_prediction_model is None or purchase_prediction_model.model is None:
            raise HTTPException(
                status_code=404,
                detail="Purchase prediction model not trained. Please train the model first."
            )
        
        # Получаем соединение с БД
        db_connection = get_db_connection()
        
        # Определяем дату предсказания
        if prediction_date:
            pred_date = datetime.strptime(prediction_date, "%Y-%m-%d")
        else:
            pred_date = datetime.now()
        
        # Извлекаем признаки пользователя
        feature_extractor = PurchaseFeatureExtractor(db_connection)
        features = feature_extractor.extract_user_purchase_features(user_id, pred_date)
        
        if not features:
            raise HTTPException(
                status_code=404,
                detail=f"User {user_id} not found or no features available"
            )
        
        # Конвертируем в DataFrame
        features_df = purchase_features_to_dataframe([features])
        ml_features_df = prepare_purchase_features_for_ml(features_df)
        
        # Предсказываем
        predictions = purchase_prediction_model.predict(ml_features_df)
        
        if not predictions:
            raise HTTPException(
                status_code=500,
                detail="Error generating prediction"
            )
        
        result = predictions[0]
        
        return {
            "success": True,
            "data": {
                "user_id": result.user_id,
                "purchase_probability": result.purchase_probability,
                "prediction_confidence": result.prediction_confidence,
                "key_factors": result.key_factors,
                "prediction_date": result.prediction_date.isoformat(),
                "model_version": result.model_version,
                "recommendations": _generate_recommendations(result)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error predicting user purchase: {e}")
        raise HTTPException(status_code=500, detail=f"Error predicting purchase: {str(e)}")

@router.post("/predict/batch")
async def predict_batch_purchases(
    user_ids: List[int],
    prediction_date: Optional[str] = Query(None, description="Дата предсказания (YYYY-MM-DD)")
):
    """
    Предсказание вероятности покупки для списка пользователей
    
    Args:
        user_ids: Список ID пользователей
        prediction_date: Дата предсказания (опционально)
    
    Returns:
        List[PurchasePredictionResult]: Список результатов предсказания
    """
    try:
        global purchase_prediction_model
        
        if purchase_prediction_model is None or purchase_prediction_model.model is None:
            raise HTTPException(
                status_code=404,
                detail="Purchase prediction model not trained. Please train the model first."
            )
        
        if len(user_ids) > 1000:
            raise HTTPException(
                status_code=400,
                detail="Too many users. Maximum 1000 users per batch."
            )
        
        # Получаем соединение с БД
        db_connection = get_db_connection()
        
        # Определяем дату предсказания
        if prediction_date:
            pred_date = datetime.strptime(prediction_date, "%Y-%m-%d")
        else:
            pred_date = datetime.now()
        
        # Извлекаем признаки для всех пользователей
        feature_extractor = PurchaseFeatureExtractor(db_connection)
        features_list = []
        
        for user_id in user_ids:
            features = feature_extractor.extract_user_purchase_features(user_id, pred_date)
            if features:
                features_list.append(features)
        
        if not features_list:
            raise HTTPException(
                status_code=404,
                detail="No valid users found for prediction"
            )
        
        # Конвертируем в DataFrame
        features_df = purchase_features_to_dataframe(features_list)
        ml_features_df = prepare_purchase_features_for_ml(features_df)
        
        # Предсказываем
        predictions = purchase_prediction_model.predict(ml_features_df)
        
        # Форматируем результаты
        results = []
        for result in predictions:
            results.append({
                "user_id": result.user_id,
                "purchase_probability": result.purchase_probability,
                "prediction_confidence": result.prediction_confidence,
                "key_factors": result.key_factors[:3],  # Только топ-3 фактора
                "prediction_date": result.prediction_date.isoformat(),
                "model_version": result.model_version
            })
        
        return {
            "success": True,
            "data": {
                "predictions": results,
                "total_predictions": len(results),
                "high_confidence_count": len([r for r in results if r["prediction_confidence"] == "high"]),
                "medium_confidence_count": len([r for r in results if r["prediction_confidence"] == "medium"]),
                "low_confidence_count": len([r for r in results if r["prediction_confidence"] == "low"])
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error predicting batch purchases: {e}")
        raise HTTPException(status_code=500, detail=f"Error predicting batch purchases: {str(e)}")

@router.get("/model/info")
async def get_model_info():
    """
    Получение информации о модели
    
    Returns:
        Dict: Информация о модели
    """
    try:
        global purchase_prediction_model
        
        if purchase_prediction_model is None:
            raise HTTPException(
                status_code=404,
                detail="Purchase prediction model not initialized"
            )
        
        model_info = purchase_prediction_model.get_model_info()
        
        return {
            "success": True,
            "data": model_info
        }
        
    except Exception as e:
        logger.error(f"Error getting model info: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting model info: {str(e)}")

@router.post("/optimize")
async def optimize_model_hyperparameters(
    algorithm: str = Query("xgboost", regex="^(random_forest|xgboost)$", description="Алгоритм для оптимизации"),
    days_back: int = Query(60, ge=30, le=180, description="Количество дней назад для оптимизации"),
    limit: Optional[int] = Query(500, ge=100, le=2000, description="Ограничение количества пользователей")
):
    """
    Оптимизация гиперпараметров модели
    
    Args:
        algorithm: Алгоритм для оптимизации
        days_back: Количество дней назад для оптимизации
        limit: Ограничение количества пользователей
    
    Returns:
        Dict: Результат оптимизации
    """
    try:
        global purchase_prediction_model
        
        if purchase_prediction_model is None:
            purchase_prediction_model = PurchasePredictionModel()
        
        # Получаем соединение с БД
        db_connection = get_db_connection()
        
        # Определяем временной период
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        # Извлекаем данные для оптимизации
        feature_extractor = PurchaseFeatureExtractor(db_connection)
        features_list = feature_extractor.extract_training_data(start_date, end_date, limit)
        
        if len(features_list) < 100:
            raise HTTPException(
                status_code=400,
                detail=f"Недостаточно данных для оптимизации. Требуется минимум 100 образцов, получено {len(features_list)}"
            )
        
        # Конвертируем в DataFrame
        features_df = purchase_features_to_dataframe(features_list)
        ml_features_df = prepare_purchase_features_for_ml(features_df)
        
        # Оптимизируем гиперпараметры
        optimization_result = purchase_prediction_model.optimize_hyperparameters(ml_features_df, algorithm)
        
        return {
            "success": True,
            "message": "Hyperparameters optimized successfully",
            "data": {
                "best_params": optimization_result['best_params'],
                "best_score": optimization_result['best_score'],
                "recommendation": f"Рекомендуется использовать {algorithm} с параметрами: {optimization_result['best_params']}"
            }
        }
        
    except Exception as e:
        logger.error(f"Error optimizing hyperparameters: {e}")
        raise HTTPException(status_code=500, detail=f"Error optimizing hyperparameters: {str(e)}")

@router.get("/stats")
async def get_prediction_stats():
    """
    Получение статистики по предсказаниям
    
    Returns:
        Dict: Статистика предсказаний
    """
    try:
        global purchase_prediction_model
        
        if purchase_prediction_model is None or purchase_prediction_model.model is None:
            raise HTTPException(
                status_code=404,
                detail="Purchase prediction model not trained"
            )
        
        # Получаем соединение с БД
        db_connection = get_db_connection()
        
        # Получаем статистику из БД
        query = """
        SELECT 
            COUNT(*) as total_users,
            AVG(purchase_probability_30d) as avg_probability,
            COUNT(CASE WHEN purchase_probability_30d > 0.8 THEN 1 END) as high_probability_users,
            COUNT(CASE WHEN purchase_probability_30d BETWEEN 0.5 AND 0.8 THEN 1 END) as medium_probability_users,
            COUNT(CASE WHEN purchase_probability_30d < 0.5 THEN 1 END) as low_probability_users
        FROM app_schema.user_metrics
        WHERE purchase_probability_30d IS NOT NULL
        """
        
        result = db_connection.execute(query)
        stats = result[0] if result else {}
        
        return {
            "success": True,
            "data": {
                "model_info": purchase_prediction_model.get_model_info(),
                "prediction_stats": {
                    "total_users_with_predictions": stats.get('total_users', 0),
                    "average_probability": float(stats.get('avg_probability', 0)) if stats.get('avg_probability') else 0,
                    "high_probability_users": stats.get('high_probability_users', 0),
                    "medium_probability_users": stats.get('medium_probability_users', 0),
                    "low_probability_users": stats.get('low_probability_users', 0)
                },
                "timestamp": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting prediction stats: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting stats: {str(e)}")

def _generate_recommendations(prediction_result: PurchasePredictionResult) -> List[str]:
    """Генерация рекомендаций на основе предсказания"""
    recommendations = []
    
    prob = prediction_result.purchase_probability
    
    if prob > 0.8:
        recommendations.extend([
            "Высокая вероятность покупки - рекомендуется персонализированное предложение",
            "Рассмотрите возможность предоставления эксклюзивных скидок",
            "Отправьте персональное сообщение с рекомендациями продуктов"
        ])
    elif prob > 0.6:
        recommendations.extend([
            "Средняя вероятность покупки - рекомендуется ретаргетинг",
            "Отправьте напоминание о продуктах в корзине",
            "Предложите дополнительные продукты к ранее просмотренным"
        ])
    elif prob > 0.4:
        recommendations.extend([
            "Низкая вероятность покупки - рекомендуется повышение вовлеченности",
            "Отправьте информационные материалы о продуктах",
            "Предложите участие в акциях или конкурсах"
        ])
    else:
        recommendations.extend([
            "Очень низкая вероятность покупки - рекомендуется работа с лояльностью",
            "Отправьте приветственное сообщение новым пользователям",
            "Предложите подписку на новости и специальные предложения"
        ])
    
    return recommendations
