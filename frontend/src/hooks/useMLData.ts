import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mlServices } from '../services/mlApi';
import { ApiResponse, ApiError } from '../types';

// Конфигурация React Query
const queryConfig = {
  staleTime: 5 * 60 * 1000, // 5 минут
  cacheTime: 10 * 60 * 1000, // 10 минут
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
};

// Хук для сегментации пользователей
export const useSegmentationData = (refreshInterval?: number) => {
  const queryClient = useQueryClient();

  const {
    data: segments,
    isLoading: segmentsLoading,
    error: segmentsError,
    refetch: refetchSegments,
  } = useQuery({
    queryKey: ['segmentation', 'segments'],
    queryFn: async () => {
      const response = await mlServices.segmentation.getSegments();
      if (!response.success) {
        throw new Error(response.message || 'Ошибка загрузки сегментов');
      }
      return response.data;
    },
    ...queryConfig,
    refetchInterval: refreshInterval || false,
  });

  const {
    data: userSegments,
    isLoading: userSegmentsLoading,
    error: userSegmentsError,
  } = useQuery({
    queryKey: ['segmentation', 'user-segments'],
    queryFn: async () => {
      const response = await mlServices.segmentation.getUserSegments();
      if (!response.success) {
        throw new Error(response.message || 'Ошибка загрузки сегментов пользователей');
      }
      return response.data;
    },
    ...queryConfig,
    refetchInterval: refreshInterval || false,
  });

  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
  } = useQuery({
    queryKey: ['segmentation', 'metrics'],
    queryFn: async () => {
      const response = await mlServices.segmentation.getModelMetrics();
      if (!response.success) {
        throw new Error(response.message || 'Ошибка загрузки метрик');
      }
      return response.data;
    },
    ...queryConfig,
    refetchInterval: refreshInterval || false,
  });

  const retrainMutation = useMutation({
    mutationFn: async () => {
      const response = await mlServices.segmentation.retrainModel();
      if (!response.success) {
        throw new Error(response.message || 'Ошибка переобучения модели');
      }
      return response.data;
    },
    onSuccess: () => {
      // Инвалидируем кэш после успешного переобучения
      queryClient.invalidateQueries({ queryKey: ['segmentation'] });
    },
  });

  const isLoading = segmentsLoading || userSegmentsLoading || metricsLoading;
  const error = segmentsError || userSegmentsError || metricsError;

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['segmentation'] });
  }, [queryClient]);

  const retrain = useCallback(() => {
    retrainMutation.mutate();
  }, [retrainMutation]);

  return {
    segments,
    userSegments,
    metrics,
    isLoading,
    error,
    refresh,
    retrain,
    isRetraining: retrainMutation.isPending,
  };
};

// Хук для прогнозов покупок
export const usePurchasePredictionData = (refreshInterval?: number) => {
  const queryClient = useQueryClient();

  const {
    data: predictions,
    isLoading: predictionsLoading,
    error: predictionsError,
  } = useQuery({
    queryKey: ['purchase-prediction', 'predictions'],
    queryFn: async () => {
      const response = await mlServices.purchasePrediction.getAllPredictions();
      if (!response.success) {
        throw new Error(response.message || 'Ошибка загрузки прогнозов');
      }
      return response.data;
    },
    ...queryConfig,
    refetchInterval: refreshInterval || false,
  });

  const {
    data: topPredictions,
    isLoading: topPredictionsLoading,
    error: topPredictionsError,
  } = useQuery({
    queryKey: ['purchase-prediction', 'top-predictions'],
    queryFn: async () => {
      const response = await mlServices.purchasePrediction.getTopPredictions(100);
      if (!response.success) {
        throw new Error(response.message || 'Ошибка загрузки топ прогнозов');
      }
      return response.data;
    },
    ...queryConfig,
    refetchInterval: refreshInterval || false,
  });

  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
  } = useQuery({
    queryKey: ['purchase-prediction', 'metrics'],
    queryFn: async () => {
      const response = await mlServices.purchasePrediction.getModelMetrics();
      if (!response.success) {
        throw new Error(response.message || 'Ошибка загрузки метрик');
      }
      return response.data;
    },
    ...queryConfig,
    refetchInterval: refreshInterval || false,
  });

  const updatePredictionsMutation = useMutation({
    mutationFn: async () => {
      const response = await mlServices.purchasePrediction.updatePredictions();
      if (!response.success) {
        throw new Error(response.message || 'Ошибка обновления прогнозов');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-prediction'] });
    },
  });

  const isLoading = predictionsLoading || topPredictionsLoading || metricsLoading;
  const error = predictionsError || topPredictionsError || metricsError;

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['purchase-prediction'] });
  }, [queryClient]);

  const updatePredictions = useCallback(() => {
    updatePredictionsMutation.mutate();
  }, [updatePredictionsMutation]);

  return {
    predictions,
    topPredictions,
    metrics,
    isLoading,
    error,
    refresh,
    updatePredictions,
    isUpdating: updatePredictionsMutation.isPending,
  };
};

// Хук для прогнозов оттока
export const useChurnPredictionData = (refreshInterval?: number) => {
  const queryClient = useQueryClient();

  const {
    data: predictions,
    isLoading: predictionsLoading,
    error: predictionsError,
  } = useQuery({
    queryKey: ['churn-prediction', 'predictions'],
    queryFn: async () => {
      const response = await mlServices.churnPrediction.getAllPredictions();
      if (!response.success) {
        throw new Error(response.message || 'Ошибка загрузки прогнозов оттока');
      }
      return response.data;
    },
    ...queryConfig,
    refetchInterval: refreshInterval || false,
  });

  const {
    data: highRiskUsers,
    isLoading: highRiskLoading,
    error: highRiskError,
  } = useQuery({
    queryKey: ['churn-prediction', 'high-risk'],
    queryFn: async () => {
      const response = await mlServices.churnPrediction.getHighRiskUsers(0.7);
      if (!response.success) {
        throw new Error(response.message || 'Ошибка загрузки пользователей высокого риска');
      }
      return response.data;
    },
    ...queryConfig,
    refetchInterval: refreshInterval || false,
  });

  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
  } = useQuery({
    queryKey: ['churn-prediction', 'metrics'],
    queryFn: async () => {
      const response = await mlServices.churnPrediction.getModelMetrics();
      if (!response.success) {
        throw new Error(response.message || 'Ошибка загрузки метрик');
      }
      return response.data;
    },
    ...queryConfig,
    refetchInterval: refreshInterval || false,
  });

  const updatePredictionsMutation = useMutation({
    mutationFn: async () => {
      const response = await mlServices.churnPrediction.updatePredictions();
      if (!response.success) {
        throw new Error(response.message || 'Ошибка обновления прогнозов');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['churn-prediction'] });
    },
  });

  const isLoading = predictionsLoading || highRiskLoading || metricsLoading;
  const error = predictionsError || highRiskError || metricsError;

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['churn-prediction'] });
  }, [queryClient]);

  const updatePredictions = useCallback(() => {
    updatePredictionsMutation.mutate();
  }, [updatePredictionsMutation]);

  return {
    predictions,
    highRiskUsers,
    metrics,
    isLoading,
    error,
    refresh,
    updatePredictions,
    isUpdating: updatePredictionsMutation.isPending,
  };
};

// Хук для управления всеми ML моделями
export const useMLModelsManagement = () => {
  const queryClient = useQueryClient();

  const retrainAllMutation = useMutation({
    mutationFn: async () => {
      const response = await mlServices.modelTraining.retrainAllModels();
      if (!response.success) {
        throw new Error(response.message || 'Ошибка переобучения моделей');
      }
      return response.data;
    },
    onSuccess: () => {
      // Инвалидируем весь кэш ML данных
      queryClient.invalidateQueries({ queryKey: ['segmentation'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-prediction'] });
      queryClient.invalidateQueries({ queryKey: ['churn-prediction'] });
    },
  });

  const {
    data: retrainingStatus,
    isLoading: statusLoading,
    error: statusError,
  } = useQuery({
    queryKey: ['ml-models', 'retraining-status'],
    queryFn: async () => {
      const response = await mlServices.modelTraining.getAllRetrainingStatus();
      if (!response.success) {
        throw new Error(response.message || 'Ошибка загрузки статуса переобучения');
      }
      return response.data;
    },
    ...queryConfig,
    refetchInterval: 30000, // Обновляем каждые 30 секунд
  });

  const retrainAllModels = useCallback(() => {
    retrainAllMutation.mutate();
  }, [retrainAllMutation]);

  const refreshAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['segmentation'] });
    queryClient.invalidateQueries({ queryKey: ['purchase-prediction'] });
    queryClient.invalidateQueries({ queryKey: ['churn-prediction'] });
    queryClient.invalidateQueries({ queryKey: ['ml-models'] });
  }, [queryClient]);

  return {
    retrainAllModels,
    retrainingStatus,
    isRetraining: retrainAllMutation.isPending,
    statusLoading,
    statusError,
    refreshAll,
  };
};

// Хук для получения данных конкретного пользователя
export const useUserMLData = (userId: number) => {
  const {
    data: segmentation,
    isLoading: segmentationLoading,
    error: segmentationError,
  } = useQuery({
    queryKey: ['user', userId, 'segmentation'],
    queryFn: async () => {
      const response = await mlServices.segmentation.getSegment(0); // Предполагаем, что есть эндпоинт для пользователя
      if (!response.success) {
        throw new Error(response.message || 'Ошибка загрузки сегментации пользователя');
      }
      return response.data;
    },
    ...queryConfig,
    enabled: !!userId,
  });

  const {
    data: purchasePrediction,
    isLoading: purchaseLoading,
    error: purchaseError,
  } = useQuery({
    queryKey: ['user', userId, 'purchase-prediction'],
    queryFn: async () => {
      const response = await mlServices.purchasePrediction.getUserPrediction(userId);
      if (!response.success) {
        throw new Error(response.message || 'Ошибка загрузки прогноза покупки');
      }
      return response.data;
    },
    ...queryConfig,
    enabled: !!userId,
  });

  const {
    data: churnPrediction,
    isLoading: churnLoading,
    error: churnError,
  } = useQuery({
    queryKey: ['user', userId, 'churn-prediction'],
    queryFn: async () => {
      const response = await mlServices.churnPrediction.getUserPrediction(userId);
      if (!response.success) {
        throw new Error(response.message || 'Ошибка загрузки прогноза оттока');
      }
      return response.data;
    },
    ...queryConfig,
    enabled: !!userId,
  });

  const {
    data: retentionRecommendations,
    isLoading: recommendationsLoading,
    error: recommendationsError,
  } = useQuery({
    queryKey: ['user', userId, 'retention-recommendations'],
    queryFn: async () => {
      const response = await mlServices.churnPrediction.getRetentionRecommendations(userId);
      if (!response.success) {
        throw new Error(response.message || 'Ошибка загрузки рекомендаций');
      }
      return response.data;
    },
    ...queryConfig,
    enabled: !!userId,
  });

  const isLoading = segmentationLoading || purchaseLoading || churnLoading || recommendationsLoading;
  const error = segmentationError || purchaseError || churnError || recommendationsError;

  return {
    segmentation,
    purchasePrediction,
    churnPrediction,
    retentionRecommendations,
    isLoading,
    error,
  };
};

export default {
  useSegmentationData,
  usePurchasePredictionData,
  useChurnPredictionData,
  useMLModelsManagement,
  useUserMLData,
};
