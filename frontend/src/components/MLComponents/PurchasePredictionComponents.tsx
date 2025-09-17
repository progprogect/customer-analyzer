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
} from '@mui/material';
import {
  Refresh,
  ShoppingCart,
  TrendingUp,
  Assessment,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { purchasePredictionApi } from '../../services/mlApi';
import { PurchasePredictionResult, PurchasePredictionMetrics } from '../../types';

interface PurchasePredictionComponentsProps {
  refreshInterval?: number;
}

export const PurchasePredictionOverview: React.FC<PurchasePredictionComponentsProps> = ({ 
  refreshInterval = 300000 // 5 минут по умолчанию
}) => {
  const [predictions, setPredictions] = useState<PurchasePredictionResult[]>([]);
  const [topPredictions, setTopPredictions] = useState<PurchasePredictionResult[]>([]);
  const [metrics, setMetrics] = useState<PurchasePredictionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPurchasePredictionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [predictionsResponse, topPredictionsResponse, metricsResponse] = await Promise.all([
        purchasePredictionApi.getAllPredictions(),
        purchasePredictionApi.getTopPredictions(50),
        purchasePredictionApi.getModelMetrics(),
      ]);

      if (predictionsResponse.success && predictionsResponse.data) {
        setPredictions(predictionsResponse.data);
      }
      
      if (topPredictionsResponse.success && topPredictionsResponse.data) {
        setTopPredictions(topPredictionsResponse.data);
      }
      
      if (metricsResponse.success && metricsResponse.data) {
        setMetrics(metricsResponse.data);
      }
      
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки данных прогнозов покупок');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchasePredictionData();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchPurchasePredictionData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  const handleRefresh = () => {
    fetchPurchasePredictionData();
  };

  const handleUpdatePredictions = async () => {
    try {
      setLoading(true);
      await purchasePredictionApi.updatePredictions();
      await fetchPurchasePredictionData();
    } catch (err: any) {
      setError(err.message || 'Ошибка обновления прогнозов');
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'success';
      case 'medium': return 'warning';
      case 'low': return 'error';
      default: return 'default';
    }
  };

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high': return <CheckCircle />;
      case 'medium': return <Warning />;
      case 'low': return <Warning />;
      default: return <Assessment />;
    }
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
          Прогнозы покупок
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
                Высокая вероятность
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp color="success" sx={{ mr: 1 }} />
                <Typography variant="h4">
                  {predictions.filter(p => p.purchase_probability > 0.7).length}
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
                Средняя вероятность
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning color="warning" sx={{ mr: 1 }} />
                <Typography variant="h4">
                  {predictions.filter(p => p.purchase_probability >= 0.4 && p.purchase_probability <= 0.7).length}
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
                <ShoppingCart color="info" sx={{ mr: 1 }} />
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

        {/* Распределение вероятностей */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Распределение вероятностей покупки
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={predictions.slice(0, 20)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="user_id" />
                  <YAxis />
                  <RechartsTooltip 
                    formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Вероятность']}
                  />
                  <Bar dataKey="purchase_probability" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Топ пользователи */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Топ пользователи
              </Typography>
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {topPredictions.slice(0, 10).map((prediction) => (
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
                        {prediction.key_factors.slice(0, 2).join(', ')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={`${(prediction.purchase_probability * 100).toFixed(0)}%`}
                        color={getConfidenceColor(prediction.prediction_confidence)}
                        size="small"
                      />
                      {getConfidenceIcon(prediction.prediction_confidence)}
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
                Детали прогнозов
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Пользователь</TableCell>
                      <TableCell align="right">Вероятность</TableCell>
                      <TableCell>Уверенность</TableCell>
                      <TableCell>Ключевые факторы</TableCell>
                      <TableCell>Дата прогноза</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topPredictions.slice(0, 20).map((prediction) => (
                      <TableRow key={prediction.user_id}>
                        <TableCell>
                          User #{prediction.user_id}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="h6" color="primary">
                            {(prediction.purchase_probability * 100).toFixed(1)}%
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getConfidenceIcon(prediction.prediction_confidence)}
                            label={prediction.prediction_confidence}
                            color={getConfidenceColor(prediction.prediction_confidence)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {prediction.key_factors.slice(0, 3).map((factor) => (
                              <Chip
                                key={factor}
                                label={factor}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                            {prediction.key_factors.length > 3 && (
                              <Tooltip title={prediction.key_factors.slice(3).join(', ')}>
                                <Chip
                                  label={`+${prediction.key_factors.length - 3}`}
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
      </Grid>
    </Box>
  );
};

export default PurchasePredictionOverview;
