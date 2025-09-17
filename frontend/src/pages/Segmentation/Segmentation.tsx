import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { dataService, UserSegment } from '../../services/dataService.ts';

const Segmentation: React.FC = () => {
  const [segments, setSegments] = useState<UserSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSegments();
  }, []);

  const loadSegments = async () => {
    try {
      setLoading(true);
      const segmentsData = await dataService.getUserSegments();
      setSegments(segmentsData);
    } catch (err) {
      setError('Ошибка загрузки данных сегментации');
      console.error('Error loading segments:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSegmentIcon = (name: string) => {
    if (name.includes('VIP')) return <StarIcon />;
    if (name.includes('Активные')) return <TrendingUpIcon />;
    return <PeopleIcon />;
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
        👥 Сегментация пользователей
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Анализ поведения клиентов и их группировка по сегментам
      </Typography>

      <Grid container spacing={3}>
        {segments.map((segment, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <Card sx={{ height: '100%', position: 'relative' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      backgroundColor: segment.color,
                      mr: 2,
                    }}
                  >
                    {getSegmentIcon(segment.name)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" component="div">
                      {segment.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {segment.count} пользователей
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={`${segment.percentage}% от общего числа`}
                    color="primary"
                    size="small"
                    sx={{ mb: 1 }}
                  />
                </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {segment.name.includes('VIP') ? 'Высокоценные клиенты с большими покупками' :
                     segment.name.includes('Активные') ? 'Регулярно совершают покупки' :
                     'Недавно зарегистрированные пользователи'}
                  </Typography>

                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Средний чек
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        ${segment.avgOrder}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Удержание
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {segment.retention}%
                      </Typography>
                    </Box>
                  </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Распределение по сегментам
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Общее количество пользователей: 1,250
              </Typography>
              <Box sx={{ mt: 2 }}>
                {segments.map((segment, index) => (
                  <Box key={index} sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        backgroundColor: segment.color,
                        borderRadius: '50%',
                        mr: 1,
                      }}
                    />
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {segment.name}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {segment.count}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🎯 Рекомендации
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" gutterBottom>
                  • VIP клиенты: Персонализированные предложения
                </Typography>
                <Typography variant="body2" gutterBottom>
                  • Спящие клиенты: Реактивационные кампании
                </Typography>
                <Typography variant="body2" gutterBottom>
                  • Новые клиенты: Программа лояльности
                </Typography>
                <Typography variant="body2">
                  • Активные покупатели: Кросс-продажи
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Segmentation;
