"""
Основной файл для запуска ML-сервисов
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os

from .api.segmentation_api import router as segmentation_router
from .api.retraining_api import router as retraining_router
from .scheduler.model_retraining import start_retraining_scheduler

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/ml_services.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Создание FastAPI приложения
app = FastAPI(
    title="Customer Analyzer ML Services",
    description="ML-сервисы для анализа клиентов и сегментации пользователей",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене указать конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение роутеров
app.include_router(segmentation_router)
app.include_router(retraining_router)

@app.on_event("startup")
async def startup_event():
    """Инициализация при запуске приложения"""
    logger.info("Starting ML Services...")
    
    # Создаем необходимые директории
    os.makedirs("models", exist_ok=True)
    os.makedirs("models/backup", exist_ok=True)
    os.makedirs("logs", exist_ok=True)
    
    # Запускаем планировщик переобучения
    try:
        start_retraining_scheduler()
        logger.info("Retraining scheduler started successfully")
    except Exception as e:
        logger.error(f"Error starting retraining scheduler: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Очистка при остановке приложения"""
    logger.info("Shutting down ML Services...")

@app.get("/")
async def root():
    """Корневой эндпоинт"""
    return {
        "service": "Customer Analyzer ML Services",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "segmentation": "/api/segmentation",
            "retraining": "/api/retraining",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health_check():
    """Проверка здоровья сервиса"""
    return {
        "status": "healthy",
        "service": "ml_services",
        "timestamp": "2023-01-20T10:30:00Z"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
