import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Refresh,
  TrendingDown,
  Warning,
  Assessment,
  Error,
  CheckCircle,
  ExpandMore,
  PriorityHigh,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { churnPredictionApi } from '../../services/mlApi';
import { ChurnPredictionResult, ChurnPredictionMetrics } from '../../types';

interface ChurnPredictionComponentsProps {
  refreshInterval?: number;
}

export const ChurnPredictionOverview: React.FC<ChurnPredictionComponentsProps> = ({ 
  refreshInterval = 300000 // 5 минут по умолчанию
}) => {
  const [predictions, setPredictions] = useState<ChurnPredictionResult[]>([]);
  const [highRiskUsers, setHighRiskUsers] = useState<ChurnPredictionResult[]>([]);
  const [metrics, setMetrics] = useState<ChurnPredictionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchChurnPredictionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [predictionsResponse, highRiskResponse, metricsResponse] = await Promise.all([
        churnPredictionApi.getAllPredictions(),
        churnPredictionApi.getHighRiskUsers(0.7),
        churnPredictionApi.getModelMetrics(),
      ]);

      if (predictionsResponse.success && predictionsResponse.data) {
        setPredictions(predictionsResponse.data);
      }
      
      if (highRiskResponse.success && highRiskResponse.data) {
        setHighRiskUsers(highRiskResponse.data);
      }
      
      if (metricsResponse.success && metricsResponse.data) {
        setMetrics(metricsResponse.data);
      }
      
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки данных прогнозов оттока');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChurnPredictionData();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchChurnPredictionData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  const handleRefresh = () => {
    fetchChurnPredictionData();
  };

  const handleUpdatePredictions = async () => {
    try {
      setLoading(true);
      await churnPredictionApi.updatePredictions();
      await fetchChurnPredictionData();
    } catch (err: any) {
      setError(err.message || 'Ошибка обновления прогнозов');
    }
  };

  const getRiskColor = (probability: number) => {
    if (probability >= 0.8) return 'error';
    if (probability >= 0.6) return 'warning';
    if (probability >= 0.4) return 'info';
    return 'success';
  };

  const getRiskIcon = (probability: number) => {
    if (probability >= 0.8) return <Error />;
    if (probability >= 0.6) return <Warning />;
    return <CheckCircle />;
  };

  const getRiskLabel = (probability: number) => {
    if (probability >= 0.8) return 'Критический';
    if (probability >= 0.6) return 'Высокий';
    if (probability >= 0.4) return 'Средний';
    return 'Низкий';
  };

  if (loading && !predictions.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
        <Button onClick={handleRefresh} sx={{ ml: 2 }}>
          Повторить
        </Button>
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Прогнозы оттока
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary">
              Обновлено: {lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
          <Button
            variant="outlined"
            onClick={handleUpdatePredictions}
            disabled={loading}
            startIcon={<Refresh />}
          >
            Обновить прогнозы
          </Button>
          <IconButton onClick={handleRefresh} disabled={loading}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Предупреждение о высоком риске */}
      {highRiskUsers.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="h6">
            Внимание! {highRiskUsers.length} пользователей с высоким риском оттока
          </Typography>
          <Typography>
            Требуется немедленное вмешательство для удержания клиентов
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Общая статистика */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Всего прогнозов
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assessment color="primary" sx={{ mr: 1 }} />
                <Typography variant="h4">
                  {predictions.length.toLocaleString()}
                </Typography>
              </Box>
              <Typography color="text.secondary">
                Пользователей
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Критический риск
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Error color="error" sx={{ mr: 1 }} />
                <Typography variant="h4">
                  {predictions.filter(p => p.churn_probability >= 0.8).length}
                </Typography>
              </Box>
              <Typography color="text.secondary">
                Пользователей
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Высокий риск
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning color="warning" sx={{ mr: 1 }} />
                <Typography variant="h4">
                  {predictions.filter(p => p.churn_probability >= 0.6 && p.churn_probability < 0.8).length}
                </Typography>
              </Box>
              <Typography color="text.secondary">
                Пользователей
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Точность модели
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingDown color="info" sx={{ mr: 1 }} />
                <Typography variant="h4">
                  {metrics ? (metrics.accuracy * 100).toFixed(1) : 'N/A'}%
                </Typography>
              </Box>
              <Typography color="text.secondary">
                Accuracy
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Распределение рисков */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Распределение рисков оттока
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={predictions.slice(0, 20)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="user_id" />
                  <YAxis />
                  <RechartsTooltip 
                    formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Вероятность оттока']}
                  />
                  <Bar dataKey="churn_probability" fill="#dc004e" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Пользователи с высоким риском */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Badge badgeContent={highRiskUsers.length} color="error">
                  Высокий риск оттока
                </Badge>
              </Typography>
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {highRiskUsers.slice(0, 10).map((prediction) => (
                  <Box
                    key={prediction.user_id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box>
                      <Typography variant="body2">
                        User #{prediction.user_id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {prediction.risk_factors.slice(0, 2).join(', ')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={`${(prediction.churn_probability * 100).toFixed(0)}%`}
                        color={getRiskColor(prediction.churn_probability)}
                        size="small"
                      />
                      {getRiskIcon(prediction.churn_probability)}
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Таблица прогнозов */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Детали прогнозов оттока
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Пользователь</TableCell>
                      <TableCell align="right">Вероятность оттока</TableCell>
                      <TableCell>Уровень риска</TableCell>
                      <TableCell>Факторы риска</TableCell>
                      <TableCell>Рекомендации</TableCell>
                      <TableCell>Дата прогноза</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {predictions.slice(0, 20).map((prediction) => (
                      <TableRow key={prediction.user_id}>
                        <TableCell>
                          User #{prediction.user_id}
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            variant="h6" 
                            color={getRiskColor(prediction.churn_probability)}
                          >
                            {(prediction.churn_probability * 100).toFixed(1)}%
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getRiskIcon(prediction.churn_probability)}
                            label={getRiskLabel(prediction.churn_probability)}
                            color={getRiskColor(prediction.churn_probability)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {prediction.risk_factors.slice(0, 2).map((factor) => (
                              <Chip
                                key={factor}
                                label={factor}
                                size="small"
                                variant="outlined"
                                color={getRiskColor(prediction.churn_probability)}
                              />
                            ))}
                            {prediction.risk_factors.length > 2 && (
                              <Tooltip title={prediction.risk_factors.slice(2).join(', ')}>
                                <Chip
                                  label={`+${prediction.risk_factors.length - 2}`}
                                  size="small"
                                  variant="outlined"
                                />
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {prediction.retention_recommendations.slice(0, 2).map((recommendation) => (
                              <Chip
                                key={recommendation}
                                label={recommendation}
                                size="small"
                                variant="filled"
                                color="primary"
                              />
                            ))}
                            {prediction.retention_recommendations.length > 2 && (
                              <Tooltip title={prediction.retention_recommendations.slice(2).join(', ')}>
                                <Chip
                                  label={`+${prediction.retention_recommendations.length - 2}`}
                                  size="small"
                                  variant="outlined"
                                />
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {new Date(prediction.prediction_date).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Рекомендации по удержанию */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Стратегии удержания пользователей
              </Typography>
              <Grid container spacing={2}>
                {highRiskUsers.slice(0, 5).map((prediction) => (
                  <Grid item xs={12} md={6} key={prediction.user_id}>
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PriorityHigh color="error" />
                          <Typography variant="subtitle1">
                            User #{prediction.user_id} - {getRiskLabel(prediction.churn_probability)} риск
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Факторы риска:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            {prediction.risk_factors.map((factor) => (
                              <Chip
                                key={factor}
                                label={factor}
                                size="small"
                                color="error"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Рекомендации по удержанию:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {prediction.retention_recommendations.map((recommendation) => (
                              <Chip
                                key={recommendation}
                                label={recommendation}
                                size="small"
                                color="primary"
                              />
                            ))}
                          </Box>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ChurnPredictionOverview;
