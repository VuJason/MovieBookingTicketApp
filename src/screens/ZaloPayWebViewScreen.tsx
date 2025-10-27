import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/Ionicons';
import { useLocation, useNavigate } from 'react-router-native';

const ZaloPayWebViewScreen = ({ navigation, route }: any) => {
  const location = useLocation();
  const navigate = useNavigate();
  const routerState = location.state as any;
  const webViewRef = useRef<WebView>(null);

  // Get payment URL from either React Navigation or React Router
  const paymentUrl = route?.params?.paymentUrl || routerState?.paymentUrl;
  const bookingData = route?.params?.bookingData || routerState?.bookingData;

  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState(paymentUrl);
  const [loadAttempts, setLoadAttempts] = useState(0);

  // Handle back button
  const handleBackPress = () => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
      return true;
    }
    
    Alert.alert(
      'Hủy thanh toán?',
      'Bạn có chắc muốn hủy thanh toán không?',
      [
        {
          text: 'Tiếp tục thanh toán',
          style: 'cancel',
        },
        {
          text: 'Hủy',
          onPress: () => {
            if (navigation?.goBack) {
              navigation.goBack();
            } else {
              navigate(-1);
            }
          },
          style: 'destructive',
        },
      ]
    );
    return true;
  };

  // Handle should start load with request (for opening external apps)
  const handleShouldStartLoadWithRequest = (request: any) => {
    const url = request.url;
    console.log('=== Should start load with request ===');
    console.log('URL:', url);
    console.log('Main document URL:', request.mainDocumentURL);
    console.log('Is for main frame:', request.isForMainFrame);

    // Allow ZaloPay deep links to open in external app
    if (url.startsWith('zalopay://') || url.includes('zalopay.vn/openinapp')) {
      console.log('Opening ZaloPay app...');
      Linking.openURL(url).catch(err => {
        console.error('Error opening ZaloPay app:', err);
        Alert.alert(
          'Không thể mở ZaloPay',
          'Vui lòng cài đặt ứng dụng ZaloPay để tiếp tục thanh toán.',
          [{ text: 'OK' }]
        );
      });
      return false; // Don't load in WebView
    }

    // Allow normal web URLs
    return true;
  };

  // Handle navigation state changes
  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
    
    // Check if payment is completed
    const url = navState.url;
    console.log('=== Navigation state changed ===');
    console.log('URL:', url);
    console.log('Title:', navState.title);
    console.log('Loading:', navState.loading);
    console.log('Can go back:', navState.canGoBack);
    console.log('Can go forward:', navState.canGoForward);

    // Check for success callback
    if (url.includes('payment/success') || url.includes('status=success') || url.includes('status=1')) {
      console.log('Payment successful!');
      Alert.alert(
        'Thanh toán thành công',
        'Đơn hàng của bạn đã được thanh toán thành công!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to home
              if (navigation?.navigate) {
                navigation.navigate('Home');
              } else {
                navigate('/');
              }
            },
          },
        ]
      );
    }

    // Check for failure callback
    if (url.includes('payment/failed') || url.includes('status=failed') || url.includes('status=-1')) {
      console.log('Payment failed!');
      Alert.alert(
        'Thanh toán thất bại',
        'Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (navigation?.goBack) {
                navigation.goBack();
              } else {
                navigate(-1);
              }
            },
          },
        ]
      );
    }

    // Check for cancel callback
    if (url.includes('payment/cancel') || url.includes('status=cancel') || url.includes('status=0')) {
      console.log('Payment cancelled!');
      if (navigation?.goBack) {
        navigation.goBack();
      } else {
        navigate(-1);
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán ZaloPay</Text>
        <TouchableOpacity 
          style={styles.debugButton} 
          onPress={() => {
            Alert.alert(
              'Debug Info',
              `Current URL: ${currentUrl}\n\nLoad Attempts: ${loadAttempts}\n\nLoading: ${loading}`,
              [
                {
                  text: 'Reload',
                  onPress: () => {
                    setLoadAttempts(0);
                    webViewRef.current?.reload();
                  }
                },
                {
                  text: 'Open in Browser',
                  onPress: () => {
                    Linking.openURL(currentUrl);
                  }
                },
                { text: 'Close' }
              ]
            );
          }}>
          <Text style={styles.debugButtonText}>ℹ️</Text>
        </TouchableOpacity>
      </View>

      {/* WebView */}
      {paymentUrl ? (
        <>
          <WebView
            ref={webViewRef}
            source={{ uri: paymentUrl }}
            style={styles.webview}
            onLoadStart={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.log('WebView load started:', nativeEvent.url);
              setCurrentUrl(nativeEvent.url);
              setLoading(true);
              setError(null);
              setLoadAttempts(prev => prev + 1);
            }}
            onLoadEnd={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.log('WebView load ended:', nativeEvent.url);
              setLoading(false);
              
              // If we've been loading for too long, show error
              if (loadAttempts > 10) {
                setError('Trang web tải quá lâu. Vui lòng thử lại.');
              }
            }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView error:', nativeEvent);
              setError('Không thể tải trang thanh toán');
              setLoading(false);
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView HTTP error:', nativeEvent);
              setError(`Lỗi HTTP: ${nativeEvent.statusCode}`);
              setLoading(false);
            }}
            onNavigationStateChange={handleNavigationStateChange}
            onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
            javaScriptEnabled={true}
            javaScriptCanOpenWindowsAutomatically={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            mixedContentMode="always"
            setSupportMultipleWindows={false}
            cacheEnabled={false}
            incognito={true}
            userAgent="Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36"
          />
          
          {/* Error Display */}
          {error && (
            <View style={styles.errorOverlay}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setError(null);
                  setLoading(true);
                  webViewRef.current?.reload();
                }}>
                <Text style={styles.retryButtonText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không tìm thấy URL thanh toán</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => {
              if (navigation?.goBack) {
                navigation.goBack();
              } else {
                navigate(-1);
              }
            }}>
            <Text style={styles.errorButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0088FF" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  debugButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugButtonText: {
    fontSize: 18,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF4500',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: '#FF4500',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  retryButton: {
    backgroundColor: '#FF4500',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ZaloPayWebViewScreen;
