import { useState, useEffect } from 'react';
import { apiService } from '../api/apicall';

export const useToken = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    try {
      const storedToken = await apiService.getStoredToken();
      setToken(storedToken);
    } catch (error) {
      console.error('Error loading token:', error);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToken = async (newToken: string) => {
    try {
      await apiService.storeToken(newToken);
      setToken(newToken);
    } catch (error) {
      console.error('Error saving token:', error);
      throw error;
    }
  };

  const removeToken = async () => {
    try {
      await apiService.removeToken();
      setToken(null);
    } catch (error) {
      console.error('Error removing token:', error);
      throw error;
    }
  };

  const isAuthenticated = !!token;

  return {
    token,
    isLoading,
    isAuthenticated,
    saveToken,
    removeToken,
    loadToken,
  };
};