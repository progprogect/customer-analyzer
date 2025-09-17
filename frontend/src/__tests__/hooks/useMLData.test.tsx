/**
 * Тесты для хуков useMLData
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSegmentationData, usePurchasePredictionData, useChurnPredictionData } from '../../hooks/useMLData';
import { mlServices } from '../../services/mlApi';

// Mock для mlServices
jest.mock('../../services/mlApi', () => ({
  mlServices: {
    segmentation: {
      getSegments: jest.fn(),
      getUserSegments: jest.fn(),
      getModelMetrics: jest.fn(),
      retrainModel: jest.fn(),
    },
    purchasePrediction: {
      getAllPredictions: jest.fn(),
      getTopPredictions: jest.fn(),
      getModelMetrics: jest.fn(),
      updatePredictions: jest.fn(),
    },
    churnPrediction: {
      getAllPredictions: jest.fn(),
      getHighRiskUsers: jest.fn(),
      getModelMetrics: jest.fn(),
      updatePredictions: jest.fn(),
    },
  },
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useMLData hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useSegmentationData', () => {
    it('должен успешно загружать данные сегментации', async () => {
      const mockSegmentsData = {
        segments: [
          {
            segment_id: 1,
            name: 'Активные пользователи',
            description: 'Пользователи с высокой активностью',
            size: 1000,
            percentage: 35.0,
            characteristics: { avg_events_per_day: 5.2 },
          },
        ],
        user_segments: { 123: 1 },
        model_metrics: { silhouette_score: 0.75 },
        feature_importance: { event_count: 0.85 },
        model_version: 'v1.0.0',
        created_at: new Date().toISOString(),
      };

      const mockUserSegments = { 123: 1, 456: 2 };
      const mockMetrics = { silhouette_score: 0.75, inertia: 1234.56 };

      (mlServices.segmentation.getSegments as jest.Mock).mockResolvedValue({
        success: true,
        data: mockSegmentsData,
      });
      (mlServices.segmentation.getUserSegments as jest.Mock).mockResolvedValue({
        success: true,
        data: mockUserSegments,
      });
      (mlServices.segmentation.getModelMetrics as jest.Mock).mockResolvedValue({
        success: true,
        data: mockMetrics,
      });

      const { result } = renderHook(() => useSegmentationData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.segments).toEqual(mockSegmentsData);
      expect(result.current.userSegments).toEqual(mockUserSegments);
      expect(result.current.metrics).toEqual(mockMetrics);
      expect(result.current.error).toBeNull();
    });

    it('должен обрабатывать ошибки загрузки', async () => {
      const error = new Error('Failed to fetch segments');
      (mlServices.segmentation.getSegments as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useSegmentationData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toEqual(error);
      expect(result.current.segments).toBeUndefined();
    });

    it('должен успешно выполнять переобучение модели', async () => {
      (mlServices.segmentation.retrainModel as jest.Mock).mockResolvedValue({
        success: true,
        data: { message: 'Model retrained successfully' },
      });

      const { result } = renderHook(() => useSegmentationData(), { wrapper });

      result.current.retrain();

      await waitFor(() => {
        expect(result.current.isRetraining).toBe(false);
      });

      expect(mlServices.segmentation.retrainModel).toHaveBeenCalled();
    });
  });

  describe('usePurchasePredictionData', () => {
    it('должен успешно загружать данные прогнозов покупок', async () => {
      const mockPredictions = [
        {
          user_id: 123,
          purchase_probability: 0.85,
          prediction_confidence: 'high',
          key_factors: ['high_activity'],
          prediction_date: new Date().toISOString(),
          model_version: 'v1.0.0',
        },
      ];

      const mockTopPredictions = mockPredictions;
      const mockMetrics = { accuracy: 0.85, precision: 0.82, recall: 0.88 };

      (mlServices.purchasePrediction.getAllPredictions as jest.Mock).mockResolvedValue({
        success: true,
        data: mockPredictions,
      });
      (mlServices.purchasePrediction.getTopPredictions as jest.Mock).mockResolvedValue({
        success: true,
        data: mockTopPredictions,
      });
      (mlServices.purchasePrediction.getModelMetrics as jest.Mock).mockResolvedValue({
        success: true,
        data: mockMetrics,
      });

      const { result } = renderHook(() => usePurchasePredictionData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.predictions).toEqual(mockPredictions);
      expect(result.current.topPredictions).toEqual(mockTopPredictions);
      expect(result.current.metrics).toEqual(mockMetrics);
    });

    it('должен успешно обновлять прогнозы', async () => {
      (mlServices.purchasePrediction.updatePredictions as jest.Mock).mockResolvedValue({
        success: true,
        data: { message: 'Predictions updated successfully' },
      });

      const { result } = renderHook(() => usePurchasePredictionData(), { wrapper });

      result.current.updatePredictions();

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false);
      });

      expect(mlServices.purchasePrediction.updatePredictions).toHaveBeenCalled();
    });
  });

  describe('useChurnPredictionData', () => {
    it('должен успешно загружать данные прогнозов оттока', async () => {
      const mockPredictions = [
        {
          user_id: 123,
          churn_probability: 0.25,
          prediction_confidence: 'low',
          risk_factors: ['recent_activity'],
          retention_recommendations: ['send_email'],
          prediction_date: new Date().toISOString(),
          model_version: 'v1.0.0',
        },
      ];

      const mockHighRiskUsers = [
        {
          user_id: 789,
          churn_probability: 0.85,
          prediction_confidence: 'high',
          risk_factors: ['low_activity'],
          retention_recommendations: ['personal_outreach'],
          prediction_date: new Date().toISOString(),
          model_version: 'v1.0.0',
        },
      ];

      const mockMetrics = { accuracy: 0.88, precision: 0.85, recall: 0.82 };

      (mlServices.churnPrediction.getAllPredictions as jest.Mock).mockResolvedValue({
        success: true,
        data: mockPredictions,
      });
      (mlServices.churnPrediction.getHighRiskUsers as jest.Mock).mockResolvedValue({
        success: true,
        data: mockHighRiskUsers,
      });
      (mlServices.churnPrediction.getModelMetrics as jest.Mock).mockResolvedValue({
        success: true,
        data: mockMetrics,
      });

      const { result } = renderHook(() => useChurnPredictionData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.predictions).toEqual(mockPredictions);
      expect(result.current.highRiskUsers).toEqual(mockHighRiskUsers);
      expect(result.current.metrics).toEqual(mockMetrics);
    });

    it('должен обрабатывать ошибки при обновлении прогнозов', async () => {
      const error = new Error('Failed to update predictions');
      (mlServices.churnPrediction.updatePredictions as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useChurnPredictionData(), { wrapper });

      result.current.updatePredictions();

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false);
      });

      expect(mlServices.churnPrediction.updatePredictions).toHaveBeenCalled();
    });
  });
});
