import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  MoreVert,
  Refresh,
  Download,
  Fullscreen,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  data: any[];
  type: 'line' | 'bar' | 'pie';
  dataKey: string;
  color?: string;
  height?: number;
  onRefresh?: () => void;
  onExport?: () => void;
  onFullscreen?: () => void;
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  data,
  type,
  dataKey,
  color = '#1976d2',
  height = 300,
  onRefresh,
  onExport,
  onFullscreen,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const renderChart = () => {
    const commonProps = {
      width: '100%',
      height: height,
      data: data,
    };

    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey={dataKey} fill={color} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer {...commonProps}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey={dataKey}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={title}
        subheader={subtitle}
        action={
          <IconButton onClick={handleMenuOpen}>
            <MoreVert />
          </IconButton>
        }
      />
      <CardContent>
        <Box sx={{ height: height }}>
          {renderChart()}
        </Box>
      </CardContent>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {onRefresh && (
          <MenuItem onClick={() => { onRefresh(); handleMenuClose(); }}>
            <Refresh sx={{ mr: 1 }} />
            Обновить
          </MenuItem>
        )}
        {onExport && (
          <MenuItem onClick={() => { onExport(); handleMenuClose(); }}>
            <Download sx={{ mr: 1 }} />
            Экспорт
          </MenuItem>
        )}
        {onFullscreen && (
          <MenuItem onClick={() => { onFullscreen(); handleMenuClose(); }}>
            <Fullscreen sx={{ mr: 1 }} />
            Полный экран
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
};

export default ChartCard;
