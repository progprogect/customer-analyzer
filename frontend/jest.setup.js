// Frontend Jest setup file
// Этот файл выполняется перед каждым тестом

import '@testing-library/jest-dom';

// Mock для window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock для IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock для ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock для localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock для sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock для fetch API
global.fetch = jest.fn();

// Mock для URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Настройки для тестирования
process.env.NODE_ENV = 'test';
process.env.REACT_APP_API_URL = 'http://localhost:3001/api';
process.env.REACT_APP_ML_API_URL = 'http://localhost:8000/api';

// Mock для React Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }) => children,
}));

// Mock для Material-UI
jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: jest.fn(() => false),
    useTheme: jest.fn(() => ({
      breakpoints: {
        down: jest.fn(() => 'md'),
      },
    })),
  };
});

// Mock для Recharts
jest.mock('recharts', () => ({
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
}));

// Глобальные утилиты для Frontend тестов
global.frontendTestUtils = {
  // Генерация тестовых пользователей
  generateTestUser: (overrides = {}) => ({
    user_id: Math.floor(Math.random() * 1000000),
    telegram_id: Math.floor(Math.random() * 1000000000),
    first_name: 'Test',
    last_name: 'User',
    username: 'testuser',
    registration_date: new Date().toISOString(),
    profile_data: {},
    ...overrides,
  }),
  
  // Генерация тестовых сегментов
  generateTestSegments: () => ({
    segments: [
      {
        segment_id: 1,
        name: 'Активные пользователи',
        description: 'Пользователи с высокой активностью',
        size: 1000,
        percentage: 35.0,
        characteristics: {
          avg_events_per_day: 5.2,
          avg_session_duration: 1200,
        },
      },
      {
        segment_id: 2,
        name: 'Новые пользователи',
        description: 'Недавно зарегистрированные пользователи',
        size: 500,
        percentage: 17.5,
        characteristics: {
          registration_days_ago: 7,
          onboarding_completed: true,
        },
      },
    ],
    user_segments: {
      123: 1,
      456: 2,
    },
    model_metrics: {
      silhouette_score: 0.75,
      inertia: 1234.56,
    },
    feature_importance: {
      event_count: 0.85,
      session_duration: 0.72,
      days_since_registration: 0.68,
    },
    model_version: 'v1.0.0',
    created_at: new Date().toISOString(),
  }),
  
  // Генерация тестовых прогнозов покупок
  generateTestPurchasePredictions: () => [
    {
      user_id: 123,
      purchase_probability: 0.85,
      prediction_confidence: 'high',
      key_factors: ['high_activity', 'recent_views'],
      prediction_date: new Date().toISOString(),
      model_version: 'v1.0.0',
    },
    {
      user_id: 456,
      purchase_probability: 0.45,
      prediction_confidence: 'medium',
      key_factors: ['moderate_activity'],
      prediction_date: new Date().toISOString(),
      model_version: 'v1.0.0',
    },
  ],
  
  // Генерация тестовых прогнозов оттока
  generateTestChurnPredictions: () => [
    {
      user_id: 123,
      churn_probability: 0.25,
      prediction_confidence: 'low',
      risk_factors: ['recent_activity'],
      retention_recommendations: ['send_promotional_email'],
      prediction_date: new Date().toISOString(),
      model_version: 'v1.0.0',
    },
    {
      user_id: 789,
      churn_probability: 0.85,
      prediction_confidence: 'high',
      risk_factors: ['low_activity', 'no_recent_purchases'],
      retention_recommendations: ['personal_outreach', 'special_offer'],
      prediction_date: new Date().toISOString(),
      model_version: 'v1.0.0',
    },
  ],
  
  // Mock для API ответов
  mockApiResponse: (data, success = true) => ({
    success,
    data,
    timestamp: new Date().toISOString(),
  }),
  
  // Mock для ошибок API
  mockApiError: (message, status = 500) => ({
    success: false,
    error: message,
    status,
    timestamp: new Date().toISOString(),
  }),
  
  // Ожидание async операций
  waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Очистка localStorage
  clearLocalStorage: () => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  },
  
  // Очистка fetch моков
  clearFetchMocks: () => {
    fetch.mockClear();
  },
};
