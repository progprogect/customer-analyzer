# ETL-скрипт для исторических данных

## Описание

ETL (Extract, Transform, Load) скрипт для загрузки исторических данных о пользователях, продуктах и событиях из внешних источников в PostgreSQL базу данных системы аналитики.

## Возможности

- **Поддержка форматов:** CSV, JSON
- **Batch processing:** Обработка больших объемов данных батчами
- **Валидация данных:** Проверка корректности данных перед загрузкой
- **Обработка дубликатов:** Автоматическое обновление существующих записей
- **Детальное логирование:** Полный отчет о процессе загрузки
- **Обработка ошибок:** Graceful handling ошибок с продолжением процесса

## Структура файлов

```
scripts/
├── etl-historical-data.ts     # Основной ETL скрипт
├── etl-utils.ts              # Утилиты для ETL
├── etl-config.json           # Конфигурационные файлы
├── data/
│   ├── input/                # Входные файлы
│   │   ├── users-sample.csv
│   │   ├── products-sample.csv
│   │   └── events-sample.csv
│   └── output/               # Выходные отчеты
└── README-ETL.md            # Эта документация
```

## Установка зависимостей

```bash
# Установка зависимостей для ETL скрипта
npm install csv-parser @types/csv-parser
```

## Использование

### Базовое использование

```bash
# Запуск ETL с настройками по умолчанию
npx ts-node scripts/etl-historical-data.ts
```

### С переменными окружения

```bash
# Настройка параметров через переменные окружения
export ETL_INPUT_DIR="./data/input"
export ETL_OUTPUT_DIR="./data/output"
export ETL_BATCH_SIZE=2000
export ETL_VALIDATE=true
export ETL_SKIP_DUPLICATES=true
export ETL_LOG_LEVEL=info

npx ts-node scripts/etl-historical-data.ts
```

### Программное использование

```typescript
import { HistoricalDataETL } from './scripts/etl-historical-data';

const etl = new HistoricalDataETL({
  inputDir: './data/input',
  outputDir: './data/output',
  batchSize: 1000,
  validateData: true,
  skipDuplicates: true,
  logLevel: 'info'
});

await etl.run();
```

## Формат входных данных

### Пользователи (users.csv)

```csv
telegram_id,first_name,last_name,username,registration_date,profile_data
123456789,Иван,Иванов,ivan_ivanov,2023-01-15T10:30:00Z,"{""age"": 25, ""city"": ""Москва""}"
```

**Обязательные поля:**
- `telegram_id` - уникальный ID пользователя в Telegram
- `first_name` - имя пользователя

**Опциональные поля:**
- `last_name` - фамилия
- `username` - имя пользователя в Telegram
- `registration_date` - дата регистрации (ISO 8601)
- `profile_data` - дополнительные данные в JSON формате

### Продукты (products.csv)

```csv
name,category,price,description,attributes
iPhone 14 Pro,Электроника,89990,"Флагманский смартфон","{""brand"": ""Apple"", ""rating"": 4.8}"
```

**Обязательные поля:**
- `name` - название продукта
- `category` - категория товара
- `price` - цена (число)

**Опциональные поля:**
- `description` - описание продукта
- `attributes` - атрибуты в JSON формате

### События (events.csv)

```csv
user_telegram_id,product_name,event_type,event_timestamp,properties
123456789,iPhone 14 Pro,view,2023-06-01T10:30:00Z,"{""duration_seconds"": 45, ""source"": ""search""}"
```

**Обязательные поля:**
- `user_telegram_id` - Telegram ID пользователя
- `event_type` - тип события (view, add_to_cart, purchase, bot_command, click, scroll)
- `event_timestamp` - время события (ISO 8601)

**Опциональные поля:**
- `product_name` - название продукта (для событий связанных с товарами)
- `properties` - дополнительные свойства в JSON формате

## Конфигурация

### Файл конфигурации (etl-config.json)

```json
{
  "default": {
    "inputDir": "./data/input",
    "outputDir": "./data/output",
    "batchSize": 1000,
    "validateData": true,
    "skipDuplicates": true,
    "logLevel": "info"
  },
  "large_dataset": {
    "batchSize": 5000,
    "validateData": false,
    "logLevel": "warn"
  }
}
```

### Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `ETL_INPUT_DIR` | Директория с входными файлами | `./data/input` |
| `ETL_OUTPUT_DIR` | Директория для отчетов | `./data/output` |
| `ETL_BATCH_SIZE` | Размер батча для обработки | `1000` |
| `ETL_VALIDATE` | Включить валидацию данных | `true` |
| `ETL_SKIP_DUPLICATES` | Пропускать дубликаты | `true` |
| `ETL_LOG_LEVEL` | Уровень логирования | `info` |

## Валидация данных

Скрипт автоматически валидирует данные перед загрузкой:

### Пользователи
- Telegram ID должен быть положительным числом
- Имя пользователя обязательно
- Дата регистрации должна быть валидной
- Profile data должен быть валидным JSON

### Продукты
- Название продукта обязательно
- Категория обязательна
- Цена должна быть положительным числом
- Attributes должны быть валидным JSON

### События
- User Telegram ID должен быть валидным
- Event type должен быть из списка разрешенных
- Event timestamp должен быть валидной датой
- Properties должны быть валидным JSON

## Обработка ошибок

Скрипт обрабатывает следующие типы ошибок:

1. **Ошибки подключения к БД** - автоматическое переподключение
2. **Ошибки валидации** - запись в отчет, пропуск некорректных записей
3. **Ошибки вставки** - логирование, продолжение с остальными записями
4. **Ошибки файловой системы** - проверка существования файлов

## Отчеты

После завершения ETL процесса генерируется детальный отчет в формате JSON:

```json
{
  "summary": {
    "startTime": "2023-01-20T10:00:00Z",
    "endTime": "2023-01-20T10:15:00Z",
    "duration": "900.00 seconds"
  },
  "statistics": {
    "users": {
      "processed": 1000,
      "inserted": 995,
      "skipped": 5,
      "errors": 0
    },
    "products": {
      "processed": 100,
      "inserted": 100,
      "skipped": 0,
      "errors": 0
    },
    "events": {
      "processed": 50000,
      "inserted": 49950,
      "skipped": 0,
      "errors": 50
    }
  },
  "recommendations": [
    "Review and fix invalid event data"
  ]
}
```

## Примеры использования

### Загрузка тестовых данных

```bash
# Использование примеров данных
npx ts-node scripts/etl-historical-data.ts
```

### Загрузка больших объемов данных

```bash
# Оптимизированная конфигурация для больших данных
export ETL_BATCH_SIZE=5000
export ETL_VALIDATE=false
export ETL_LOG_LEVEL=warn

npx ts-node scripts/etl-historical-data.ts
```

### Только валидация без загрузки

```bash
# Режим только валидации
export ETL_VALIDATE=true
export ETL_BATCH_SIZE=1  # Минимальный батч для валидации

npx ts-node scripts/etl-historical-data.ts
```

## Troubleshooting

### Проблемы с подключением к БД

```bash
# Проверка переменных окружения БД
echo $POSTGRES_HOST
echo $POSTGRES_PORT
echo $POSTGRES_DB

# Тест подключения
psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT 1;"
```

### Проблемы с файлами

```bash
# Проверка существования входных файлов
ls -la scripts/data/input/

# Проверка формата CSV
head -5 scripts/data/input/users.csv
```

### Проблемы с памятью

```bash
# Уменьшение размера батча
export ETL_BATCH_SIZE=500

# Мониторинг использования памяти
top -p $(pgrep -f "etl-historical-data")
```

## Производительность

### Рекомендуемые настройки

| Объем данных | Batch Size | Validate | Время выполнения |
|--------------|------------|----------|------------------|
| < 10K записей | 1000 | true | ~2 минуты |
| 10K-100K записей | 2000 | true | ~15 минут |
| 100K-1M записей | 5000 | false | ~1 час |
| > 1M записей | 10000 | false | ~6 часов |

### Оптимизация

1. **Увеличить batch size** для больших объемов данных
2. **Отключить валидацию** для ускорения (если данные уже проверены)
3. **Использовать SSD** для входных файлов
4. **Настроить PostgreSQL** для bulk inserts

## Мониторинг

### Логи

Скрипт выводит подробные логи процесса:

```
🚀 Starting historical data ETL process...
📁 Input directory: ./data/input
📊 Batch size: 1000
✅ Validation: enabled
✅ Database connection established

👥 Loading users...
   Processed users batch: 1000/1000
✅ Users loaded: 995 inserted, 5 skipped, 0 errors

🛍️ Loading products...
   Processed products batch: 100/100
✅ Products loaded: 100 inserted, 0 skipped, 0 errors

📊 Loading events...
   Processed events batch: 10000/50000
   Processed events batch: 20000/50000
   ...
✅ Events loaded: 49950 inserted, 0 skipped, 50 errors
```

### Метрики производительности

- Время выполнения по типам данных
- Количество обработанных записей
- Процент ошибок валидации
- Использование памяти
