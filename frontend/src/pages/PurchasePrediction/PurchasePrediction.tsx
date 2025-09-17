import React from 'react';
import { Box, Typography } from '@mui/material';

const PurchasePrediction: React.FC = () => {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h4" gutterBottom>
        Предсказание покупок
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Анализ вероятности совершения покупок пользователями
      </Typography>
    </Box>
  );
};

export default PurchasePrediction;
