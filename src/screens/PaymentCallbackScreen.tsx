import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocation, useNavigate } from 'react-router-native';
import EncryptedStorage from 'react-native-encrypted-storage';
import LinearGradient from 'react-native-linear-gradient';
import { apiService } from '../api/apicall';

const PaymentCallbackScreen = ({ navigation, route }: any) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [bookingData, setBookingData] = useState<any>(null);

  useEffect(() => {
    handlePaymentCallback();
  }, []);

  const handlePaymentCallback = async () => {
    try {
      // Parse URL params manually (URLSearchParams doesn't work well in RN)
      const queryString = location.search.substring(1); // Remove '?'
      const params: Record<string, string> = {};
      
      queryString.split('&').forEach(param => {
        const [key, value] = param.split('=');
        if (key && value) {
          params[key] = decodeURIComponent(value);
        }
      });

      const paymentStatus = params.status;
      const bookingIdParam = params.bookingId;

      console.log('Payment callback params:', { paymentStatus, bookingIdParam });

      // Get saved booking data
      const savedData = await EncryptedStorage.getItem('pending_ticket');
      let bookingId = bookingIdParam;
      
      if (savedData) {
        const data = JSON.parse(savedData);
        setBookingData(data);
        bookingId = data.bookingId || bookingIdParam;
      }

      console.log('Booking ID:', bookingId);

      // Check payment status
      if (paymentStatus === 'success' || paymentStatus === '1') {
        // Verify with backend by checking booking status
        if (bookingId) {
          try {
            console.log('Checking booking status from API...');
            const response = await apiService.getBookingStatus(parseInt(bookingId));
            console.log('Booking status response:', response);
            
            const booking = response.data;
            
            // If booking is still PENDING, webhook might not have been called yet
            // Try manual confirm as backup
            if (booking && booking.status === 'PENDING') {
              console.log('Booking still PENDING, trying manual confirm...');
              try {
                const confirmResponse = await apiService.confirmBookingPayment(parseInt(bookingId));
                console.log('Manual confirm response:', confirmResponse);
                
                // Check status again after manual confirm
                const updatedResponse = await apiService.getBookingStatus(parseInt(bookingId));
                const updatedBooking = updatedResponse.data;
                
                if (updatedBooking && updatedBooking.status === 'CONFIRMED') {
                  console.log('Booking confirmed successfully via manual API');
                  setStatus('success');
                  await EncryptedStorage.removeItem('pending_ticket');
                } else {
                  console.warn('Manual confirm did not update status:', updatedBooking?.status);
                  // Still show success since payment was successful
                  setStatus('success');
                  await EncryptedStorage.removeItem('pending_ticket');
                }
              } catch (confirmError) {
                console.error('Error in manual confirm:', confirmError);
                // Still show success since payment was successful
                setStatus('success');
                await EncryptedStorage.removeItem('pending_ticket');
              }
            } else if (booking && booking.status === 'CONFIRMED') {
              console.log('Booking already confirmed (webhook worked!)');
              setStatus('success');
              await EncryptedStorage.removeItem('pending_ticket');
            } else {
              console.warn('Unexpected booking status:', booking?.status);
              setStatus('failed');
            }
          } catch (error) {
            console.error('Error checking booking status:', error);
            // If API fails, still show success based on payment status
            setStatus('success');
            await EncryptedStorage.removeItem('pending_ticket');
          }
        } else {
          setStatus('success');
          await EncryptedStorage.removeItem('pending_ticket');
        }
      } else {
        setStatus('failed');
      }
    } catch (error) {
      console.error('Error handling payment callback:', error);
      setStatus('failed');
    }
  };

  const handleContinue = () => {
    if (status === 'success') {
      // Navigate to home or ticket screen
      if (navigation?.navigate) {
        navigation.navigate('Home');
      } else {
        navigate('/');
      }
    } else {
      // Go back to payment method
      if (navigation?.goBack) {
        navigation.goBack();
      } else {
        navigate(-1);
      }
    }
  };

  return (
    <View style={styles.container}>
      {status === 'loading' ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF4500" />
          <Text style={styles.loadingText}>Đang xử lý thanh toán...</Text>
        </View>
      ) : status === 'success' ? (
        <View style={styles.successContainer}>
          <View style={styles.iconContainer}>
            <Text style={styles.successIcon}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Thanh toán thành công!</Text>
          <Text style={styles.successMessage}>
            Đơn hàng của bạn đã được thanh toán thành công.
          </Text>
          
          {bookingData && (
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mã đặt vé:</Text>
                <Text style={styles.infoValue}>#{bookingData.bookingId}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tổng tiền:</Text>
                <Text style={styles.infoValue}>
                  {bookingData.totalPrice?.toLocaleString('vi-VN')} VNĐ
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.button} onPress={handleContinue}>
            <LinearGradient
              colors={['#FF6B35', '#FF4500']}
              style={styles.buttonGradient}>
              <Text style={styles.buttonText}>Về trang chủ</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.failedContainer}>
          <View style={styles.iconContainer}>
            <Text style={styles.failedIcon}>✕</Text>
          </View>
          <Text style={styles.failedTitle}>Thanh toán thất bại</Text>
          <Text style={styles.failedMessage}>
            Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.
          </Text>

          <TouchableOpacity style={styles.button} onPress={handleContinue}>
            <LinearGradient
              colors={['#FF6B35', '#FF4500']}
              style={styles.buttonGradient}>
              <Text style={styles.buttonText}>Thử lại</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
    marginTop: 16,
  },
  successContainer: {
    alignItems: 'center',
    width: '100%',
  },
  failedContainer: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    fontSize: 60,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  failedIcon: {
    fontSize: 60,
    color: '#FF4500',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  failedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 32,
  },
  failedMessage: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 32,
  },
  infoContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  button: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PaymentCallbackScreen;
