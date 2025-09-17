import React from 'react';
import { Box, Typography } from '@mui/material';

const Settings: React.FC = () => {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h4" gutterBottom>
        Настройки
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Настройки системы и конфигурация моделей
      </Typography>
    </Box>
  );
};

export default Settings;
