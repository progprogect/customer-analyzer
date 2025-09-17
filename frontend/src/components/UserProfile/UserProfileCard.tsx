import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  ShoppingCart as ShoppingCartIcon,
  Psychology as PsychologyIcon,
  Star as StarIcon,
  Edit as EditIcon,
  Message as MessageIcon,
} from '@mui/icons-material';

interface UserProfile {
  user: {
    id: string;
    telegram_id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    registration_date: string;
    last_activity: string;
    status: 'active' | 'inactive';
    total_purchases: number;
    total_spent: number;
    last_purchase_date?: string;
  };
  events: Array<{
    id: string;
    type: string;
    timestamp: string;
    data: any;
  }>;
  predictions?: {
    userId: string;
    userName: string;
    probability: number;
    predictedAmount: number;
    lastPurchase: string;
    status: 'high' | 'medium' | 'low';
  };
  churnRisk?: {
    userId: string;
    userName: string;
    riskScore: number;
    daysSinceLastActivity: number;
    lastPurchase: string;
    totalSpent: number;
    riskLevel: 'high' | 'medium' | 'low';
  };
  recommendations: string[];
}

interface UserProfileCardProps {
  profile: UserProfile;
  onEdit?: () => void;
  onMessage?: () => void;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({
  profile,
  onEdit,
  onMessage,
}) => {
  const { user, predictions, churnRisk, recommendations } = profile;

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'success' : 'error';
  };

  const getPredictionColor = (status: string) => {
    switch (status) {
      case 'high': return 'success';
      case 'medium': return 'warning';
      case 'low': return 'error';
      default: return 'default';
    }
  };

  const getChurnColor = (level: string) => {
    switch (level) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'page_view': return <PersonIcon />;
      case 'product_view': return <ShoppingCartIcon />;
      case 'purchase': return <TrendingUpIcon />;
      default: return <PersonIcon />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        {/* Заголовок с действиями */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                mr: 2,
                bgcolor: user.status === 'active' ? 'primary.main' : 'grey.500',
              }}
            >
              {user.first_name.charAt(0)}{user.last_name.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h5" component="div">
                {user.first_name} {user.last_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                @{user.username}
              </Typography>
              <Chip
                label={user.status === 'active' ? 'Активен' : 'Неактивен'}
                color={getStatusColor(user.status) as any}
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>
          </Box>
          <Box>
            <Tooltip title="Редактировать">
              <IconButton onClick={onEdit} size="small">
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Написать сообщение">
              <IconButton onClick={onMessage} size="small">
                <MessageIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Grid container spacing={2}>
          {/* Контактная информация */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              📞 Контактная информация
            </Typography>
            <List dense>
              <ListItem>
                <ListItemAvatar>
                  <EmailIcon color="primary" />
                </ListItemAvatar>
                <ListItemText
                  primary="Email"
                  secondary={user.email}
                />
              </ListItem>
              <ListItem>
                <ListItemAvatar>
                  <PhoneIcon color="primary" />
                </ListItemAvatar>
                <ListItemText
                  primary="Телефон"
                  secondary={user.phone}
                />
              </ListItem>
              <ListItem>
                <ListItemAvatar>
                  <CalendarIcon color="primary" />
                </ListItemAvatar>
                <ListItemText
                  primary="Регистрация"
                  secondary={formatDate(user.registration_date)}
                />
              </ListItem>
              <ListItem>
                <ListItemAvatar>
                  <CalendarIcon color="primary" />
                </ListItemAvatar>
                <ListItemText
                  primary="Последняя активность"
                  secondary={formatDate(user.last_activity)}
                />
              </ListItem>
            </List>
          </Grid>

          {/* Статистика покупок */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              💰 Статистика покупок
            </Typography>
            <List dense>
              <ListItem>
                <ListItemAvatar>
                  <ShoppingCartIcon color="success" />
                </ListItemAvatar>
                <ListItemText
                  primary="Всего покупок"
                  secondary={user.total_purchases}
                />
              </ListItem>
              <ListItem>
                <ListItemAvatar>
                  <TrendingUpIcon color="success" />
                </ListItemAvatar>
                <ListItemText
                  primary="Потрачено"
                  secondary={formatCurrency(user.total_spent)}
                />
              </ListItem>
              {user.last_purchase_date && (
                <ListItem>
                  <ListItemAvatar>
                    <CalendarIcon color="success" />
                  </ListItemAvatar>
                  <ListItemText
                    primary="Последняя покупка"
                    secondary={formatDate(user.last_purchase_date)}
                  />
                </ListItem>
              )}
            </List>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* ML Предсказания */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              🔮 Предсказание покупки
            </Typography>
            {predictions ? (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PsychologyIcon sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    Вероятность: {predictions.probability}%
                  </Typography>
                  <Chip
                    label={predictions.status === 'high' ? 'Высокая' : 
                           predictions.status === 'medium' ? 'Средняя' : 'Низкая'}
                    color={getPredictionColor(predictions.status) as any}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Прогнозируемая сумма: {formatCurrency(predictions.predictedAmount)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Последняя покупка: {predictions.lastPurchase}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Данные недоступны
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              ⚠️ Риск оттока
            </Typography>
            {churnRisk ? (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <WarningIcon sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    Риск: {churnRisk.riskScore}%
                  </Typography>
                  <Chip
                    label={churnRisk.riskLevel === 'high' ? 'Высокий' : 
                           churnRisk.riskLevel === 'medium' ? 'Средний' : 'Низкий'}
                    color={getChurnColor(churnRisk.riskLevel) as any}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Неактивен: {churnRisk.daysSinceLastActivity} дней
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Потратил: {formatCurrency(churnRisk.totalSpent)}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Данные недоступны
              </Typography>
            )}
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Рекомендации */}
        <Typography variant="h6" gutterBottom>
          💡 Рекомендации
        </Typography>
        <List dense>
          {recommendations.map((recommendation, index) => (
            <ListItem key={index}>
              <ListItemAvatar>
                <StarIcon color="warning" />
              </ListItemAvatar>
              <ListItemText
                primary={recommendation}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default UserProfileCard;
