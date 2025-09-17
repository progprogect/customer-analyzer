# Customer Analyzer - Production Deployment Guide

## Обзор

Данное руководство описывает развертывание системы Customer Analyzer в production окружении с использованием Docker и Docker Compose.

## Архитектура

Система состоит из следующих компонентов:

- **Frontend**: React приложение с Nginx
- **Backend**: Node.js API сервер
- **ML Services**: Python FastAPI сервисы для ML моделей
- **Database**: PostgreSQL база данных
- **Cache**: Redis для кэширования
- **Monitoring**: Prometheus, Grafana, ELK Stack
- **Proxy**: Nginx reverse proxy с SSL

## Требования

### Системные требования

- Docker 20.10+
- Docker Compose 2.0+
- Минимум 8GB RAM
- Минимум 50GB свободного места на диске
- Linux/macOS/Windows с WSL2

### Сетевые требования

- Открытые порты: 80, 443, 3000, 9090, 5601
- Доступ к интернету для скачивания образов
- SSL сертификаты (опционально)

## Установка

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd customer-analyzer
```

### 2. Генерация секретов

```bash
chmod +x secrets/generate-secrets.sh
./secrets/generate-secrets.sh
```

**Важно**: Замените `YOUR_TELEGRAM_BOT_TOKEN_HERE` на реальный токен Telegram Bot.

### 3. Настройка SSL сертификатов

Для production рекомендуется использовать реальные SSL сертификаты:

```bash
# Создание директории для SSL
mkdir -p nginx/ssl

# Копирование ваших сертификатов
cp your-cert.pem nginx/ssl/cert.pem
cp your-key.pem nginx/ssl/key.pem
```

### 4. Развертывание

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh production deploy
```

## Конфигурация

### Переменные окружения

Основные переменные окружения настраиваются в `docker-compose.prod.yml`:

```yaml
environment:
  NODE_ENV: production
  DB_NAME: customer_analyzer
  DB_USER: postgres
  LOG_LEVEL: info
```

### Секреты

Все секреты хранятся в файлах в директории `secrets/`:

- `db_password.txt` - Пароль базы данных
- `redis_password.txt` - Пароль Redis
- `jwt_secret.txt` - Секрет для JWT токенов
- `telegram_bot_token.txt` - Токен Telegram Bot
- `grafana_password.txt` - Пароль администратора Grafana

## Мониторинг

### Доступ к сервисам мониторинга

- **Grafana**: http://localhost:3000 (admin / пароль из grafana_password.txt)
- **Prometheus**: http://localhost:9090
- **Kibana**: http://localhost:5601
- **Elasticsearch**: http://localhost:9200

### Основные метрики

- Использование CPU и памяти
- Время ответа API
- Количество запросов
- Ошибки в логах
- Состояние ML моделей

## Управление

### Основные команды

```bash
# Развертывание
./scripts/deploy.sh production deploy

# Остановка
./scripts/deploy.sh production stop

# Запуск
./scripts/deploy.sh production start

# Перезапуск
./scripts/deploy.sh production restart

# Статус
./scripts/deploy.sh production status

# Логи
./scripts/deploy.sh production logs

# Очистка
./scripts/deploy.sh production cleanup
```

### Проверка здоровья системы

```bash
./scripts/health-check.sh
```

### Резервное копирование

```bash
# Автоматическое резервное копирование
./scripts/backup-db.sh

# Восстановление из резервной копии
./scripts/restore-db.sh backup_file.sql
```

## Безопасность

### SSL/TLS

- Используйте реальные SSL сертификаты в production
- Настройте автоматическое обновление сертификатов (Let's Encrypt)
- Включите HSTS headers

### Секреты

- Никогда не коммитьте файлы секретов в Git
- Регулярно обновляйте пароли и токены
- Используйте внешние системы управления секретами (HashiCorp Vault, AWS Secrets Manager)

### Сеть

- Настройте firewall для ограничения доступа
- Используйте VPN для доступа к сервисам мониторинга
- Настройте rate limiting в Nginx

## Масштабирование

### Горизонтальное масштабирование

```yaml
# В docker-compose.prod.yml
services:
  backend:
    deploy:
      replicas: 3
    # ...
```

### Вертикальное масштабирование

Увеличьте лимиты ресурсов в Docker Compose:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
```

## Обслуживание

### Обновление системы

1. Создайте резервную копию
2. Остановите сервисы
3. Обновите код
4. Пересоберите образы
5. Запустите сервисы
6. Проверьте работоспособность

### Мониторинг логов

```bash
# Просмотр логов всех сервисов
docker-compose -f docker-compose.prod.yml logs -f

# Просмотр логов конкретного сервиса
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Обновление ML моделей

```bash
# Запуск переобучения моделей
curl -X POST http://localhost/ml-api/retraining/retrain-all

# Проверка статуса
curl http://localhost/ml-api/retraining/status
```

## Устранение неполадок

### Общие проблемы

1. **Сервис не запускается**
   - Проверьте логи: `docker-compose logs service_name`
   - Проверьте доступность портов
   - Проверьте переменные окружения

2. **База данных недоступна**
   - Проверьте подключение к PostgreSQL
   - Проверьте пароли в секретах
   - Проверьте инициализацию базы данных

3. **ML сервисы не отвечают**
   - Проверьте загрузку моделей
   - Проверьте доступность данных
   - Проверьте логи ML сервисов

### Полезные команды

```bash
# Проверка состояния контейнеров
docker-compose -f docker-compose.prod.yml ps

# Проверка использования ресурсов
docker stats

# Очистка неиспользуемых ресурсов
docker system prune -f

# Проверка сетевых подключений
docker network ls
docker network inspect customer_analyzer_network
```

## Поддержка

### Контакты

- Техническая поддержка: support@customer-analyzer.com
- Документация: https://docs.customer-analyzer.com
- GitHub Issues: https://github.com/customer-analyzer/issues

### Логирование инцидентов

При возникновении проблем:

1. Соберите информацию о проблеме
2. Создайте резервную копию логов
3. Задокументируйте шаги для воспроизведения
4. Обратитесь в службу поддержки

## Лицензия

Copyright (c) 2025 Customer Analyzer. Все права защищены.
