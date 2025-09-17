# Руководство разработчика Customer Analyzer

## Введение

Данное руководство предназначено для разработчиков, которые будут работать с кодом системы Customer Analyzer. Оно содержит информацию о структуре проекта, стандартах кодирования, процессах разработки и архитектуре системы.

## Структура проекта

```
customer-analyzer/
├── backend/                 # Backend API сервис
│   ├── src/
│   │   ├── controllers/     # Контроллеры API
│   │   ├── middleware/      # Middleware функции
│   │   ├── models/          # Модели данных
│   │   ├── routes/          # Маршруты API
│   │   ├── services/        # Бизнес-логика
│   │   ├── utils/           # Утилиты
│   │   └── tests/           # Тесты
│   ├── Dockerfile           # Docker образ для development
│   ├── Dockerfile.prod      # Docker образ для production
│   ├── package.json         # Зависимости Node.js
│   └── tsconfig.json        # Конфигурация TypeScript
│
├── frontend/                # Frontend приложение
│   ├── public/              # Статические файлы
│   ├── src/
│   │   ├── components/      # React компоненты
│   │   ├── pages/           # Страницы приложения
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API сервисы
│   │   ├── contexts/        # React contexts
│   │   ├── utils/           # Утилиты
│   │   └── __tests__/       # Тесты
│   ├── Dockerfile           # Docker образ для development
│   ├── Dockerfile.prod      # Docker образ для production
│   ├── package.json         # Зависимости React
│   └── tsconfig.json        # Конфигурация TypeScript
│
├── ml-services/             # ML сервисы
│   ├── src/
│   │   ├── models/          # ML модели
│   │   ├── features/        # Извлечение признаков
│   │   ├── api/             # FastAPI endpoints
│   │   ├── utils/           # Утилиты
│   │   └── tests/           # Тесты
│   ├── Dockerfile           # Docker образ для development
│   ├── Dockerfile.prod      # Docker образ для production
│   ├── requirements.txt     # Зависимости Python
│   └── pytest.ini          # Конфигурация pytest
│
├── database/                # База данных
│   ├── init/                # Скрипты инициализации
│   ├── migrations/          # Миграции БД
│   └── backups/             # Резервные копии
│
├── docs/                    # Документация
│   ├── api/                 # API документация
│   ├── architecture/        # Архитектурная документация
│   ├── user-guide/          # Руководства пользователя
│   ├── admin-guide/         # Руководства администратора
│   └── developer-guide/     # Руководства разработчика
│
├── scripts/                 # Скрипты развертывания
├── monitoring/              # Конфигурация мониторинга
├── nginx/                   # Конфигурация Nginx
├── secrets/                 # Управление секретами
└── docker-compose.yml       # Docker Compose для development
```

## Технологический стек

### Backend
- **Node.js 18+** - JavaScript runtime
- **Express.js** - Web framework
- **TypeScript** - Типизированный JavaScript
- **PostgreSQL** - Основная база данных
- **Redis** - Кэширование и сессии
- **JWT** - Аутентификация
- **Winston** - Логирование
- **Jest** - Тестирование

### Frontend
- **React 18+** - UI библиотека
- **TypeScript** - Типизированный JavaScript
- **Material-UI** - UI компоненты
- **React Router** - Маршрутизация
- **Axios** - HTTP клиент
- **React Query** - Управление состоянием сервера
- **Recharts** - Графики и диаграммы
- **Jest + React Testing Library** - Тестирование

### ML Services
- **Python 3.9+** - Основной язык
- **FastAPI** - Web framework
- **scikit-learn** - ML библиотеки
- **XGBoost** - Gradient boosting
- **pandas** - Обработка данных
- **numpy** - Численные вычисления
- **pytest** - Тестирование

### DevOps
- **Docker** - Контейнеризация
- **Docker Compose** - Оркестрация
- **Nginx** - Reverse proxy
- **Prometheus** - Мониторинг
- **Grafana** - Визуализация метрик
- **ELK Stack** - Логирование
- **GitHub Actions** - CI/CD

## Настройка среды разработки

### Предварительные требования

1. **Node.js 18+**:
```bash
# Установка через nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

2. **Python 3.9+**:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3.9 python3.9-pip python3.9-venv

# macOS
brew install python@3.9
```

3. **Docker и Docker Compose**:
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

4. **PostgreSQL и Redis**:
```bash
# Через Docker (рекомендуется)
docker run --name postgres-dev -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:14
docker run --name redis-dev -p 6379:6379 -d redis:7
```

### Настройка проекта

1. **Клонирование репозитория**:
```bash
git clone <repository-url>
cd customer-analyzer
```

2. **Установка зависимостей Backend**:
```bash
cd backend
npm install
```

3. **Установка зависимостей Frontend**:
```bash
cd ../frontend
npm install
```

4. **Настройка Python окружения**:
```bash
cd ../ml-services
python3.9 -m venv venv
source venv/bin/activate  # Linux/macOS
# или
venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

5. **Настройка переменных окружения**:
```bash
# Backend
cp backend/.env.example backend/.env
# Отредактируйте backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
# Отредактируйте frontend/.env.local

# ML Services
cp ml-services/.env.example ml-services/.env
# Отредактируйте ml-services/.env
```

6. **Запуск development окружения**:
```bash
# Запуск всех сервисов
docker-compose up -d postgres redis

# Запуск Backend
cd backend
npm run dev

# Запуск Frontend
cd ../frontend
npm start

# Запуск ML Services
cd ../ml-services
source venv/bin/activate
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

## Стандарты кодирования

### TypeScript/JavaScript

**ESLint конфигурация**:
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "indent": ["error", 2],
    "quotes": ["error", "single"],
    "semi": ["error", "always"],
    "no-unused-vars": "error",
    "no-console": "warn",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}
```

**Примеры кода**:

```typescript
// Хорошо
interface User {
  id: number;
  name: string;
  email: string;
}

class UserService {
  async getUser(id: number): Promise<User | null> {
    try {
      const user = await this.userRepository.findById(id);
      return user;
    } catch (error) {
      this.logger.error('Failed to get user', { id, error });
      throw new Error('User not found');
    }
  }
}

// Плохо
function getUser(id) {
  return db.users.find(u => u.id === id);
}
```

### Python

**PEP 8 конфигурация**:
```ini
# setup.cfg
[flake8]
max-line-length = 88
extend-ignore = E203, W503
exclude = venv,__pycache__,migrations
```

**Примеры кода**:

```python
# Хорошо
from typing import List, Optional, Dict, Any
import pandas as pd
from sklearn.cluster import KMeans

class UserSegmentationModel:
    """Модель сегментации пользователей."""
    
    def __init__(self, n_clusters: int = 4) -> None:
        self.n_clusters = n_clusters
        self.model: Optional[KMeans] = None
        
    def fit(self, features: pd.DataFrame) -> Dict[str, Any]:
        """Обучение модели сегментации."""
        if features.empty:
            raise ValueError("Features cannot be empty")
            
        self.model = KMeans(n_clusters=self.n_clusters, random_state=42)
        self.model.fit(features)
        
        return {
            'n_clusters': self.n_clusters,
            'inertia': self.model.inertia_,
            'labels': self.model.labels_
        }

# Плохо
def segment_users(data, k=4):
    model = KMeans(k)
    return model.fit(data)
```

### React

**Примеры компонентов**:

```typescript
// Хорошо
import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useSegmentationData } from '../../hooks/useMLData';

interface SegmentationOverviewProps {
  refreshInterval?: number;
}

const SegmentationOverview: React.FC<SegmentationOverviewProps> = ({
  refreshInterval = 300000
}) => {
  const { segments, isLoading, error, retrain } = useSegmentationData();
  
  const handleRetrain = useCallback(async () => {
    try {
      await retrain();
    } catch (error) {
      console.error('Failed to retrain model:', error);
    }
  }, [retrain]);
  
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Typography color="error">
        Error loading segmentation data: {error.message}
      </Typography>
    );
  }
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        User Segmentation
      </Typography>
      {/* Остальной код компонента */}
    </Box>
  );
};

export default SegmentationOverview;

// Плохо
const SegmentationOverview = () => {
  const [data, setData] = useState();
  
  useEffect(() => {
    fetch('/api/segmentation').then(res => res.json()).then(setData);
  }, []);
  
  return <div>{data && data.map(item => <div>{item.name}</div>)}</div>;
};
```

## Тестирование

### Backend тестирование

**Unit тесты**:
```typescript
// backend/src/tests/services/userService.test.ts
import { UserService } from '../../services/userService';
import { UserRepository } from '../../repositories/userRepository';

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  
  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<UserRepository>;
    
    userService = new UserService(mockUserRepository);
  });
  
  describe('getUser', () => {
    it('should return user when found', async () => {
      const mockUser = { id: 1, name: 'John Doe', email: 'john@example.com' };
      mockUserRepository.findById.mockResolvedValue(mockUser);
      
      const result = await userService.getUser(1);
      
      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
    });
    
    it('should return null when user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);
      
      const result = await userService.getUser(999);
      
      expect(result).toBeNull();
    });
  });
});
```

**Integration тесты**:
```typescript
// backend/src/tests/integration/api.test.ts
import request from 'supertest';
import { app } from '../../app';

describe('User API', () => {
  describe('GET /api/users/:id', () => {
    it('should return user data', async () => {
      const response = await request(app)
        .get('/api/users/1')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('name');
    });
    
    it('should return 404 for non-existent user', async () => {
      await request(app)
        .get('/api/users/999')
        .expect(404);
    });
  });
});
```

### Frontend тестирование

**Component тесты**:
```typescript
// frontend/src/__tests__/components/SegmentationOverview.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SegmentationOverview from '../../components/MLComponents/SegmentationComponents';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('SegmentationOverview', () => {
  it('renders segmentation data correctly', async () => {
    render(
      <TestWrapper>
        <SegmentationOverview />
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('User Segmentation')).toBeInTheDocument();
    });
  });
  
  it('handles retrain button click', async () => {
    render(
      <TestWrapper>
        <SegmentationOverview />
      </TestWrapper>
    );
    
    const retrainButton = screen.getByText('Retrain Model');
    fireEvent.click(retrainButton);
    
    await waitFor(() => {
      expect(screen.getByText('Retraining...')).toBeInTheDocument();
    });
  });
});
```

### ML Services тестирование

**Unit тесты**:
```python
# ml-services/tests/test_user_segmentation.py
import pytest
import pandas as pd
import numpy as np
from unittest.mock import Mock, patch
from src.models.user_segmentation import UserSegmentationModel

class TestUserSegmentationModel:
    @pytest.fixture
    def sample_features(self):
        """Фикстура с тестовыми признаками."""
        np.random.seed(42)
        X = np.random.rand(100, 10)
        return pd.DataFrame(X, columns=[f'feature_{i}' for i in range(10)])
    
    def test_kmeans_segmentation(self, sample_features):
        """Тест кластеризации K-means."""
        model = UserSegmentationModel()
        features = sample_features.values
        
        segments = model.kmeans_clustering(features, n_clusters=4)
        
        assert len(segments) == len(features)
        assert len(np.unique(segments)) <= 4
        assert all(0 <= segment < 4 for segment in segments)
    
    def test_evaluate_clustering_quality(self, sample_features):
        """Тест оценки качества кластеризации."""
        model = UserSegmentationModel()
        features = sample_features.values
        segments = model.kmeans_clustering(features, n_clusters=4)
        
        metrics = model.evaluate_clustering_quality(features, segments)
        
        assert 'silhouette_score' in metrics
        assert 'inertia' in metrics
        assert 0 <= metrics['silhouette_score'] <= 1
        assert metrics['inertia'] >= 0
```

**Integration тесты**:
```python
# ml-services/tests/test_api_integration.py
import pytest
import requests

class TestMLAPI:
    @pytest.fixture
    def api_url(self):
        return "http://localhost:8000/api"
    
    def test_segmentation_endpoints(self, api_url):
        """Тест эндпоинтов сегментации."""
        response = requests.get(f"{api_url}/segmentation/segments")
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] is True
        assert 'data' in data
    
    def test_purchase_prediction_endpoints(self, api_url):
        """Тест эндпоинтов прогноза покупок."""
        response = requests.get(f"{api_url}/purchase-prediction/predictions")
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] is True
        assert isinstance(data['data'], list)
```

## Процесс разработки

### Git workflow

1. **Создание feature ветки**:
```bash
git checkout main
git pull origin main
git checkout -b feature/new-feature-name
```

2. **Коммиты**:
```bash
# Частые, небольшие коммиты
git add .
git commit -m "feat: add user segmentation API endpoint

- Added GET /api/users/segments endpoint
- Implemented segmentation logic in UserService
- Added tests for segmentation functionality

Refs: T-3.1, FR-3.1.1"
```

3. **Push и Pull Request**:
```bash
git push origin feature/new-feature-name
# Создать Pull Request через GitHub
```

### Коммит сообщения

Используйте conventional commits:
- `feat:` - новая функциональность
- `fix:` - исправление ошибки
- `docs:` - изменения в документации
- `style:` - форматирование кода
- `refactor:` - рефакторинг кода
- `test:` - добавление тестов
- `chore:` - обновление зависимостей, конфигурации

### Code Review

**Checklist для reviewer**:
- [ ] Код соответствует стандартам проекта
- [ ] Добавлены необходимые тесты
- [ ] Документация обновлена
- [ ] Нет уязвимостей безопасности
- [ ] Производительность не деградировала
- [ ] Логирование добавлено где необходимо

### CI/CD Pipeline

**GitHub Actions workflow**:
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
    
    - name: Install dependencies
      run: |
        cd backend && npm ci
        cd ../frontend && npm ci
        cd ../ml-services && pip install -r requirements.txt
    
    - name: Run tests
      run: |
        cd backend && npm test
        cd ../frontend && npm test
        cd ../ml-services && pytest tests/
    
    - name: Build Docker images
      run: |
        docker build -t customer-analyzer-backend ./backend
        docker build -t customer-analyzer-frontend ./frontend
        docker build -t customer-analyzer-ml ./ml-services
```

## Архитектурные паттерны

### Backend архитектура

**Слоистая архитектура**:
```
Controllers (API endpoints)
    ↓
Services (Business logic)
    ↓
Repositories (Data access)
    ↓
Database
```

**Пример структуры**:
```typescript
// Controller
export class UserController {
  constructor(private userService: UserService) {}
  
  async getUsers(req: Request, res: Response) {
    const users = await this.userService.getUsers(req.query);
    res.json({ success: true, data: users });
  }
}

// Service
export class UserService {
  constructor(private userRepository: UserRepository) {}
  
  async getUsers(filters: UserFilters): Promise<User[]> {
    return this.userRepository.findByFilters(filters);
  }
}

// Repository
export class UserRepository {
  constructor(private db: Database) {}
  
  async findByFilters(filters: UserFilters): Promise<User[]> {
    // SQL запросы
  }
}
```

### Frontend архитектура

**Component-based архитектура**:
```
Pages
    ↓
Components (UI components)
    ↓
Hooks (Business logic)
    ↓
Services (API calls)
    ↓
Context (State management)
```

### ML Services архитектура

**Service-oriented архитектура**:
```
API Endpoints
    ↓
ML Services (Business logic)
    ↓
Feature Extractors (Data processing)
    ↓
Models (ML algorithms)
    ↓
Database
```

## Отладка и профилирование

### Backend отладка

**Логирование**:
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Использование
logger.info('User created', { userId: 123, email: 'user@example.com' });
logger.error('Database connection failed', { error: error.message });
```

**Профилирование**:
```typescript
import { performance } from 'perf_hooks';

async function slowOperation() {
  const start = performance.now();
  
  try {
    // Ваша операция
    await someAsyncOperation();
  } finally {
    const duration = performance.now() - start;
    logger.info('Operation completed', { duration: `${duration}ms` });
  }
}
```

### Frontend отладка

**React DevTools**:
- Установите React Developer Tools
- Используйте Profiler для анализа производительности
- Проверяйте состояние компонентов

**Логирование**:
```typescript
// В development режиме
if (process.env.NODE_ENV === 'development') {
  console.log('Component rendered', { props, state });
}

// Использование React Query DevTools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <>
      {/* Ваше приложение */}
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}
```

### ML Services отладка

**Логирование**:
```python
import logging
import time

logger = logging.getLogger(__name__)

def train_model(features, labels):
    start_time = time.time()
    
    try:
        model = SomeMLModel()
        model.fit(features, labels)
        
        duration = time.time() - start_time
        logger.info(f"Model training completed", extra={
            'duration': duration,
            'samples': len(features),
            'features': features.shape[1]
        })
        
        return model
    except Exception as e:
        logger.error(f"Model training failed: {str(e)}")
        raise
```

**Профилирование**:
```python
import cProfile
import pstats

def profile_function():
    # Ваша функция
    pass

# Запуск профилирования
profiler = cProfile.Profile()
profiler.enable()
profile_function()
profiler.disable()

# Анализ результатов
stats = pstats.Stats(profiler)
stats.sort_stats('cumulative')
stats.print_stats(10)  # Топ 10 функций
```

## Документация кода

### JSDoc для TypeScript

```typescript
/**
 * Сервис для управления пользователями
 * @class UserService
 */
export class UserService {
  /**
   * Получение пользователя по ID
   * @param {number} id - ID пользователя
   * @returns {Promise<User | null>} Пользователь или null если не найден
   * @throws {Error} Если произошла ошибка при обращении к БД
   * @example
   * ```typescript
   * const user = await userService.getUser(123);
   * if (user) {
   *   console.log(user.name);
   * }
   * ```
   */
  async getUser(id: number): Promise<User | null> {
    // Реализация
  }
}
```

### Docstrings для Python

```python
def segment_users(features: pd.DataFrame, n_clusters: int = 4) -> Dict[str, Any]:
    """
    Сегментация пользователей с помощью K-means кластеризации.
    
    Args:
        features (pd.DataFrame): Матрица признаков пользователей.
            Каждая строка - пользователь, каждый столбец - признак.
        n_clusters (int, optional): Количество кластеров. По умолчанию 4.
    
    Returns:
        Dict[str, Any]: Словарь с результатами сегментации:
            - 'labels': numpy.ndarray - Метки кластеров для каждого пользователя
            - 'centers': numpy.ndarray - Центры кластеров
            - 'inertia': float - Сумма квадратов расстояний до центров
            - 'silhouette_score': float - Оценка качества кластеризации
    
    Raises:
        ValueError: Если features пустой или n_clusters <= 0
        TypeError: Если features не является DataFrame
    
    Example:
        >>> import pandas as pd
        >>> features = pd.DataFrame({'feature1': [1, 2, 3], 'feature2': [4, 5, 6]})
        >>> result = segment_users(features, n_clusters=2)
        >>> print(result['labels'])
        [0 0 1]
    """
    if features.empty:
        raise ValueError("Features cannot be empty")
    
    # Реализация
```

## Заключение

Данное руководство покрывает основные аспекты разработки системы Customer Analyzer. Следование стандартам и процессам, описанным в руководстве, поможет обеспечить качество кода и эффективность разработки.

Для получения дополнительной информации обращайтесь к:
- API документации в папке `docs/api/`
- Архитектурной документации в папке `docs/architecture/`
- Команде разработки через GitHub Issues или внутренние каналы связи
