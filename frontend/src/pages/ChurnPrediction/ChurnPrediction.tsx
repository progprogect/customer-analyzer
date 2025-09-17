import React from 'react';
import { Box, Typography } from '@mui/material';

const ChurnPrediction: React.FC = () => {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h4" gutterBottom>
        Предсказание оттока
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Анализ риска оттока пользователей и рекомендации по удержанию
      </Typography>
    </Box>
  );
};

export default ChurnPrediction;
