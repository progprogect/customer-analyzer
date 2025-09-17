import React from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Warning as WarningIcon,
  TrendingDown as TrendingDownIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';

const Churn: React.FC = () => {
  const churnUsers = [
    {
      userId: 'user_101',
      name: 'Иван Новиков',
      riskScore: 85,
      daysSinceLastActivity: 45,
      lastPurchase: '2 месяца назад',
      totalSpent: 1200,
      riskLevel: 'high',
    },
    {
      userId: 'user_102',
      name: 'Мария Козлова',
      riskScore: 72,
      daysSinceLastActivity: 35,
      lastPurchase: '1.5 месяца назад',
      totalSpent: 850,
      riskLevel: 'high',
    },
    {
      userId: 'user_103',
      name: 'Алексей Соколов',
      riskScore: 58,
      daysSinceLastActivity: 28,
      lastPurchase: '1 месяц назад',
      totalSpent: 420,
      riskLevel: 'medium',
    },
    {
      userId: 'user_104',
      name: 'Татьяна Морозова',
      riskScore: 45,
      daysSinceLastActivity: 20,
      lastPurchase: '3 недели назад',
      totalSpent: 680,
      riskLevel: 'medium',
    },
    {
      userId: 'user_105',
      name: 'Сергей Лебедев',
      riskScore: 38,
      daysSinceLastActivity: 15,
      lastPurchase: '2 недели назад',
      totalSpent: 950,
      riskLevel: 'low',
    },
  ];

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'high': return 'Высокий риск';
      case 'medium': return 'Средний риск';
      case 'low': return 'Низкий риск';
      default: return 'Неизвестно';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        ⚠️ Анализ оттока клиентов
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Предсказание вероятности ухода клиентов и рекомендации по их удержанию
      </Typography>

      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Внимание:</strong> 15 пользователей находятся в зоне высокого риска оттока. 
          Рекомендуется немедленно запустить кампанию по удержанию.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🚨 Пользователи в зоне риска
              </Typography>
              <List>
                {churnUsers.map((user, index) => (
                  <ListItem key={index} divider={index < churnUsers.length - 1}>
                    <ListItemAvatar>
                      <Avatar sx={{ backgroundColor: 'error.main' }}>
                        <WarningIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">
                            {user.name}
                          </Typography>
                          <Chip
                            label={getRiskLabel(user.riskLevel)}
                            color={getRiskColor(user.riskLevel) as any}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Риск оттока: {user.riskScore}%
                          </Typography>
                          <Box sx={{ mt: 1, mb: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={user.riskScore}
                              color={user.riskLevel === 'high' ? 'error' : user.riskLevel === 'medium' ? 'warning' : 'success'}
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Неактивен {user.daysSinceLastActivity} дней • 
                            Последняя покупка: {user.lastPurchase} • 
                            Потратил: ${user.totalSpent}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Статистика оттока
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Высокий риск</Typography>
                  <Typography variant="body2" fontWeight="bold" color="error.main">
                    15 пользователей
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={12} color="error" sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Средний риск</Typography>
                  <Typography variant="body2" fontWeight="bold" color="warning.main">
                    28 пользователей
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={22} color="warning" sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Низкий риск</Typography>
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    87 пользователей
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={70} color="success" />
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🎯 План действий
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" gutterBottom>
                  • Отправить персональные скидки пользователям высокого риска
                </Typography>
                <Typography variant="body2" gutterBottom>
                  • Запустить email-кампанию с напоминанием о товарах
                </Typography>
                <Typography variant="body2" gutterBottom>
                  • Предложить бонусы за возвращение
                </Typography>
                <Typography variant="body2">
                  • Настроить push-уведомления для мобильных пользователей
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                💰 Потенциальные потери
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body1">Высокий риск</Typography>
                  <Typography variant="h6" color="error.main">
                    $18,500
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body1">Средний риск</Typography>
                  <Typography variant="h6" color="warning.main">
                    $12,800
                  </Typography>
                </Box>
                <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Общие потери</Typography>
                    <Typography variant="h5" color="error.main">
                      $31,300
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📈 Эффективность удержания
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Успешно удержано</Typography>
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    78%
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={78} color="success" sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Средний ROI кампаний</Typography>
                  <Typography variant="body2" fontWeight="bold" color="primary.main">
                    340%
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={85} sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Экономия от удержания</Typography>
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    $24,400
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={78} color="success" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Churn;
