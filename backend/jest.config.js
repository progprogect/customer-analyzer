module.exports = {
  // Тестовая среда
  testEnvironment: 'node',
  
  // Преобразование файлов
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  
  // Паттерны для поиска тестовых файлов
  testMatch: [
    '**/__tests__/**/*.(ts|tsx)',
    '**/*.(test|spec).(ts|tsx)',
  ],
  
  // Исключения
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
  ],
  
  // Настройки для TypeScript
  preset: 'ts-jest',
  
  // Настройки покрытия кода
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/**/__tests__/**',
  ],
  
  // Минимальный порог покрытия для Backend
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // Настройки для модулей
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Настройки для async тестов
  testTimeout: 15000,
  
  // Настройки для setup файлов
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Настройки для очистки моков
  clearMocks: true,
  restoreMocks: true,
  
  // Настройки для verbose режима
  verbose: true,
  
  // Настройки для тестирования с базой данных
  globalSetup: '<rootDir>/jest.global-setup.js',
  globalTeardown: '<rootDir>/jest.global-teardown.js',
};
