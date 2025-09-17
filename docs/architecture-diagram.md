# Диаграммы архитектуры системы

## C4 Model - Level 1: System Context

```mermaid
graph TB
    User[👤 Пользователь] --> Bot[📱 Telegram Bot]
    Admin[👨‍💼 Администратор] --> Dashboard[🖥️ Web Dashboard]
    Bot --> System[🏢 Система аналитики и рекомендаций]
    Dashboard --> System
    System --> DB[(🗄️ PostgreSQL)]
    System --> ML[🤖 ML Services]
```

## C4 Model - Level 2: Container Diagram

```mermaid
graph TB
    subgraph "Frontend Layer"
        Dashboard[React Dashboard<br/>Port: 3000]
    end
    
    subgraph "Backend Layer"
        API[Node.js API<br/>Port: 8000]
        Bot[Telegram Bot<br/>Port: 8001]
    end
    
    subgraph "ML Layer"
        MLService[Python ML Services<br/>Port: 8002]
    end
    
    subgraph "Data Layer"
        PostgreSQL[(PostgreSQL<br/>Port: 5432)]
        Redis[(Redis Cache<br/>Port: 6379)]
    end
    
    Dashboard -->|HTTP/REST| API
    Bot -->|HTTP/REST| API
    API -->|SQL| PostgreSQL
    API -->|Cache| Redis
    MLService -->|SQL| PostgreSQL
    API -->|HTTP/REST| MLService
```

## C4 Model - Level 3: Component Diagram (Backend API)

```mermaid
graph TB
    subgraph "Node.js API Container"
        Auth[Authentication<br/>Middleware]
        Routes[API Routes]
        Services[Business Services]
        Models[Data Models]
        Utils[Utilities]
    end
    
    subgraph "External Systems"
        TelegramAPI[Telegram Bot API]
        PostgreSQL[(PostgreSQL)]
        Redis[(Redis)]
        MLAPI[ML Services API]
    end
    
    Auth --> Routes
    Routes --> Services
    Services --> Models
    Services --> Utils
    Models --> PostgreSQL
    Services --> Redis
    Services --> MLAPI
    Routes --> TelegramAPI
```

## Data Flow Diagram

```mermaid
graph LR
    subgraph "Data Sources"
        Historical[📊 Исторические данные]
        BotEvents[🤖 События от бота]
        UserActions[👤 Действия пользователей]
    end
    
    subgraph "ETL Process"
        ETL[🔄 ETL Pipeline]
        Validation[✅ Валидация данных]
    end
    
    subgraph "Data Storage"
        RawData[(📋 Сырые данные)]
        ProcessedData[(⚡ Обработанные данные)]
    end
    
    subgraph "ML Pipeline"
        FeatureEng[🔧 Feature Engineering]
        ModelTraining[🎯 Обучение моделей]
        Predictions[🔮 Прогнозы]
    end
    
    subgraph "Applications"
        Dashboard[🖥️ Dashboard]
        Bot[📱 Bot]
        API[🔌 API]
    end
    
    Historical --> ETL
    BotEvents --> ETL
    UserActions --> ETL
    ETL --> Validation
    Validation --> RawData
    RawData --> FeatureEng
    FeatureEng --> ProcessedData
    ProcessedData --> ModelTraining
    ModelTraining --> Predictions
    Predictions --> Dashboard
    Predictions --> Bot
    Predictions --> API
```

## ML Pipeline Architecture

```mermaid
graph TB
    subgraph "Data Processing"
        DataIngestion[📥 Data Ingestion]
        FeatureExtraction[🔍 Feature Extraction]
        DataValidation[✅ Data Validation]
    end
    
    subgraph "Model Training"
        Segmentation[👥 User Segmentation<br/>K-means/DBSCAN]
        PurchasePred[🛒 Purchase Prediction<br/>Random Forest]
        ChurnPred[🚪 Churn Prediction<br/>XGBoost]
        Recommendation[🎯 Recommendation System<br/>Collaborative + Content-based]
    end
    
    subgraph "Model Serving"
        ModelStorage[💾 Model Storage]
        BatchInference[📊 Batch Inference]
        RealTimeInference[⚡ Real-time Inference]
    end
    
    subgraph "Monitoring"
        ModelMetrics[📈 Model Metrics]
        DataDrift[🔄 Data Drift Detection]
        Performance[⚡ Performance Monitoring]
    end
    
    DataIngestion --> FeatureExtraction
    FeatureExtraction --> DataValidation
    DataValidation --> Segmentation
    DataValidation --> PurchasePred
    DataValidation --> ChurnPred
    DataValidation --> Recommendation
    
    Segmentation --> ModelStorage
    PurchasePred --> ModelStorage
    ChurnPred --> ModelStorage
    Recommendation --> ModelStorage
    
    ModelStorage --> BatchInference
    ModelStorage --> RealTimeInference
    
    BatchInference --> ModelMetrics
    RealTimeInference --> ModelMetrics
    DataValidation --> DataDrift
    ModelStorage --> Performance
```

## API Architecture

```mermaid
graph TB
    subgraph "API Gateway"
        Gateway[🌐 API Gateway<br/>Rate Limiting, Auth, CORS]
    end
    
    subgraph "Authentication"
        JWT[🔐 JWT Token Service]
        AuthMiddleware[🛡️ Auth Middleware]
    end
    
    subgraph "API Endpoints"
        UserAPI[👤 User API]
        AnalyticsAPI[📊 Analytics API]
        MLAPI[🤖 ML API]
        BotAPI[📱 Bot API]
    end
    
    subgraph "Business Logic"
        UserService[👤 User Service]
        AnalyticsService[📊 Analytics Service]
        MLService[🤖 ML Service]
        BotService[📱 Bot Service]
    end
    
    subgraph "Data Access"
        UserRepo[👤 User Repository]
        AnalyticsRepo[📊 Analytics Repository]
        MLRepo[🤖 ML Repository]
    end
    
    Gateway --> JWT
    Gateway --> AuthMiddleware
    AuthMiddleware --> UserAPI
    AuthMiddleware --> AnalyticsAPI
    AuthMiddleware --> MLAPI
    AuthMiddleware --> BotAPI
    
    UserAPI --> UserService
    AnalyticsAPI --> AnalyticsService
    MLAPI --> MLService
    BotAPI --> BotService
    
    UserService --> UserRepo
    AnalyticsService --> AnalyticsRepo
    MLService --> MLRepo
```

## Database Schema Relationships

```mermaid
erDiagram
    USERS ||--o{ EVENTS : "has"
    USERS ||--|| USER_METRICS : "has"
    PRODUCTS ||--o{ EVENTS : "involves"
    
    USERS {
        int user_id PK
        bigint telegram_id UK
        varchar first_name
        varchar last_name
        varchar username
        timestamp registration_date
        jsonb profile_data
    }
    
    PRODUCTS {
        int product_id PK
        varchar name
        varchar category
        numeric price
        text description
        jsonb attributes
    }
    
    EVENTS {
        bigint event_id PK
        int user_id FK
        int product_id FK
        varchar event_type
        timestamp event_timestamp
        jsonb properties
    }
    
    USER_METRICS {
        int user_id PK,FK
        int segment_id
        numeric ltv
        real churn_probability
        real purchase_probability_30d
        timestamp last_updated
    }
```
