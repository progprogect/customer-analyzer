import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Avatar,
} from '@mui/material';
import {
  People,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Notifications,
  CheckCircle,
  Warning,
  Error,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// Mock data для демонстрации
const mockAnalyticsData = {
  totalUsers: 12543,
  activeUsers: 8921,
  totalEvents: 45678,
  totalPurchases: 2341,
  totalRevenue: 156789,
  avgOrderValue: 67.2,
  conversionRate: 18.7,
  churnRate: 12.3,
};

const mockTimeSeriesData = [
  { date: '2023-01-01', users: 1200, events: 4500, purchases: 180 },
  { date: '2023-01-02', users: 1350, events: 5200, purchases: 210 },
  { date: '2023-01-03', users: 1280, events: 4800, purchases: 195 },
  { date: '2023-01-04', users: 1420, events: 5600, purchases: 225 },
  { date: '2023-01-05', users: 1380, events: 5100, purchases: 205 },
  { date: '2023-01-06', users: 1500, events: 5900, purchases: 240 },
  { date: '2023-01-07', users: 1450, events: 5500, purchases: 220 },
];

const mockSegmentData = [
  { name: 'Активные пользователи', value: 35, color: '#1976d2' },
  { name: 'Новые пользователи', value: 25, color: '#42a5f5' },
  { name: 'VIP клиенты', value: 15, color: '#dc004e' },
  { name: 'Неактивные', value: 25, color: '#757575' },
];

const mockRecentEvents = [
  { id: 1, type: 'purchase', user: 'Иван Петров', amount: 1500, time: '2 мин назад' },
  { id: 2, type: 'churn_risk', user: 'Мария Сидорова', risk: 'high', time: '5 мин назад' },
  { id: 3, type: 'segment_change', user: 'Алексей Иванов', segment: 'VIP', time: '10 мин назад' },
  { id: 4, type: 'new_user', user: 'Елена Козлова', time: '15 мин назад' },
];

const Dashboard: React.FC = () => {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <CheckCircle color="success" />;
      case 'churn_risk':
        return <Warning color="warning" />;
      case 'segment_change':
        return <TrendingUp color="info" />;
      case 'new_user':
        return <People color="primary" />;
      default:
        return <Notifications />;
    }
  };

  const getEventText = (event: any) => {
    switch (event.type) {
      case 'purchase':
        return `${event.user} совершил покупку на ${event.amount}₽`;
      case 'churn_risk':
        return `Высокий риск оттока у пользователя ${event.user}`;
      case 'segment_change':
        return `${event.user} перешел в сегмент "${event.segment}"`;
      case 'new_user':
        return `Новый пользователь: ${event.user}`;
      default:
        return 'Неизвестное событие';
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h4" gutterBottom>
        Дашборд
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Обзор ключевых метрик и активности системы
      </Typography>

      {/* Ключевые метрики */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Всего пользователей
                  </Typography>
                  <Typography variant="h4">
                    {mockAnalyticsData.totalUsers.toLocaleString()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <People />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Активные пользователи
                  </Typography>
                  <Typography variant="h4">
                    {mockAnalyticsData.activeUsers.toLocaleString()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <TrendingUp />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Общий доход
                  </Typography>
                  <Typography variant="h4">
                    {mockAnalyticsData.totalRevenue.toLocaleString()}₽
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <ShoppingCart />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Конверсия
                  </Typography>
                  <Typography variant="h4">
                    {mockAnalyticsData.conversionRate}%
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <TrendingDown />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Графики */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Динамика активности
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockTimeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#1976d2" strokeWidth={2} />
                <Line type="monotone" dataKey="events" stroke="#42a5f5" strokeWidth={2} />
                <Line type="monotone" dataKey="purchases" stroke="#dc004e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Сегменты пользователей
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockSegmentData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {mockSegmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Последние события */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Последние события
            </Typography>
            <List>
              {mockRecentEvents.map((event) => (
                <ListItem key={event.id} divider>
                  <ListItemIcon>
                    {getEventIcon(event.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={getEventText(event)}
                    secondary={event.time}
                  />
                  {event.type === 'churn_risk' && (
                    <Chip
                      label="Высокий риск"
                      color="warning"
                      size="small"
                    />
                  )}
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Быстрые действия
            </Typography>
            <List>
              <ListItem button>
                <ListItemText
                  primary="Обучить модель сегментации"
                  secondary="Последнее обучение: 2 часа назад"
                />
              </ListItem>
              <ListItem button>
                <ListItemText
                  primary="Обновить прогнозы покупок"
                  secondary="Последнее обновление: 1 час назад"
                />
              </ListItem>
              <ListItem button>
                <ListItemText
                  primary="Проверить риск оттока"
                  secondary="Найдено 23 пользователя с высоким риском"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
