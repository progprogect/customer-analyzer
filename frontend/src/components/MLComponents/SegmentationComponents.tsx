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
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Refresh,
  TrendingUp,
  People,
  Assessment,
  Info,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { segmentationApi } from '../../services/mlApi';
import { SegmentationResult, UserSegment } from '../../types';

interface SegmentationComponentsProps {
  refreshInterval?: number;
}

const COLORS = ['#1976d2', '#42a5f5', '#dc004e', '#ff9800', '#4caf50', '#9c27b0'];

export const SegmentationOverview: React.FC<SegmentationComponentsProps> = ({ 
  refreshInterval = 300000 // 5 минут по умолчанию
}) => {
  const [segmentationData, setSegmentationData] = useState<SegmentationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchSegmentationData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await segmentationApi.getSegments();
      if (response.success && response.data) {
        setSegmentationData(response.data);
        setLastUpdated(new Date());
      } else {
        setError(response.message || 'Ошибка загрузки данных сегментации');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSegmentationData();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchSegmentationData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  const handleRefresh = () => {
    fetchSegmentationData();
  };

  if (loading && !segmentationData) {
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

  if (!segmentationData) {
    return (
      <Alert severity="info">
        Нет данных сегментации
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Сегментация пользователей
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary">
              Обновлено: {lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
          <IconButton onClick={handleRefresh} disabled={loading}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={3}>
        {/* Общая статистика */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Общая статистика
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <People color="primary" sx={{ mr: 1 }} />
                <Typography variant="h4">
                  {segmentationData.segments.reduce((sum, segment) => sum + segment.size, 0).toLocaleString()}
                </Typography>
              </Box>
              <Typography color="text.secondary">
                Всего пользователей
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Количество сегментов
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assessment color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h4">
                  {segmentationData.segments.length}
                </Typography>
              </Box>
              <Typography color="text.secondary">
                Активных сегментов
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Качество модели
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp color="success" sx={{ mr: 1 }} />
                <Typography variant="h4">
                  {(segmentationData.model_metrics.silhouette_score * 100).toFixed(1)}%
                </Typography>
              </Box>
              <Typography color="text.secondary">
                Silhouette Score
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Круговая диаграмма сегментов */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Распределение сегментов
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={segmentationData.segments}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="size"
                    label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  >
                    {segmentationData.segments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Столбчатая диаграмма размеров сегментов */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Размеры сегментов
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={segmentationData.segments}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="size" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Таблица сегментов */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Детали сегментов
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Сегмент</TableCell>
                      <TableCell>Описание</TableCell>
                      <TableCell align="right">Размер</TableCell>
                      <TableCell align="right">Процент</TableCell>
                      <TableCell>Характеристики</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {segmentationData.segments.map((segment, index) => (
                      <TableRow key={segment.segment_id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: COLORS[index % COLORS.length],
                                mr: 1,
                              }}
                            />
                            {segment.name}
                          </Box>
                        </TableCell>
                        <TableCell>{segment.description}</TableCell>
                        <TableCell align="right">
                          {segment.size.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          {segment.percentage.toFixed(1)}%
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {Object.entries(segment.characteristics).slice(0, 3).map(([key, value]) => (
                              <Chip
                                key={key}
                                label={`${key}: ${value}`}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                            {Object.keys(segment.characteristics).length > 3 && (
                              <Tooltip title={Object.entries(segment.characteristics).slice(3).map(([key, value]) => `${key}: ${value}`).join(', ')}>
                                <Chip
                                  label={`+${Object.keys(segment.characteristics).length - 3}`}
                                  size="small"
                                  variant="outlined"
                                />
                              </Tooltip>
                            )}
                          </Box>
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

export default SegmentationOverview;
