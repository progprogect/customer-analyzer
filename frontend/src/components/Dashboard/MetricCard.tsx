import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Refresh,
} from '@mui/icons-material';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  onRefresh?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  color = 'primary',
  onRefresh,
}) => {
  const getTrendIcon = () => {
    if (change === undefined || change === 0) return <TrendingFlat />;
    return change > 0 ? <TrendingUp /> : <TrendingDown />;
  };

  const getTrendColor = () => {
    if (change === undefined || change === 0) return 'default';
    return change > 0 ? 'success' : 'error';
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        '&:hover': {
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Box
            sx={{
              backgroundColor: `${color}.light`,
              borderRadius: 1,
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
          {onRefresh && (
            <IconButton size="small" onClick={onRefresh}>
              <Refresh />
            </IconButton>
          )}
        </Box>

        <Typography variant="h4" component="div" gutterBottom>
          {value}
        </Typography>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          {title}
        </Typography>

        {change !== undefined && (
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={getTrendIcon()}
              label={`${change > 0 ? '+' : ''}${change}%`}
              color={getTrendColor() as any}
              size="small"
            />
            {changeLabel && (
              <Typography variant="caption" color="text.secondary">
                {changeLabel}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;
