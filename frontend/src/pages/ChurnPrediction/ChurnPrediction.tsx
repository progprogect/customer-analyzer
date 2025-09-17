import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Alert } from '@mui/material';
import ChurnPredictionOverview from '../../components/MLComponents/ChurnPredictionComponents';
import DataRefreshManager from '../../components/DataRefreshManager';

const ChurnPrediction: React.FC = () => {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h4" gutterBottom>
        Предсказание оттока
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Анализ риска оттока пользователей и рекомендации по удержанию с использованием ML моделей
      </Typography>

      {/* Предупреждение о важности */}
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="subtitle2">
          Важно: Пользователи с высоким риском оттока требуют немедленного внимания
        </Typography>
        <Typography variant="body2">
          Раннее выявление и вмешательство могут значительно снизить процент оттока клиентов
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* Управление данными */}
        <Grid item xs={12}>
          <DataRefreshManager />
        </Grid>

        {/* Основные компоненты прогнозов оттока */}
        <Grid item xs={12}>
          <ChurnPredictionOverview refreshInterval={300000} />
        </Grid>

        {/* Дополнительная информация */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                О прогнозах оттока
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Система анализирует поведенческие паттерны пользователей и предсказывает вероятность 
                прекращения использования сервиса. Это позволяет принимать проактивные меры 
                для удержания ценных клиентов.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Факторы риска
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Модель учитывает снижение активности, увеличение интервалов между сессиями, 
                изменение паттернов поведения и внешние факторы. Регулярное обновление 
                обеспечивает точность предсказаний.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Стратегии удержания */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Стратегии удержания по уровням риска
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom color="error">
                    Критический риск (80%+)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Персональное обращение менеджера<br/>
                    • Эксклюзивные предложения<br/>
                    • Индивидуальные условия<br/>
                    • Немедленное вмешательство
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom color="warning">
                    Высокий риск (60-80%)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Специальные акции и скидки<br/>
                    • Персонализированные рекомендации<br/>
                    • Улучшенная поддержка<br/>
                    • Программа лояльности
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom color="info">
                    Средний риск (40-60%)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Регулярные напоминания<br/>
                    • Новые функции и возможности<br/>
                    • Образовательный контент<br/>
                    • Сообщество пользователей
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Метрики эффективности */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Метрики эффективности удержания
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Точность модели
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Точность предсказания оттока составляет 85%+ благодаря использованию 
                    ensemble методов и регулярному переобучению.
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Время реагирования
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Система предупреждает о риске оттока за 2-4 недели до вероятного 
                    прекращения использования.
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Эффективность вмешательства
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Проактивные меры снижают отток на 40-60% среди пользователей 
                    высокого риска.
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    ROI удержания
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Каждый удержанный клиент приносит в 5-7 раз больше прибыли, 
                    чем привлечение нового.
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

export default ChurnPrediction;
