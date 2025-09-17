// Единый сервис для получения данных из API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const ML_API_URL = process.env.REACT_APP_ML_API_URL || 'http://localhost:8000';

export interface User {
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
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
}

export interface Event {
  id: string;
  user_id: string;
  event_type: string;
  event_data: any;
  timestamp: string;
}

export interface UserSegment {
  name: string;
  count: number;
  percentage: number;
  color: string;
  avgOrder: number;
  retention: number;
}

export interface PurchasePrediction {
  userId: string;
  userName: string;
  probability: number;
  predictedAmount: number;
  lastPurchase: string;
  status: 'high' | 'medium' | 'low';
}

export interface ChurnRisk {
  userId: string;
  userName: string;
  riskScore: number;
  daysSinceLastActivity: number;
  lastPurchase: string;
  totalSpent: number;
  riskLevel: 'high' | 'medium' | 'low';
}

class DataService {
  // Получение всех пользователей
  async getUsers(): Promise<User[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      // Возвращаем моковые данные в случае ошибки
      return this.getMockUsers();
    }
  }

  // Получение статистики пользователей
  async getUserStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stats/users`);
      if (!response.ok) throw new Error('Failed to fetch user stats');
      return await response.json();
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return this.getMockUserStats();
    }
  }

  // Получение сегментации пользователей
  async getUserSegments(): Promise<UserSegment[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/segmentation`);
      if (!response.ok) throw new Error('Failed to fetch segments');
      return await response.json();
    } catch (error) {
      console.error('Error fetching segments:', error);
      return this.getMockSegments();
    }
  }

  // Получение предсказаний покупок
  async getPurchasePredictions(): Promise<PurchasePrediction[]> {
    try {
      // Пытаемся получить реальные данные из ML API
      const users = await this.getUsers();
      const predictions: PurchasePrediction[] = [];
      
      for (const user of users) {
        try {
          const response = await fetch(`${ML_API_URL}/predict/purchase/${user.id}`);
          if (response.ok) {
            const prediction = await response.json();
            predictions.push({
              userId: user.id,
              userName: `${user.first_name} ${user.last_name}`,
              probability: prediction.probability,
              predictedAmount: user.total_spent > 1000 ? user.total_spent * 0.1 : user.total_spent * 0.2,
              lastPurchase: user.last_purchase_date ? 
                `${Math.floor((new Date().getTime() - new Date(user.last_purchase_date).getTime()) / (1000 * 60 * 60 * 24))} дней назад` : 
                'Никогда',
              status: prediction.probability > 70 ? 'high' : prediction.probability > 40 ? 'medium' : 'low'
            });
          }
        } catch (error) {
          console.warn(`Failed to get prediction for user ${user.id}:`, error);
        }
      }
      
      // Если получили реальные данные, возвращаем их
      if (predictions.length > 0) {
        return predictions;
      }
      
      // Иначе возвращаем моковые данные
      return this.getMockPredictions();
    } catch (error) {
      console.error('Error fetching predictions:', error);
      return this.getMockPredictions();
    }
  }

  // Получение анализа оттока
  async getChurnAnalysis(): Promise<ChurnRisk[]> {
    try {
      // Пытаемся получить реальные данные из ML API
      const users = await this.getUsers();
      const churnRisks: ChurnRisk[] = [];
      
      for (const user of users) {
        try {
          const response = await fetch(`${ML_API_URL}/predict/churn/${user.id}`);
          if (response.ok) {
            const prediction = await response.json();
            churnRisks.push({
              userId: user.id,
              userName: `${user.first_name} ${user.last_name}`,
              riskScore: prediction.probability,
              daysSinceLastActivity: Math.floor((new Date().getTime() - new Date(user.last_activity).getTime()) / (1000 * 60 * 60 * 24)),
              lastPurchase: user.last_purchase_date ? 
                `${Math.floor((new Date().getTime() - new Date(user.last_purchase_date).getTime()) / (1000 * 60 * 60 * 24))} дней назад` : 
                'Никогда',
              totalSpent: user.total_spent,
              riskLevel: prediction.probability > 60 ? 'high' : prediction.probability > 30 ? 'medium' : 'low'
            });
          }
        } catch (error) {
          console.warn(`Failed to get churn prediction for user ${user.id}:`, error);
        }
      }
      
      // Если получили реальные данные, возвращаем их
      if (churnRisks.length > 0) {
        return churnRisks;
      }
      
      // Иначе возвращаем моковые данные
      return this.getMockChurnAnalysis();
    } catch (error) {
      console.error('Error fetching churn analysis:', error);
      return this.getMockChurnAnalysis();
    }
  }

  // Получение детальной информации о пользователе
  async getUserProfile(userId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/profile`);
      if (!response.ok) throw new Error('Failed to fetch user profile');
      return await response.json();
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return this.getMockUserProfile(userId);
    }
  }

  // Обучение ML моделей
  async trainModels() {
    try {
      const response = await fetch(`${ML_API_URL}/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to train models');
      return await response.json();
    } catch (error) {
      console.error('Error training models:', error);
      throw error;
    }
  }

  // Получение статуса ML сервиса
  async getMLServiceStatus() {
    try {
      const response = await fetch(`${ML_API_URL}/health`);
      if (!response.ok) throw new Error('Failed to fetch ML service status');
      return await response.json();
    } catch (error) {
      console.error('Error fetching ML service status:', error);
      return { status: 'unavailable', models_trained: false };
    }
  }

  // Получение реального прогноза для пользователя
  async getRealPrediction(userId: string, type: 'purchase' | 'churn' | 'segment') {
    try {
      const endpoint = type === 'purchase' ? 'purchase' : 
                      type === 'churn' ? 'churn' : 'segment';
      const response = await fetch(`${ML_API_URL}/predict/${endpoint}/${userId}`);
      if (!response.ok) throw new Error(`Failed to get ${type} prediction`);
      return await response.json();
    } catch (error) {
      console.error(`Error getting ${type} prediction:`, error);
      throw error;
    }
  }

  // Моковые данные (согласованные между всеми дашбордами)
  private getMockUsers(): User[] {
    return [
      {
        id: 'user_001',
        telegram_id: 123456789,
        username: 'anna_smirnova',
        first_name: 'Анна',
        last_name: 'Смирнова',
        email: 'anna@example.com',
        phone: '+7-900-123-4567',
        registration_date: '2024-01-15',
        last_activity: '2024-09-15',
        status: 'active',
        total_purchases: 3,
        total_spent: 3299.97,
        last_purchase_date: '2024-09-15'
      },
      {
        id: 'user_002',
        telegram_id: 234567890,
        username: 'dmitry_kozlov',
        first_name: 'Дмитрий',
        last_name: 'Козлов',
        email: 'dmitry@example.com',
        phone: '+7-900-234-5678',
        registration_date: '2024-02-20',
        last_activity: '2024-09-14',
        status: 'active',
        total_purchases: 2,
        total_spent: 719.97,
        last_purchase_date: '2024-09-14'
      },
      {
        id: 'user_003',
        telegram_id: 345678901,
        username: 'elena_petrova',
        first_name: 'Елена',
        last_name: 'Петрова',
        email: 'elena@example.com',
        phone: '+7-900-345-6789',
        registration_date: '2024-03-10',
        last_activity: '2024-09-16',
        status: 'active',
        total_purchases: 0,
        total_spent: 0
      },
      {
        id: 'user_004',
        telegram_id: 456789012,
        username: 'mikhail_volkov',
        first_name: 'Михаил',
        last_name: 'Волков',
        email: 'mikhail@example.com',
        phone: '+7-900-456-7890',
        registration_date: '2024-04-05',
        last_activity: '2024-09-10',
        status: 'active',
        total_purchases: 0,
        total_spent: 0
      },
      {
        id: 'user_005',
        telegram_id: 567890123,
        username: 'olga_sidorova',
        first_name: 'Ольга',
        last_name: 'Сидорова',
        email: 'olga@example.com',
        phone: '+7-900-567-8901',
        registration_date: '2024-05-12',
        last_activity: '2024-09-08',
        status: 'active',
        total_purchases: 0,
        total_spent: 0
      },
      {
        id: 'user_011',
        telegram_id: 1234567890,
        username: 'alexandra_ivanova',
        first_name: 'Александра',
        last_name: 'Иванова',
        email: 'alexandra@example.com',
        phone: '+7-900-111-2222',
        registration_date: '2024-01-10',
        last_activity: '2024-09-16',
        status: 'active',
        total_purchases: 5,
        total_spent: 5099.98,
        last_purchase_date: '2024-09-16'
      },
      {
        id: 'user_012',
        telegram_id: 2345678901,
        username: 'vladimir_petrov',
        first_name: 'Владимир',
        last_name: 'Петров',
        email: 'vladimir@example.com',
        phone: '+7-900-222-3333',
        registration_date: '2024-02-15',
        last_activity: '2024-09-15',
        status: 'active',
        total_purchases: 1,
        total_spent: 499.99,
        last_purchase_date: '2024-09-15'
      },
      {
        id: 'user_013',
        telegram_id: 3456789012,
        username: 'natalia_sidorova',
        first_name: 'Наталья',
        last_name: 'Сидорова',
        email: 'natalia@example.com',
        phone: '+7-900-333-4444',
        registration_date: '2024-03-05',
        last_activity: '2024-09-14',
        status: 'active',
        total_purchases: 0,
        total_spent: 0
      },
      {
        id: 'user_014',
        telegram_id: 4567890123,
        username: 'andrey_kuznetsov',
        first_name: 'Андрей',
        last_name: 'Кузнецов',
        email: 'andrey@example.com',
        phone: '+7-900-444-5555',
        registration_date: '2024-04-12',
        last_activity: '2024-09-13',
        status: 'active',
        total_purchases: 1,
        total_spent: 399.99,
        last_purchase_date: '2024-09-13'
      },
      {
        id: 'user_015',
        telegram_id: 5678901234,
        username: 'elena_morozova',
        first_name: 'Елена',
        last_name: 'Морозова',
        email: 'elena2@example.com',
        phone: '+7-900-555-6666',
        registration_date: '2024-05-20',
        last_activity: '2024-09-12',
        status: 'active',
        total_purchases: 0,
        total_spent: 0
      }
    ];
  }

  private getMockUserStats() {
    const users = this.getMockUsers();
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'active').length,
      totalPurchases: users.reduce((sum, u) => sum + u.total_purchases, 0),
      totalSpent: users.reduce((sum, u) => sum + u.total_spent, 0),
      conversionRate: 40.0, // 2 из 5 пользователей совершили покупки
      churnRate: 0.0, // Пока никто не ушел
      telegramUsers: users.length,
      userGrowth: [
        { name: 'Янв', users: 1 },
        { name: 'Фев', users: 2 },
        { name: 'Мар', users: 3 },
        { name: 'Апр', users: 4 },
        { name: 'Май', users: 5 },
        { name: 'Июн', users: 5 },
        { name: 'Июл', users: 5 },
        { name: 'Авг', users: 5 },
        { name: 'Сен', users: 5 }
      ],
      purchaseTrends: [
        { name: 'Янв', purchases: 0 },
        { name: 'Фев', purchases: 0 },
        { name: 'Мар', purchases: 0 },
        { name: 'Апр', purchases: 0 },
        { name: 'Май', purchases: 0 },
        { name: 'Июн', purchases: 0 },
        { name: 'Июл', purchases: 0 },
        { name: 'Авг', purchases: 0 },
        { name: 'Сен', purchases: 5 }
      ],
      userSegments: [
        { name: 'VIP', value: 1, color: '#ff6b35' },
        { name: 'Активные', value: 1, color: '#4caf50' },
        { name: 'Новые', value: 3, color: '#2196f3' }
      ]
    };
  }

  private getMockSegments(): UserSegment[] {
    return [
      {
        name: 'VIP Клиенты',
        count: 1,
        percentage: 20.0,
        color: '#ff6b35',
        avgOrder: 1149.99,
        retention: 100
      },
      {
        name: 'Активные покупатели',
        count: 1,
        percentage: 20.0,
        color: '#4caf50',
        avgOrder: 109.99,
        retention: 100
      },
      {
        name: 'Новые клиенты',
        count: 3,
        percentage: 60.0,
        color: '#2196f3',
        avgOrder: 0,
        retention: 100
      }
    ];
  }

  private getMockPredictions(): PurchasePrediction[] {
    return [
      {
        userId: 'user_001',
        userName: 'Анна Смирнова',
        probability: 15, // Недавно покупала
        predictedAmount: 0,
        lastPurchase: '1 день назад',
        status: 'low'
      },
      {
        userId: 'user_002',
        userName: 'Дмитрий Козлов',
        probability: 25, // Недавно покупал
        predictedAmount: 0,
        lastPurchase: '2 дня назад',
        status: 'low'
      },
      {
        userId: 'user_003',
        userName: 'Елена Петрова',
        probability: 85, // Смотрела товары, но не купила
        predictedAmount: 249.99,
        lastPurchase: 'Никогда',
        status: 'high'
      },
      {
        userId: 'user_004',
        userName: 'Михаил Волков',
        probability: 65, // Смотрел товары
        predictedAmount: 899.99,
        lastPurchase: 'Никогда',
        status: 'medium'
      },
      {
        userId: 'user_005',
        userName: 'Ольга Сидорова',
        probability: 45, // Смотрела товары
        predictedAmount: 29.99,
        lastPurchase: 'Никогда',
        status: 'medium'
      }
    ];
  }

  private getMockChurnAnalysis(): ChurnRisk[] {
    return [
      {
        userId: 'user_001',
        userName: 'Анна Смирнова',
        riskScore: 5, // Активный VIP клиент
        daysSinceLastActivity: 2,
        lastPurchase: '1 день назад',
        totalSpent: 2299.98,
        riskLevel: 'low'
      },
      {
        userId: 'user_002',
        userName: 'Дмитрий Козлов',
        riskScore: 10, // Активный покупатель
        daysSinceLastActivity: 3,
        lastPurchase: '2 дня назад',
        totalSpent: 219.98,
        riskLevel: 'low'
      },
      {
        userId: 'user_003',
        userName: 'Елена Петрова',
        riskScore: 35, // Новый клиент, но активный
        daysSinceLastActivity: 1,
        lastPurchase: 'Никогда',
        totalSpent: 0,
        riskLevel: 'medium'
      },
      {
        userId: 'user_004',
        userName: 'Михаил Волков',
        riskScore: 55, // Смотрел, но не покупал
        daysSinceLastActivity: 7,
        lastPurchase: 'Никогда',
        totalSpent: 0,
        riskLevel: 'medium'
      },
      {
        userId: 'user_005',
        userName: 'Ольга Сидорова',
        riskScore: 75, // Долго неактивна
        daysSinceLastActivity: 9,
        lastPurchase: 'Никогда',
        totalSpent: 0,
        riskLevel: 'high'
      }
    ];
  }

  private getMockUserProfile(userId: string) {
    const users = this.getMockUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) return null;

    return {
      user,
      events: [
        { id: '1', type: 'page_view', timestamp: '2024-09-15 10:30:00', data: { page: '/products' } },
        { id: '2', type: 'product_view', timestamp: '2024-09-15 10:32:00', data: { product: 'iPhone 15 Pro' } },
        { id: '3', type: 'purchase', timestamp: '2024-09-15 10:40:00', data: { amount: 999.99 } }
      ],
      predictions: this.getMockPredictions().find(p => p.userId === userId),
      churnRisk: this.getMockChurnAnalysis().find(c => c.userId === userId),
      recommendations: [
        'Персонализированные предложения',
        'Программа лояльности',
        'Уведомления о новых товарах'
      ]
    };
  }
}

export const dataService = new DataService();
