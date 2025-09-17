#!/bin/bash

# Скрипт развертывания Customer Analyzer в production
# Использование: ./scripts/deploy.sh [environment] [action]

set -e

# Конфигурация
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT=${1:-production}
ACTION=${2:-deploy}

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции логирования
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка зависимостей
check_dependencies() {
    log_info "Проверка зависимостей..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker не установлен"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose не установлен"
        exit 1
    fi
    
    log_success "Все зависимости установлены"
}

# Проверка секретов
check_secrets() {
    log_info "Проверка секретов..."
    
    SECRETS_DIR="$PROJECT_ROOT/secrets"
    
    if [ ! -d "$SECRETS_DIR" ]; then
        log_error "Директория секретов не найдена: $SECRETS_DIR"
        log_info "Запустите ./secrets/generate-secrets.sh для создания секретов"
        exit 1
    fi
    
    REQUIRED_SECRETS=(
        "db_password.txt"
        "redis_password.txt"
        "jwt_secret.txt"
        "telegram_bot_token.txt"
        "grafana_password.txt"
    )
    
    for secret in "${REQUIRED_SECRETS[@]}"; do
        if [ ! -f "$SECRETS_DIR/$secret" ]; then
            log_error "Секрет не найден: $secret"
            exit 1
        fi
    done
    
    log_success "Все секреты найдены"
}

# Проверка SSL сертификатов
check_ssl_certificates() {
    log_info "Проверка SSL сертификатов..."
    
    SSL_DIR="$PROJECT_ROOT/nginx/ssl"
    
    if [ ! -d "$SSL_DIR" ]; then
        log_warning "Директория SSL сертификатов не найдена: $SSL_DIR"
        log_info "Создание самоподписанного сертификата..."
        
        mkdir -p "$SSL_DIR"
        
        # Генерируем самоподписанный сертификат
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$SSL_DIR/key.pem" \
            -out "$SSL_DIR/cert.pem" \
            -subj "/C=RU/ST=Moscow/L=Moscow/O=CustomerAnalyzer/CN=localhost"
        
        log_success "Самоподписанный сертификат создан"
    else
        log_success "SSL сертификаты найдены"
    fi
}

# Создание резервной копии
create_backup() {
    log_info "Создание резервной копии..."
    
    BACKUP_DIR="$PROJECT_ROOT/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Резервная копия базы данных
    if docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps postgres | grep -q "Up"; then
        log_info "Создание резервной копии базы данных..."
        docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec -T postgres \
            pg_dump -U postgres customer_analyzer > "$BACKUP_DIR/database_backup.sql"
    fi
    
    # Резервная копия конфигурации
    cp -r "$PROJECT_ROOT/secrets" "$BACKUP_DIR/"
    cp -r "$PROJECT_ROOT/monitoring" "$BACKUP_DIR/"
    cp -r "$PROJECT_ROOT/nginx" "$BACKUP_DIR/"
    
    log_success "Резервная копия создана: $BACKUP_DIR"
}

# Остановка сервисов
stop_services() {
    log_info "Остановка сервисов..."
    
    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.prod.yml down
    
    log_success "Сервисы остановлены"
}

# Сборка образов
build_images() {
    log_info "Сборка Docker образов..."
    
    cd "$PROJECT_ROOT"
    
    # Сборка всех сервисов
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    log_success "Образы собраны"
}

# Запуск сервисов
start_services() {
    log_info "Запуск сервисов..."
    
    cd "$PROJECT_ROOT"
    
    # Запуск в фоновом режиме
    docker-compose -f docker-compose.prod.yml up -d
    
    log_success "Сервисы запущены"
}

# Проверка состояния сервисов
check_services() {
    log_info "Проверка состояния сервисов..."
    
    cd "$PROJECT_ROOT"
    
    # Ждем запуска сервисов
    sleep 30
    
    # Проверяем health checks
    SERVICES=(
        "postgres"
        "redis"
        "backend"
        "ml-services"
        "frontend"
        "nginx"
    )
    
    for service in "${SERVICES[@]}"; do
        if docker-compose -f docker-compose.prod.yml ps "$service" | grep -q "healthy\|Up"; then
            log_success "Сервис $service запущен"
        else
            log_error "Сервис $service не запущен или нездоров"
        fi
    done
}

# Показать логи
show_logs() {
    log_info "Показать логи сервисов..."
    
    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.prod.yml logs --tail=100
}

# Показать статус
show_status() {
    log_info "Статус сервисов:"
    
    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.prod.yml ps
}

# Очистка
cleanup() {
    log_info "Очистка неиспользуемых ресурсов..."
    
    docker system prune -f
    docker volume prune -f
    
    log_success "Очистка завершена"
}

# Основная функция развертывания
deploy() {
    log_info "Начало развертывания Customer Analyzer в $ENVIRONMENT..."
    
    check_dependencies
    check_secrets
    check_ssl_certificates
    
    if [ "$ACTION" = "deploy" ]; then
        create_backup
        stop_services
        build_images
        start_services
        check_services
        log_success "Развертывание завершено успешно!"
        
    elif [ "$ACTION" = "stop" ]; then
        stop_services
        log_success "Сервисы остановлены"
        
    elif [ "$ACTION" = "start" ]; then
        start_services
        check_services
        log_success "Сервисы запущены"
        
    elif [ "$ACTION" = "restart" ]; then
        stop_services
        start_services
        check_services
        log_success "Сервисы перезапущены"
        
    elif [ "$ACTION" = "status" ]; then
        show_status
        
    elif [ "$ACTION" = "logs" ]; then
        show_logs
        
    elif [ "$ACTION" = "cleanup" ]; then
        cleanup
        
    else
        log_error "Неизвестное действие: $ACTION"
        show_usage
        exit 1
    fi
}

# Показать справку
show_usage() {
    echo "Использование: $0 [environment] [action]"
    echo ""
    echo "Environment:"
    echo "  production  - Production окружение (по умолчанию)"
    echo ""
    echo "Actions:"
    echo "  deploy      - Полное развертывание (по умолчанию)"
    echo "  stop        - Остановка сервисов"
    echo "  start       - Запуск сервисов"
    echo "  restart     - Перезапуск сервисов"
    echo "  status      - Показать статус сервисов"
    echo "  logs        - Показать логи"
    echo "  cleanup     - Очистка неиспользуемых ресурсов"
    echo ""
    echo "Примеры:"
    echo "  $0                    # Развертывание в production"
    echo "  $0 production deploy  # Полное развертывание"
    echo "  $0 production status  # Показать статус"
    echo "  $0 production logs    # Показать логи"
}

# Главная функция
main() {
    case "$1" in
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            deploy
            ;;
    esac
}

# Запуск скрипта
main "$@"
