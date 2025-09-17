"""
API для управления переобучением ML-моделей
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any, Optional
from datetime import datetime
import logging

from ..scheduler.model_retraining import get_retraining_scheduler

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/retraining", tags=["retraining"])

@router.get("/status")
async def get_retraining_status():
    """
    Получение статуса системы переобучения моделей
    
    Returns:
        Dict: Статус переобучения
    """
    try:
        scheduler = get_retraining_scheduler()
        status = scheduler.get_retraining_status()
        
        return {
            "success": True,
            "data": status,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting retraining status: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting status: {str(e)}")

@router.post("/trigger")
async def trigger_retraining(
    model_type: str = "segmentation",
    background_tasks: BackgroundTasks = None
):
    """
    Принудительное переобучение модели
    
    Args:
        model_type: Тип модели для переобучения (segmentation)
        background_tasks: Фоновые задачи FastAPI
    
    Returns:
        Dict: Результат запуска переобучения
    """
    try:
        scheduler = get_retraining_scheduler()
        
        if background_tasks:
            # Запускаем в фоновом режиме
            background_tasks.add_task(scheduler.trigger_retraining, model_type)
            
            return {
                "success": True,
                "message": f"Retraining of {model_type} model started in background",
                "timestamp": datetime.now().isoformat()
            }
        else:
            # Запускаем синхронно
            scheduler.trigger_retraining(model_type)
            
            return {
                "success": True,
                "message": f"Retraining of {model_type} model completed",
                "timestamp": datetime.now().isoformat()
            }
        
    except Exception as e:
        logger.error(f"Error triggering retraining: {e}")
        raise HTTPException(status_code=500, detail=f"Error triggering retraining: {str(e)}")

@router.put("/config")
async def update_retraining_config(config: Dict[str, Any]):
    """
    Обновление конфигурации переобучения
    
    Args:
        config: Новая конфигурация
    
    Returns:
        Dict: Результат обновления конфигурации
    """
    try:
        scheduler = get_retraining_scheduler()
        scheduler.update_retraining_config(config)
        
        return {
            "success": True,
            "message": "Retraining configuration updated successfully",
            "data": scheduler.retraining_config,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error updating retraining config: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating config: {str(e)}")

@router.get("/config")
async def get_retraining_config():
    """
    Получение текущей конфигурации переобучения
    
    Returns:
        Dict: Текущая конфигурация
    """
    try:
        scheduler = get_retraining_scheduler()
        
        return {
            "success": True,
            "data": scheduler.retraining_config,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting retraining config: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting config: {str(e)}")

@router.post("/start")
async def start_retraining_scheduler():
    """
    Запуск планировщика переобучения
    
    Returns:
        Dict: Результат запуска планировщика
    """
    try:
        scheduler = get_retraining_scheduler()
        scheduler.start()
        
        return {
            "success": True,
            "message": "Retraining scheduler started successfully",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error starting retraining scheduler: {e}")
        raise HTTPException(status_code=500, detail=f"Error starting scheduler: {str(e)}")

@router.post("/stop")
async def stop_retraining_scheduler():
    """
    Остановка планировщика переобучения
    
    Returns:
        Dict: Результат остановки планировщика
    """
    try:
        scheduler = get_retraining_scheduler()
        scheduler.stop()
        
        return {
            "success": True,
            "message": "Retraining scheduler stopped successfully",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error stopping retraining scheduler: {e}")
        raise HTTPException(status_code=500, detail=f"Error stopping scheduler: {str(e)}")
