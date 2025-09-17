#!/bin/bash

# Скрипт для создания бэкапов базы данных
# Использование: ./backup-db.sh [database_name] [backup_dir]

set -e

# Конфигурация по умолчанию
DB_NAME=${1:-customer_analyzer}
BACKUP_DIR=${2:-./backups}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql"

# Переменные окружения
PG_HOST=${POSTGRES_HOST:-localhost}
PG_PORT=${POSTGRES_PORT:-5432}
PG_USER=${POSTGRES_USER:-postgres}
PG_PASSWORD=${POSTGRES_PASSWORD:-postgres}

# Создание директории для бэкапов
mkdir -p "$BACKUP_DIR"

echo "Начинаем создание бэкапа базы данных $DB_NAME..."
echo "Файл бэкапа: $BACKUP_FILE"

# Установка переменной окружения для пароля
export PGPASSWORD="$PG_PASSWORD"

# Создание бэкапа
pg_dump \
    --host="$PG_HOST" \
    --port="$PG_PORT" \
    --username="$PG_USER" \
    --dbname="$DB_NAME" \
    --verbose \
    --clean \
    --if-exists \
    --create \
    --format=plain \
    --file="$BACKUP_FILE"

# Проверка успешности создания бэкапа
if [ $? -eq 0 ]; then
    echo "Бэкап успешно создан: $BACKUP_FILE"
    
    # Сжатие бэкапа
    gzip "$BACKUP_FILE"
    echo "Бэкап сжат: ${BACKUP_FILE}.gz"
    
    # Удаление старых бэкапов (старше 7 дней)
    find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +7 -delete
    echo "Старые бэкапы (старше 7 дней) удалены"
    
    # Показ размера файла
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
    echo "Размер бэкапа: $BACKUP_SIZE"
    
else
    echo "Ошибка при создании бэкапа!"
    exit 1
fi

# Очистка переменной окружения
unset PGPASSWORD

echo "Бэкап завершен успешно!"
