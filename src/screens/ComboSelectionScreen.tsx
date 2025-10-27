import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import EncryptedStorage from 'react-native-encrypted-storage';
import { useLocation, useNavigate } from 'react-router-native';
import { apiService } from '../api/apicall';

interface Combo {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  status: string;
}

interface SelectedCombo extends Combo {
  quantity: number;
}

const ComboSelectionScreen = ({ navigation, route }: any) => {
  // React Router support
  const location = useLocation();
  const navigate = useNavigate();
  const routerState = location.state as any;

  // Get data from either React Navigation or React Router
  const bookingData = route?.params?.bookingData || routerState?.bookingData;

  const [combos, setCombos] = useState<Combo[]>([]);
  const [selectedCombos, setSelectedCombos] = useState<SelectedCombo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch combos from API
  useEffect(() => {
    const fetchCombos = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('Fetching combos...');
        const response = await apiService.getCombos();

        if (response && response.data) {
          console.log('Combos data received:', response.data);
          setCombos(response.data);
        } else {
          throw new Error('No combos data received');
        }
      } catch (error: any) {
        console.error('Error fetching combos:', error);
        setError(error.message || 'Không thể tải danh sách combo');
        ToastAndroid.showWithGravity(
          'Không thể tải combo. Vui lòng thử lại.',
          ToastAndroid.SHORT,
          ToastAndroid.BOTTOM,
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCombos();
  }, []);

  const addCombo = (combo: Combo) => {
    const existing = selectedCombos.find(c => c.id === combo.id);
    
    if (existing) {
      setSelectedCombos(
        selectedCombos.map(c =>
          c.id === combo.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      );
    } else {
      setSelectedCombos([...selectedCombos, { ...combo, quantity: 1 }]);
    }
  };

  const removeCombo = (comboId: number) => {
    const existing = selectedCombos.find(c => c.id === comboId);
    
    if (existing && existing.quantity > 1) {
      setSelectedCombos(
        selectedCombos.map(c =>
          c.id === comboId ? { ...c, quantity: c.quantity - 1 } : c
        )
      );
    } else {
      setSelectedCombos(selectedCombos.filter(c => c.id !== comboId));
    }
  };

  const getTotalPrice = () => {
    const comboTotal = selectedCombos.reduce((sum, combo) => {
      return sum + (combo.price * combo.quantity);
    }, 0);
    return comboTotal;
  };

  const handleContinue = async () => {
    try {
      setIsLoading(true);

      // Calculate final total price
      const comboTotal = getTotalPrice();
      const finalTotalPrice = (bookingData?.totalPrice || 0) + comboTotal;

      console.log('Creating booking with combos...');
      console.log('Booking data:', {
        showtimeId: bookingData.showtimeId,
        seatIds: bookingData.seatIds,
        totalPrice: finalTotalPrice,
        combos: selectedCombos.map(c => ({
          comboId: c.id,
          quantity: c.quantity,
        })),
      });

      // Create booking with seat and combo data
      const bookingResponse = await apiService.createBooking({
        showtimeId: bookingData.showtimeId,
        seatIds: bookingData.seatIds,
        totalPrice: finalTotalPrice,
        combos: selectedCombos.length > 0 ? selectedCombos.map(c => ({
          comboId: c.id,
          quantity: c.quantity,
        })) : undefined,
      });

      console.log('Booking response:', bookingResponse);

      if (!bookingResponse) {
        throw new Error('Không thể tạo booking. Vui lòng thử lại.');
      }

      // API returns data directly or wrapped in response.data
      const bookingDataResponse = bookingResponse.data || bookingResponse;
      const bookingId = bookingDataResponse.id || bookingDataResponse.bookingId;

      if (!bookingId) {
        console.error('No booking ID found in response:', bookingDataResponse);
        throw new Error('Không nhận được booking ID từ server.');
      }

      console.log('Booking created successfully:', bookingId);

      // Prepare complete booking data
      const completeBookingData = {
        ...bookingData,
        bookingId: bookingId,
        combos: selectedCombos,
        comboTotal: comboTotal,
        totalPrice: finalTotalPrice,
      };

      ToastAndroid.showWithGravity(
        'Đã tạo booking. Chọn phương thức thanh toán...',
        ToastAndroid.SHORT,
        ToastAndroid.BOTTOM,
      );

      // Navigate to payment method selection
      if (navigation?.navigate) {
        navigation.navigate('PaymentMethod', {
          bookingData: completeBookingData,
        });
      } else {
        navigate('/payment-method', {
          state: {
            bookingData: completeBookingData,
          }
        });
      }

    } catch (error: any) {
      console.error('Error creating booking:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      let errorMessage = 'Tạo booking thất bại. Vui lòng thử lại.';

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
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      setIsLoading(true);

      console.log('Creating booking without combos...');
      console.log('Booking data:', {
        showtimeId: bookingData.showtimeId,
        seatIds: bookingData.seatIds,
        totalPrice: bookingData.totalPrice,
      });

      // Create booking without combos
      const bookingResponse = await apiService.createBooking({
        showtimeId: bookingData.showtimeId,
        seatIds: bookingData.seatIds,
        totalPrice: bookingData.totalPrice,
      });

      console.log('Booking response:', bookingResponse);

      if (!bookingResponse) {
        throw new Error('Không thể tạo booking. Vui lòng thử lại.');
      }

      // API returns data directly or wrapped in response.data
      const bookingDataResponse = bookingResponse.data || bookingResponse;
      const bookingId = bookingDataResponse.id || bookingDataResponse.bookingId;

      if (!bookingId) {
        console.error('No booking ID found in response:', bookingDataResponse);
        throw new Error('Không nhận được booking ID từ server.');
      }

      console.log('Booking created successfully:', bookingId);

      // Prepare complete booking data
      const completeBookingData = {
        ...bookingData,
        bookingId: bookingId,
      };

      ToastAndroid.showWithGravity(
        'Đã tạo booking. Chọn phương thức thanh toán...',
        ToastAndroid.SHORT,
        ToastAndroid.BOTTOM,
      );

      // Navigate to payment method
      if (navigation?.navigate) {
        navigation.navigate('PaymentMethod', {
          bookingData: completeBookingData,
        });
      } else {
        navigate('/payment-method', {
          state: {
            bookingData: completeBookingData,
          }
        });
      }

    } catch (error: any) {
      console.error('Error creating booking:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      let errorMessage = 'Tạo booking thất bại. Vui lòng thử lại.';

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
      setIsLoading(false);
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
          <Text style={styles.headerTitle}>Chọn Combo</Text>
          <Text style={styles.headerSubtitle}>Bắp nước & Đồ ăn</Text>
        </View>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Bỏ qua</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        {/* Loading State */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF4500" />
            <Text style={styles.loadingText}>Đang tải combo...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setIsLoading(true);
                setError(null);
              }}>
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Combo List */}
            <View style={styles.comboList}>
              {combos.map((combo) => {
                const selected = selectedCombos.find(c => c.id === combo.id);
                const quantity = selected?.quantity || 0;

                return (
                  <View key={combo.id} style={styles.comboCard}>
                    <Image
                      source={{ uri: combo.image }}
                      style={styles.comboImage}
                      resizeMode="cover"
                    />
                    <View style={styles.comboInfo}>
                      <Text style={styles.comboName}>{combo.name}</Text>
                      <Text style={styles.comboDescription} numberOfLines={2}>
                        {combo.description}
                      </Text>
                      <Text style={styles.comboPrice}>
                        {combo.price.toLocaleString('vi-VN')} VNĐ
                      </Text>
                    </View>
                    <View style={styles.comboActions}>
                      {quantity > 0 ? (
                        <View style={styles.quantityControl}>
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => removeCombo(combo.id)}>
                            <Text style={styles.quantityButtonText}>−</Text>
                          </TouchableOpacity>
                          <Text style={styles.quantityText}>{quantity}</Text>
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => addCombo(combo)}>
                            <Text style={styles.quantityButtonText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.addButton}
                          onPress={() => addCombo(combo)}>
                          <Text style={styles.addButtonText}>Thêm</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Selected Combos Summary */}
            {selectedCombos.length > 0 && (
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Đã chọn</Text>
                {selectedCombos.map((combo) => (
                  <View key={combo.id} style={styles.summaryItem}>
                    <Text style={styles.summaryItemName}>
                      {combo.name} x{combo.quantity}
                    </Text>
                    <Text style={styles.summaryItemPrice}>
                      {(combo.price * combo.quantity).toLocaleString('vi-VN')} VNĐ
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceSection}>
          <Text style={styles.totalPriceLabel}>Tổng combo</Text>
          <Text style={styles.totalPrice}>
            {getTotalPrice().toLocaleString('vi-VN')} VNĐ
          </Text>
          {selectedCombos.length > 0 && (
            <Text style={styles.itemCount}>
              {selectedCombos.reduce((sum, c) => sum + c.quantity, 0)} món
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.continueButton, isLoading && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={isLoading}
          activeOpacity={0.8}>
          <LinearGradient
            colors={isLoading ? ['#666', '#555'] : ['#FF6B35', '#FF4500']}
            style={styles.continueButtonGradient}>
            {isLoading ? (
              <>
                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.continueButtonText}>Đang xử lý...</Text>
              </>
            ) : (
              <Text style={styles.continueButtonText}>Tiếp tục</Text>
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
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipButtonText: {
    color: '#FF4500',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  errorText: {
    color: '#FF4500',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
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
  comboList: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  comboCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  comboImage: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  comboInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  comboName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  comboDescription: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
  },
  comboPrice: {
    color: '#FF4500',
    fontSize: 14,
    fontWeight: 'bold',
  },
  comboActions: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  addButton: {
    backgroundColor: '#FF4500',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FF4500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
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
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryItemName: {
    color: '#888',
    fontSize: 14,
  },
  summaryItemPrice: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  itemCount: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  continueButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginLeft: 16,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ComboSelectionScreen;
