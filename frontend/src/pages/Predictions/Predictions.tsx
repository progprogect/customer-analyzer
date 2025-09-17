import React from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  TrendingUp as TrendingUpIcon,
  Psychology as PsychologyIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

const Predictions: React.FC = () => {
  const predictions = [
    {
      userId: 'user_001',
      name: 'Анна Смирнова',
      probability: 87,
      predictedAmount: 450,
      lastPurchase: '2 дня назад',
      status: 'high',
    },
    {
      userId: 'user_002',
      name: 'Дмитрий Козлов',
      probability: 73,
      predictedAmount: 280,
      lastPurchase: '1 неделя назад',
      status: 'high',
    },
    {
      userId: 'user_003',
      name: 'Елена Петрова',
      probability: 65,
      predictedAmount: 180,
      lastPurchase: '3 дня назад',
      status: 'medium',
    },
    {
      userId: 'user_004',
      name: 'Михаил Волков',
      probability: 45,
      predictedAmount: 120,
      lastPurchase: '2 недели назад',
      status: 'medium',
    },
    {
      userId: 'user_005',
      name: 'Ольга Сидорова',
      probability: 32,
      predictedAmount: 85,
      lastPurchase: '1 месяц назад',
      status: 'low',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'high': return 'success';
      case 'medium': return 'warning';
      case 'low': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'high': return 'Высокая вероятность';
      case 'medium': return 'Средняя вероятность';
      case 'low': return 'Низкая вероятность';
      default: return 'Неизвестно';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        🔮 Предсказания покупок
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        ML-модель предсказывает вероятность совершения покупки каждым пользователем
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🎯 Топ-5 кандидатов на покупку
              </Typography>
              <List>
                {predictions.map((prediction, index) => (
                  <ListItem key={index} divider={index < predictions.length - 1}>
                    <ListItemAvatar>
                      <Avatar sx={{ backgroundColor: 'primary.main' }}>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">
                            {prediction.name}
                          </Typography>
                          <Chip
                            label={getStatusLabel(prediction.status)}
                            color={getStatusColor(prediction.status) as any}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Вероятность покупки: {prediction.probability}%
                          </Typography>
                          <Box sx={{ mt: 1, mb: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={prediction.probability}
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Прогнозируемая сумма: ${prediction.predictedAmount} • 
                            Последняя покупка: {prediction.lastPurchase}
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
                📊 Статистика модели
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Точность модели</Typography>
                  <Typography variant="body2" fontWeight="bold">94.2%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={94.2} sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">AUC-ROC</Typography>
                  <Typography variant="body2" fontWeight="bold">0.91</Typography>
                </Box>
                <LinearProgress variant="determinate" value={91} sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">F1-Score</Typography>
                  <Typography variant="body2" fontWeight="bold">0.89</Typography>
                </Box>
                <LinearProgress variant="determinate" value={89} />
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🎯 Рекомендации по действиям
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" gutterBottom>
                  • Отправить персональные предложения пользователям с высокой вероятностью
                </Typography>
                <Typography variant="body2" gutterBottom>
                  • Настроить таргетированную рекламу для среднего сегмента
                </Typography>
                <Typography variant="body2" gutterBottom>
                  • Запустить реактивационную кампанию для низкого сегмента
                </Typography>
                <Typography variant="body2">
                  • Обновить модель каждые 7 дней
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
                📈 Прогноз доходов
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body1">Высокая вероятность</Typography>
                  <Typography variant="h6" color="success.main">
                    $2,340
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body1">Средняя вероятность</Typography>
                  <Typography variant="h6" color="warning.main">
                    $1,680
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body1">Низкая вероятность</Typography>
                  <Typography variant="h6" color="error.main">
                    $890
                  </Typography>
                </Box>
                <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Общий прогноз</Typography>
                    <Typography variant="h5" color="primary.main">
                      $4,910
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
                🔄 История обновлений модели
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">17.09.2025</Typography>
                  <Chip label="Успешно" color="success" size="small" />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Обновление модели с новыми данными
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">10.09.2025</Typography>
                  <Chip label="Успешно" color="success" size="small" />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Добавление новых признаков
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">03.09.2025</Typography>
                  <Chip label="Успешно" color="success" size="small" />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Первоначальная настройка модели
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Predictions;
