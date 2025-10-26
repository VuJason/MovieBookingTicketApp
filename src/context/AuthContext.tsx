import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Alert } from 'react-native';
import { apiService, LoginRequest, ApiResponse } from '../api/apicall';

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const authenticated = await apiService.isAuthenticated();
      setIsLoggedIn(authenticated);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginRequest): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      console.log('Attempting login with credentials:', { email: credentials.email, password: '***' });
      
      const response: ApiResponse<string> = await apiService.login(credentials);
      
      console.log('Login response received:', {
        code: response.code,
        message: response.message,
        hasData: !!response.data,
        dataLength: response.data ? response.data.length : 0
      });
      
      if (response.code === 200 && response.data) {
        console.log('Login successful, storing token...');
        // Lưu token vào encrypted storage
        await apiService.storeToken(response.data);
        setIsLoggedIn(true);
        
        Alert.alert(
          'Đăng nhập thành công',
          'Chào mừng bạn đến với ứng dụng!',
          [{ text: 'OK' }]
        );
        
        return true;
      } else {
        console.log('Login failed - Invalid response:', { code: response.code, message: response.message });
        // Xử lý lỗi từ server
        const errorMessage = response.message || `Đăng nhập thất bại (Code: ${response.code})`;
        Alert.alert(
          'Lỗi đăng nhập',
          errorMessage,
          [{ text: 'Thử lại' }]
        );
        
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
      
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('Timeout')) {
          errorMessage = 'Kết nối quá thời gian. Vui lòng thử lại.';
        } else if (error.message.includes('Network request failed')) {
          errorMessage = 'Lỗi mạng. Kiểm tra kết nối internet và thử lại.';
        } else if (error.message.includes('HTTP')) {
          errorMessage = 'Server không phản hồi. Vui lòng thử lại sau.';
        }
      }
      
      Alert.alert(
        'Lỗi kết nối',
        errorMessage,
        [
          { text: 'Thử lại', onPress: () => {} },
          { text: 'Hủy', style: 'cancel' }
        ]
      );
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await apiService.removeToken();
      setIsLoggedIn(false);
      
      Alert.alert(
        'Đăng xuất thành công',
        'Bạn đã đăng xuất khỏi ứng dụng.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isLoggedIn, 
        isLoading, 
        login, 
        logout, 
        checkAuthStatus 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}