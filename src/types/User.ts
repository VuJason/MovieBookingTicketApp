export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  dateOfBirth?: string;
  memberSince?: string;
  totalBookings?: number;
  favoriteGenres?: string[];
  loyaltyPoints?: number;
  membershipTier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
}

export interface ProfileMenuItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  onPress: () => void;
  showChevron?: boolean;
  badge?: string | number;
}

export interface ProfileSection {
  id: string;
  title?: string;
  items: ProfileMenuItem[];
}