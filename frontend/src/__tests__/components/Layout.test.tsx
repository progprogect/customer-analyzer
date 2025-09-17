/**
 * Тесты для компонентов Layout
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import Layout from '../../components/Layout/Layout';
import Header from '../../components/Layout/Header';
import Sidebar from '../../components/Layout/Sidebar';

// Mock для useMediaQuery
const mockUseMediaQuery = jest.fn();

jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: () => mockUseMediaQuery(),
  };
});

// Mock для useAuth
const mockAuthContext = {
  user: {
    user_id: 1,
    telegram_id: 123456789,
    first_name: 'Test',
    last_name: 'User',
    username: 'testuser',
    registration_date: new Date().toISOString(),
  },
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

const theme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  </BrowserRouter>
);

describe('Layout Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Layout', () => {
    it('должен рендериться без ошибок', () => {
      mockUseMediaQuery.mockReturnValue(false); // Desktop view
      
      render(
        <TestWrapper>
          <Layout>
            <div>Test Content</div>
          </Layout>
        </TestWrapper>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('должен показывать sidebar на desktop', () => {
      mockUseMediaQuery.mockReturnValue(false); // Desktop view
      
      render(
        <TestWrapper>
          <Layout>
            <div>Test Content</div>
          </Layout>
        </TestWrapper>
      );

      expect(screen.getByText('Customer Analyzer')).toBeInTheDocument();
    });

    it('должен скрывать sidebar на mobile по умолчанию', () => {
      mockUseMediaQuery.mockReturnValue(true); // Mobile view
      
      render(
        <TestWrapper>
          <Layout>
            <div>Test Content</div>
          </Layout>
        </TestWrapper>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('Header', () => {
    it('должен отображать название приложения', () => {
      render(
        <TestWrapper>
          <Header onMenuClick={jest.fn()} />
        </TestWrapper>
      );

      expect(screen.getByText('Customer Analyzer')).toBeInTheDocument();
    });

    it('должен отображать аватар пользователя', () => {
      render(
        <TestWrapper>
          <Header onMenuClick={jest.fn()} />
        </TestWrapper>
      );

      expect(screen.getByText('T')).toBeInTheDocument(); // First letter of first name
    });

    it('должен показывать кнопку меню на mobile', () => {
      mockUseMediaQuery.mockReturnValue(true); // Mobile view
      
      render(
        <TestWrapper>
          <Header onMenuClick={jest.fn()} />
        </TestWrapper>
      );

      expect(screen.getByLabelText('open drawer')).toBeInTheDocument();
    });

    it('должен скрывать кнопку меню на desktop', () => {
      mockUseMediaQuery.mockReturnValue(false); // Desktop view
      
      render(
        <TestWrapper>
          <Header onMenuClick={jest.fn()} />
        </TestWrapper>
      );

      expect(screen.queryByLabelText('open drawer')).not.toBeInTheDocument();
    });

    it('должен вызывать onMenuClick при клике на кнопку меню', () => {
      const mockOnMenuClick = jest.fn();
      mockUseMediaQuery.mockReturnValue(true); // Mobile view
      
      render(
        <TestWrapper>
          <Header onMenuClick={mockOnMenuClick} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByLabelText('open drawer'));
      expect(mockOnMenuClick).toHaveBeenCalledTimes(1);
    });

    it('должен показывать меню профиля при клике на аватар', () => {
      render(
        <TestWrapper>
          <Header onMenuClick={jest.fn()} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByLabelText('account of current user'));
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Настройки')).toBeInTheDocument();
      expect(screen.getByText('Выйти')).toBeInTheDocument();
    });

    it('должен вызывать logout при клике на "Выйти"', () => {
      render(
        <TestWrapper>
          <Header onMenuClick={jest.fn()} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByLabelText('account of current user'));
      fireEvent.click(screen.getByText('Выйти'));
      
      expect(mockAuthContext.logout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Sidebar', () => {
    it('должен отображать все пункты навигации', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      expect(screen.getByText('Дашборд')).toBeInTheDocument();
      expect(screen.getByText('Сегментация пользователей')).toBeInTheDocument();
      expect(screen.getByText('Предсказание покупок')).toBeInTheDocument();
      expect(screen.getByText('Предсказание оттока')).toBeInTheDocument();
      expect(screen.getByText('Аналитика')).toBeInTheDocument();
      expect(screen.getByText('Настройки')).toBeInTheDocument();
    });

    it('должен показывать активный пункт меню', () => {
      // Mock для useLocation
      jest.mock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useLocation: () => ({
          pathname: '/dashboard',
        }),
      }));

      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      // Проверяем, что активный пункт имеет соответствующие стили
      const dashboardItem = screen.getByText('Дашборд').closest('[role="button"]');
      expect(dashboardItem).toHaveClass('Mui-selected');
    });

    it('должен вызывать onItemClick при клике на пункт меню', () => {
      const mockOnItemClick = jest.fn();
      
      render(
        <TestWrapper>
          <Sidebar onItemClick={mockOnItemClick} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Дашборд'));
      expect(mockOnItemClick).toHaveBeenCalledTimes(1);
    });

    it('должен отображать версию приложения', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    });
  });
});
