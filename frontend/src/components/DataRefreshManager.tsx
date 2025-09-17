import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Switch,
  FormControlLabel,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh,
  Settings,
  PlayArrow,
  Pause,
  CheckCircle,
  Error,
  Warning,
} from '@mui/icons-material';
import { useMLModelsManagement } from '../hooks/useMLData';

interface RefreshStatus {
  segmentation: boolean;
  purchasePrediction: boolean;
  churnPrediction: boolean;
  lastUpdate: Date | null;
  errors: string[];
}

const DataRefreshManager: React.FC = () => {
  const { refreshAll, retrainAllModels, isRetraining, retrainingStatus } = useMLModelsManagement();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(300000); // 5 минут
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus>({
    segmentation: false,
    purchasePrediction: false,
    churnPrediction: false,
    lastUpdate: null,
    errors: [],
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (autoRefresh && refreshInterval > 0) {
      interval = setInterval(() => {
        handleRefreshAll();
      }, refreshInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval]);

  const handleRefreshAll = async () => {
    try {
      setRefreshStatus(prev => ({
        ...prev,
        errors: [],
      }));

      await refreshAll();
      
      setRefreshStatus(prev => ({
        ...prev,
        segmentation: true,
        purchasePrediction: true,
        churnPrediction: true,
        lastUpdate: new Date(),
      }));

      // Сбрасываем статусы через 5 секунд
      setTimeout(() => {
        setRefreshStatus(prev => ({
          ...prev,
          segmentation: false,
          purchasePrediction: false,
          churnPrediction: false,
        }));
      }, 5000);
    } catch (error: any) {
      setRefreshStatus(prev => ({
        ...prev,
        errors: [...prev.errors, error.message],
      }));
    }
  };

  const handleRetrainAll = async () => {
    try {
      await retrainAllModels();
    } catch (error: any) {
      setRefreshStatus(prev => ({
        ...prev,
        errors: [...prev.errors, `Ошибка переобучения: ${error.message}`],
      }));
    }
  };

  const getStatusIcon = (status: boolean, type: 'success' | 'error' | 'warning' = 'success') => {
    if (status) {
      return <CheckCircle color="success" />;
    }
    return type === 'error' ? <Error color="error" /> : <Warning color="warning" />;
  };

  const getStatusColor = (status: boolean) => {
    return status ? 'success' : 'default';
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Управление данными ML
          </Typography>
          <Tooltip title="Настройки обновления">
            <IconButton>
              <Settings />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Ошибки */}
        {refreshStatus.errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Ошибки обновления:</Typography>
            {refreshStatus.errors.map((error, index) => (
              <Typography key={index} variant="body2">
                • {error}
              </Typography>
            ))}
          </Alert>
        )}

        {/* Статус переобучения */}
        {isRetraining && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">
              Переобучение моделей в процессе...
            </Typography>
            <LinearProgress sx={{ mt: 1 }} />
          </Alert>
        )}

        {/* Настройки автообновления */}
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                color="primary"
              />
            }
            label="Автоматическое обновление данных"
          />
        </Box>

        {/* Статус последнего обновления */}
        {refreshStatus.lastUpdate && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Последнее обновление: {refreshStatus.lastUpdate.toLocaleString()}
            </Typography>
          </Box>
        )}

        {/* Статус компонентов */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getStatusIcon(refreshStatus.segmentation)}
              <Typography variant="body2">Сегментация</Typography>
              <Chip
                label={refreshStatus.segmentation ? 'Обновлено' : 'Ожидает'}
                color={getStatusColor(refreshStatus.segmentation)}
                size="small"
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getStatusIcon(refreshStatus.purchasePrediction)}
              <Typography variant="body2">Прогнозы покупок</Typography>
              <Chip
                label={refreshStatus.purchasePrediction ? 'Обновлено' : 'Ожидает'}
                color={getStatusColor(refreshStatus.purchasePrediction)}
                size="small"
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getStatusIcon(refreshStatus.churnPrediction)}
              <Typography variant="body2">Прогнозы оттока</Typography>
              <Chip
                label={refreshStatus.churnPrediction ? 'Обновлено' : 'Ожидает'}
                color={getStatusColor(refreshStatus.churnPrediction)}
                size="small"
              />
            </Box>
          </Grid>
        </Grid>

        {/* Кнопки управления */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={handleRefreshAll}
            disabled={isRetraining}
          >
            Обновить все данные
          </Button>
          
          <Button
            variant="outlined"
            startIcon={autoRefresh ? <Pause /> : <PlayArrow />}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Остановить автообновление' : 'Запустить автообновление'}
          </Button>
          
          <Button
            variant="outlined"
            color="warning"
            startIcon={<Settings />}
            onClick={handleRetrainAll}
            disabled={isRetraining}
          >
            Переобучить модели
          </Button>
        </Box>

        {/* Информация о переобучении */}
        {retrainingStatus && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Статус переобучения моделей:
            </Typography>
            <Grid container spacing={1}>
              {Object.entries(retrainingStatus).map(([model, status]: [string, any]) => (
                <Grid item xs={12} sm={6} md={4} key={model}>
                  <Chip
                    label={`${model}: ${status.status}`}
                    color={status.status === 'completed' ? 'success' : 'warning'}
                    size="small"
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Интервалы обновления */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Интервал автообновления: {Math.round(refreshInterval / 1000 / 60)} минут
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {[
              { label: '1 мин', value: 60000 },
              { label: '5 мин', value: 300000 },
              { label: '15 мин', value: 900000 },
              { label: '30 мин', value: 1800000 },
            ].map(({ label, value }) => (
              <Button
                key={value}
                variant={refreshInterval === value ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setRefreshInterval(value)}
              >
                {label}
              </Button>
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DataRefreshManager;
