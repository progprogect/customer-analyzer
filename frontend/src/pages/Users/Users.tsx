import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Psychology as PsychologyIcon,
  Star as StarIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Message as MessageIcon,
} from '@mui/icons-material';
import { dataService, User, PurchasePrediction, ChurnRisk } from '../../services/dataService.ts';
import UserProfileCard from '../../components/UserProfile/UserProfileCard.tsx';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [predictions, setPredictions] = useState<PurchasePrediction[]>([]);
  const [churnRisks, setChurnRisks] = useState<ChurnRisk[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, predictionsData, churnData] = await Promise.all([
        dataService.getUsers(),
        dataService.getPurchasePredictions(),
        dataService.getChurnAnalysis(),
      ]);
      
      setUsers(usersData);
      setPredictions(predictionsData);
      setChurnRisks(churnData);
    } catch (err) {
      setError('Ошибка загрузки данных');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = useCallback(() => {
    if (!searchTerm) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user =>
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  const handleUserClick = async (userId: string) => {
    try {
      const profile = await dataService.getUserProfile(userId);
      setSelectedUserProfile(profile);
      setSelectedUser(userId);
    } catch (err) {
      console.error('Error loading user profile:', err);
    }
  };

  const handleCloseProfile = () => {
    setSelectedUser(null);
    setSelectedUserProfile(null);
  };

  const getUserPrediction = (userId: string) => {
    return predictions.find(p => p.userId === userId);
  };

  const getUserChurnRisk = (userId: string) => {
    return churnRisks.find(c => c.userId === userId);
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

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        👥 Пользователи системы
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Управление пользователями и анализ их поведения
      </Typography>

      {/* Поиск и фильтры */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          placeholder="Поиск пользователей..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1 }}
        />
        <Button
          variant="outlined"
          startIcon={<FilterIcon />}
        >
          Фильтры
        </Button>
      </Box>

      {/* Статистика */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{users.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Всего пользователей
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">
                    {predictions.filter(p => p.status === 'high').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Высокая вероятность покупки
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <WarningIcon color="error" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">
                    {churnRisks.filter(c => c.riskLevel === 'high').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Высокий риск оттока
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <StarIcon color="warning" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">
                    {users.filter(u => u.total_spent > 1000).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    VIP клиенты
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Список пользователей */}
      <Grid container spacing={3}>
        {filteredUsers.map((user) => {
          const prediction = getUserPrediction(user.id);
          const churnRisk = getUserChurnRisk(user.id);
          
          return (
            <Grid item xs={12} sm={6} lg={4} key={user.id}>
              <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => handleUserClick(user.id)}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        mr: 2,
                        bgcolor: user.status === 'active' ? 'primary.main' : 'grey.500',
                      }}
                    >
                      {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="div">
                        {user.first_name} {user.last_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        @{user.username}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={(e) => {
                      e.stopPropagation();
                      handleUserClick(user.id);
                    }}>
                      <VisibilityIcon />
                    </IconButton>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={user.status === 'active' ? 'Активен' : 'Неактивен'}
                      color={user.status === 'active' ? 'success' : 'error'}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    {user.total_spent > 1000 && (
                      <Chip label="VIP" color="warning" size="small" />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Покупки:
                    </Typography>
                    <Typography variant="body2">
                      {user.total_purchases}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Потрачено:
                    </Typography>
                    <Typography variant="body2">
                      ${user.total_spent}
                    </Typography>
                  </Box>

                  {prediction && (
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PsychologyIcon fontSize="small" />
                      <Typography variant="body2" color="text.secondary">
                        Покупка:
                      </Typography>
                      <Chip
                        label={`${prediction.probability}%`}
                        color={getPredictionColor(prediction.status) as any}
                        size="small"
                      />
                    </Box>
                  )}

                  {churnRisk && (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WarningIcon fontSize="small" />
                      <Typography variant="body2" color="text.secondary">
                        Отток:
                      </Typography>
                      <Chip
                        label={`${churnRisk.riskScore}%`}
                        color={getChurnColor(churnRisk.riskLevel) as any}
                        size="small"
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Диалог профиля пользователя */}
      <Dialog
        open={!!selectedUser}
        onClose={handleCloseProfile}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Профиль пользователя
          <IconButton
            onClick={handleCloseProfile}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            ×
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedUserProfile && (
            <UserProfileCard
              profile={selectedUserProfile}
              onEdit={() => console.log('Edit user')}
              onMessage={() => console.log('Message user')}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProfile}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Users;
