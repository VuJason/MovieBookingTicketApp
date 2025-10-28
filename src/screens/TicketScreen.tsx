import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apicall';

interface Ticket {
  bookingId: number;
  movieTitle: string;
  posterUrl: string;
  showtime: string;
  date: string;
  room: string;
  seats: string[];
  seatsWithPrice?: Array<{
    code: string;
    price: number;
  }>;
  combos?: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
  qrCode?: string;
}

const TicketScreen = ({ navigation }: any) => {
  const { isLoggedIn } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    if (isLoggedIn) {
      fetchTickets();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      
      const response = await apiService.getUserBookings();
      console.log('Bookings response:', response);
      
      if (response && response.data) {
        // Transform API data to Ticket format
        const transformedTickets: Ticket[] = response.data.map((booking: any) => {
          // Extract seat codes from tickets array
          const seats = booking.tickets?.map((ticket: any) => ticket.seatCode) || [];
          
          // Get showtime info
          const showtime = booking.showtime;
          const movie = showtime?.movie;
          
          // Format showtime date (startTime) to date
          const showtimeDate = showtime?.startTime ? 
            new Date(showtime.startTime).toLocaleDateString('vi-VN') : 
            'N/A';
          
          // Format showtime time (startTime) to time only
          const showtimeTime = showtime?.startTime ? 
            new Date(showtime.startTime).toLocaleTimeString('vi-VN', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            }) : 
            'N/A';
          
          // Get room info
          const room = showtime?.room || booking.room;
          const roomName = room?.type || `Phòng ${room?.roomNumber || 'N/A'}`;
          
          // Map status
          let status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' = 'PENDING';
          if (booking.status === 'SUCCESS' || booking.status === 'CONFIRMED') {
            status = 'CONFIRMED';
          } else if (booking.status === 'CANCELLED' || booking.status === 'FAILED') {
            status = 'CANCELLED';
          }
          
          // Get movie info
          const movieTitle = movie?.name || movie?.title || 'Movie';
          const posterUrl = movie?.posterUrl || 'https://via.placeholder.com/500x750/333/fff?text=Movie';
          
          // Transform tickets to include price
          const seatsWithPrice = booking.tickets?.map((ticket: any) => ({
            code: ticket.seatCode,
            price: ticket.price,
          })) || [];
          
          return {
            bookingId: booking.id,
            movieTitle: movieTitle,
            posterUrl: posterUrl,
            showtime: showtimeTime,
            date: showtimeDate,
            room: roomName,
            seats: seats,
            seatsWithPrice: seatsWithPrice,
            combos: booking.combos || [],
            totalAmount: booking.totalAmount || 0,
            status: status,
            qrCode: booking.qrCode,
          };
        });
        
        console.log('Transformed tickets:', transformedTickets);
        setTickets(transformedTickets);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'Đã xác nhận';
      case 'PENDING':
        return 'Chờ thanh toán';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const renderTicketCard = (ticket: Ticket) => (
    <TouchableOpacity
      key={ticket.bookingId}
      style={styles.ticketCard}
      activeOpacity={0.95}>
      
      {/* Background Gradient with Glow */}
      <LinearGradient
        colors={['#2a2a2a', '#1a1a1a', '#0a0a0a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ticketGradient}>
        
        {/* Accent Line */}
        <LinearGradient
          colors={['#FF6B35', '#FF4500', '#FF2500']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.accentLine}
        />
        
        {/* Top Section - Movie Poster & Info */}
        <View style={styles.ticketTop}>
          {/* Poster with Shadow */}
          <View style={styles.posterContainer}>
            <Image
              source={{ uri: ticket.posterUrl }}
              style={styles.ticketPoster}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.posterOverlay}
            />
          </View>
          
          {/* Movie Info */}
          <View style={styles.ticketInfo}>
            <Text style={styles.ticketTitle} numberOfLines={2}>
              {ticket.movieTitle}
            </Text>
            
            <View style={styles.detailsContainer}>
              <View style={styles.ticketDetail}>
                <View style={styles.iconCircle}>
                  <Text style={styles.iconText}>📅</Text>
                </View>
                <View>
                  <Text style={styles.detailLabel}>Ngày chiếu</Text>
                  <Text style={styles.ticketDetailText}>{ticket.date}</Text>
                </View>
              </View>
              
              <View style={styles.ticketDetail}>
                <View style={styles.iconCircle}>
                  <Text style={styles.iconText}>🕐</Text>
                </View>
                <View>
                  <Text style={styles.detailLabel}>Giờ chiếu</Text>
                  <Text style={styles.ticketDetailText}>{ticket.showtime}</Text>
                </View>
              </View>
              
              <View style={styles.ticketDetail}>
                <View style={styles.iconCircle}>
                  <Text style={styles.iconText}>🎬</Text>
                </View>
                <View>
                  <Text style={styles.detailLabel}>Phòng</Text>
                  <Text style={styles.ticketDetailText}>{ticket.room}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Decorative Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerCircleLeft} />
          <View style={styles.dividerDots}>
            {[...Array(20)].map((_, i) => (
              <View key={i} style={styles.dot} />
            ))}
          </View>
          <View style={styles.dividerCircleRight} />
        </View>

        {/* Bottom Section - Seats, Combos & QR */}
        <View style={styles.ticketBottom}>
          <View style={styles.seatInfo}>
            {/* Seats */}
            <Text style={styles.seatLabel}>GHẾ NGỒI</Text>
            <View style={styles.seatsColumn}>
              {ticket.seatsWithPrice && ticket.seatsWithPrice.length > 0 ? (
                ticket.seatsWithPrice.map((seat, index) => (
                  <View key={index} style={styles.seatRow}>
                    <View style={styles.seatBadge}>
                      <Text style={styles.seatBadgeText}>{seat.code}</Text>
                    </View>
                    <Text style={styles.seatPrice}>
                      {seat.price.toLocaleString('vi-VN')} ₫
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.seatsRow}>
                  {ticket.seats.map((seat, index) => (
                    <View key={index} style={styles.seatBadge}>
                      <Text style={styles.seatBadgeText}>{seat}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            
            {/* Combos */}
            {ticket.combos && ticket.combos.length > 0 && (
              <>
                <Text style={[styles.seatLabel, { marginTop: 12 }]}>COMBO</Text>
                <View style={styles.combosContainer}>
                  {ticket.combos.map((combo: any, index: number) => (
                    <View key={index} style={styles.comboItem}>
                      <Text style={styles.comboName}>
                        {combo.name} x{combo.quantity}
                      </Text>
                      <Text style={styles.comboPrice}>
                        {(combo.price * combo.quantity).toLocaleString('vi-VN')} ₫
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
            
            {/* Total Price */}
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Tổng tiền</Text>
              <Text style={styles.ticketPrice}>
                {ticket.totalAmount.toLocaleString('vi-VN')} ₫
              </Text>
            </View>
          </View>

          {/* QR Code with Glow */}
          <View style={styles.qrContainer}>
            <LinearGradient
              colors={['#fff', '#f0f0f0']}
              style={styles.qrCode}>
              <Text style={styles.qrText}>QR</Text>
              <Text style={styles.qrId}>#{ticket.bookingId}</Text>
            </LinearGradient>
            <View style={styles.qrGlow} />
          </View>
        </View>

        {/* Status Badge with Gradient */}
        <LinearGradient
          colors={
            ticket.status === 'CONFIRMED'
              ? ['#4CAF50', '#45a049']
              : ticket.status === 'PENDING'
              ? ['#FFA500', '#ff8c00']
              : ['#FF4500', '#dc3545']
          }
          style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {getStatusText(ticket.status)}
          </Text>
        </LinearGradient>
        
        {/* Corner Decoration */}
        <View style={styles.cornerDecoration} />
      </LinearGradient>
    </TouchableOpacity>
  );

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎫</Text>
          <Text style={styles.emptyTitle}>Chưa đăng nhập</Text>
          <Text style={styles.emptyText}>
            Vui lòng đăng nhập để xem vé của bạn
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation?.navigate('Login')}>
            <LinearGradient
              colors={['#FF6B35', '#FF4500']}
              style={styles.loginButtonGradient}>
              <Text style={styles.loginButtonText}>Đăng nhập</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Vé của tôi</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'upcoming' && styles.tabTextActive,
            ]}>
            Sắp tới
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'past' && styles.tabTextActive,
            ]}>
            Đã xem
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF4500" />
          <Text style={styles.loadingText}>Đang tải vé...</Text>
        </View>
      ) : tickets.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          <Text style={styles.emptyIcon}>🎫</Text>
          <Text style={styles.emptyTitle}>Chưa có vé nào</Text>
          <Text style={styles.emptyText}>
            Đặt vé ngay để xem phim yêu thích của bạn
          </Text>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => navigation?.navigate('Home')}>
            <LinearGradient
              colors={['#FF6B35', '#FF4500']}
              style={styles.bookButtonGradient}>
              <Text style={styles.bookButtonText}>Đặt vé ngay</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          {tickets.map(renderTicketCard)}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#000',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#FF4500',
  },
  tabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  ticketCard: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#FF4500',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  ticketGradient: {
    padding: 0,
    position: 'relative',
  },
  accentLine: {
    height: 4,
    width: '100%',
  },
  ticketTop: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 16,
  },
  posterContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  ticketPoster: {
    width: 90,
    height: 130,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  posterOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  ticketInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'flex-start',
  },
  ticketTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    lineHeight: 26,
  },
  detailsContainer: {
    gap: 10,
  },
  ticketDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,69,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  iconText: {
    fontSize: 16,
  },
  detailLabel: {
    fontSize: 10,
    color: '#888',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ticketDetailText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 20,
  },
  dividerCircleLeft: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000',
    marginLeft: -32,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dividerDots: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dividerCircleRight: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000',
    marginRight: -32,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  ticketBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 16,
  },
  seatInfo: {
    flex: 1,
  },
  seatLabel: {
    fontSize: 10,
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  seatsColumn: {
    gap: 8,
    marginBottom: 12,
  },
  seatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  seatBadge: {
    backgroundColor: 'rgba(255,69,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,69,0,0.4)',
  },
  seatBadgeText: {
    color: '#FF6B35',
    fontSize: 13,
    fontWeight: 'bold',
  },
  seatPrice: {
    fontSize: 13,
    color: '#ccc',
    fontWeight: '600',
  },
  combosContainer: {
    gap: 6,
  },
  comboItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#FF6B35',
  },
  comboName: {
    fontSize: 12,
    color: '#ccc',
    flex: 1,
  },
  comboPrice: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
    marginLeft: 8,
  },
  priceContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  priceLabel: {
    fontSize: 10,
    color: '#888',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ticketPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF4500',
    letterSpacing: 0.5,
  },
  qrContainer: {
    position: 'relative',
    marginLeft: 16,
  },
  qrCode: {
    width: 90,
    height: 90,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  qrGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    zIndex: -1,
  },
  qrText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  qrId: {
    fontSize: 9,
    color: '#666',
    marginTop: 4,
    fontWeight: '600',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cornerDecoration: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255,69,0,0.05)',
    borderTopLeftRadius: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  loginButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bookButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  bookButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TicketScreen;
