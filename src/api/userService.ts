import { apiService } from './apicall';
import { UserProfile } from '../types/User';

export class UserService {
  // Get user profile
  async getUserProfile(): Promise<UserProfile> {
    try {
      const response = await apiService.get<UserProfile>('/user/profile');
      
      if (response.code === 200 && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  // Update user profile
  async updateUserProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await apiService.put<UserProfile>('/user/profile', profileData);
      
      if (response.code === 200 && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update user profile');
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Upload avatar
  async uploadAvatar(imageUri: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as any);

      const response = await apiService.post<{ avatarUrl: string }>('/user/avatar', formData);
      
      if (response.code === 200 && response.data) {
        return response.data.avatarUrl;
      } else {
        throw new Error(response.message || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  }

  // Get user booking history
  async getBookingHistory(): Promise<any[]> {
    try {
      const response = await apiService.get<any[]>('/user/bookings');
      
      if (response.code === 200 && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch booking history');
      }
    } catch (error) {
      console.error('Error fetching booking history:', error);
      throw error;
    }
  }

  // Get user favorite movies
  async getFavoriteMovies(): Promise<any[]> {
    try {
      const response = await apiService.get<any[]>('/user/favorites');
      
      if (response.code === 200 && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch favorite movies');
      }
    } catch (error) {
      console.error('Error fetching favorite movies:', error);
      throw error;
    }
  }

  // Add movie to favorites
  async addToFavorites(movieId: number): Promise<void> {
    try {
      const response = await apiService.post<void>('/user/favorites', { movieId });
      
      if (response.code !== 200) {
        throw new Error(response.message || 'Failed to add to favorites');
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  }

  // Remove movie from favorites
  async removeFromFavorites(movieId: number): Promise<void> {
    try {
      const response = await apiService.delete<void>(`/user/favorites/${movieId}`);
      
      if (response.code !== 200) {
        throw new Error(response.message || 'Failed to remove from favorites');
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  }

  // Update user preferences
  async updatePreferences(preferences: {
    notifications?: boolean;
    darkMode?: boolean;
    language?: string;
  }): Promise<void> {
    try {
      const response = await apiService.put<void>('/user/preferences', preferences);
      
      if (response.code !== 200) {
        throw new Error(response.message || 'Failed to update preferences');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }
}

export const userService = new UserService();