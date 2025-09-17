# Система аналитики и персонализированных рекомендаций

## Описание проекта

Система для сбора и анализа данных о поведении пользователей, применения моделей машинного обучения для прогнозирования и сегментации, а также автоматической отправки рекомендаций через Telegram-бота.

## Архитектура

- **Frontend:** React + TypeScript дашборд для администраторов
- **Backend:** Node.js + Express + TypeScript API
- **ML Services:** Python сервисы для ML и аналитики
- **Telegram Bot:** Интеграция с Telegram Bot API
- **Database:** PostgreSQL + Redis

## Структура проекта

```
customer-analyzer/
├── frontend/          # React дашборд
├── backend/           # Node.js API
├── ml-services/       # Python ML сервисы
├── telegram-bot/      # Telegram бот
├── database/          # Миграции и схемы
├── docker/           # Docker конфигурации
├── docs/             # Документация
└── scripts/          # Вспомогательные скрипты
```

## Быстрый старт

### Предварительные требования

- Node.js 18+
- Python 3.9+
- Docker & Docker Compose
- PostgreSQL 14+

### Локальная разработка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/progprogect/customer-analyzer.git
cd customer-analyzer
```

2. Запустите базы данных:
```bash
docker-compose up -d postgres redis
```

3. Настройте переменные окружения:
```bash
cp .env.example .env
# Отредактируйте .env файл
```

4. Установите зависимости:
```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install

# ML Services
cd ../ml-services && pip install -r requirements.txt
```

5. Запустите миграции:
```bash
cd backend && npm run migrate
```

6. Запустите сервисы:
```bash
# Backend API
cd backend && npm run dev

# Frontend
cd frontend && npm start

# ML Services
cd ml-services && python app.py

# Telegram Bot
cd telegram-bot && npm run dev
```

## API Документация

После запуска backend сервиса, документация API доступна по адресу:
- Swagger UI: http://localhost:8000/api-docs
- OpenAPI JSON: http://localhost:8000/api-docs.json

## Разработка

### Стандарты кода

- **Frontend:** ESLint + Prettier + TypeScript
- **Backend:** ESLint + Prettier + TypeScript
- **Python:** Black + flake8 + mypy

### Git Workflow

1. Создайте feature ветку от `main`
2. Внесите изменения
3. Создайте Pull Request
4. После ревью и тестов - мерж в `main`

### Тестирование

```bash
# Backend тесты
cd backend && npm test

# Frontend тесты
cd frontend && npm test

# ML тесты
cd ml-services && pytest
```

## Развертывание

### Docker

```bash
docker-compose up -d
```

### Production

```bash
# Сборка образов
docker-compose -f docker-compose.prod.yml build

# Запуск
docker-compose -f docker-compose.prod.yml up -d
```

## Мониторинг

- **Логи:** Централизованное логирование через Winston
- **Метрики:** Prometheus + Grafana (опционально)
- **Health checks:** `/health` эндпоинты

## Документация

- [Архитектура](docs/architecture.md)
- [Диаграммы](docs/architecture-diagram.md)
- [Функциональные требования](Functional%20Requirements.txt)
- [WBS](WBS.txt)

## Команда

- **Менеджер проекта:** [Имя]
- **Backend разработчик:** [Имя]
- **Frontend разработчик:** [Имя]
- **ML Engineer:** [Имя]

## Лицензия

[Указать лицензию]
