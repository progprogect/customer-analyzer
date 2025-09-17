#!/bin/bash

# Скрипт для восстановления базы данных из бэкапа
# Использование: ./restore-db.sh [backup_file] [database_name]

set -e

# Проверка аргументов
if [ $# -lt 1 ]; then
    echo "Использование: $0 <backup_file> [database_name]"
    echo "Пример: $0 ./backups/customer_analyzer_20240120_143022.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"
DB_NAME=${2:-customer_analyzer}

# Переменные окружения
PG_HOST=${POSTGRES_HOST:-localhost}
PG_PORT=${POSTGRES_PORT:-5432}
PG_USER=${POSTGRES_USER:-postgres}
PG_PASSWORD=${POSTGRES_PASSWORD:-postgres}

# Проверка существования файла бэкапа
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Файл бэкапа не найден: $BACKUP_FILE"
    exit 1
fi

echo "Начинаем восстановление базы данных $DB_NAME из файла $BACKUP_FILE..."

# Подтверждение действия
read -p "Вы уверены, что хотите восстановить базу данных? Это удалит все существующие данные! (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Восстановление отменено."
    exit 1
fi

# Установка переменной окружения для пароля
export PGPASSWORD="$PG_PASSWORD"

# Проверка, сжат ли файл
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "Распаковываем сжатый бэкап..."
    gunzip -c "$BACKUP_FILE" | psql \
        --host="$PG_HOST" \
        --port="$PG_PORT" \
        --username="$PG_USER" \
        --dbname="postgres" \
        --verbose
else
    echo "Восстанавливаем из несжатого бэкапа..."
    psql \
        --host="$PG_HOST" \
        --port="$PG_PORT" \
        --username="$PG_USER" \
        --dbname="postgres" \
        --verbose \
        --file="$BACKUP_FILE"
fi

# Проверка успешности восстановления
if [ $? -eq 0 ]; then
    echo "База данных успешно восстановлена!"
    
    # Проверка подключения к восстановленной базе
    echo "Проверяем подключение к восстановленной базе..."
    psql \
        --host="$PG_HOST" \
        --port="$PG_PORT" \
        --username="$PG_USER" \
        --dbname="$DB_NAME" \
        --command="SELECT 'Database restored successfully' as status;"
        
    if [ $? -eq 0 ]; then
        echo "Проверка подключения прошла успешно!"
    else
        echo "Ошибка при проверке подключения к базе данных."
        exit 1
    fi
    
else
    echo "Ошибка при восстановлении базы данных!"
    exit 1
fi

# Очистка переменной окружения
unset PGPASSWORD

echo "Восстановление завершено успешно!"
