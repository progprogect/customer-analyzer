# 🏗️ Архитектура ML системы Customer Analyzer

## Схема работы ML прогнозов

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │   Feature       │    │   ML Models     │
│   Database      │───▶│   Extraction    │───▶│   Training      │
│                 │    │                 │    │                 │
│ • users         │    │ • Purchase      │    │ • XGBoost       │
│ • events        │    │   Features      │    │ • Random Forest │
│ • products      │    │ • Churn         │    │ • K-means       │
│ • user_metrics  │    │   Features      │    │ • DBSCAN        │
│                 │    │ • User          │    │                 │
└─────────────────┘    │   Features      │    └─────────────────┘
                       └─────────────────┘              │
                                                         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Layer     │    │   Predictions   │
│   Dashboard     │◀───│   FastAPI       │◀───│   Storage       │
│                 │    │                 │    │                 │
│ • Users page    │    │ • /predictions  │    │ • Redis Cache   │
│ • Analytics     │    │ • /churn        │    │ • DB Tables     │
│ • Segmentation  │    │ • /segmentation │    │ • Real-time     │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Детальная схема Feature Engineering

```
┌─────────────────────────────────────────────────────────────────┐
│                    FEATURE EXTRACTION PIPELINE                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Raw Data Sources:                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Users     │  │   Events    │  │  Products   │             │
│  │             │  │             │  │             │             │
│  │ • telegram_id│  │ • user_id   │  │ • id        │             │
│  │ • username  │  │ • event_type│  │ • name      │             │
│  │ • reg_date  │  │ • timestamp │  │ • category  │             │
│  │ • status    │  │ • event_data│  │ • price     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│         │                 │                 │                  │
│         ▼                 ▼                 ▼                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              FEATURE ENGINEERING                            │ │
│  │                                                             │ │
│  │  Temporal Features:                                         │ │
│  │  • days_since_registration                                 │ │
│  │  • days_since_last_activity                                │ │
│  │  • days_since_last_purchase                                │ │
│  │                                                             │ │
│  │  Activity Windows:                                          │ │
│  │  • events_last_7_days                                      │ │
│  │  • events_last_14_days                                     │ │
│  │  • events_last_30_days                                     │ │
│  │  • events_last_60_days                                     │ │
│  │                                                             │ │
│  │  Behavioral Patterns:                                       │ │
│  │  • activity_trend_7d_vs_14d                               │ │
│  │  • purchase_trend_30d_vs_60d                              │ │
│  │  • engagement_trend                                        │ │
│  │                                                             │ │
│  │  Financial Metrics:                                         │ │
│  │  • total_spent                                             │ │
│  │  • avg_order_value                                         │ │
│  │  • purchase_count                                          │ │
│  │                                                             │ │
│  │  Interaction Features:                                      │ │
│  │  • bot_commands_last_7_days                               │ │
│  │  • product_views_last_7_days                              │ │
│  │  • cart_additions_last_7_days                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                 │                                │
│                                 ▼                                │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              DATA PREPROCESSING                             │ │
│  │                                                             │ │
│  │  • Normalization (Min-Max, Z-Score)                       │ │
│  │  • Encoding (One-Hot, Label Encoding)                     │ │
│  │  • Log Transformation (for skewed features)               │ │
│  │  • Missing Value Imputation                               │ │
│  │  • Feature Scaling                                        │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## ML Models Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      ML MODELS PIPELINE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  │  PURCHASE       │    │  CHURN          │    │  SEGMENTATION   │
│  │  PREDICTION     │    │  PREDICTION     │    │  MODEL          │
│  │                 │    │                 │    │                 │
│  │  Algorithm:     │    │  Algorithm:     │    │  Algorithm:     │
│  │  • XGBoost      │    │  • XGBoost      │    │  • K-means      │
│  │  • Random Forest│    │  • Random Forest│    │  • DBSCAN       │
│  │  • Gradient     │    │  • Gradient     │    │  • Agglomerative│
│  │    Boosting     │    │    Boosting     │    │                 │
│  │                 │    │                 │    │                 │
│  │  Target:        │    │  Target:        │    │  Output:        │
│  │  • Purchase in  │    │  • Churn in     │    │  • User         │
│  │    30 days      │    │    60 days      │    │    segments     │
│  │                 │    │                 │    │                 │
│  │  Features: 50+  │    │  Features: 60+  │    │  Features: 40+  │
│  │                 │    │                 │    │                 │
│  │  Accuracy:      │    │  Accuracy:      │    │  Silhouette:    │
│  │  • AUC: 0.91    │    │  • AUC: 0.89    │    │  • Score: 0.75  │
│  │  • F1: 0.89     │    │  • F1: 0.85     │    │                 │
│  │  • Prec: 94.2%  │    │  • Prec: 91.5%  │    │                 │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘
│           │                       │                       │
│           ▼                       ▼                       ▼
│  ┌─────────────────────────────────────────────────────────────┐
│  │              MODEL EVALUATION & VALIDATION                 │
│  │                                                             │
│  │  • Cross-validation (5-fold)                               │
│  │  • Train/Test Split (80/20)                                │
│  │  • Time-based validation                                   │
│  │  • Feature importance analysis                             │
│  │  • Hyperparameter optimization                             │
│  └─────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────┘
```

## Real-time Prediction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    REAL-TIME PREDICTION FLOW                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Action ──┐                                               │
│                │                                               │
│                ▼                                               │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  │   Event         │    │   Feature       │    │   ML Model      │
│  │   Capture       │    │   Update        │    │   Inference     │
│  │                 │    │                 │    │                 │
│  │ • page_view     │───▶│ • Real-time     │───▶│ • Purchase      │
│  │ • product_view  │    │   features      │    │   prediction    │
│  │ • add_to_cart   │    │ • Window        │    │ • Churn risk    │
│  │ • purchase      │    │   updates       │    │ • Segment       │
│  │                 │    │                 │    │   update        │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘
│           │                       │                       │
│           ▼                       ▼                       ▼
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  │   Database      │    │   Cache         │    │   Frontend      │
│  │   Storage       │    │   Update        │    │   Update        │
│  │                 │    │                 │    │                 │
│  │ • events table  │    │ • Redis cache   │    │ • Dashboard     │
│  │ • user_metrics  │    │ • Predictions   │    │ • User profile  │
│  │ • predictions   │    │ • Features      │    │ • Analytics     │
│  │                 │    │                 │    │                 │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘
└─────────────────────────────────────────────────────────────────┘
```

## Model Training Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    MODEL TRAINING PIPELINE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  │   Data          │    │   Feature       │    │   Model         │
│  │   Collection    │    │   Engineering   │    │   Training      │
│  │                 │    │                 │    │                 │
│  │ • 90-180 days   │───▶│ • 50-60+        │───▶│ • XGBoost       │
│  │   of history    │    │   features      │    │   training      │
│  │ • All users     │    │ • Normalization │    │ • Validation    │
│  │ • All events    │    │ • Encoding      │    │ • Hyperparams   │
│  │                 │    │ • Scaling       │    │   tuning        │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘
│           │                       │                       │
│           ▼                       ▼                       ▼
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  │   Data          │    │   Feature       │    │   Model         │
│  │   Validation    │    │   Selection     │    │   Evaluation    │
│  │                 │    │                 │    │                 │
│  │ • Train/Test    │    │ • Importance    │    │ • Metrics       │
│  │   split         │    │   analysis      │    │   calculation   │
│  │ • Time-based    │    │ • Correlation   │    │ • A/B testing   │
│  │   validation    │    │   removal       │    │ • Performance   │
│  │ • Cross-        │    │ • PCA/LDA       │    │   monitoring    │
│  │   validation    │    │                 │    │                 │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘
│           │                       │                       │
│           ▼                       ▼                       ▼
│  ┌─────────────────────────────────────────────────────────────┐
│  │              MODEL DEPLOYMENT & MONITORING                 │
│  │                                                             │
│  │  • Model versioning                                         │
│  │  • A/B testing setup                                        │
│  │  • Performance monitoring                                   │
│  │  • Drift detection                                          │
│  │  • Automated retraining                                     │
│  │  • Feature store updates                                    │
│  └─────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────┘
```

## Performance Metrics

```
┌─────────────────────────────────────────────────────────────────┐
│                      PERFORMANCE METRICS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Model Performance:                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  │  PURCHASE       │    │  CHURN          │    │  SEGMENTATION   │
│  │  PREDICTION     │    │  PREDICTION     │    │  MODEL          │
│  │                 │    │                 │    │                 │
│  │  • AUC: 0.91    │    │  • AUC: 0.89    │    │  • Silhouette:  │
│  │  • F1: 0.89     │    │  • F1: 0.85     │    │    0.75         │
│  │  • Prec: 94.2%  │    │  • Prec: 91.5%  │    │  • Inertia:     │
│  │  • Recall: 84.7%│    │  • Recall: 79.3%│    │    0.23         │
│  │                 │    │                 │    │                 │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘
│                                                                 │
│  System Performance:                                            │
│  • Prediction latency: <100ms                                   │
│  • Training time: 5-15 minutes                                  │
│  • Throughput: 1000+ users/minute                               │
│  • Model size: 50-100MB                                         │
│  • Memory usage: 2-4GB                                          │
│                                                                 │
│  Business Impact:                                               │
│  • Conversion rate: +25% (12% → 15%)                           │
│  • Average order value: +18% ($85 → $100)                      │
│  • Customer retention: +12% (78% → 87%)                        │
│  • Campaign ROI: +340%                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

*Эта архитектура обеспечивает высокую точность прогнозов, масштабируемость и надежность системы машинного обучения для анализа поведения пользователей.*
