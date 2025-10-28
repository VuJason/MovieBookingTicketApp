import React, { useEffect } from 'react';
import { View, StatusBar, useColorScheme, Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { NativeRouter, Routes, Route, useLocation, useNavigate } from 'react-router-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import MovieDetailScreen from './src/screens/MovieDetailScreen';
import SeatBookingScreen from './src/screens/SeatBookingScreen';
import ComboSelectionScreen from './src/screens/ComboSelectionScreen';
import PaymentMethodScreen from './src/screens/PaymentMethodScreen';
import ZaloPayWebViewScreen from './src/screens/ZaloPayWebViewScreen';
import PaymentCallbackScreen from './src/screens/PaymentCallbackScreen';
import TestZaloPayScreen from './src/screens/TestZaloPayScreen';
import BookingStatusScreen from './src/screens/BookingStatusScreen';

// 👇 Component tách riêng để dùng useLocation()
function MainRouter() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMovieDetail = location.pathname.startsWith('/movie/');
  const isSeatBooking = location.pathname.startsWith('/seat-booking');
  const isComboSelection = location.pathname.startsWith('/combo-selection');
  const isPaymentMethod = location.pathname.startsWith('/payment-method');
  const isZaloPayWebView = location.pathname.startsWith('/zalopay-webview');
  const isDarkMode = useColorScheme() === 'dark';

  // Handle deep links for payment callback
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url;
      console.log('Deep link received:', url);

      // Parse URL: moviebooking://payment/callback?status=success&bookingId=123
      if (url.includes('moviebooking://payment')) {
        try {
          // Extract query params manually
          const queryString = url.split('?')[1] || '';
          const params: Record<string, string> = {};
          
          queryString.split('&').forEach(param => {
            const [key, value] = param.split('=');
            if (key && value) {
              params[key] = decodeURIComponent(value);
            }
          });
          
          const status = params.status || 'unknown';
          const bookingId = params.bookingId || '';
          
          console.log('Payment callback:', { status, bookingId });
          
          // Navigate to callback screen with params
          navigate(`/payment/callback?status=${status}&bookingId=${bookingId}`);
        } catch (error) {
          console.error('Error parsing deep link:', error);
        }
      }
    };

    // Listen for deep links when app is already open
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('App opened with URL:', url);
        handleDeepLink({ url });
      }
    }).catch(err => {
      console.error('Error getting initial URL:', err);
    });

    return () => {
      subscription.remove();
    };
  }, [navigate]);

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <AppContent 
          isMovieDetail={isMovieDetail} 
          isSeatBooking={isSeatBooking} 
          isComboSelection={isComboSelection}
          isPaymentMethod={isPaymentMethod}
          isZaloPayWebView={isZaloPayWebView}
        />
      </SafeAreaProvider>
    </AuthProvider>
  );
}

function AppContent({ isMovieDetail, isSeatBooking, isComboSelection, isPaymentMethod, isZaloPayWebView }: { 
  isMovieDetail: boolean; 
  isSeatBooking: boolean; 
  isComboSelection: boolean;
  isPaymentMethod: boolean;
  isZaloPayWebView: boolean;
}) {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* React Navigation Tabs — chỉ hiện khi KHÔNG ở các trang đặc biệt */}
      {!isMovieDetail && !isSeatBooking && !isComboSelection && !isPaymentMethod && !isZaloPayWebView && (
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      )}

      {/* React Router quản lý các trang đặc biệt */}
      <Routes>
        <Route path="/movie/:id" element={<MovieDetailScreen />} />
        <Route path="/seat-booking" element={<SeatBookingScreen />} />
        <Route path="/combo-selection" element={<ComboSelectionScreen />} />
        <Route path="/payment-method" element={<PaymentMethodScreen />} />
        <Route path="/zalopay-webview" element={<ZaloPayWebViewScreen />} />
        <Route path="/payment/callback" element={<PaymentCallbackScreen />} />
        <Route path="/test-zalopay" element={<TestZaloPayScreen />} />
        <Route path="/booking-status" element={<BookingStatusScreen />} />
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
