import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { apiService } from '../api/apicall';

const TestZaloPayScreen = () => {
  const [bookingId, setBookingId] = useState('1');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const testZaloPayAPI = async () => {
    if (!bookingId) {
      Alert.alert('Lỗi', 'Vui lòng nhập Booking ID');
      return;
    }

    try {
      setLoading(true);
      setResponse(null);

      console.log('Testing ZaloPay API with booking ID:', bookingId);
      const result = await apiService.createZaloPayment(parseInt(bookingId));
      
      console.log('API Result:', JSON.stringify(result, null, 2));
      setResponse(result);

      // Check if we got a payment URL
      const paymentData = result.data || result;
      const paymentUrl = paymentData.order_url || 
                        paymentData.orderUrl || 
                        paymentData.payment_url ||
                        paymentData.paymentUrl ||
                        paymentData.url;

      if (paymentUrl) {
        Alert.alert(
          'Thành công!',
          `Payment URL: ${paymentUrl.substring(0, 50)}...`,
          [
            {
              text: 'Copy URL',
              onPress: () => console.log('URL:', paymentUrl)
            },
            { text: 'OK' }
          ]
        );
      } else {
        Alert.alert(
          'Không có Payment URL',
          'Backend không trả về payment URL. Kiểm tra logs.',
          [{ text: 'OK' }]
        );
      }

    } catch (error: any) {
      console.error('Test error:', error);
      setResponse({
        error: true,
        message: error.message,
        details: error.response?.data
      });
      Alert.alert('Lỗi', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test ZaloPay API</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Booking ID:</Text>
        <TextInput
          style={styles.input}
          value={bookingId}
          onChangeText={setBookingId}
          keyboardType="numeric"
          placeholder="Nhập booking ID"
        />
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={testZaloPayAPI}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Test API</Text>
        )}
      </TouchableOpacity>

      {response && (
        <ScrollView style={styles.responseContainer}>
          <Text style={styles.responseTitle}>Response:</Text>
          <Text style={styles.responseText}>
            {JSON.stringify(response, null, 2)}
          </Text>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    marginTop: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FF4500',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  responseContainer: {
    marginTop: 20,
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 8,
    maxHeight: 400,
  },
  responseTitle: {
    color: '#FF4500',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  responseText: {
    color: '#0f0',
    fontSize: 12,
    fontFamily: 'monospace',
  },
});

export default TestZaloPayScreen;
