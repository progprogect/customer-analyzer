#!/bin/bash

# Скрипт для генерации секретов для production развертывания
# ВНИМАНИЕ: Этот скрипт генерирует секреты для демонстрации
# В production используйте более безопасные методы генерации секретов

set -e

SECRETS_DIR="./secrets"

echo "🔐 Генерация секретов для Customer Analyzer..."

# Создаем директорию для секретов
mkdir -p "$SECRETS_DIR"

# Генерация пароля для базы данных
echo "📊 Генерация пароля для базы данных..."
openssl rand -base64 32 > "$SECRETS_DIR/db_password.txt"

# Генерация пароля для Redis
echo "🗄️ Генерация пароля для Redis..."
openssl rand -base64 32 > "$SECRETS_DIR/redis_password.txt"

# Генерация JWT секрета
echo "🔑 Генерация JWT секрета..."
openssl rand -base64 64 > "$SECRETS_DIR/jwt_secret.txt"

# Генерация пароля для Grafana
echo "📈 Генерация пароля для Grafana..."
openssl rand -base64 16 > "$SECRETS_DIR/grafana_password.txt"

# Telegram Bot Token (нужно заменить на реальный)
echo "🤖 Создание файла для Telegram Bot Token..."
echo "YOUR_TELEGRAM_BOT_TOKEN_HERE" > "$SECRETS_DIR/telegram_bot_token.txt"

# Настройка прав доступа
chmod 600 "$SECRETS_DIR"/*.txt

echo "✅ Секреты сгенерированы в директории $SECRETS_DIR"
echo ""
echo "⚠️  ВАЖНО:"
echo "1. Замените YOUR_TELEGRAM_BOT_TOKEN_HERE на реальный токен Telegram Bot"
echo "2. Убедитесь, что файлы секретов не попадают в систему контроля версий"
echo "3. Регулярно обновляйте секреты в production"
echo ""
echo "📋 Список созданных секретов:"
ls -la "$SECRETS_DIR"
