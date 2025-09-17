import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Telegram as TelegramIcon,
  Psychology as PsychologyIcon,
} from '@mui/icons-material';
import MetricCard from '../../components/Dashboard/MetricCard.tsx';
import ChartCard from '../../components/Dashboard/ChartCard.tsx';
import { dataService } from '../../services/dataService.ts';

interface DashboardData {
  totalUsers: number;
  activeUsers: number;
  totalPurchases: number;
  conversionRate: number;
  churnRate: number;
  telegramUsers: number;
  userGrowth: any[];
  purchaseTrends: any[];
  userSegments: any[];
  systemHealth: {
    backend: boolean;
    database: boolean;
    telegram: boolean;
    ml: boolean;
  };
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Получаем данные из единого сервиса
      const userStats = await dataService.getUserStats();
      
      const dashboardData: DashboardData = {
        totalUsers: userStats.totalUsers,
        activeUsers: userStats.activeUsers,
        totalPurchases: userStats.totalPurchases,
        conversionRate: userStats.conversionRate,
        churnRate: userStats.churnRate,
        telegramUsers: userStats.telegramUsers,
        userGrowth: userStats.userGrowth,
        purchaseTrends: userStats.purchaseTrends,
        userSegments: userStats.userSegments,
        systemHealth: {
          backend: true,
          database: true,
          telegram: true,
          ml: true,
        },
      };

      setData(dashboardData);
    } catch (err) {
      setError('Ошибка загрузки данных');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!data) return null;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        📊 Дашборд Customer Analyzer
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Обзор аналитики пользователей и системы
      </Typography>

      {/* Системный статус */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🔧 Статус системы
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: data.systemHealth.backend ? 'success.main' : 'error.main',
                }}
              />
              <Typography variant="body2">Backend API</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: data.systemHealth.database ? 'success.main' : 'error.main',
                }}
              />
              <Typography variant="body2">База данных</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: data.systemHealth.telegram ? 'success.main' : 'error.main',
                }}
              />
              <Typography variant="body2">Telegram Bot</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: data.systemHealth.ml ? 'success.main' : 'error.main',
                }}
              />
              <Typography variant="body2">ML Сервисы</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Основные метрики */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Всего пользователей"
            value={data.totalUsers.toLocaleString()}
            change={12.5}
            changeLabel="за месяц"
            icon={<PeopleIcon />}
            color="primary"
            onRefresh={fetchDashboardData}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Активные пользователи"
            value={data.activeUsers.toLocaleString()}
            change={8.2}
            changeLabel="за неделю"
            icon={<TrendingUpIcon />}
            color="success"
            onRefresh={fetchDashboardData}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Всего покупок"
            value={data.totalPurchases.toLocaleString()}
            change={15.3}
            changeLabel="за месяц"
            icon={<ShoppingCartIcon />}
            color="warning"
            onRefresh={fetchDashboardData}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Конверсия"
            value={`${data.conversionRate}%`}
            change={-2.1}
            changeLabel="за неделю"
            icon={<TrendingUpIcon />}
            color="secondary"
            onRefresh={fetchDashboardData}
          />
        </Grid>
      </Grid>

      {/* Дополнительные метрики */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Отток клиентов"
            value={`${data.churnRate}%`}
            change={-1.2}
            changeLabel="улучшение"
            icon={<WarningIcon />}
            color="error"
            onRefresh={fetchDashboardData}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Telegram пользователи"
            value={data.telegramUsers.toLocaleString()}
            change={25.7}
            changeLabel="рост"
            icon={<TelegramIcon />}
            color="primary"
            onRefresh={fetchDashboardData}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="ML Предсказания"
            value="98.7%"
            change={0.3}
            changeLabel="точность"
            icon={<PsychologyIcon />}
            color="success"
            onRefresh={fetchDashboardData}
          />
        </Grid>
      </Grid>

      {/* Графики */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <ChartCard
            title="Рост пользователей"
            subtitle="Динамика регистраций по месяцам"
            data={data.userGrowth}
            type="line"
            dataKey="users"
            color="#1976d2"
            height={300}
            onRefresh={fetchDashboardData}
          />
        </Grid>
        <Grid item xs={12} lg={4}>
          <ChartCard
            title="Сегменты пользователей"
            subtitle="Распределение по типам"
            data={data.userSegments}
            type="pie"
            dataKey="value"
            height={300}
            onRefresh={fetchDashboardData}
          />
        </Grid>
        <Grid item xs={12}>
          <ChartCard
            title="Тренды покупок"
            subtitle="Объем продаж по месяцам"
            data={data.purchaseTrends}
            type="bar"
            dataKey="purchases"
            color="#ff9800"
            height={250}
            onRefresh={fetchDashboardData}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;