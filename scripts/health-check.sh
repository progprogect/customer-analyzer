#!/bin/bash

# Скрипт проверки здоровья системы Customer Analyzer

set -e

# Конфигурация
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

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

# Проверка Docker сервисов
check_docker_services() {
    log_info "Проверка Docker сервисов..."
    
    cd "$PROJECT_ROOT"
    
    SERVICES=(
        "postgres:5432"
        "redis:6379"
        "backend:3001"
        "ml-services:8000"
        "frontend:80"
        "nginx:80"
    )
    
    for service_port in "${SERVICES[@]}"; do
        service=$(echo $service_port | cut -d: -f1)
        port=$(echo $service_port | cut -d: -f2)
        
        if docker-compose -f docker-compose.prod.yml ps "$service" | grep -q "Up"; then
            log_success "Сервис $service запущен"
        else
            log_error "Сервис $service не запущен"
            return 1
        fi
    done
}

# Проверка health endpoints
check_health_endpoints() {
    log_info "Проверка health endpoints..."
    
    ENDPOINTS=(
        "http://localhost/health:Nginx"
        "http://localhost/api/health:Backend API"
        "http://localhost/ml-api/health:ML Services"
    )
    
    for endpoint_name in "${ENDPOINTS[@]}"; do
        endpoint=$(echo $endpoint_name | cut -d: -f1)
        name=$(echo $endpoint_name | cut -d: -f2)
        
        if curl -f -s "$endpoint" > /dev/null; then
            log_success "$name доступен"
        else
            log_error "$name недоступен"
            return 1
        fi
    done
}

# Проверка базы данных
check_database() {
    log_info "Проверка базы данных..."
    
    cd "$PROJECT_ROOT"
    
    # Проверяем подключение к базе данных
    if docker-compose -f docker-compose.prod.yml exec -T postgres \
        psql -U postgres -d customer_analyzer -c "SELECT 1;" > /dev/null 2>&1; then
        log_success "База данных доступна"
    else
        log_error "База данных недоступна"
        return 1
    fi
    
    # Проверяем таблицы
    TABLES=("users" "products" "events" "user_metrics")
    
    for table in "${TABLES[@]}"; do
        if docker-compose -f docker-compose.prod.yml exec -T postgres \
            psql -U postgres -d customer_analyzer -c "SELECT 1 FROM $table LIMIT 1;" > /dev/null 2>&1; then
            log_success "Таблица $table существует"
        else
            log_error "Таблица $table не существует"
            return 1
        fi
    done
}

# Проверка Redis
check_redis() {
    log_info "Проверка Redis..."
    
    cd "$PROJECT_ROOT"
    
    if docker-compose -f docker-compose.prod.yml exec -T redis \
        redis-cli ping | grep -q "PONG"; then
        log_success "Redis доступен"
    else
        log_error "Redis недоступен"
        return 1
    fi
}

# Проверка ML моделей
check_ml_models() {
    log_info "Проверка ML моделей..."
    
    # Проверяем эндпоинты ML сервисов
    ML_ENDPOINTS=(
        "http://localhost/ml-api/segmentation/segments"
        "http://localhost/ml-api/purchase-prediction/predictions"
        "http://localhost/ml-api/churn-prediction/predictions"
    )
    
    for endpoint in "${ML_ENDPOINTS[@]}"; do
        if curl -f -s "$endpoint" > /dev/null; then
            log_success "ML endpoint доступен: $endpoint"
        else
            log_warning "ML endpoint недоступен: $endpoint"
        fi
    done
}

# Проверка мониторинга
check_monitoring() {
    log_info "Проверка мониторинга..."
    
    MONITORING_SERVICES=(
        "prometheus:9090"
        "grafana:3000"
        "elasticsearch:9200"
        "kibana:5601"
    )
    
    for service_port in "${MONITORING_SERVICES[@]}"; do
        service=$(echo $service_port | cut -d: -f1)
        port=$(echo $service_port | cut -d: -f2)
        
        if curl -f -s "http://localhost:$port" > /dev/null; then
            log_success "Мониторинг сервис $service доступен"
        else
            log_warning "Мониторинг сервис $service недоступен"
        fi
    done
}

# Проверка производительности
check_performance() {
    log_info "Проверка производительности..."
    
    # Проверяем время ответа основных эндпоинтов
    ENDPOINTS=(
        "http://localhost/health"
        "http://localhost/api/health"
        "http://localhost/ml-api/health"
    )
    
    for endpoint in "${ENDPOINTS[@]}"; do
        response_time=$(curl -o /dev/null -s -w "%{time_total}" "$endpoint")
        
        if (( $(echo "$response_time < 2.0" | bc -l) )); then
            log_success "Время ответа $endpoint: ${response_time}s"
        else
            log_warning "Медленный ответ $endpoint: ${response_time}s"
        fi
    done
}

# Проверка логов на ошибки
check_logs() {
    log_info "Проверка логов на ошибки..."
    
    cd "$PROJECT_ROOT"
    
    SERVICES=("backend" "ml-services" "nginx")
    
    for service in "${SERVICES[@]}"; do
        error_count=$(docker-compose -f docker-compose.prod.yml logs "$service" 2>&1 | grep -i "error\|exception\|failed" | wc -l)
        
        if [ "$error_count" -eq 0 ]; then
            log_success "Ошибки в логах $service не найдены"
        else
            log_warning "Найдено $error_count ошибок в логах $service"
        fi
    done
}

# Генерация отчета
generate_report() {
    log_info "Генерация отчета о состоянии системы..."
    
    REPORT_FILE="$PROJECT_ROOT/health-report-$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "=== ОТЧЕТ О СОСТОЯНИИ СИСТЕМЫ CUSTOMER ANALYZER ==="
        echo "Дата: $(date)"
        echo ""
        
        echo "=== DOCKER СЕРВИСЫ ==="
        docker-compose -f docker-compose.prod.yml ps
        echo ""
        
        echo "=== ИСПОЛЬЗОВАНИЕ РЕСУРСОВ ==="
        docker stats --no-stream
        echo ""
        
        echo "=== ДИСКОВОЕ ПРОСТРАНСТВО ==="
        df -h
        echo ""
        
        echo "=== ПАМЯТЬ ==="
        free -h
        echo ""
        
        echo "=== ПРОЦЕССЫ ==="
        ps aux --sort=-%cpu | head -10
        echo ""
        
    } > "$REPORT_FILE"
    
    log_success "Отчет сохранен: $REPORT_FILE"
}

# Основная функция
main() {
    log_info "Начало проверки здоровья системы Customer Analyzer..."
    
    local exit_code=0
    
    # Выполняем все проверки
    check_docker_services || exit_code=1
    check_health_endpoints || exit_code=1
    check_database || exit_code=1
    check_redis || exit_code=1
    check_ml_models
    check_monitoring
    check_performance
    check_logs
    generate_report
    
    if [ $exit_code -eq 0 ]; then
        log_success "Все проверки пройдены успешно!"
    else
        log_error "Обнаружены проблемы в системе"
    fi
    
    exit $exit_code
}

# Запуск скрипта
main "$@"
