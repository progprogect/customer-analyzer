import React from 'react';
import { Box, Typography } from '@mui/material';

const UserSegmentation: React.FC = () => {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h4" gutterBottom>
        Сегментация пользователей
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Управление сегментами пользователей и анализ их поведения
      </Typography>
    </Box>
  );
};

export default UserSegmentation;
