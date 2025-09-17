/**
 * Типы для фронтенд-приложения Customer Analyzer
 */

// Базовые типы
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginationResponse {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// Типы пользователей
export interface User {
  user_id: number;
  telegram_id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  registration_date: string;
  profile_data?: Record<string, any>;
}

export interface UserMetrics {
  user_id: number;
  segment_id?: number;
  ltv?: number;
  churn_probability?: number;
  purchase_probability_30d?: number;
  last_updated: string;
}

// Типы событий
export interface Event {
  event_id: number;
  user_id: number;
  product_id?: number;
  event_type: 'view' | 'add_to_cart' | 'purchase' | 'bot_command' | 'message' | 'callback_query';
  event_timestamp: string;
  properties?: Record<string, any>;
}

// Типы продуктов
export interface Product {
  product_id: number;
  name: string;
  category?: string;
  price?: number;
  description?: string;
  attributes?: Record<string, any>;
}

// Типы сегментации
export interface UserSegment {
  segment_id: number;
  name: string;
  description: string;
  size: number;
  percentage: number;
  characteristics: Record<string, any>;
}

export interface SegmentationResult {
  segments: UserSegment[];
  user_segments: Record<number, number>;
  model_metrics: Record<string, number>;
  feature_importance: Record<string, number>;
  model_version: string;
  created_at: string;
}

// Типы предсказания покупок
export interface PurchasePredictionResult {
  user_id: number;
  purchase_probability: number;
  prediction_confidence: 'low' | 'medium' | 'high';
  key_factors: string[];
  prediction_date: string;
  model_version: string;
}

export interface PurchasePredictionMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  auc_roc: number;
  confusion_matrix: number[][];
  feature_importance: Record<string, number>;
  cross_val_scores: number[];
  model_version: string;
  evaluation_date: string;
}

// Типы предсказания оттока
export interface ChurnPredictionResult {
  user_id: number;
  churn_probability: number;
  prediction_confidence: 'low' | 'medium' | 'high';
  risk_factors: string[];
  retention_recommendations: string[];
  prediction_date: string;
  model_version: string;
}

export interface ChurnPredictionMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  auc_roc: number;
  confusion_matrix: number[][];
  feature_importance: Record<string, number>;
  cross_val_scores: number[];
  model_version: string;
  evaluation_date: string;
}

// Типы аналитики
export interface AnalyticsData {
  total_users: number;
  active_users: number;
  total_events: number;
  total_purchases: number;
  total_revenue: number;
  avg_order_value: number;
  conversion_rate: number;
  churn_rate: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

// Типы фильтров
export interface DateRangeFilter {
  start_date: string;
  end_date: string;
}

export interface UserFilter {
  segment_id?: number;
  registration_date_range?: DateRangeFilter;
  activity_level?: 'low' | 'medium' | 'high';
  has_purchases?: boolean;
}

export interface EventFilter {
  event_type?: string[];
  date_range?: DateRangeFilter;
  user_ids?: number[];
}

// Типы компонентов
export interface TableColumn<T = any> {
  key: keyof T;
  title: string;
  dataIndex: keyof T;
  render?: (value: any, record: T) => React.ReactNode;
  sorter?: boolean;
  filterable?: boolean;
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  pagination?: PaginationParams;
  onPaginationChange?: (params: PaginationParams) => void;
  onRowClick?: (record: T) => void;
}

// Типы форм
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'select' | 'date' | 'boolean';
  required?: boolean;
  options?: { value: any; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    message?: string;
  };
}

export interface FormProps {
  fields: FormField[];
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void;
  loading?: boolean;
  submitText?: string;
}

// Типы уведомлений
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: {
    label: string;
    onClick: () => void;
  }[];
}

// Типы настроек
export interface AppSettings {
  theme: 'light' | 'dark';
  language: string;
  date_format: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  dashboard: {
    refresh_interval: number;
    default_date_range: number;
    charts_per_page: number;
  };
}

// Типы API
export interface ApiError {
  status: number;
  message: string;
  details?: any;
}

export interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

// Типы состояния
export interface LoadingState {
  [key: string]: boolean;
}

export interface ErrorState {
  [key: string]: string | null;
}

// Типы контекста
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

// Типы экспорта
export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'pdf';
  filename?: string;
  include_headers?: boolean;
  date_range?: DateRangeFilter;
}

// Типы поиска
export interface SearchParams {
  query: string;
  filters?: Record<string, any>;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  pagination?: PaginationParams;
}

export interface SearchResult<T = any> {
  data: T[];
  total: number;
  query: string;
  filters: Record<string, any>;
  pagination: PaginationResponse;
}
