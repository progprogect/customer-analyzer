import { mlApi } from './api';
import {
  SegmentationResult,
  PurchasePredictionResult,
  ChurnPredictionResult,
  ApiResponse,
  PaginationParams,
} from '../types';

// API для сегментации пользователей
export const segmentationApi = {
  // Получить все сегменты
  getSegments: async (): Promise<ApiResponse<SegmentationResult>> => {
    const response = await mlApi.get('/segmentation/segments');
    return response.data;
  },

  // Получить сегмент по ID
  getSegment: async (segmentId: number): Promise<ApiResponse<SegmentationResult>> => {
    const response = await mlApi.get(`/segmentation/segments/${segmentId}`);
    return response.data;
  },

  // Получить сегменты пользователей
  getUserSegments: async (params?: PaginationParams): Promise<ApiResponse<Record<number, number>>> => {
    const response = await mlApi.get('/segmentation/user-segments', { params });
    return response.data;
  },

  // Получить метрики модели
  getModelMetrics: async (): Promise<ApiResponse<any>> => {
    const response = await mlApi.get('/segmentation/metrics');
    return response.data;
  },

  // Запустить переобучение модели
  retrainModel: async (): Promise<ApiResponse<any>> => {
    const response = await mlApi.post('/segmentation/retrain');
    return response.data;
  },

  // Получить статус переобучения
  getRetrainingStatus: async (): Promise<ApiResponse<any>> => {
    const response = await mlApi.get('/segmentation/retraining-status');
    return response.data;
  },

  // Получить важность признаков
  getFeatureImportance: async (): Promise<ApiResponse<Record<string, number>>> => {
    const response = await mlApi.get('/segmentation/feature-importance');
    return response.data;
  },
};

// API для предсказания покупок
export const purchasePredictionApi = {
  // Получить прогнозы для пользователя
  getUserPrediction: async (userId: number): Promise<ApiResponse<PurchasePredictionResult>> => {
    const response = await mlApi.get(`/purchase-prediction/user/${userId}`);
    return response.data;
  },

  // Получить прогнозы для всех пользователей
  getAllPredictions: async (params?: PaginationParams): Promise<ApiResponse<PurchasePredictionResult[]>> => {
    const response = await mlApi.get('/purchase-prediction/predictions', { params });
    return response.data;
  },

  // Получить топ пользователей с высокой вероятностью покупки
  getTopPredictions: async (limit: number = 100): Promise<ApiResponse<PurchasePredictionResult[]>> => {
    const response = await mlApi.get(`/purchase-prediction/top-predictions?limit=${limit}`);
    return response.data;
  },

  // Получить метрики модели
  getModelMetrics: async (): Promise<ApiResponse<any>> => {
    const response = await mlApi.get('/purchase-prediction/metrics');
    return response.data;
  },

  // Обновить прогнозы
  updatePredictions: async (): Promise<ApiResponse<any>> => {
    const response = await mlApi.post('/purchase-prediction/update-predictions');
    return response.data;
  },

  // Получить статус обновления
  getUpdateStatus: async (): Promise<ApiResponse<any>> => {
    const response = await mlApi.get('/purchase-prediction/update-status');
    return response.data;
  },

  // Получить важность признаков
  getFeatureImportance: async (): Promise<ApiResponse<Record<string, number>>> => {
    const response = await mlApi.get('/purchase-prediction/feature-importance');
    return response.data;
  },
};

// API для предсказания оттока
export const churnPredictionApi = {
  // Получить прогноз оттока для пользователя
  getUserPrediction: async (userId: number): Promise<ApiResponse<ChurnPredictionResult>> => {
    const response = await mlApi.get(`/churn-prediction/user/${userId}`);
    return response.data;
  },

  // Получить прогнозы для всех пользователей
  getAllPredictions: async (params?: PaginationParams): Promise<ApiResponse<ChurnPredictionResult[]>> => {
    const response = await mlApi.get('/churn-prediction/predictions', { params });
    return response.data;
  },

  // Получить пользователей с высоким риском оттока
  getHighRiskUsers: async (threshold: number = 0.7): Promise<ApiResponse<ChurnPredictionResult[]>> => {
    const response = await mlApi.get(`/churn-prediction/high-risk?threshold=${threshold}`);
    return response.data;
  },

  // Получить рекомендации по удержанию
  getRetentionRecommendations: async (userId: number): Promise<ApiResponse<string[]>> => {
    const response = await mlApi.get(`/churn-prediction/recommendations/${userId}`);
    return response.data;
  },

  // Получить метрики модели
  getModelMetrics: async (): Promise<ApiResponse<any>> => {
    const response = await mlApi.get('/churn-prediction/metrics');
    return response.data;
  },

  // Обновить прогнозы оттока
  updatePredictions: async (): Promise<ApiResponse<any>> => {
    const response = await mlApi.post('/churn-prediction/update-predictions');
    return response.data;
  },

  // Получить статус обновления
  getUpdateStatus: async (): Promise<ApiResponse<any>> => {
    const response = await mlApi.get('/churn-prediction/update-status');
    return response.data;
  },

  // Получить важность признаков
  getFeatureImportance: async (): Promise<ApiResponse<Record<string, number>>> => {
    const response = await mlApi.get('/churn-prediction/feature-importance');
    return response.data;
  },

  // Получить факторы риска
  getRiskFactors: async (userId: number): Promise<ApiResponse<string[]>> => {
    const response = await mlApi.get(`/churn-prediction/risk-factors/${userId}`);
    return response.data;
  },
};

// API для переобучения моделей
export const modelTrainingApi = {
  // Запустить переобучение всех моделей
  retrainAllModels: async (): Promise<ApiResponse<any>> => {
    const response = await mlApi.post('/retraining/retrain-all');
    return response.data;
  },

  // Получить статус переобучения всех моделей
  getAllRetrainingStatus: async (): Promise<ApiResponse<any>> => {
    const response = await mlApi.get('/retraining/status');
    return response.data;
  },

  // Получить историю переобучения
  getTrainingHistory: async (params?: PaginationParams): Promise<ApiResponse<any>> => {
    const response = await mlApi.get('/retraining/history', { params });
    return response.data;
  },
};

// Экспорт всех API
export const mlServices = {
  segmentation: segmentationApi,
  purchasePrediction: purchasePredictionApi,
  churnPrediction: churnPredictionApi,
  modelTraining: modelTrainingApi,
};

export default mlServices;
