import React, { useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  ToastAndroid,
  ActivityIndicator,
  Image,
  Linking,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import EncryptedStorage from 'react-native-encrypted-storage';
import { useLocation, useNavigate } from 'react-router-native';
import { apiService } from '../api/apicall';

const PaymentMethodScreen = ({ navigation, route }: any) => {
  const location = useLocation();
  const navigate = useNavigate();
  const routerState = location.state as any;

  // Get data from either React Navigation or React Router
  const bookingData = route?.params?.bookingData || routerState?.bookingData;

  const [selectedMethod, setSelectedMethod] = useState<string>('zalopay');
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentMethods = [
    {
      id: 'zalopay',
      name: 'ZaloPay',
      description: 'Thanh toán qua ví ZaloPay',
      icon: '💳',
    },
    {
      id: 'momo',
      name: 'MoMo',
      description: 'Thanh toán qua ví MoMo',
      icon: '📱',
      disabled: true,
    },
    {
      id: 'vnpay',
      name: 'VNPay',
      description: 'Thanh toán qua VNPay',
      icon: '🏦',
      disabled: true,
    },
  ];

  const handlePayment = async () => {
    if (!selectedMethod) {
      ToastAndroid.showWithGravity(
        'Vui lòng chọn phương thức thanh toán',
        ToastAndroid.SHORT,
        ToastAndroid.BOTTOM,
      );
      return;
    }

    if (!bookingData?.bookingId) {
      ToastAndroid.showWithGravity(
        'Không tìm thấy booking ID',
        ToastAndroid.SHORT,
        ToastAndroid.BOTTOM,
      );
      return;
    }

    try {
      setIsProcessing(true);

      console.log('Creating payment for booking:', bookingData.bookingId);

      // Create payment based on selected method
      let paymentResponse;

      if (selectedMethod === 'zalopay') {
        console.log('Creating ZaloPay payment...');
        paymentResponse = await apiService.createZaloPayment(bookingData.bookingId);
      } else {
        throw new Error('Phương thức thanh toán chưa được hỗ trợ');
      }

      console.log('=== Payment Response Debug ===');
      console.log('Full response:', JSON.stringify(paymentResponse, null, 2));
      console.log('Response type:', typeof paymentResponse);
      console.log('Response keys:', paymentResponse ? Object.keys(paymentResponse) : 'null');

      if (!paymentResponse) {
        throw new Error('Không nhận được phản hồi từ server thanh toán.');
      }

      // Get payment data from response
      const paymentData = paymentResponse.data || paymentResponse;
      console.log('=== Payment Data Debug ===');
      console.log('Payment data:', JSON.stringify(paymentData, null, 2));
      console.log('Payment data keys:', paymentData ? Object.keys(paymentData) : 'null');

      // Get payment URL from response - try multiple possible field names
      const paymentUrl = paymentData.order_url || 
                        paymentData.orderUrl || 
                        paymentData.payment_url ||
                        paymentData.paymentUrl ||
                        paymentData.url;
      
      const zpTransToken = paymentData.zp_trans_token || 
                          paymentData.zpTransToken ||
                          paymentData.trans_token ||
                          paymentData.transToken;
      
      const returnCode = paymentData.return_code || 
                        paymentData.returnCode ||
                        paymentData.code;

      console.log('=== Extracted Values ===');
      console.log('Payment URL:', paymentUrl);
      console.log('ZP Trans Token:', zpTransToken);
      console.log('Return Code:', returnCode);

      // Check ZaloPay return code
      if (returnCode !== undefined && returnCode !== 1 && returnCode !== 200) {
        const errorMessage = paymentData.return_message || 
                           paymentData.returnMessage || 
                           paymentData.message ||
                           'Lỗi từ ZaloPay';
        console.error('ZaloPay error:', errorMessage);
        throw new Error(`ZaloPay Error: ${errorMessage} (Code: ${returnCode})`);
      }

      if (!paymentUrl) {
        console.error('=== Payment URL Not Found ===');
        console.error('Full payment data:', JSON.stringify(paymentData, null, 2));
        Alert.alert(
          'Lỗi Backend',
          'Backend không trả về payment URL từ ZaloPay.\n\nCó thể:\n1. ZaloPay API key không đúng\n2. ZaloPay sandbox không hoạt động\n3. Backend chưa implement đúng\n\nData: ' + JSON.stringify(paymentData).substring(0, 200),
          [{ text: 'OK' }]
        );
        throw new Error('Backend không trả về payment URL. Vui lòng kiểm tra logs backend.');
      }

      // Save complete booking data
      const completeBookingData = {
        ...bookingData,
        paymentData: paymentData,
        paymentMethod: selectedMethod,
      };

      await EncryptedStorage.setItem('pending_ticket', JSON.stringify(completeBookingData));

      console.log('Payment URL:', paymentUrl);
      console.log('ZP Trans Token:', zpTransToken);

      // Show alert with URL for debugging
      Alert.alert(
        'Chọn cách mở thanh toán',
        `URL: ${paymentUrl.substring(0, 50)}...`,
        [
          {
            text: 'Mở trong WebView',
            onPress: () => {
              console.log('Opening payment in WebView');
              
              if (navigation?.navigate) {
                navigation.navigate('ZaloPayWebView', {
                  paymentUrl: paymentUrl,
                  bookingData: completeBookingData,
                });
              } else {
                navigate('/zalopay-webview', {
                  state: {
                    paymentUrl: paymentUrl,
                    bookingData: completeBookingData,
                  }
                });
              }
            }
          },
          {
            text: 'Mở trong Browser',
            onPress: () => {
              console.log('Opening payment in external browser');
              Linking.openURL(paymentUrl).catch(err => {
                console.error('Error opening browser:', err);
                Alert.alert('Lỗi', 'Không thể mở trình duyệt');
              });
            }
          },
          {
            text: 'Hủy',
            style: 'cancel'
          }
        ]
      );

    } catch (error: any) {
      console.error('Error processing payment:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      let errorMessage = 'Thanh toán thất bại. Vui lòng thử lại.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      ToastAndroid.showWithGravity(
        errorMessage,
        ToastAndroid.LONG,
        ToastAndroid.BOTTOM,
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (navigation?.goBack) {
              navigation.goBack();
            } else {
              navigate(-1);
            }
          }}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Phương thức thanh toán</Text>
          <Text style={styles.headerSubtitle}>Chọn cách thanh toán</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        {/* Booking Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Thông tin đặt vé</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Số ghế:</Text>
            <Text style={styles.summaryValue}>{bookingData?.seats?.length || 0} ghế</Text>
          </View>

          {bookingData?.combos && bookingData.combos.length > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Combo:</Text>
              <Text style={styles.summaryValue}>
                {bookingData.combos.reduce((sum: number, c: any) => sum + c.quantity, 0)} món
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabelBold}>Tổng tiền:</Text>
            <Text style={styles.summaryValueBold}>
              {bookingData?.totalPrice?.toLocaleString('vi-VN')} VNĐ
            </Text>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.methodsContainer}>
          <Text style={styles.methodsTitle}>Chọn phương thức thanh toán</Text>

          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodCard,
                selectedMethod === method.id && styles.methodCardSelected,
                method.disabled && styles.methodCardDisabled,
              ]}
              onPress={() => !method.disabled && setSelectedMethod(method.id)}
              disabled={method.disabled}
              activeOpacity={0.7}>
              <View style={styles.methodIcon}>
                <Text style={styles.methodIconText}>{method.icon}</Text>
              </View>
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>{method.name}</Text>
                <Text style={styles.methodDescription}>
                  {method.disabled ? 'Sắp ra mắt' : method.description}
                </Text>
              </View>
              <View style={styles.methodRadio}>
                {selectedMethod === method.id && !method.disabled && (
                  <View style={styles.methodRadioSelected} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceSection}>
          <Text style={styles.totalPriceLabel}>Tổng thanh toán</Text>
          <Text style={styles.totalPrice}>
            {bookingData?.totalPrice?.toLocaleString('vi-VN')} VNĐ
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={isProcessing}
          activeOpacity={0.8}>
          <LinearGradient
            colors={isProcessing ? ['#666', '#555'] : ['#FF6B35', '#FF4500']}
            style={styles.payButtonGradient}>
            {isProcessing ? (
              <>
                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.payButtonText}>Đang xử lý...</Text>
              </>
            ) : (
              <Text style={styles.payButtonText}>Thanh toán</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#000',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  summaryContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  summaryTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    color: '#888',
    fontSize: 14,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 14,
  },
  summaryLabelBold: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryValueBold: {
    color: '#FF4500',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 12,
  },
  methodsContainer: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  methodsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  methodCardSelected: {
    borderColor: '#FF4500',
    backgroundColor: 'rgba(255,69,0,0.1)',
  },
  methodCardDisabled: {
    opacity: 0.5,
  },
  methodIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  methodIconText: {
    fontSize: 24,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  methodDescription: {
    color: '#888',
    fontSize: 12,
  },
  methodRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#888',
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodRadioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF4500',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  priceSection: {
    flex: 1,
  },
  totalPriceLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  totalPrice: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  payButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginLeft: 16,
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PaymentMethodScreen;
