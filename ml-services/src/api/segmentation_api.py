"""
API для работы с сегментацией пользователей
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Dict, List, Optional, Any
import pandas as pd
import numpy as np
from datetime import datetime
import logging

from ..models.user_segmentation import UserSegmentationModel, SegmentationResult
from ..features.user_features import UserFeatureExtractor, features_to_dataframe, prepare_features_for_ml
from ..database.connection import get_db_connection

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/segmentation", tags=["segmentation"])

# Глобальная переменная для модели (в продакшене лучше использовать dependency injection)
segmentation_model = None

@router.on_event("startup")
async def load_model():
    """Загрузка модели при запуске приложения"""
    global segmentation_model
    try:
        segmentation_model = UserSegmentationModel()
        segmentation_model.load_model()
        logger.info("Segmentation model loaded successfully")
    except FileNotFoundError:
        logger.warning("Segmentation model not found. Will need to train first.")
        segmentation_model = UserSegmentationModel()
    except Exception as e:
        logger.error(f"Error loading segmentation model: {e}")
        segmentation_model = UserSegmentationModel()

@router.post("/train")
async def train_segmentation_model(
    n_clusters: int = Query(5, ge=2, le=20, description="Количество кластеров"),
    algorithm: str = Query("kmeans", regex="^(kmeans|dbscan|agglomerative)$", description="Алгоритм кластеризации"),
    use_pca: bool = Query(True, description="Использовать PCA для снижения размерности"),
    limit: Optional[int] = Query(None, ge=1, le=10000, description="Ограничение количества пользователей для обучения")
):
    """
    Обучение модели сегментации пользователей
    
    Args:
        n_clusters: Количество кластеров для создания
        algorithm: Алгоритм кластеризации (kmeans, dbscan, agglomerative)
        use_pca: Использовать ли PCA для снижения размерности
        limit: Ограничение количества пользователей для обучения
    
    Returns:
        SegmentationResult: Результат обучения модели
    """
    try:
        global segmentation_model
        
        if segmentation_model is None:
            segmentation_model = UserSegmentationModel()
        
        # Получаем соединение с БД
        db_connection = get_db_connection()
        
        # Извлекаем признаки пользователей
        feature_extractor = UserFeatureExtractor(db_connection)
        features_list = feature_extractor.extract_all_users_features(limit)
        
        if len(features_list) < n_clusters:
            raise HTTPException(
                status_code=400,
                detail=f"Недостаточно пользователей для обучения. Требуется минимум {n_clusters}, получено {len(features_list)}"
            )
        
        # Конвертируем в DataFrame
        features_df = features_to_dataframe(features_list)
        
        # Подготавливаем признаки для ML
        ml_features_df = prepare_features_for_ml(features_df)
        
        # Обучаем модель
        result = segmentation_model.train(
            features_df=ml_features_df,
            n_clusters=n_clusters,
            algorithm=algorithm,
            use_pca=use_pca
        )
        
        logger.info(f"Segmentation model trained successfully with {len(result.segments)} segments")
        
        return {
            "success": True,
            "message": "Model trained successfully",
            "data": {
                "segments": [
                    {
                        "segment_id": segment.segment_id,
                        "name": segment.name,
                        "description": segment.description,
                        "size": segment.size,
                        "percentage": segment.percentage,
                        "characteristics": segment.characteristics
                    }
                    for segment in result.segments
                ],
                "model_metrics": result.model_metrics,
                "feature_importance": result.feature_importance,
                "model_version": result.model_version,
                "created_at": result.created_at.isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error training segmentation model: {e}")
        raise HTTPException(status_code=500, detail=f"Error training model: {str(e)}")

@router.get("/segments")
async def get_segments():
    """
    Получение информации о всех сегментах
    
    Returns:
        List[Dict]: Список сегментов с их характеристиками
    """
    try:
        global segmentation_model
        
        if segmentation_model is None or segmentation_model.model is None:
            raise HTTPException(
                status_code=404,
                detail="Segmentation model not trained. Please train the model first."
            )
        
        # Получаем соединение с БД
        db_connection = get_db_connection()
        
        # Извлекаем признаки всех пользователей
        feature_extractor = UserFeatureExtractor(db_connection)
        features_list = feature_extractor.extract_all_users_features()
        
        if not features_list:
            return {"success": True, "data": {"segments": []}}
        
        # Конвертируем в DataFrame
        features_df = features_to_dataframe(features_list)
        ml_features_df = prepare_features_for_ml(features_df)
        
        # Предсказываем сегменты
        user_segments = segmentation_model.predict(ml_features_df)
        
        # Группируем пользователей по сегментам
        segments_info = {}
        for user_id, segment_id in user_segments.items():
            if segment_id not in segments_info:
                segments_info[segment_id] = {
                    "segment_id": segment_id,
                    "name": segmentation_model.segment_names.get(segment_id, f"Сегмент {segment_id}"),
                    "users": []
                }
            segments_info[segment_id]["users"].append(user_id)
        
        # Добавляем статистику
        segments_data = []
        for segment_id, info in segments_info.items():
            segment_users = features_df[features_df['user_id'].isin(info["users"])]
            
            segments_data.append({
                "segment_id": segment_id,
                "name": info["name"],
                "size": len(info["users"]),
                "percentage": len(info["users"]) / len(features_df) * 100,
                "characteristics": {
                    "avg_total_events": segment_users['total_events'].mean(),
                    "avg_days_active": segment_users['unique_days_active'].mean(),
                    "avg_purchase_count": segment_users['purchase_count'].mean(),
                    "avg_total_spent": segment_users['total_spent'].mean(),
                    "has_username_ratio": segment_users['has_username'].mean(),
                    "avg_weekend_activity": segment_users['weekend_activity_ratio'].mean()
                }
            })
        
        return {
            "success": True,
            "data": {
                "segments": segments_data,
                "total_users": len(features_df),
                "model_version": segmentation_model.model_version if hasattr(segmentation_model, 'model_version') else "unknown"
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting segments: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting segments: {str(e)}")

@router.get("/users/{user_id}/segment")
async def get_user_segment(user_id: int):
    """
    Получение сегмента конкретного пользователя
    
    Args:
        user_id: ID пользователя
    
    Returns:
        Dict: Информация о сегменте пользователя
    """
    try:
        global segmentation_model
        
        if segmentation_model is None or segmentation_model.model is None:
            raise HTTPException(
                status_code=404,
                detail="Segmentation model not trained. Please train the model first."
            )
        
        # Получаем соединение с БД
        db_connection = get_db_connection()
        
        # Извлекаем признаки пользователя
        feature_extractor = UserFeatureExtractor(db_connection)
        features = feature_extractor.extract_user_features(user_id)
        
        if not features:
            raise HTTPException(
                status_code=404,
                detail=f"User {user_id} not found or no features available"
            )
        
        # Конвертируем в DataFrame
        features_df = features_to_dataframe([features])
        ml_features_df = prepare_features_for_ml(features_df)
        
        # Предсказываем сегмент
        user_segments = segmentation_model.predict(ml_features_df)
        segment_id = user_segments.get(user_id)
        
        if segment_id is None:
            raise HTTPException(
                status_code=500,
                detail="Error predicting user segment"
            )
        
        segment_name = segmentation_model.segment_names.get(segment_id, f"Сегмент {segment_id}")
        
        return {
            "success": True,
            "data": {
                "user_id": user_id,
                "segment_id": segment_id,
                "segment_name": segment_name,
                "features": {
                    "total_events": features.total_events,
                    "unique_days_active": features.unique_days_active,
                    "purchase_count": features.purchase_count,
                    "total_spent": features.total_spent,
                    "avg_events_per_day": features.avg_events_per_day,
                    "days_since_last_activity": features.days_since_last_activity
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user segment: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting user segment: {str(e)}")

@router.get("/users/segment/{segment_id}")
async def get_users_by_segment(
    segment_id: int,
    limit: int = Query(100, ge=1, le=1000, description="Максимальное количество пользователей"),
    offset: int = Query(0, ge=0, description="Смещение для пагинации")
):
    """
    Получение списка пользователей в определенном сегменте
    
    Args:
        segment_id: ID сегмента
        limit: Максимальное количество пользователей
        offset: Смещение для пагинации
    
    Returns:
        Dict: Список пользователей в сегменте
    """
    try:
        global segmentation_model
        
        if segmentation_model is None or segmentation_model.model is None:
            raise HTTPException(
                status_code=404,
                detail="Segmentation model not trained. Please train the model first."
            )
        
        # Получаем соединение с БД
        db_connection = get_db_connection()
        
        # Извлекаем признаки всех пользователей
        feature_extractor = UserFeatureExtractor(db_connection)
        features_list = feature_extractor.extract_all_users_features()
        
        if not features_list:
            return {"success": True, "data": {"users": [], "total": 0}}
        
        # Конвертируем в DataFrame
        features_df = features_to_dataframe(features_list)
        ml_features_df = prepare_features_for_ml(features_df)
        
        # Предсказываем сегменты
        user_segments = segmentation_model.predict(ml_features_df)
        
        # Фильтруем пользователей по сегменту
        segment_users = [
            user_id for user_id, seg_id in user_segments.items() 
            if seg_id == segment_id
        ]
        
        # Применяем пагинацию
        total_users = len(segment_users)
        paginated_users = segment_users[offset:offset + limit]
        
        # Получаем детальную информацию о пользователях
        users_info = []
        for user_id in paginated_users:
            user_features = features_df[features_df['user_id'] == user_id].iloc[0]
            users_info.append({
                "user_id": user_id,
                "telegram_id": user_features['telegram_id'],
                "total_events": user_features['total_events'],
                "unique_days_active": user_features['unique_days_active'],
                "purchase_count": user_features['purchase_count'],
                "total_spent": user_features['total_spent'],
                "days_since_last_activity": user_features['days_since_last_activity']
            })
        
        segment_name = segmentation_model.segment_names.get(segment_id, f"Сегмент {segment_id}")
        
        return {
            "success": True,
            "data": {
                "segment_id": segment_id,
                "segment_name": segment_name,
                "users": users_info,
                "pagination": {
                    "total": total_users,
                    "limit": limit,
                    "offset": offset,
                    "has_more": offset + limit < total_users
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting users by segment: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting users by segment: {str(e)}")

@router.post("/optimize")
async def optimize_model_parameters(
    limit: Optional[int] = Query(None, ge=1, le=10000, description="Ограничение количества пользователей для оптимизации")
):
    """
    Оптимизация параметров модели сегментации
    
    Args:
        limit: Ограничение количества пользователей для оптимизации
    
    Returns:
        Dict: Результат оптимизации параметров
    """
    try:
        global segmentation_model
        
        if segmentation_model is None:
            segmentation_model = UserSegmentationModel()
        
        # Получаем соединение с БД
        db_connection = get_db_connection()
        
        # Извлекаем признаки пользователей
        feature_extractor = UserFeatureExtractor(db_connection)
        features_list = feature_extractor.extract_all_users_features(limit)
        
        if len(features_list) < 10:
            raise HTTPException(
                status_code=400,
                detail="Недостаточно пользователей для оптимизации. Требуется минимум 10"
            )
        
        # Конвертируем в DataFrame
        features_df = features_to_dataframe(features_list)
        ml_features_df = prepare_features_for_ml(features_df)
        
        # Оптимизируем параметры
        optimization_result = segmentation_model.optimize_parameters(ml_features_df)
        
        return {
            "success": True,
            "message": "Model parameters optimized successfully",
            "data": {
                "best_params": optimization_result['best_params'],
                "best_score": optimization_result['best_score'],
                "recommendation": f"Рекомендуется использовать {optimization_result['best_params']['algorithm']} с {optimization_result['best_params']['n_clusters']} кластерами"
            }
        }
        
    except Exception as e:
        logger.error(f"Error optimizing model parameters: {e}")
        raise HTTPException(status_code=500, detail=f"Error optimizing parameters: {str(e)}")

@router.get("/stats")
async def get_segmentation_stats():
    """
    Получение статистики по сегментации
    
    Returns:
        Dict: Статистика сегментации
    """
    try:
        global segmentation_model
        
        if segmentation_model is None or segmentation_model.model is None:
            raise HTTPException(
                status_code=404,
                detail="Segmentation model not trained. Please train the model first."
            )
        
        # Получаем соединение с БД
        db_connection = get_db_connection()
        
        # Извлекаем признаки всех пользователей
        feature_extractor = UserFeatureExtractor(db_connection)
        features_list = feature_extractor.extract_all_users_features()
        
        if not features_list:
            return {"success": True, "data": {"stats": {}}}
        
        # Конвертируем в DataFrame
        features_df = features_to_dataframe(features_list)
        ml_features_df = prepare_features_for_ml(features_df)
        
        # Предсказываем сегменты
        user_segments = segmentation_model.predict(ml_features_df)
        
        # Рассчитываем статистику
        segment_counts = {}
        for segment_id in user_segments.values():
            segment_counts[segment_id] = segment_counts.get(segment_id, 0) + 1
        
        total_users = len(features_df)
        segment_distribution = {
            segment_id: {
                "count": count,
                "percentage": count / total_users * 100
            }
            for segment_id, count in segment_counts.items()
        }
        
        return {
            "success": True,
            "data": {
                "total_users": total_users,
                "segment_distribution": segment_distribution,
                "model_version": segmentation_model.model_version if hasattr(segmentation_model, 'model_version') else "unknown",
                "feature_extraction_date": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting segmentation stats: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting stats: {str(e)}")
