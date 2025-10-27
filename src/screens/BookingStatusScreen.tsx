import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { apiService } from '../api/apicall';

const BookingStatusScreen = ({ route }: any) => {
  const bookingId = route?.params?.bookingId || 28; // Default to latest booking
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [confirming, setConfirming] = useState(false);

  const fetchBookingStatus = async () => {
    try {
      console.log('Fetching booking status:', bookingId);
      const response = await apiService.getBookingStatus(bookingId);
      console.log('Booking response:', response);
      setBooking(response.data);
    } catch (error) {
      console.error('Error fetching booking:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookingStatus();
  }, [bookingId]);

  // Auto refresh every 3 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      console.log('Auto refreshing booking status...');
      fetchBookingStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, [autoRefresh, bookingId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookingStatus();
  };

  const handleManualConfirm = async () => {
    try {
      setConfirming(true);
      console.log('Manually confirming booking:', bookingId);
      const response = await apiService.confirmBookingPayment(bookingId);
      console.log('Confirm response:', response);
      
      // Refresh booking status
      await fetchBookingStatus();
      
      Alert.alert('Success', 'Booking confirmed successfully!');
    } catch (error: any) {
      console.error('Error confirming booking:', error);
      Alert.alert('Error', error.message);
    } finally {
      setConfirming(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return '#4CAF50';
      case 'PENDING':
        return '#FFA500';
      case 'CANCELLED':
        return '#FF4500';
      default:
        return '#888';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF4500" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <View style={styles.header}>
        <Text style={styles.title}>Booking Status Monitor</Text>
        <TouchableOpacity
          style={[styles.autoRefreshButton, autoRefresh && styles.autoRefreshActive]}
          onPress={() => setAutoRefresh(!autoRefresh)}>
          <Text style={styles.autoRefreshText}>
            Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>
      </View>

      {booking ? (
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.label}>Booking ID</Text>
            <Text style={styles.value}>#{booking.bookingId || bookingId}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Status</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(booking.status) },
              ]}>
              <Text style={styles.statusText}>{booking.status}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Total Amount</Text>
            <Text style={styles.value}>
              {booking.totalAmount?.toLocaleString('vi-VN')} VNĐ
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Booking Time</Text>
            <Text style={styles.value}>
              {booking.bookingTime || 'N/A'}
            </Text>
          </View>

          {booking.paymentUrl && (
            <View style={styles.card}>
              <Text style={styles.label}>Payment URL</Text>
              <Text style={styles.valueSmall} numberOfLines={2}>
                {booking.paymentUrl}
              </Text>
            </View>
          )}

          {booking.paymentTime && (
            <View style={styles.card}>
              <Text style={styles.label}>Payment Time</Text>
              <Text style={styles.value}>{booking.paymentTime}</Text>
            </View>
          )}

          {booking.status === 'PENDING' && (
            <TouchableOpacity
              style={[styles.confirmButton, confirming && styles.confirmButtonDisabled]}
              onPress={handleManualConfirm}
              disabled={confirming}>
              {confirming ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>
                  ✓ Manual Confirm Payment
                </Text>
              )}
            </TouchableOpacity>
          )}

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>ℹ️ Status Guide</Text>
            <Text style={styles.infoText}>
              • PENDING: Waiting for payment confirmation
            </Text>
            <Text style={styles.infoText}>
              • CONFIRMED: Payment successful, booking confirmed
            </Text>
            <Text style={styles.infoText}>
              • CANCELLED: Payment failed or cancelled
            </Text>
            {booking.status === 'PENDING' && (
              <Text style={[styles.infoText, { marginTop: 12, color: '#FFA500' }]}>
                💡 If webhook is not working, use "Manual Confirm" button above
              </Text>
            )}
          </View>

          <View style={styles.debugBox}>
            <Text style={styles.debugTitle}>Debug Info</Text>
            <Text style={styles.debugText}>
              {JSON.stringify(booking, null, 2)}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Booking not found</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  autoRefreshButton: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  autoRefreshActive: {
    backgroundColor: '#FF4500',
  },
  autoRefreshText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  label: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  valueSmall: {
    fontSize: 12,
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: 'rgba(255,165,0,0.1)',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,165,0,0.3)',
  },
  infoTitle: {
    fontSize: 16,
    color: '#FFA500',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#FFA500',
    marginBottom: 4,
  },
  debugBox: {
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  debugTitle: {
    fontSize: 14,
    color: '#0f0',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 10,
    color: '#0f0',
    fontFamily: 'monospace',
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF4500',
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BookingStatusScreen;
