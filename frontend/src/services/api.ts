import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { ApiResponse, ApiError } from '../types';

// Конфигурация API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const ML_API_BASE_URL = process.env.REACT_APP_ML_API_URL || 'http://localhost:8000/api';

// Создание экземпляров axios для разных сервисов
const backendApi: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const mlApi: AxiosInstance = axios.create({
  baseURL: ML_API_BASE_URL,
  timeout: 30000, // ML запросы могут занимать больше времени
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для обработки ошибок
const handleApiError = (error: AxiosError): ApiError => {
  if (error.response) {
    return {
      status: error.response.status,
      message: error.response.data?.message || error.message,
      details: error.response.data,
    };
  } else if (error.request) {
    return {
      status: 0,
      message: 'Network error - no response received',
      details: error.request,
    };
  } else {
    return {
      status: 0,
      message: error.message,
      details: error,
    };
  }
};

// Interceptor для backend API
backendApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(handleApiError(error))
);

backendApi.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => Promise.reject(handleApiError(error))
);

// Interceptor для ML API
mlApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(handleApiError(error))
);

mlApi.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => Promise.reject(handleApiError(error))
);

export { backendApi, mlApi };
export default backendApi;
