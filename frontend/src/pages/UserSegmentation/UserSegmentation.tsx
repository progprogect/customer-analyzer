import React from 'react';
import { Box, Typography, Grid, Card, CardContent } from '@mui/material';
import SegmentationOverview from '../../components/MLComponents/SegmentationComponents';
import DataRefreshManager from '../../components/DataRefreshManager';

const UserSegmentation: React.FC = () => {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h4" gutterBottom>
        Сегментация пользователей
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Управление сегментами пользователей и анализ их поведения с использованием ML моделей
      </Typography>

      <Grid container spacing={3}>
        {/* Управление данными */}
        <Grid item xs={12}>
          <DataRefreshManager />
        </Grid>

        {/* Основные компоненты сегментации */}
        <Grid item xs={12}>
          <SegmentationOverview refreshInterval={300000} />
        </Grid>

        {/* Дополнительная информация */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                О сегментации
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Система автоматически анализирует поведение пользователей и группирует их в сегменты 
                на основе активности, предпочтений и характеристик. Это помогает персонализировать 
                взаимодействие и улучшить эффективность маркетинговых кампаний.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Метрики качества
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Модель сегментации использует алгоритмы кластеризации с оптимизацией по Silhouette Score. 
                Регулярное переобучение обеспечивает актуальность сегментов и адаптацию к изменениям 
                в поведении пользователей.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserSegmentation;
