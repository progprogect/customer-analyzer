module.exports = {
  // Тестовая среда
  testEnvironment: 'node',
  
  // Расширения файлов для тестирования
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Преобразование файлов
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  
  // Паттерны для поиска тестовых файлов
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js|jsx)',
    '**/*.(test|spec).(ts|tsx|js|jsx)',
  ],
  
  // Исключения
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/',
  ],
  
  // Настройки для TypeScript
  preset: 'ts-jest',
  
  // Настройки покрытия кода
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    '**/*.{ts,tsx,js,jsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/build/**',
    '!**/coverage/**',
    '!**/*.config.js',
    '!**/*.config.ts',
  ],
  
  // Минимальный порог покрытия
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Настройки для модулей
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Настройки для async тестов
  testTimeout: 10000,
  
  // Настройки для setup файлов
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Настройки для очистки моков
  clearMocks: true,
  restoreMocks: true,
  
  // Настройки для verbose режима
  verbose: true,
};
