import React from 'react';
import { Box, Typography } from '@mui/material';

const Analytics: React.FC = () => {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h4" gutterBottom>
        Аналитика
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Детальная аналитика и отчеты по пользователям и их поведению
      </Typography>
    </Box>
  );
};

export default Analytics;
