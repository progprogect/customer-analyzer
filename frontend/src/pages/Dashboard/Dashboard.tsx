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
  Button,
  Alert,
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
  Refresh,
  Assessment,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useSegmentationData, usePurchasePredictionData, useChurnPredictionData } from '../../hooks/useMLData';
import DataRefreshManager from '../../components/DataRefreshManager';

const Dashboard: React.FC = () => {
  const { segments, metrics: segmentationMetrics, isLoading: segmentationLoading } = useSegmentationData();
  const { topPredictions, metrics: purchaseMetrics, isLoading: purchaseLoading } = usePurchasePredictionData();
  const { highRiskUsers, metrics: churnMetrics, isLoading: churnLoading } = useChurnPredictionData();

  // Вычисляем агрегированные метрики
  const totalUsers = segments?.segments?.reduce((sum, segment) => sum + segment.size, 0) || 0;
  const activeUsers = segments?.segments?.filter(s => s.name !== 'Неактивные').reduce((sum, segment) => sum + segment.size, 0) || 0;
  const highRiskCount = highRiskUsers?.length || 0;
  const highPurchaseProbability = topPredictions?.filter(p => p.purchase_probability > 0.7).length || 0;

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

  // Mock данные для демонстрации (пока нет реальных данных)
  const mockTimeSeriesData = [
    { date: '2023-01-01', users: 1200, events: 4500, purchases: 180 },
    { date: '2023-01-02', users: 1350, events: 5200, purchases: 210 },
    { date: '2023-01-03', users: 1280, events: 4800, purchases: 195 },
    { date: '2023-01-04', users: 1420, events: 5600, purchases: 225 },
    { date: '2023-01-05', users: 1380, events: 5100, purchases: 205 },
    { date: '2023-01-06', users: 1500, events: 5900, purchases: 240 },
    { date: '2023-01-07', users: 1450, events: 5500, purchases: 220 },
  ];

  const mockRecentEvents = [
    { id: 1, type: 'purchase', user: 'Иван Петров', amount: 1500, time: '2 мин назад' },
    { id: 2, type: 'churn_risk', user: 'Мария Сидорова', risk: 'high', time: '5 мин назад' },
    { id: 3, type: 'segment_change', user: 'Алексей Иванов', segment: 'VIP', time: '10 мин назад' },
    { id: 4, type: 'new_user', user: 'Елена Козлова', time: '15 мин назад' },
  ];

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h4" gutterBottom>
        Дашборд
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Обзор ключевых метрик и активности системы с ML аналитикой
      </Typography>

      {/* Предупреждения о высоком риске */}
      {highRiskCount > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">
            Внимание! {highRiskCount} пользователей с высоким риском оттока требуют немедленного внимания
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Управление данными */}
        <Grid item xs={12}>
          <DataRefreshManager />
        </Grid>

        {/* Ключевые метрики */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Всего пользователей
                  </Typography>
                  <Typography variant="h4">
                    {segmentationLoading ? '...' : totalUsers.toLocaleString()}
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
                    {segmentationLoading ? '...' : activeUsers.toLocaleString()}
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
                    Высокая вероятность покупки
                  </Typography>
                  <Typography variant="h4">
                    {purchaseLoading ? '...' : highPurchaseProbability}
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
                    Риск оттока
                  </Typography>
                  <Typography variant="h4" color={highRiskCount > 0 ? 'error' : 'success'}>
                    {churnLoading ? '...' : highRiskCount}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: highRiskCount > 0 ? 'error.main' : 'success.main' }}>
                  <TrendingDown />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Графики */}
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
            {segments?.segments ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={segments.segments}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="size"
                    label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  >
                    {segments.segments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                <Typography color="text.secondary">Загрузка данных...</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* ML метрики */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Качество ML моделей
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <Assessment />
                </ListItemIcon>
                <ListItemText
                  primary="Сегментация"
                  secondary={`Silhouette Score: ${segmentationMetrics?.silhouette_score ? (segmentationMetrics.silhouette_score * 100).toFixed(1) : 'N/A'}%`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <ShoppingCart />
                </ListItemIcon>
                <ListItemText
                  primary="Прогнозы покупок"
                  secondary={`Accuracy: ${purchaseMetrics?.accuracy ? (purchaseMetrics.accuracy * 100).toFixed(1) : 'N/A'}%`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <TrendingDown />
                </ListItemIcon>
                <ListItemText
                  primary="Прогнозы оттока"
                  secondary={`Accuracy: ${churnMetrics?.accuracy ? (churnMetrics.accuracy * 100).toFixed(1) : 'N/A'}%`}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Последние события */}
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

        {/* Топ пользователи с высокой вероятностью покупки */}
        {topPredictions && topPredictions.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Топ пользователи для конверсии
              </Typography>
              <List>
                {topPredictions.slice(0, 5).map((prediction) => (
                  <ListItem key={prediction.user_id} divider>
                    <ListItemIcon>
                      <ShoppingCart color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`User #${prediction.user_id}`}
                      secondary={`${(prediction.purchase_probability * 100).toFixed(1)}% вероятность`}
                    />
                    <Chip
                      label={prediction.prediction_confidence}
                      color={prediction.prediction_confidence === 'high' ? 'success' : 'warning'}
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        )}

        {/* Пользователи с высоким риском оттока */}
        {highRiskUsers && highRiskUsers.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="error">
                Пользователи высокого риска оттока
              </Typography>
              <List>
                {highRiskUsers.slice(0, 5).map((prediction) => (
                  <ListItem key={prediction.user_id} divider>
                    <ListItemIcon>
                      <Warning color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`User #${prediction.user_id}`}
                      secondary={`${(prediction.churn_probability * 100).toFixed(1)}% риск оттока`}
                    />
                    <Chip
                      label="Высокий риск"
                      color="error"
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Dashboard;
