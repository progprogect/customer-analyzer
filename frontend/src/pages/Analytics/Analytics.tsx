import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Search as SearchIcon,
  Psychology as PsychologyIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Visibility as VisibilityIcon,
  PlayArrow as PlayArrowIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Person as PersonIcon,
  ShoppingCart as ShoppingCartIcon,
  MonetizationOn as MonetizationOnIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { dataService, User, PurchasePrediction, ChurnRisk } from '../../services/dataService.ts';

interface UserAnalytics extends User {
  prediction?: PurchasePrediction;
  churnRisk?: ChurnRisk;
  segment?: string;
  lastActivityDays?: number;
  purchaseProbability?: number;
  churnProbability?: number;
}

interface PredictionExplanation {
  userId: string;
  predictionType: 'purchase' | 'churn';
  probability: number;
  confidence: 'high' | 'medium' | 'low';
  keyFactors: Array<{
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
    description: string;
  }>;
  recommendation: string;
}

const Analytics: React.FC = () => {
  const [users, setUsers] = useState<UserAnalytics[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserAnalytics[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserAnalytics | null>(null);
  const [predictionExplanation, setPredictionExplanation] = useState<PredictionExplanation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [predicting, setPredicting] = useState<string | null>(null);
  const [mlStatus, setMlStatus] = useState<any>(null);
  const [training, setTraining] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
    checkMLStatus();
  }, []);

  const checkMLStatus = async () => {
    try {
      const status = await dataService.getMLServiceStatus();
      setMlStatus(status);
    } catch (error) {
      console.error('Error checking ML status:', error);
    }
  };

  const trainModels = async () => {
    try {
      setTraining(true);
      const result = await dataService.trainModels();
      alert(`Модели обучены успешно!\nТочность предсказания покупок: ${result.purchase_accuracy?.toFixed(3) || 'N/A'}\nТочность предсказания оттока: ${result.churn_accuracy?.toFixed(3) || 'N/A'}\nОбучающих примеров: ${result.samples_count || 'N/A'}`);
      await checkMLStatus();
    } catch (error) {
      console.error('Error training models:', error);
      alert('Ошибка обучения моделей. Проверьте, что ML сервис запущен и база данных доступна.');
    } finally {
      setTraining(false);
    }
  };

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const [usersData, predictionsData, churnData] = await Promise.all([
        dataService.getUsers(),
        dataService.getPurchasePredictions(),
        dataService.getChurnAnalysis(),
      ]);
      
      // Объединяем данные пользователей с прогнозами
      const analyticsUsers: UserAnalytics[] = usersData.map(user => {
        const prediction = predictionsData.find(p => p.userId === user.id);
        const churn = churnData.find(c => c.userId === user.id);
        
        // Определяем сегмент на основе трат и активности
        let segment = 'Новый';
        if (user.total_spent > 1000) segment = 'VIP';
        else if (user.total_spent > 200 && user.total_purchases > 1) segment = 'Активный';
        else if (user.total_purchases === 0) segment = 'Новый';
        else segment = 'Спящий';
        
        // Вычисляем дни с последней активности
        const lastActivityDays = user.last_activity 
          ? Math.floor((new Date().getTime() - new Date(user.last_activity).getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        
        return {
          ...user,
          prediction,
          churnRisk: churn,
          segment,
          lastActivityDays,
          purchaseProbability: prediction?.probability || 0,
          churnProbability: churn?.riskScore || 0,
        };
      });
      
      setUsers(analyticsUsers);
    } catch (err) {
      setError('Ошибка загрузки данных аналитики');
      console.error('Error loading analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    if (!searchTerm) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user =>
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.segment?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredUsers(filtered);
  };

  const runPrediction = async (user: UserAnalytics, type: 'purchase' | 'churn') => {
    try {
      setPredicting(`${user.id}-${type}`);
      
      // Пытаемся получить реальный прогноз от ML API
      try {
        const realPrediction = await dataService.getRealPrediction(user.id, type);
        
        const explanation: PredictionExplanation = {
          userId: user.id,
          predictionType: type,
          probability: realPrediction.probability,
          confidence: realPrediction.probability > 70 ? 'high' : realPrediction.probability > 40 ? 'medium' : 'low',
          keyFactors: generateKeyFactors(user, type, realPrediction.features),
          recommendation: generateRecommendation(user, type, realPrediction.probability),
        };
        
        setPredictionExplanation(explanation);
        setSelectedUser(user);
        
        // Обновляем данные пользователя с реальным прогнозом
        setUsers(prevUsers => 
          prevUsers.map(u => 
            u.id === user.id 
              ? { 
                  ...u, 
                  purchaseProbability: type === 'purchase' ? realPrediction.probability : u.purchaseProbability,
                  churnProbability: type === 'churn' ? realPrediction.probability : u.churnProbability
                }
              : u
          )
        );
        
      } catch (error) {
        // Если реальный API недоступен, используем симуляцию
        console.warn('ML API unavailable, using simulation:', error);
        
        const explanation: PredictionExplanation = {
          userId: user.id,
          predictionType: type,
          probability: type === 'purchase' ? user.purchaseProbability || 0 : user.churnProbability || 0,
          confidence: type === 'purchase' 
            ? user.purchaseProbability! > 70 ? 'high' : user.purchaseProbability! > 40 ? 'medium' : 'low'
            : user.churnProbability! > 60 ? 'high' : user.churnProbability! > 30 ? 'medium' : 'low',
          keyFactors: generateKeyFactors(user, type),
          recommendation: generateRecommendation(user, type),
        };
        
        setPredictionExplanation(explanation);
        setSelectedUser(user);
      }
      
    } catch (err) {
      console.error('Error running prediction:', err);
    } finally {
      setPredicting(null);
    }
  };

  const generateKeyFactors = (user: UserAnalytics, type: 'purchase' | 'churn', features?: any): PredictionExplanation['keyFactors'] => {
    if (type === 'purchase') {
      return [
        {
          factor: 'История покупок',
          impact: user.total_purchases > 2 ? 'positive' : user.total_purchases > 0 ? 'neutral' : 'negative',
          weight: 0.3,
          description: user.total_purchases > 2 
            ? `Пользователь совершил ${user.total_purchases} покупок, что указывает на лояльность`
            : user.total_purchases > 0 
            ? `Пользователь совершил ${user.total_purchases} покупок`
            : 'Пользователь еще не совершал покупок'
        },
        {
          factor: 'Активность',
          impact: user.lastActivityDays! < 7 ? 'positive' : user.lastActivityDays! < 30 ? 'neutral' : 'negative',
          weight: 0.25,
          description: user.lastActivityDays! < 7 
            ? 'Высокая активность в последние дни'
            : user.lastActivityDays! < 30 
            ? 'Умеренная активность'
            : 'Низкая активность'
        },
        {
          factor: 'Сегмент пользователя',
          impact: user.segment === 'VIP' ? 'positive' : user.segment === 'Активный' ? 'positive' : 'neutral',
          weight: 0.2,
          description: `Пользователь относится к сегменту "${user.segment}"`
        },
        {
          factor: 'Сумма трат',
          impact: user.total_spent > 1000 ? 'positive' : user.total_spent > 200 ? 'neutral' : 'negative',
          weight: 0.15,
          description: `Потратил $${user.total_spent} за все время`
        },
        {
          factor: 'Время с регистрации',
          impact: user.registration_date ? 'neutral' : 'negative',
          weight: 0.1,
          description: `Зарегистрирован ${new Date(user.registration_date).toLocaleDateString('ru-RU')}`
        }
      ];
    } else {
      return [
        {
          factor: 'Дни без активности',
          impact: user.lastActivityDays! > 30 ? 'negative' : user.lastActivityDays! > 14 ? 'neutral' : 'positive',
          weight: 0.3,
          description: `${user.lastActivityDays} дней без активности`
        },
        {
          factor: 'История покупок',
          impact: user.total_purchases > 1 ? 'positive' : 'negative',
          weight: 0.25,
          description: user.total_purchases > 1 
            ? `Совершил ${user.total_purchases} покупок - высокая лояльность`
            : 'Нет истории покупок'
        },
        {
          factor: 'Сегмент пользователя',
          impact: user.segment === 'VIP' ? 'positive' : user.segment === 'Спящий' ? 'negative' : 'neutral',
          weight: 0.2,
          description: `Сегмент "${user.segment}"`
        },
        {
          factor: 'Сумма трат',
          impact: user.total_spent > 500 ? 'positive' : user.total_spent > 100 ? 'neutral' : 'negative',
          weight: 0.15,
          description: `Потратил $${user.total_spent}`
        },
        {
          factor: 'Статус активности',
          impact: user.status === 'active' ? 'positive' : 'negative',
          weight: 0.1,
          description: `Статус: ${user.status === 'active' ? 'Активный' : 'Неактивный'}`
        }
      ];
    }
  };

  const generateRecommendation = (user: UserAnalytics, type: 'purchase' | 'churn', probability?: number): string => {
    const prob = probability || (type === 'purchase' ? user.purchaseProbability : user.churnProbability) || 0;
    
    if (type === 'purchase') {
      if (prob > 70) {
        return 'Отправить персональное предложение с эксклюзивной скидкой. Пользователь готов к покупке.';
      } else if (prob > 40) {
        return 'Настроить таргетированную рекламу с интересными товарами. Умеренная вероятность покупки.';
      } else {
        return 'Запустить образовательную кампанию о преимуществах товаров. Низкая вероятность покупки.';
      }
    } else {
      if (prob > 60) {
        return 'Немедленно отправить персональное предложение с бонусами. Высокий риск оттока.';
      } else if (prob > 30) {
        return 'Улучшить качество сервиса и отправить опрос удовлетворенности. Средний риск оттока.';
      } else {
        return 'Поддерживать текущий уровень сервиса. Низкий риск оттока.';
      }
    }
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'VIP': return 'warning';
      case 'Активный': return 'success';
      case 'Новый': return 'info';
      case 'Спящий': return 'error';
      default: return 'default';
    }
  };

  const getProbabilityColor = (probability: number, type: 'purchase' | 'churn') => {
    if (type === 'purchase') {
      return probability > 70 ? 'success' : probability > 40 ? 'warning' : 'error';
    } else {
      return probability > 60 ? 'error' : probability > 30 ? 'warning' : 'success';
    }
  };

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

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        📊 Аналитика пользователей
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" color="text.secondary">
          Детальная статистика и ML прогнозы для каждого пользователя
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {mlStatus && (
            <Chip
              label={mlStatus.models_trained ? "ML модели обучены" : "ML модели не обучены"}
              color={mlStatus.models_trained ? "success" : "warning"}
              size="small"
            />
          )}
          <Button
            variant="outlined"
            color="secondary"
            startIcon={training ? <CircularProgress size={16} /> : <PsychologyIcon />}
            onClick={trainModels}
            disabled={training}
            size="small"
          >
            {training ? 'Обучение...' : 'Обучить модели'}
          </Button>
        </Box>
      </Box>

      {/* Поиск */}
      <Box sx={{ mb: 3 }}>
        <TextField
          placeholder="Поиск пользователей..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ width: 300 }}
        />
      </Box>

      {/* Статистика */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{users.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Всего пользователей
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PsychologyIcon color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">
                    {users.filter(u => u.purchaseProbability! > 70).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Высокая вероятность покупки
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <WarningIcon color="error" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">
                    {users.filter(u => u.churnProbability! > 60).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Высокий риск оттока
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MonetizationOnIcon color="warning" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">
                    {users.filter(u => u.segment === 'VIP').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    VIP клиенты
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Таблица пользователей */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📋 Детальная статистика пользователей
          </Typography>
          
          <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Пользователь</TableCell>
                  <TableCell>Сегмент</TableCell>
                  <TableCell>Активность</TableCell>
                  <TableCell>Покупки</TableCell>
                  <TableCell>Траты</TableCell>
                  <TableCell>Прогноз покупки</TableCell>
                  <TableCell>Риск оттока</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            mr: 1,
                            bgcolor: user.status === 'active' ? 'primary.main' : 'grey.500',
                          }}
                        >
                          {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {user.first_name} {user.last_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            @{user.username}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.segment}
                        color={getSegmentColor(user.segment!) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {user.lastActivityDays} дней назад
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.status === 'active' ? 'Активен' : 'Неактивен'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.total_purchases} покупок
                      </Typography>
                      {user.last_purchase_date && (
                        <Typography variant="caption" color="text.secondary">
                          Последняя: {new Date(user.last_purchase_date).toLocaleDateString('ru-RU')}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        ${user.total_spent}
                      </Typography>
                      {user.total_purchases > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          Средний чек: ${Math.round(user.total_spent / user.total_purchases)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">
                          {user.purchaseProbability}%
                        </Typography>
                        <Chip
                          label={user.purchaseProbability! > 70 ? 'Высокая' : 
                                 user.purchaseProbability! > 40 ? 'Средняя' : 'Низкая'}
                          color={getProbabilityColor(user.purchaseProbability!, 'purchase') as any}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">
                          {user.churnProbability}%
                        </Typography>
                        <Chip
                          label={user.churnProbability! > 60 ? 'Высокий' : 
                                 user.churnProbability! > 30 ? 'Средний' : 'Низкий'}
                          color={getProbabilityColor(user.churnProbability!, 'churn') as any}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Прогноз покупки">
                          <IconButton
                            size="small"
                            onClick={() => runPrediction(user, 'purchase')}
                            disabled={predicting === `${user.id}-purchase`}
                          >
                            {predicting === `${user.id}-purchase` ? 
                              <CircularProgress size={16} /> : 
                              <TrendingUpIcon fontSize="small" />
                            }
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Прогноз оттока">
                          <IconButton
                            size="small"
                            onClick={() => runPrediction(user, 'churn')}
                            disabled={predicting === `${user.id}-churn`}
                          >
                            {predicting === `${user.id}-churn` ? 
                              <CircularProgress size={16} /> : 
                              <WarningIcon fontSize="small" />
                            }
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Диалог с объяснением прогноза */}
      <Dialog
        open={!!predictionExplanation}
        onClose={() => setPredictionExplanation(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PsychologyIcon color="primary" />
            Объяснение прогноза
            {predictionExplanation?.predictionType === 'purchase' ? ' покупки' : ' оттока'}
          </Box>
        </DialogTitle>
        <DialogContent>
          {predictionExplanation && selectedUser && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Пользователь: {selectedUser.first_name} {selectedUser.last_name}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Вероятность:</strong> {predictionExplanation.probability}%
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Уверенность:</strong> 
                  <Chip
                    label={predictionExplanation.confidence === 'high' ? 'Высокая' :
                           predictionExplanation.confidence === 'medium' ? 'Средняя' : 'Низкая'}
                    color={predictionExplanation.confidence === 'high' ? 'success' :
                           predictionExplanation.confidence === 'medium' ? 'warning' : 'error'}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Ключевые факторы
              </Typography>
              <List>
                {predictionExplanation.keyFactors.map((factor, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {factor.impact === 'positive' ? (
                        <CheckCircleIcon color="success" />
                      ) : factor.impact === 'negative' ? (
                        <ErrorIcon color="error" />
                      ) : (
                        <InfoIcon color="info" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={factor.factor}
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            {factor.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Влияние: {Math.round(factor.weight * 100)}%
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Рекомендация
              </Typography>
              <Alert severity="info" sx={{ mt: 1 }}>
                {predictionExplanation.recommendation}
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPredictionExplanation(null)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Analytics;