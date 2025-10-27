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
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import EncryptedStorage from 'react-native-encrypted-storage';
import { useLocation, useNavigate } from 'react-router-native';
import { apiService } from '../api/apicall';
import { useAuth } from '../context/AuthContext';

// Transform API seat data to UI format
const transformSeatsData = (apiSeats: any[]) => {
  // Group seats by row
  const seatsByRow: { [key: string]: any[] } = {};

  apiSeats.forEach(seat => {
    const row = seat.seatRow;
    if (!seatsByRow[row]) {
      seatsByRow[row] = [];
    }
    seatsByRow[row].push({
      seatId: seat.seatId,
      row: seat.seatRow,
      number: seat.seatNumber,
      id: `${seat.seatRow}${seat.seatNumber}`,
      price: seat.price,
      taken: seat.status === 'BOOKED', // Đã thanh toán thành công
      held: seat.status === 'HELD', // Đang giữ (sau khi hold API)
      selected: false,
      type: 'regular',
    });
  });

  // Sort rows alphabetically and seats by number
  const sortedRows = Object.keys(seatsByRow).sort();
  const rowArray = sortedRows.map(row => {
    return seatsByRow[row].sort((a, b) => a.number - b.number);
  });

  return rowArray;
};

const SeatBookingScreen = ({ navigation, route }: any) => {
  // React Router support
  const location = useLocation();
  const navigate = useNavigate();
  const routerState = location.state as any;
  const { isLoggedIn } = useAuth();

  // Get data from either React Navigation or React Router
  const movieId = route?.params?.movieId || routerState?.movieId;
  const showtimeId = route?.params?.showtimeId || routerState?.showtimeId;
  const showtime = route?.params?.showtime || routerState?.showtime;
  const posterImage = route?.params?.PosterImage || routerState?.PosterImage || routerState?.posterUrl;
  const bgImage = route?.params?.BgImage || routerState?.BgImage || routerState?.posterUrl;

  console.log('SeatBookingScreen received:', { movieId, showtimeId, showtime });

  const [price, setPrice] = useState<number>(0);
  const [twoDSeatArray, setTwoDSeatArray] = useState<any[][]>([]);
  const [selectedSeatArray, setSelectedSeatArray] = useState<any[]>([]);
  const [isLoadingSeats, setIsLoadingSeats] = useState(true);
  const [seatsError, setSeatsError] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  // Load saved seat selection on mount (for returning from login)
  useEffect(() => {
    const loadSavedSelection = async () => {
      try {
        const saved = await EncryptedStorage.getItem('pending_seat_selection');
        if (saved) {
          const data = JSON.parse(saved);
          if (data.savedShowtimeId === showtimeId && twoDSeatArray.length > 0) {
            // Restore selection after seats are loaded
            setTimeout(() => {
              const temp = [...twoDSeatArray];
              data.savedSeats.forEach((savedSeat: any) => {
                const rowIdx = temp.findIndex(row => row.some((s: any) => s.seatId === savedSeat.seatId));
                if (rowIdx !== -1) {
                  const seatIdx = temp[rowIdx].findIndex((s: any) => s.seatId === savedSeat.seatId);
                  if (seatIdx !== -1 && !temp[rowIdx][seatIdx].taken) {
                    temp[rowIdx][seatIdx].selected = true;
                  }
                }
              });
              setTwoDSeatArray(temp);
              setSelectedSeatArray(data.savedSeats);
              setPrice(data.savedPrice);
              EncryptedStorage.removeItem('pending_seat_selection');
              ToastAndroid.showWithGravity('Đã khôi phục ghế đã chọn', ToastAndroid.SHORT, ToastAndroid.BOTTOM);
            }, 500);
          }
        }
      } catch (error) {
        console.error('Error loading saved selection:', error);
      }
    };

    if (twoDSeatArray.length > 0) {
      loadSavedSelection();
    }
  }, [twoDSeatArray.length]);

  // Fetch seats from API
  useEffect(() => {
    const fetchSeats = async () => {
      if (!showtimeId) {
        setSeatsError('No showtime ID provided');
        setIsLoadingSeats(false);
        return;
      }

      try {
        setIsLoadingSeats(true);
        setSeatsError(null);

        console.log('Fetching seats for showtime:', showtimeId);
        const response = await apiService.getSeatsByShowtimeId(showtimeId);

        if (response && response.data) {
          console.log('Seats data received:', response.data);
          const transformedSeats = transformSeatsData(response.data);
          setTwoDSeatArray(transformedSeats);
        } else {
          throw new Error('No seats data received');
        }
      } catch (error: any) {
        console.error('Error fetching seats:', error);
        setSeatsError(error.message || 'Không thể tải danh sách ghế');
        ToastAndroid.showWithGravity(
          'Không thể tải ghế. Vui lòng thử lại.',
          ToastAndroid.SHORT,
          ToastAndroid.BOTTOM,
        );
      } finally {
        setIsLoadingSeats(false);
      }
    };

    fetchSeats();
  }, [showtimeId]);

  const selectSeat = (rowIndex: number, seatIndex: number) => {
    const seat = twoDSeatArray[rowIndex][seatIndex];

    if (seat.taken) return;

    let temp = [...twoDSeatArray];
    temp[rowIndex][seatIndex].selected = !temp[rowIndex][seatIndex].selected;

    let selectedSeats = [...selectedSeatArray];
    const seatId = seat.id;

    if (temp[rowIndex][seatIndex].selected) {
      selectedSeats.push(seat);
    } else {
      selectedSeats = selectedSeats.filter(s => s.id !== seatId);
    }

    // Calculate price using actual seat prices from API
    const totalPrice = selectedSeats.reduce((sum, s) => {
      return sum + (s.price || 0);
    }, 0);

    setSelectedSeatArray(selectedSeats);
    setPrice(totalPrice);
    setTwoDSeatArray(temp);
  };

  const BookSeats = async () => {
    if (selectedSeatArray.length === 0) {
      ToastAndroid.showWithGravity(
        'Vui lòng chọn ít nhất một ghế',
        ToastAndroid.SHORT,
        ToastAndroid.BOTTOM,
      );
      return;
    }

    // Check if user is logged in
    if (!isLoggedIn) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Bạn cần đăng nhập để tiếp tục đặt vé.',
        [
          {
            text: 'Hủy',
            style: 'cancel'
          }
        ]
      );
      return;
    }

    try {
      setIsBooking(true);

      // Extract seat IDs from selected seats
      const seatIds = selectedSeatArray.map(s => s.seatId);
      console.log('Extracted seat IDs:', seatIds);

      console.log('=== Step 1: Holding seats ===');
      console.log('Showtime ID:', showtimeId);
      console.log('Seat IDs:', seatIds);

      // Step 1: Hold seats temporarily (booking hold)
      const holdResponse = await apiService.holdSeats(showtimeId, seatIds);
      console.log('=== Hold Response ===');
      console.log('Response:', JSON.stringify(holdResponse, null, 2));

      if (!holdResponse) {
        throw new Error('Không nhận được phản hồi từ server khi giữ ghế.');
      }

      // Check response code (accept both 200 and 201)
      if (holdResponse.code && holdResponse.code !== 200 && holdResponse.code !== 201) {
        throw new Error(holdResponse.message || 'Không thể giữ ghế. Vui lòng thử lại.');
      }

      console.log('✅ Seats held successfully');

      // Prepare data for combo selection
      const bookingData = {
        seatArray: selectedSeatArray.map(s => s.id),
        seats: selectedSeatArray.map(s => ({
          seatId: s.seatId,
          seatRow: s.row,
          seatNumber: s.number,
          price: s.price,
          displayName: s.id,
        })),
        seatIds: seatIds,
        totalPrice: price,
        time: showtime?.startTime || 'N/A',
        date: new Date().toLocaleDateString(),
        ticketImage: posterImage,
        showtimeId: showtimeId,
        movieId: movieId,
      };

      await EncryptedStorage.setItem('pending_booking', JSON.stringify(bookingData));

      ToastAndroid.showWithGravity(
        'Ghế đã được giữ. Chọn combo...',
        ToastAndroid.SHORT,
        ToastAndroid.BOTTOM,
      );

      // Navigate to combo selection screen
      if (navigation?.navigate) {
        navigation.navigate('ComboSelection', {
          bookingData
        });
      } else {
        navigate('/combo-selection', {
          state: {
            bookingData
          }
        });
      }

    } catch (error: any) {
      console.error('Error booking seats:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      let errorMessage = 'Đặt ghế thất bại. Vui lòng thử lại.';

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
      setIsBooking(false);
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
          <Text style={styles.headerTitle}>Chọn Ghế</Text>
          {showtime && (
            <Text style={styles.headerSubtitle}>
              {showtime.room?.type?.name} • {showtime.startTime}
            </Text>
          )}
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        {/* Loading State */}
        {isLoadingSeats ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF4500" />
            <Text style={styles.loadingText}>Đang tải ghế...</Text>
          </View>
        ) : seatsError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{seatsError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setIsLoadingSeats(true);
                setSeatsError(null);
              }}>
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Screen Indicator */}
            <View style={styles.screenContainer}>
              <View style={styles.screenCurve} />
              <Text style={styles.screenText}>MÀN HÌNH</Text>
            </View>

            {/* Seat Map */}
            <View style={styles.seatMapContainer}>
              {twoDSeatArray?.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.seatRow}>
                  {/* Row Label - Left */}
                  <Text style={styles.rowLabel}>{row[0]?.row}</Text>

                  {/* Seats */}
                  <View style={styles.seatsWrapper}>
                    {row?.map((seat, seatIndex) => (
                      <TouchableOpacity
                        key={seat.id}
                        style={[
                          styles.seat,
                          seat.held && styles.heldSeat,
                          seat.taken && styles.takenSeat,
                          seat.selected && styles.selectedSeat,
                        ]}
                        onPress={() => selectSeat(rowIndex, seatIndex)}
                        disabled={seat.taken || seat.held}
                        activeOpacity={0.7}>
                        <Text
                          style={[
                            styles.seatNumber,
                            seat.taken && styles.takenSeatNumber,
                            seat.selected && styles.selectedSeatNumber,
                          ]}>
                          {seat.number}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Row Label - Right */}
                  <Text style={styles.rowLabel}>{row[0]?.row}</Text>
                </View>
              ))}
            </View>

            {/* Legend */}
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, styles.availableLegend]} />
                <Text style={styles.legendText}>Trống</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, styles.selectedLegend]} />
                <Text style={styles.legendText}>Đã chọn</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, styles.heldLegend]} />
                <Text style={styles.legendText}>Đang giữ</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, styles.takenLegend]} />
                <Text style={styles.legendText}>Đã đặt</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceSection}>
          <Text style={styles.totalPriceLabel}>Tổng tiền</Text>
          <Text style={styles.totalPrice}>{price.toLocaleString('vi-VN')} VNĐ</Text>
          <Text style={styles.seatCount}>
            {selectedSeatArray.length} {selectedSeatArray.length === 1 ? 'ghế' : 'ghế'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.bookButton, (selectedSeatArray.length === 0 || isBooking) && styles.bookButtonDisabled]}
          onPress={BookSeats}
          disabled={selectedSeatArray.length === 0 || isBooking}
          activeOpacity={0.8}>
          <LinearGradient
            colors={selectedSeatArray.length > 0 && !isBooking ? ['#FF6B35', '#FF4500'] : ['#666', '#555']}
            style={styles.bookButtonGradient}>
            {isBooking ? (
              <>
                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.bookButtonText}>Đang xử lý...</Text>
              </>
            ) : (
              <Text style={styles.bookButtonText}>
                {selectedSeatArray.length > 0 ? 'Tiếp tục' : 'Chọn ghế'}
              </Text>
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
  screenContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  screenCurve: {
    width: 250,
    height: 8,
    backgroundColor: '#FF4500',
    borderRadius: 50,
    marginBottom: 8,
    shadowColor: '#FF4500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  screenText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
  },
  seatMapContainer: {
    paddingHorizontal: 5,
    marginTop: 20,
  },
  seatRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  rowLabel: {
    color: '#888',
    fontSize: 13,
    fontWeight: 'bold',
    width: 22,
    textAlign: 'center',
  },
  seatsWrapper: {
    flexDirection: 'row',
    gap: 6,
    marginHorizontal: 6,
  },
  seat: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heldSeat: {
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderColor: 'rgba(255,215,0,0.5)',
  },
  takenSeat: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
    opacity: 0.4,
  },
  selectedSeat: {
    backgroundColor: '#FF4500',
    borderColor: '#FF6B35',
    shadowColor: '#FF4500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  seatNumber: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  takenSeatNumber: {
    color: '#666',
  },
  selectedSeatNumber: {
    color: '#fff',
    fontWeight: 'bold',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 20,
    borderRadius: 12,
  },
  legendItem: {
    alignItems: 'center',
  },
  legendBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginBottom: 6,
  },
  availableLegend: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heldLegend: {
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.5)',
  },
  selectedLegend: {
    backgroundColor: '#FF4500',
  },
  takenLegend: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    opacity: 0.4,
  },
  legendText: {
    color: '#888',
    fontSize: 10,
    fontWeight: '500',
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
  seatCount: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  bookButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginLeft: 16,
  },
  bookButtonDisabled: {
    opacity: 0.5,
  },
  bookButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
});

export default SeatBookingScreen;
