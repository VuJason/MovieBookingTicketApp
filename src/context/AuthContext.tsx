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
        
        return true;
      } else {
        console.log('Login failed - Invalid response:', { code: response.code, message: response.message });
        // Throw error để LoginScreen xử lý
        throw new Error('INVALID_CREDENTIALS');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Re-throw error để LoginScreen xử lý
      if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
        throw error;
      }
      
      // Throw network error
      throw new Error('NETWORK_ERROR');
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