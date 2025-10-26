import React from 'react';
import { View, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { NativeRouter, Routes, Route, useLocation } from 'react-router-native';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
import MovieDetailScreen from './src/screens/MovieDetailScreen';

// 👇 Component tách riêng để dùng useLocation()
function MainRouter() {
  const location = useLocation();
  const isMovieDetail = location.pathname.startsWith('/movie/'); // kiểm tra có đang ở trang movie detail

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <AppContent />
      </SafeAreaProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: safeAreaInsets.top }]}>
      {/* Bọc toàn bộ app bằng NavigationContainer */}
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
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
