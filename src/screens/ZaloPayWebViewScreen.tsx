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

  // Auto-hide loading after 3 seconds as fallback
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.log('Auto-hiding loading after 3 seconds');
        setLoading(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [loading]);

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

    // Handle payment callback deep link
    if (url.startsWith('moviebooking://payment/callback')) {
      console.log('Payment callback detected in WebView!');
      console.log('Callback URL:', url);

      // Parse URL to extract params
      try {
        const urlParts = url.split('?');
        if (urlParts.length > 1) {
          const queryString = urlParts[1];
          const params: Record<string, string> = {};

          // Parse query string manually
          queryString.split('&').forEach((param: string) => {
            const [key, value] = param.split('=');
            if (key && value) {
              params[key] = decodeURIComponent(value);
            }
          });

          const status = params.status;
          const bookingId = params.bookingId;

          console.log('Parsed params:', { status, bookingId });

          // Close WebView and navigate to callback screen
          if (navigation?.navigate) {
            navigation.navigate('PaymentCallback', { url: url });
          } else {
            navigate(`/payment/callback?status=${status}&bookingId=${bookingId}`);
          }
        }
      } catch (error) {
        console.error('Error parsing callback URL:', error);
      }

      return false; // Don't load in WebView
    }

    // Block ZaloPay app deep links - keep payment in WebView
    if (url.startsWith('zalopay://')) {
      console.log('Blocked ZaloPay app deep link, keeping in WebView');
      return false; // Don't open app, stay in WebView
    }

    // Block "open in app" links - force web payment
    if (url.includes('zalopay.vn/openinapp') || url.includes('/openinapp')) {
      console.log('Blocked "open in app" link, keeping in WebView');
      return false; // Don't open app
    }

    // Allow all other web URLs (including ZaloPay web payment)
    return true;
  };

  // Handle navigation state changes
  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);

    const url = navState.url;
    console.log('=== Navigation state changed ===');
    console.log('URL:', url);
    console.log('Title:', navState.title);
    console.log('Loading:', navState.loading);

    // Note: We don't need to check for success/failed here
    // ZaloPay will redirect to moviebooking://payment/callback
    // which is handled by handleShouldStartLoadWithRequest
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
              
              // Only show loading for initial page load, not for subsequent navigations
              if (loadAttempts === 0) {
                setLoading(true);
              }
              
              setError(null);
              setLoadAttempts(prev => prev + 1);
            }}
            onLoadEnd={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.log('WebView load ended:', nativeEvent.url);
              console.log('Load attempts:', loadAttempts);

              // Hide loading after first page load only
              if (loadAttempts <= 2) {
                setTimeout(() => {
                  setLoading(false);
                }, 800);
              }

              // If we've been loading for too long, show error
              if (loadAttempts > 20) {
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
            javaScriptCanOpenWindowsAutomatically={false}
            domStorageEnabled={true}
            startInLoadingState={false}
            scalesPageToFit={true}
            mixedContentMode="compatibility"
            setSupportMultipleWindows={false}
            cacheEnabled={false}
            incognito={false}
            thirdPartyCookiesEnabled={true}
            sharedCookiesEnabled={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
            userAgent="Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
            onMessage={(event) => {
              console.log('WebView message:', event.nativeEvent.data);
            }}
            injectedJavaScript={`
              // Log page load
              console.log('Page loaded:', window.location.href);
              
              // Hide loading spinner if exists
              setTimeout(() => {
                const spinners = document.querySelectorAll('[class*="loading"], [class*="spinner"]');
                spinners.forEach(el => el.style.display = 'none');
              }, 2000);
              
              true; // Required for injectedJavaScript
            `}
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
          {loadAttempts > 3 && (
            <TouchableOpacity
              style={styles.hideLoadingButton}
              onPress={() => {
                console.log('Force hiding loading overlay');
                setLoading(false);
              }}>
              <Text style={styles.hideLoadingText}>Ẩn loading</Text>
            </TouchableOpacity>
          )}
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
    backgroundColor: 'rgba(255,255,255,0.95)',
    zIndex: 999,
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
  hideLoadingButton: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  hideLoadingText: {
    color: '#fff',
    fontSize: 14,
  },
});

export default ZaloPayWebViewScreen;
