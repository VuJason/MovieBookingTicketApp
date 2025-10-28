import apiClient, { API_ENDPOINTS, HTTP_STATUS, ERROR_MESSAGES } from './config';
import EncryptedStorage from 'react-native-encrypted-storage';

// Interface definitions
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  password: string;
  email: string;
  phone: string;
  sex: string;
  dateOfBirth: string;
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
  async register(userData: RegisterRequest): Promise<ApiResponse<any>> {
    try {
      console.log('API: Registering user:', userData);
      const response = await apiClient.post('/account', userData);
      console.log('API: Register response:', response);

      // Handle different response structures
      if (response.data) {
        if (response.data.code !== undefined) {
          return response.data;
        }
        return {
          code: response.status || 200,
          message: 'Success',
          data: response.data
        };
      }

      return {
        code: response.status || 200,
        message: 'Success',
        data: null
      };
    } catch (error: any) {
      console.error('Register API error:', error);
      console.error('Error response:', error.response?.data);
      throw this.handleApiError(error);
    }
  }

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

  async getAccountDetails(): Promise<ApiResponse<any>> {
    try {
      console.log('API: Fetching account details');
      const response = await apiClient.get('/account/details');
      console.log('API: Account details response:', response);

      // Handle different response structures
      if (response.data) {
        // If response.data has code/message/data structure
        if (response.data.code !== undefined) {
          return response.data;
        }
        // If response.data is the actual account data
        return {
          code: response.status || 200,
          message: 'Success',
          data: response.data
        };
      }

      return {
        code: response.status || 200,
        message: 'Success',
        data: null
      };
    } catch (error: any) {
      console.error('Get account details API error:', error);
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

  // Showtime methods
  async getShowtimesByMovieId(movieId: number): Promise<ApiResponse<any[]>> {
    try {
      console.log('API: Calling /showtime/movie/' + movieId);
      const response = await apiClient.get(`/showtime/movie/${movieId}`);
      console.log('API: Raw response:', response);
      console.log('API: Response data:', response.data);

      // Check if response has the expected structure
      if (response.data && typeof response.data === 'object') {
        // If response.data is already the showtimes array (not wrapped in ApiResponse)
        if (Array.isArray(response.data)) {
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
      console.log('API: Unexpected response structure, wrapping data');
      return {
        code: 200,
        message: 'Success',
        data: response.data || []
      };

    } catch (error: any) {
      console.error('Get showtimes API error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      throw this.handleApiError(error);
    }
  }

  // Seat methods
  async getSeatsByShowtimeId(showtimeId: number): Promise<ApiResponse<any[]>> {
    try {
      console.log('API: Calling /seats/showtime/' + showtimeId);
      const response = await apiClient.get(`/seats/showtime/${showtimeId}`);
      console.log('API: Seats response:', response.data);

      // Check if response has the expected structure
      if (response.data && typeof response.data === 'object') {
        // If response.data is already the seats array (not wrapped in ApiResponse)
        if (Array.isArray(response.data)) {
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
        data: response.data || []
      };

    } catch (error: any) {
      console.error('Get seats API error:', error);
      throw this.handleApiError(error);
    }
  }

  // Booking methods
  async holdSeats(showtimeId: number, seatIds: number[]): Promise<ApiResponse<any>> {
    try {
      console.log('API: Holding seats:', { showtimeId, seatIds });
      const response = await apiClient.post('/bookings/hold', {
        showtimeId,
        seatIds
      });
      console.log('API: Hold seats response:', response);

      // Handle different response structures
      if (response.data) {
        // If response.data has code/message/data structure
        if (response.data.code !== undefined) {
          return response.data;
        }
        // If response.data is the actual data
        return {
          code: response.status || 200,
          message: 'Success',
          data: response.data
        };
      }

      return {
        code: response.status || 200,
        message: 'Success',
        data: null
      };
    } catch (error: any) {
      console.error('Hold seats API error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw this.handleApiError(error);
    }
  }

  async createBooking(bookingData: {
    showtimeId: number;
    seatIds: number[];
    totalPrice: number;
    combos?: Array<{ comboId: number; quantity: number }>;
  }): Promise<ApiResponse<any>> {
    try {
      console.log('API: Creating booking:', bookingData);
      const response = await apiClient.post('/bookings', bookingData);
      console.log('API: Create booking response:', response);

      // Handle different response structures
      if (response.data) {
        // If response.data has code/message/data structure
        if (response.data.code !== undefined) {
          return response.data;
        }
        // If response.data is the actual booking data
        return {
          code: response.status || 200,
          message: 'Success',
          data: response.data
        };
      }

      return {
        code: response.status || 200,
        message: 'Success',
        data: null
      };
    } catch (error: any) {
      console.error('Create booking API error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw this.handleApiError(error);
    }
  }

  async getBookingById(bookingId: number): Promise<ApiResponse<any>> {
    try {
      console.log('API: Getting booking by ID:', bookingId);
      const response = await apiClient.get(`/bookings/${bookingId}`);
      console.log('API: Get booking response:', response);

      if (response.data) {
        if (response.data.code !== undefined) {
          return response.data;
        }
        return {
          code: response.status || 200,
          message: 'Success',
          data: response.data
        };
      }

      return {
        code: response.status || 200,
        message: 'Success',
        data: null
      };
    } catch (error: any) {
      console.error('Get booking API error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw this.handleApiError(error);
    }
  }

  async createZaloPayment(bookingId: number): Promise<ApiResponse<any>> {
    try {
      console.log('API: Creating ZaloPay payment for booking:', bookingId);
      const response = await apiClient.post(`/bookings/${bookingId}/zalopay-payment`);
      console.log('API: ZaloPay payment response:', response);
      console.log('API: ZaloPay response data:', response.data);

      // Handle different response structures
      if (response.data) {
        // If response.data has code/message/data structure
        if (response.data.code !== undefined) {
          return response.data;
        }
        // If response.data is the actual payment data (ZaloPay response)
        return {
          code: response.status || 200,
          message: 'Success',
          data: response.data
        };
      }

      return {
        code: response.status || 200,
        message: 'Success',
        data: null
      };
    } catch (error: any) {
      console.error('Create ZaloPay payment API error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw this.handleApiError(error);
    }
  }

  // Combo methods
  async getCombos(): Promise<ApiResponse<any[]>> {
    try {
      console.log('API: Fetching combos');
      const response = await apiClient.get('/combos');
      console.log('API: Combos response:', response.data);

      // Check if response has the expected structure
      if (response.data && typeof response.data === 'object') {
        // If response.data is already the combos array (not wrapped in ApiResponse)
        if (Array.isArray(response.data)) {
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
        data: response.data || []
      };

    } catch (error: any) {
      console.error('Get combos API error:', error);
      throw this.handleApiError(error);
    }
  }

  // Check booking status
  async getBookingStatus(bookingId: number): Promise<ApiResponse<any>> {
    try {
      console.log('API: Checking booking status:', bookingId);
      const response = await apiClient.get(`/bookings/${bookingId}`);
      console.log('API: Booking status response:', response.data);

      // Handle different response structures
      if (response.data) {
        if (response.data.code !== undefined) {
          return response.data;
        }
        return {
          code: response.status || 200,
          message: 'Success',
          data: response.data
        };
      }

      return {
        code: response.status || 200,
        message: 'Success',
        data: null
      };
    } catch (error: any) {
      console.error('Get booking status API error:', error);
      throw this.handleApiError(error);
    }
  }

  // Get user bookings/tickets
  async getUserBookings(): Promise<ApiResponse<any[]>> {
    try {
      console.log('API: Fetching user bookings');
      const response = await apiClient.get('/bookings/my-bookings');
      console.log('API: User bookings response:', response.data);

      // Handle different response structures
      if (response.data && typeof response.data === 'object') {
        // If response.data is already the bookings array
        if (Array.isArray(response.data)) {
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

      return {
        code: 200,
        message: 'Success',
        data: response.data || []
      };
    } catch (error: any) {
      console.error('Get user bookings API error:', error);
      throw this.handleApiError(error);
    }
  }

  // Get showtime details (includes movie info)
  async getShowtimeDetails(showtimeId: number): Promise<ApiResponse<any>> {
    try {
      console.log('API: Fetching showtime details:', showtimeId);
      const response = await apiClient.get(`/showtime/${showtimeId}`);
      console.log('API: Showtime details response:', response.data);

      if (response.data) {
        if (response.data.code !== undefined) {
          return response.data;
        }
        return {
          code: response.status || 200,
          message: 'Success',
          data: response.data
        };
      }

      return {
        code: response.status || 200,
        message: 'Success',
        data: null
      };
    } catch (error: any) {
      console.error('Get showtime details API error:', error);
      throw this.handleApiError(error);
    }
  }


  // Error handling
  // Payment callback methods

  /**
   * Manual confirm payment - Backup method when webhook doesn't work
   * Called by frontend after user completes payment
   */
  async confirmBookingPayment(bookingId: number): Promise<ApiResponse<any>> {
    try {
      console.log('=== API: Manual Confirm Payment ===');
      console.log('Booking ID:', bookingId);
      console.log('Endpoint:', `/bookings/${bookingId}/confirm`);

      const response = await apiClient.put(`/bookings/${bookingId}/confirm`);

      console.log('=== API: Confirm Response ===');
      console.log('Status:', response.status);
      console.log('Data:', JSON.stringify(response.data, null, 2));

      if (response.data) {
        if (response.data.code !== undefined) {
          return response.data;
        }
        return {
          code: response.status || 200,
          message: 'Payment confirmed successfully',
          data: response.data
        };
      }

      return {
        code: response.status || 200,
        message: 'Success',
        data: null
      };
    } catch (error: any) {
      console.error('=== API: Confirm Payment Error ===');
      console.error('Error:', error.message);
      console.error('Response:', error.response?.data);
      throw this.handleApiError(error);
    }
  }

  /**
   * Check payment status from ZaloPay
   * Used to verify if payment was successful
   */
  async checkZaloPayStatus(bookingId: number): Promise<ApiResponse<any>> {
    try {
      console.log('=== API: Check ZaloPay Status ===');
      console.log('Booking ID:', bookingId);

      const response = await apiClient.get(`/bookings/${bookingId}/payment-status`);

      console.log('=== API: Payment Status Response ===');
      console.log('Data:', JSON.stringify(response.data, null, 2));

      if (response.data) {
        if (response.data.code !== undefined) {
          return response.data;
        }
        return {
          code: response.status || 200,
          message: 'Success',
          data: response.data
        };
      }

      return {
        code: response.status || 200,
        message: 'Success',
        data: null
      };
    } catch (error: any) {
      console.error('=== API: Check Payment Status Error ===');
      console.error('Error:', error.message);
      throw this.handleApiError(error);
    }
  }

  /**
   * Query ZaloPay order status directly
   * Alternative method to check payment status
   */
  async queryZaloPayOrder(appTransId: string): Promise<ApiResponse<any>> {
    try {
      console.log('=== API: Query ZaloPay Order ===');
      console.log('App Trans ID:', appTransId);

      const response = await apiClient.post('/payment/zalopay/query', {
        appTransId: appTransId
      });

      console.log('=== API: Query Response ===');
      console.log('Data:', JSON.stringify(response.data, null, 2));

      if (response.data) {
        if (response.data.code !== undefined) {
          return response.data;
        }
        return {
          code: response.status || 200,
          message: 'Success',
          data: response.data
        };
      }

      return {
        code: response.status || 200,
        message: 'Success',
        data: null
      };
    } catch (error: any) {
      console.error('=== API: Query Order Error ===');
      console.error('Error:', error.message);
      throw this.handleApiError(error);
    }
  }

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
