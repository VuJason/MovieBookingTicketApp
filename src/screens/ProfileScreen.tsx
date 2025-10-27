import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions,
  Switch,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { UserProfile, ProfileSection } from '../types/User';
import { apiService } from '../api/apicall';

const { width } = Dimensions.get('window');

interface ProfileScreenProps {
  navigation: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { isLoggedIn, logout } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);

  // Mock user data - trong thực tế sẽ fetch từ API
  const mockUserProfile: UserProfile = {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    phone: '+1 234 567 8900',
    dateOfBirth: '1990-05-15',
    memberSince: '2022-01-15',
    totalBookings: 47,
    favoriteGenres: ['Action', 'Thriller', 'Sci-Fi'],
    loyaltyPoints: 2450,
    membershipTier: 'Gold',
  };

  useEffect(() => {
    if (!isLoggedIn) {
      navigation.navigate('Login');
      return;
    }

    // Fetch account details from API
    const fetchAccountDetails = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching account details...');
        
        const response = await apiService.getAccountDetails();
        console.log('Account details response:', response);
        
        if (response && response.data) {
          const accountData = response.data;
          
          // Transform API data to UserProfile format
          const profile: UserProfile = {
            id: accountData.accountId?.toString() || '1',
            name: accountData.accountName || 'User',
            email: accountData.email || '',
            avatar: 'https://via.placeholder.com/120x120/333/fff?text=' + (accountData.accountName?.[0] || 'U'),
            phone: accountData.phone || '',
            dateOfBirth: accountData.dateOfBirth || '',
            memberSince: accountData.createdAt || new Date().toISOString(),
            totalBookings: 0, // Will be updated from booking history
            favoriteGenres: [],
            loyaltyPoints: 0,
            membershipTier: undefined,
          };
          
          setUserProfile(profile);
        } else {
          // Fallback to mock data if API fails
          setUserProfile(mockUserProfile);
        }
      } catch (error) {
        console.error('Error fetching account details:', error);
        // Fallback to mock data on error
        setUserProfile(mockUserProfile);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccountDetails();
  }, [isLoggedIn, navigation]);

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.navigate('Login');
          },
        },
      ]
    );
  };

  const profileSections: ProfileSection[] = [
    {
      id: 'account',
      items: [
        {
          id: 'edit-profile',
          title: 'Edit Profile',
          subtitle: 'Change Password',
          icon: 'person-outline',
          onPress: () => navigation.navigate('EditProfile'),
          showChevron: true,
        },
        {
          id: 'booking-history',
          title: 'Booking History',
          subtitle: `${userProfile?.totalBookings || 0} bookings`,
          icon: 'ticket-outline',
          onPress: () => navigation.navigate('Tickets'),
          showChevron: true,
        },
        {
          id: 'favorites',
          title: 'My Favorites',
          subtitle: 'Saved movies',
          icon: 'heart-outline',
          onPress: () => navigation.navigate('Favorites'),
          showChevron: true,
        },
      ],
    },
    {
      id: 'settings',
      items: [
        {
          id: 'notifications',
          title: 'Notifications',
          subtitle: 'Push notifications',
          icon: 'notifications-outline',
          onPress: () => {},
          showChevron: false,
        },
        {
          id: 'dark-mode',
          title: 'Dark Mode',
          subtitle: 'Theme preference',
          icon: 'moon-outline',
          onPress: () => {},
          showChevron: false,
        },
      ],
    },
  ];

  const renderProfileHeader = () => (
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={['#FF6B35', '#FF4500', '#FF2500']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>My Profile</Text>
          
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Icon name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  const renderUserInfo = () => (
    <View style={styles.userInfoContainer}>
      <View style={styles.avatarContainer}>
        <Image
          source={{ 
            uri: userProfile?.avatar || 'https://via.placeholder.com/120x120/333/fff?text=User'
          }}
          style={styles.avatar}
        />
        <TouchableOpacity style={styles.editAvatarButton}>
          <Icon name="camera" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.userName}>{userProfile?.name || 'User Name'}</Text>
      <Text style={styles.userEmail}>{userProfile?.email || 'user@example.com'}</Text>
    </View>
  );

  const renderMenuItem = (item: any, isLast: boolean) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.menuItem, isLast && styles.lastMenuItem]}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIconContainer}>
          <Icon name={item.icon} size={24} color="#fff" />
        </View>
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuTitle}>{item.title}</Text>
          {item.subtitle && (
            <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.menuItemRight}>
        {item.badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}
        
        {item.id === 'notifications' && (
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#333', true: '#FF4500' }}
            thumbColor={notificationsEnabled ? '#fff' : '#666'}
          />
        )}
        
        {item.id === 'dark-mode' && (
          <Switch
            value={darkModeEnabled}
            onValueChange={setDarkModeEnabled}
            trackColor={{ false: '#333', true: '#FF4500' }}
            thumbColor={darkModeEnabled ? '#fff' : '#666'}
          />
        )}
        
        {item.showChevron && (
          <Icon name="chevron-forward" size={20} color="#666" />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSection = (section: ProfileSection) => (
    <View key={section.id} style={styles.section}>
      {section.title && (
        <Text style={styles.sectionTitle}>{section.title}</Text>
      )}
      <View style={styles.sectionContent}>
        {section.items.map((item, index) => 
          renderMenuItem(item, index === section.items.length - 1)
        )}
      </View>
    </View>
  );

  const renderLogoutButton = () => (
    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
      <Icon name="log-out-outline" size={24} color="#FF4500" />
      <Text style={styles.logoutText}>Logout</Text>
    </TouchableOpacity>
  );

  if (!isLoggedIn) {
    return null;
  }

  if (isLoading || !userProfile) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.loadingContent}>
          <Icon name="person-circle" size={64} color="#FF4500" />
          <Text style={styles.loadingText}>Loading Profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF4500" />
      
      {renderProfileHeader()}
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderUserInfo()}
        
        {profileSections.map(renderSection)}
        
        {renderLogoutButton()}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Version 1.0.0</Text>
          <Text style={styles.footerText}>© 2024 Movie Booking App</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  headerContainer: {
    height: 100,
  },
  headerGradient: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 44,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  userInfoContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FF4500',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF4500',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000',
  },
  membershipBadge: {
    position: 'absolute',
    top: -5,
    left: -5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000',
  },
  goldBadge: {
    backgroundColor: '#FFD700',
  },
  silverBadge: {
    backgroundColor: '#C0C0C0',
  },
  bronzeBadge: {
    backgroundColor: '#CD7F32',
  },
  platinumBadge: {
    backgroundColor: '#E5E4E2',
  },
  membershipText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    color: '#888',
    fontSize: 16,
    marginBottom: 12,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  pointsText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,69,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuSubtitle: {
    color: '#888',
    fontSize: 12,
    lineHeight: 16,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#FF4500',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF4500',
    backgroundColor: 'rgba(255,69,0,0.1)',
    marginBottom: 24,
  },
  logoutText: {
    color: '#FF4500',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    color: '#666',
    fontSize: 12,
    marginBottom: 4,
  },
});

export default ProfileScreen;