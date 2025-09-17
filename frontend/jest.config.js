module.exports = {
  // Тестовая среда
  testEnvironment: 'jsdom',
  
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
  ],
  
  // Настройки для TypeScript
  preset: 'ts-jest',
  
  // Настройки покрытия кода
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/**/__tests__/**',
    '!src/index.tsx',
    '!src/index.css',
  ],
  
  // Минимальный порог покрытия для Frontend
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
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      'jest-transform-stub',
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
  
  // Настройки для jsdom
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
};
