/**
 * Общие типы для backend приложения
 */

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  connectionTimeoutMillis?: number;
  idleTimeoutMillis?: number;
  max?: number;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  corsOrigin: string;
  logLevel: string;
  database: DatabaseConfig;
}

export interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  database: {
    status: 'connected' | 'disconnected';
    responseTime?: number;
    lastError?: string;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Типы для событий
export type EventType = 
  | 'view' 
  | 'add_to_cart' 
  | 'purchase' 
  | 'bot_command' 
  | 'click' 
  | 'scroll' 
  | 'session_start' 
  | 'session_end';

export interface EventProperties {
  [key: string]: any;
}

// Типы для пользователей
export interface UserProfile {
  age?: number;
  city?: string;
  interests?: string[];
  preferred_price_range?: 'budget' | 'mid-range' | 'premium';
  notification_preferences?: {
    email?: boolean;
    telegram?: boolean;
    sms?: boolean;
  };
}

// Типы для продуктов
export interface ProductAttributes {
  brand?: string;
  color?: string;
  material?: string;
  size?: string;
  weight?: number;
  rating?: number;
  in_stock?: boolean;
  tags?: string[];
}
