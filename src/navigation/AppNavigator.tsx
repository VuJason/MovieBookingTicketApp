import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';

// import các màn hình
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import TicketScreen from '../screens/TicketScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AuthNavigator from './AuthNavigator';

// Khai báo type cho Navigator
export type AppTabParamList = {
  Home: undefined;
  Search: undefined;
  Tickets: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

// 👇 Hàm render icon đặt ra ngoài component để tránh lỗi react/no-unstable-nested-components
function renderTabIcon(routeName: string, focused: boolean, color: string, size: number) {
  let iconName = '';

  switch (routeName) {
    case 'Home':
      iconName = focused ? 'home' : 'home-outline';
      break;
    case 'Search':
      iconName = focused ? 'search' : 'search-outline';
      break;
    case 'Tickets':
      iconName = focused ? 'ticket' : 'ticket-outline';
      break;
    case 'Profile':
      iconName = focused ? 'person' : 'person-outline';
      break;
    default:
      iconName = 'ellipse';
  }

  return <Icon name={iconName} size={size} color={color} />;
}

// Main Tab navigator (Profile tab shows Login when not logged in)
export default function AppNavigator() {
  const { isLoggedIn } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: '#111',
          borderTopColor: '#222',
          height: 70,
          paddingBottom: 8,
        },
        tabBarIcon: ({ focused, color, size }: any) =>
          renderTabIcon(route.name, focused, color ?? (focused ? '#FF4500' : '#888'), size ?? 26),
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 0,
        },
        tabBarActiveTintColor: '#FF4500',
        tabBarInactiveTintColor: '#888',
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Trang chủ' }}
      />

      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ tabBarLabel: 'Tìm kiếm' }}
      />

      <Tab.Screen
        name="Tickets"
        component={TicketScreen}
        options={{ tabBarLabel: 'Vé' }}
      />

      <Tab.Screen
        name="Profile"
        component={isLoggedIn ? ProfileScreen : AuthNavigator}
        options={{ tabBarLabel: isLoggedIn ? 'Cá nhân' : 'Đăng nhập' }}
      />
    </Tab.Navigator>
  );
}