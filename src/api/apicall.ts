import apiClient, { API_ENDPOINTS, HTTP_STATUS, ERROR_MESSAGES } from './config';
import EncryptedStorage from 'react-native-encrypted-storage';

// Interface definitions
export interface LoginRequest {
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

// API Service class
class ApiService {
  // Authentication methods
  async login(credentials: LoginRequest): Promise<ApiResponse<string>> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.LOGIN, credentials);
      return response.data;
    } catch (error: any) {
      console.error('Login API error:', error);
      throw this.handleApiError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.LOGOUT);
      await this.removeToken();
    } catch (error: any) {
      console.error('Logout API error:', error);
      // Even if API call fails, remove local token
      await this.removeToken();
    }
  }

  async refreshToken(): Promise<ApiResponse<string>> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.REFRESH_TOKEN);
      return response.data;
    } catch (error: any) {
      console.error('Refresh token API error:', error);
      throw this.handleApiError(error);
    }
  }

  // Token management
  async storeToken(token: string): Promise<void> {
    try {
      await EncryptedStorage.setItem('access_token', token);
    } catch (error) {
      console.error('Error storing token:', error);
      throw new Error('Không thể lưu token');
    }
  }

  async getToken(): Promise<string | null> {
    try {
      return await EncryptedStorage.getItem('access_token');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  async removeToken(): Promise<void> {
    try {
      await EncryptedStorage.removeItem('access_token');
      await EncryptedStorage.removeItem('user_info');
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getToken();
      return !!token;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  // User profile methods
  async getUserProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USER_PROFILE);
      return response.data;
    } catch (error: any) {
      console.error('Get user profile API error:', error);
      throw this.handleApiError(error);
    }
  }

  // Movie methods
  async getMovieDetail(movieId: number): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get(`/movies/${movieId}`);
      
      // Check if response has the expected structure
      if (response.data && typeof response.data === 'object') {
        // If response.data is already the movie object (not wrapped in ApiResponse)
        if (response.data.id) {
          return {
            code: 200,
            message: 'Success',
            data: response.data
          };
        }
        // If response.data has code/message/data structure
        else if (response.data.code) {
          return response.data;
        }
      }
      
      // If we get here, the response structure is unexpected
      return {
        code: 200,
        message: 'Success',
        data: response.data
      };
      
    } catch (error: any) {
      console.error('Get movie detail API error:', error);
      throw this.handleApiError(error);
    }
  }

  async getMovies(): Promise<ApiResponse<any[]>> {
    try {
      const response = await apiClient.get('/movies');
      return response.data;
    } catch (error: any) {
      console.error('Get movies API error:', error);
      throw this.handleApiError(error);
    }
  }


  // Error handling
  private handleApiError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.message || error.message;
      
      switch (status) {
        case HTTP_STATUS.UNAUTHORIZED:
          return new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        case HTTP_STATUS.FORBIDDEN:
          return new Error('Bạn không có quyền truy cập.');
        case HTTP_STATUS.NOT_FOUND:
          return new Error('Không tìm thấy tài nguyên.');
        case HTTP_STATUS.INTERNAL_SERVER_ERROR:
          return new Error(ERROR_MESSAGES.SERVER_ERROR);
        default:
          return new Error(message || ERROR_MESSAGES.UNKNOWN_ERROR);
      }
    } else if (error.request) {
      // Network error
      if (error.code === 'ECONNABORTED') {
        return new Error(ERROR_MESSAGES.TIMEOUT_ERROR);
      }
      return new Error(ERROR_MESSAGES.NETWORK_ERROR);
    } else {
      // Other error
      return new Error(error.message || ERROR_MESSAGES.UNKNOWN_ERROR);
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
