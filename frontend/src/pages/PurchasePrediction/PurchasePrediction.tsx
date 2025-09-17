import React from 'react';
import { Box, Typography, Grid, Card, CardContent } from '@mui/material';
import PurchasePredictionOverview from '../../components/MLComponents/PurchasePredictionComponents';
import DataRefreshManager from '../../components/DataRefreshManager';

const PurchasePrediction: React.FC = () => {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h4" gutterBottom>
        Предсказание покупок
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Анализ вероятности совершения покупок пользователями с использованием ML моделей
      </Typography>

      <Grid container spacing={3}>
        {/* Управление данными */}
        <Grid item xs={12}>
          <DataRefreshManager />
        </Grid>

        {/* Основные компоненты прогнозов покупок */}
        <Grid item xs={12}>
          <PurchasePredictionOverview refreshInterval={300000} />
        </Grid>

        {/* Дополнительная информация */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                О прогнозах покупок
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Система анализирует поведение пользователей и предсказывает вероятность совершения 
                покупки в ближайшие 30 дней. Это помогает оптимизировать маркетинговые кампании 
                и увеличить конверсию.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Ключевые факторы
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Модель учитывает активность пользователей, историю покупок, взаимодействие с продуктами 
                и временные паттерны. Регулярное обновление прогнозов обеспечивает актуальность 
                предсказаний.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Рекомендации по использованию */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Рекомендации по использованию
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    Высокая вероятность (70%+)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Фокус на конверсии, предложения специальных акций для завершения покупки
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    Средняя вероятность (40-70%)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Персонализированные рекомендации, напоминания о корзине
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    Низкая вероятность (&lt;40%)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Образовательный контент, знакомство с продуктами
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PurchasePrediction;
