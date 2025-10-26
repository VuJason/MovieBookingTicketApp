import React from 'react';
import { View, StatusBar, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { NativeRouter, Routes, Route, useLocation } from 'react-router-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import MovieDetailScreen from './src/screens/MovieDetailScreen';

// 👇 Component tách riêng để dùng useLocation()
function MainRouter() {
  const location = useLocation();
  const isMovieDetail = location.pathname.startsWith('/movie/'); // kiểm tra có đang ở trang movie detail
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <AppContent isMovieDetail={isMovieDetail} />
      </SafeAreaProvider>
    </AuthProvider>
  );
}

function AppContent({ isMovieDetail }: { isMovieDetail: boolean }) {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* React Navigation Tabs — chỉ hiện khi KHÔNG ở trang chi tiết */}
      {!isMovieDetail && (
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      )}

      {/* React Router quản lý chi tiết phim */}
      <Routes>
        <Route path="/movie/:id" element={<MovieDetailScreen />} />
      </Routes>
    </View>
  );
}

export default function App() {
  return (
    <NativeRouter>
      <StatusBar barStyle="light-content" />
      <MainRouter />
    </NativeRouter>
  );
}
