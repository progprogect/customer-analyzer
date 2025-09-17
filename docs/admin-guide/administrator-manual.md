# Руководство администратора Customer Analyzer

## Введение

Данное руководство предназначено для системных администраторов, ответственных за развертывание, настройку, мониторинг и обслуживание системы Customer Analyzer.

## Обзор системы

Customer Analyzer состоит из следующих компонентов:

- **Frontend**: React приложение с Nginx
- **Backend**: Node.js API сервер
- **ML Services**: Python FastAPI сервисы
- **Database**: PostgreSQL
- **Cache**: Redis
- **Monitoring**: Prometheus, Grafana, ELK Stack
- **Proxy**: Nginx reverse proxy

## Установка и развертывание

### Системные требования

**Минимальные требования**:
- CPU: 4 ядра
- RAM: 8GB
- Диск: 50GB SSD
- ОС: Linux (Ubuntu 20.04+, CentOS 8+)

**Рекомендуемые требования**:
- CPU: 8 ядер
- RAM: 16GB
- Диск: 100GB SSD
- ОС: Linux (Ubuntu 22.04+, CentOS 9+)

### Предварительная настройка

1. **Установка Docker и Docker Compose**:
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

2. **Настройка файрвола**:
```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw enable
```

3. **Создание пользователя для приложения**:
```bash
sudo useradd -m -s /bin/bash customer-analyzer
sudo usermod -aG docker customer-analyzer
```

### Развертывание системы

1. **Клонирование репозитория**:
```bash
cd /opt
sudo git clone <repository-url> customer-analyzer
sudo chown -R customer-analyzer:customer-analyzer customer-analyzer
cd customer-analyzer
```

2. **Генерация секретов**:
```bash
chmod +x secrets/generate-secrets.sh
./secrets/generate-secrets.sh
```

3. **Настройка переменных окружения**:
```bash
cp .env.example .env
# Отредактируйте .env файл с вашими настройками
```

4. **Развертывание**:
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh production deploy
```

## Конфигурация

### Основные настройки

**Переменные окружения (.env)**:
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=customer_analyzer
DB_USER=postgres
DB_PASSWORD=<generated_password>

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<generated_password>

# JWT
JWT_SECRET=<generated_secret>
JWT_EXPIRES_IN=24h

# Telegram Bot
TELEGRAM_BOT_TOKEN=<your_bot_token>

# ML Services
ML_API_URL=http://localhost:8000
ML_API_TIMEOUT=30000

# Monitoring
PROMETHEUS_RETENTION_TIME=15d
GRAFANA_ADMIN_PASSWORD=<generated_password>
```

### Настройка SSL сертификатов

1. **Получение сертификатов Let's Encrypt**:
```bash
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com
```

2. **Копирование сертификатов**:
```bash
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
sudo chown customer-analyzer:customer-analyzer nginx/ssl/*
```

3. **Настройка автообновления**:
```bash
sudo crontab -e
# Добавьте строку:
0 12 * * * /usr/bin/certbot renew --quiet && docker-compose -f /opt/customer-analyzer/docker-compose.prod.yml restart nginx
```

### Настройка мониторинга

**Prometheus конфигурация**:
- Файл: `monitoring/prometheus.yml`
- Настройка scrape интервалов
- Конфигурация алертов
- Настройка retention policy

**Grafana настройки**:
- Создание дашбордов
- Настройка datasources
- Конфигурация алертов
- Управление пользователями

**ELK Stack конфигурация**:
- Настройка Logstash pipelines
- Конфигурация Elasticsearch индексов
- Создание Kibana dashboards
- Настройка retention policy

## Мониторинг и обслуживание

### Проверка состояния системы

**Ежедневные проверки**:
```bash
# Проверка состояния сервисов
./scripts/health-check.sh

# Проверка использования ресурсов
docker stats --no-stream

# Проверка логов на ошибки
docker-compose -f docker-compose.prod.yml logs --tail=100 | grep -i error
```

**Еженедельные проверки**:
```bash
# Проверка места на диске
df -h

# Проверка использования памяти
free -h

# Анализ производительности
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -c "SELECT * FROM pg_stat_activity;"
```

### Мониторинг производительности

**Ключевые метрики**:
- Время ответа API (< 200ms)
- Использование CPU (< 80%)
- Использование памяти (< 85%)
- Использование диска (< 90%)
- Количество активных соединений к БД

**Настройка алертов**:
```yaml
# monitoring/alerts.yml
groups:
  - name: customer_analyzer_alerts
    rules:
      - alert: HighCPUUsage
        expr: cpu_usage_percent > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage detected"
          
      - alert: HighMemoryUsage
        expr: memory_usage_percent > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
```

### Управление логами

**Ротация логов**:
```bash
# Настройка logrotate
sudo vim /etc/logrotate.d/customer-analyzer

# Содержимое файла:
/opt/customer-analyzer/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    postrotate
        docker-compose -f /opt/customer-analyzer/docker-compose.prod.yml restart
    endscript
}
```

**Анализ логов**:
```bash
# Поиск ошибок
docker-compose -f docker-compose.prod.yml logs | grep -i error

# Анализ производительности
docker-compose -f docker-compose.prod.yml logs backend | grep "response time"

# Мониторинг безопасности
docker-compose -f docker-compose.prod.yml logs nginx | grep "403\|401\|404"
```

## Резервное копирование и восстановление

### Резервное копирование базы данных

**Автоматическое резервное копирование**:
```bash
#!/bin/bash
# scripts/backup-db.sh

BACKUP_DIR="/opt/customer-analyzer/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/database_backup_$DATE.sql"

mkdir -p $BACKUP_DIR

docker-compose -f docker-compose.prod.yml exec -T postgres \
    pg_dump -U postgres customer_analyzer > $BACKUP_FILE

# Сжатие резервной копии
gzip $BACKUP_FILE

# Удаление старых резервных копий (старше 30 дней)
find $BACKUP_DIR -name "database_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

**Настройка cron для автоматического резервного копирования**:
```bash
crontab -e
# Добавьте строку:
0 2 * * * /opt/customer-analyzer/scripts/backup-db.sh
```

### Резервное копирование конфигурации

```bash
#!/bin/bash
# scripts/backup-config.sh

BACKUP_DIR="/opt/customer-analyzer/backups/config"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

tar -czf "$BACKUP_DIR/config_backup_$DATE.tar.gz" \
    secrets/ \
    monitoring/ \
    nginx/ \
    docker-compose.prod.yml \
    .env

echo "Config backup completed: $BACKUP_DIR/config_backup_$DATE.tar.gz"
```

### Восстановление из резервной копии

**Восстановление базы данных**:
```bash
#!/bin/bash
# scripts/restore-db.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

# Остановка приложения
docker-compose -f docker-compose.prod.yml stop backend ml-services

# Восстановление базы данных
gunzip -c $BACKUP_FILE | docker-compose -f docker-compose.prod.yml exec -T postgres \
    psql -U postgres customer_analyzer

# Запуск приложения
docker-compose -f docker-compose.prod.yml start backend ml-services

echo "Database restored from: $BACKUP_FILE"
```

## Обновление системы

### Обновление приложения

1. **Создание резервной копии**:
```bash
./scripts/backup-db.sh
./scripts/backup-config.sh
```

2. **Остановка сервисов**:
```bash
./scripts/deploy.sh production stop
```

3. **Обновление кода**:
```bash
git pull origin main
```

4. **Пересборка образов**:
```bash
./scripts/deploy.sh production deploy
```

5. **Проверка работоспособности**:
```bash
./scripts/health-check.sh
```

### Обновление ML моделей

```bash
# Запуск переобучения моделей
curl -X POST http://localhost/ml-api/retraining/retrain-all

# Проверка статуса
curl http://localhost/ml-api/retraining/status
```

## Безопасность

### Настройка файрвола

```bash
# Базовые правила
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Разрешенные порты
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Доступ к мониторингу только из локальной сети
sudo ufw allow from 192.168.1.0/24 to any port 3000  # Grafana
sudo ufw allow from 192.168.1.0/24 to any port 9090  # Prometheus
sudo ufw allow from 192.168.1.0/24 to any port 5601  # Kibana

sudo ufw enable
```

### Настройка SSH

```bash
# Отключение root логина
sudo vim /etc/ssh/sshd_config
# Установите: PermitRootLogin no

# Отключение паролей, использование ключей
# Установите: PasswordAuthentication no

# Перезапуск SSH
sudo systemctl restart ssh
```

### Мониторинг безопасности

**Проверка подозрительной активности**:
```bash
# Неудачные попытки входа
sudo grep "Failed password" /var/log/auth.log

# Подозрительная активность в логах приложения
docker-compose -f docker-compose.prod.yml logs nginx | grep -E "(403|401|404)"

# Проверка открытых портов
sudo netstat -tulpn | grep LISTEN
```

### Обновление системы

```bash
# Обновление пакетов
sudo apt update && sudo apt upgrade -y

# Обновление Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Перезапуск после обновления
sudo systemctl restart docker
```

## Устранение неполадок

### Частые проблемы

**1. Сервис не запускается**:
```bash
# Проверка логов
docker-compose -f docker-compose.prod.yml logs <service_name>

# Проверка статуса
docker-compose -f docker-compose.prod.yml ps

# Перезапуск сервиса
docker-compose -f docker-compose.prod.yml restart <service_name>
```

**2. База данных недоступна**:
```bash
# Проверка подключения
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U postgres

# Проверка логов PostgreSQL
docker-compose -f docker-compose.prod.yml logs postgres

# Проверка места на диске
df -h
```

**3. Высокое использование ресурсов**:
```bash
# Проверка использования ресурсов
docker stats --no-stream

# Анализ процессов
docker-compose -f docker-compose.prod.yml exec backend top

# Проверка логов на ошибки
docker-compose -f docker-compose.prod.yml logs | grep -i error
```

**4. Проблемы с ML сервисами**:
```bash
# Проверка статуса моделей
curl http://localhost/ml-api/health

# Проверка логов ML сервисов
docker-compose -f docker-compose.prod.yml logs ml-services

# Перезапуск ML сервисов
docker-compose -f docker-compose.prod.yml restart ml-services
```

### Диагностические команды

```bash
# Проверка состояния всех сервисов
./scripts/health-check.sh

# Проверка сетевых подключений
docker network ls
docker network inspect customer_analyzer_network

# Проверка томов
docker volume ls
docker volume inspect customer_analyzer_postgres_data

# Анализ производительности
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -c "SELECT * FROM pg_stat_activity;"
```

## Контакты и поддержка

### Внутренние контакты

- **Системный администратор**: admin@company.com
- **Техническая поддержка**: support@company.com
- **Менеджер проекта**: project@company.com

### Внешняя поддержка

- **Документация**: https://docs.customer-analyzer.com
- **GitHub Issues**: https://github.com/customer-analyzer/issues
- **Telegram поддержка**: @customer_analyzer_support

### План действий при инцидентах

1. **Оценка критичности**:
   - Критический: Система недоступна
   - Высокий: Основные функции не работают
   - Средний: Некоторые функции не работают
   - Низкий: Косметические проблемы

2. **Уведомления**:
   - Критический/Высокий: Немедленное уведомление команды
   - Средний: Уведомление в течение 2 часов
   - Низкий: Уведомление в течение 24 часов

3. **Документирование**:
   - Время возникновения
   - Описание проблемы
   - Принятые меры
   - Время решения
   - Причина инцидента

## Заключение

Данное руководство покрывает основные аспекты администрирования системы Customer Analyzer. Регулярное следование рекомендациям поможет обеспечить стабильную и безопасную работу системы.

Для получения дополнительной информации обращайтесь к технической документации или связывайтесь с командой поддержки.
