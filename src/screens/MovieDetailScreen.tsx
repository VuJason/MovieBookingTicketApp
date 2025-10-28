import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  ImageBackground,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useParams, useNavigate } from 'react-router-native';
import { Movie, CastMember, ShowTime, ShowtimeByDate } from '../types/Movie';
import { apiService } from '../api/apicall';
import { groupShowtimesByDate } from '../utils/showtimeUtils';
import WeeklyShowtimeSelector from '../components/WeeklyShowtimeSelector';

const { width, height } = Dimensions.get('window');

interface MovieDetailScreenProps {
  navigation?: any;
  route?: {
    params?: {
      movieId?: number;
    };
  };
}

const MovieDetailScreen: React.FC<MovieDetailScreenProps> = ({ navigation, route }) => {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showtimes, setShowtimes] = useState<ShowTime[]>([]);
  const [showtimesByDate, setShowtimesByDate] = useState<ShowtimeByDate[]>([]);
  const [isLoadingShowtimes, setIsLoadingShowtimes] = useState(false);
  const [selectedShowtime, setSelectedShowtime] = useState<ShowTime | null>(null);

  // React Router navigation
  const navigate = useNavigate();

  // Get movie ID from React Router params
  const { id } = useParams<{ id: string }>();
  const movieId = id ? parseInt(id, 10) : route?.params?.movieId;

  useEffect(() => {
    if (movieId) {
      fetchMovieDetail();
      fetchShowtimes();
    } else {
      setError('No movie ID provided');
      setIsLoading(false);
    }
  }, [movieId]);

  const fetchMovieDetail = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.getMovieDetail(movieId!);

      if (response && response.data) {
        // Transform API response to match our Movie interface
        const movieData: Movie = {
          id: response.data.id || movieId,
          name: response.data.name || 'Unknown Movie',
          posterUrl: response.data.posterUrl || 'https://via.placeholder.com/300x450',
          backdrop: response.data.posterUrl || 'https://via.placeholder.com/800x450',
          duration: response.data.duration || 120,
          releaseDate: formatReleaseDate(response.data.releaseDate || new Date().toISOString()),
          categoryNames: response.data.categoryNames || ['Unknown'],
          description: response.data.description || 'No description available',
          trailer: response.data.trailer || '',
          director: response.data.director || 'Unknown Director',
          actor: response.data.actor || 'Unknown Actor',
          isComingSoon: response.data.isComingSoon || false,
          endDate: response.data.endDate,
          createdAt: response.data.createdAt || new Date().toISOString(),
          updatedAt: response.data.updatedAt || new Date().toISOString(),
          // Add default values for optional fields
          rating: 8.0, // Default rating since API doesn't provide
          totalRatings: 100, // Default total ratings
          cast: [] // Empty cast array since API doesn't provide cast info
        };

        setMovie(movieData);
        console.log('Movie data loaded:', movieData);
        console.log('Trailer URL:', movieData.trailer);
      } else {
        throw new Error(response?.message || 'No data received from API');
      }
    } catch (error: any) {
      console.error('Error fetching movie detail:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });

      const errorMessage = error.message || 'Failed to load movie details';
      setError(errorMessage);

      // Show a more user-friendly error message
      Alert.alert(
        'Lỗi kết nối',
        'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet và thử lại.',
        [
          { text: 'Thử lại', onPress: fetchMovieDetail },
          { text: 'Hủy', style: 'cancel' }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShowtimes = async () => {
    try {
      setIsLoadingShowtimes(true);
      const response = await apiService.getShowtimesByMovieId(movieId!);

      if (response && response.data) {
        setShowtimes(response.data);

        // Group showtimes by date
        const grouped = groupShowtimesByDate(response.data);
        setShowtimesByDate(grouped);
      } else {
        setShowtimes([]);
        setShowtimesByDate([]);
      }
    } catch (error: any) {
      console.error('Error fetching showtimes:', error);
      setShowtimes([]);
      setShowtimesByDate([]);
    } finally {
      setIsLoadingShowtimes(false);
    }
  };

  // Helper function to format release date
  const formatReleaseDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString; // Return original string if parsing fails
    }
  };

  // Helper function to format duration
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleShowtimeSelect = (showtime: ShowTime | null) => {
    setSelectedShowtime(showtime);
  };

  const handleSelectSeats = () => {
    if (!selectedShowtime) {
      Alert.alert(
        'Chưa chọn suất chiếu',
        'Vui lòng chọn suất chiếu trước khi đặt ghế.',
        [{ text: 'OK' }]
      );
      return;
    }

    console.log('Navigating to SeatBooking with:', {
      movieId: movie?.id,
      showtimeId: selectedShowtime.id,
      showtime: selectedShowtime,
    });

    // Try both navigation methods
    if (navigation?.navigate) {
      // React Navigation style
      navigation.navigate('SeatBooking', {
        movieId: movie?.id,
        showtimeId: selectedShowtime.id,
        showtime: selectedShowtime,
        movieName: movie?.name,
        posterUrl: movie?.posterUrl,
        BgImage: movie?.posterUrl,
        PosterImage: movie?.posterUrl,
      });
    } else {
      // React Router Native style
      navigate('/seat-booking', {
        state: {
          movieId: movie?.id,
          showtimeId: selectedShowtime.id,
          showtime: selectedShowtime,
          movieName: movie?.name,
          posterUrl: movie?.posterUrl,
          BgImage: movie?.posterUrl,
          PosterImage: movie?.posterUrl,
        }
      });
    }
  };

  const handlePlayTrailer = async () => {
    if (!movie?.trailer) {
      Alert.alert('Không có Trailer', 'Trailer không khả dụng cho phim này.');
      return;
    }

    try {
      const supported = await Linking.canOpenURL(movie.trailer);
      if (supported) {
        await Linking.openURL(movie.trailer);
      } else {
        Alert.alert('Lỗi', 'Không thể mở URL trailer');
      }
    } catch (error) {
      console.error('Error opening trailer:', error);
      Alert.alert('Lỗi', 'Không thể mở trailer');
    }
  };

  // Helper function to extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    console.log('Extracting YouTube ID from URL:', url);
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    console.log('Extracted video ID:', videoId);
    return videoId;
  };

  // State for selected date
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Reset selected showtime when date changes
  useEffect(() => {
    setSelectedShowtime(null);
  }, [selectedDate]);

  // Get available dates from showtimes
  const renderGenreTag = (genre: string, index: number) => (
    <View key={index} style={styles.genreTag}>
      <Text style={styles.genreText}>{genre}</Text>
    </View>
  );

  const renderCastMember = (cast: CastMember, index: number) => (
    <View key={cast.id} style={styles.castItem}>
      <Image source={{ uri: cast.profileImage }} style={styles.castImage} />
      <Text style={styles.castName} numberOfLines={1}>{cast.name}</Text>
      <Text style={styles.castCharacter} numberOfLines={1}>{cast.character}</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4500" />
        <Text style={styles.loadingText}>Đang tải thông tin phim...</Text>
      </View>
    );
  }

  if (error || !movie) {
    return (
      <View style={styles.loadingContainer}>
        <Icon name="alert-circle-outline" size={48} color="#FF4500" />
        <Text style={styles.errorText}>{error || 'Không thể tải phim'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchMovieDetail}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with backdrop */}
        <View style={styles.headerContainer}>
          <ImageBackground
            source={{ uri: movie.posterUrl }}
            style={styles.backdropImage}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
              style={styles.backdropGradient}
            >
              {/* Navigation */}
              <View style={styles.navigation}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    // Navigate back to HomeScreen using React Router
                    navigate('/');
                  }}
                >
                  <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.favoriteButton}>
                  <Icon name="heart-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Movie Info */}
        <View style={styles.movieInfoContainer}>
          <View style={styles.posterSection}>
            <Image source={{ uri: movie.posterUrl }} style={styles.posterImage} />

            <View style={styles.movieDetails}>
              <View style={styles.durationContainer}>
                <Icon name="time-outline" size={16} color="#888" />
                <Text style={styles.duration}>{formatDuration(movie.duration)}</Text>
              </View>

              <Text style={styles.movieTitle}>{movie.name}</Text>

              <View style={styles.genresContainer}>
                {movie.categoryNames.map(renderGenreTag)}
              </View>

              {movie.tagline && (
                <Text style={styles.tagline}>{movie.tagline}</Text>
              )}

              <View style={styles.ratingContainer}>
                <Icon name="star" size={20} color="#FFD700" />
                <Text style={styles.rating}>
                  {movie.rating} ({movie.totalRatings})
                </Text>
                <Text style={styles.releaseDate}>{movie.releaseDate}</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>{movie.description}</Text>
          </View>

          {/* Cast & Crew */}
          <View style={styles.castContainer}>
            <View style={styles.castHeader}>
              <Text style={styles.castTitle}>Diễn viên & Đạo diễn</Text>
            </View>

            {/* Director */}
            <View style={styles.crewItem}>
              <Text style={styles.crewRole}>Đạo diễn</Text>
              <Text style={styles.crewName}>{movie.director}</Text>
            </View>

            {/* Actor */}
            <View style={styles.crewItem}>
              <Text style={styles.crewRole}>Diễn viên</Text>
              <Text style={styles.crewName}>{movie.actor}</Text>
            </View>
          </View>

          {/* Trailer Section */}
          <View style={styles.trailerContainer}>
            <Text style={styles.trailerTitle}>Trailer</Text>
            {movie.trailer ? (
              <TouchableOpacity
                style={styles.youtubeContainer}
                onPress={handlePlayTrailer}
                activeOpacity={0.8}
              >
                <View style={styles.trailerThumbnail}>
                  <Image
                    source={{
                      uri: `https://img.youtube.com/vi/${getYouTubeVideoId(movie.trailer) || 'default'}/maxresdefault.jpg`
                    }}
                    style={styles.trailerImage}
                    resizeMode="cover"
                  />
                  <View style={styles.playOverlay}>
                    <Icon name="play" size={48} color="#fff" />
                  </View>
                </View>
                <Text style={styles.trailerText}>Nhấn để xem trailer</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.noTrailerContainer}>
                <Icon name="play-circle-outline" size={48} color="#666" />
                <Text style={styles.noTrailerText}>
                  Không có trailer
                </Text>
              </View>
            )}
          </View>

          {/* Showtime Section */}
          <View style={styles.showtimeContainer}>
            <Text style={styles.showtimeTitle}>Suất chiếu</Text>

            {/* Weekly Showtime Selector */}
            {isLoadingShowtimes ? (
              <View style={styles.loadingShowtimesContainer}>
                <ActivityIndicator size="small" color="#FF4500" />
                <Text style={styles.loadingShowtimesText}>Đang tải suất chiếu...</Text>
              </View>
            ) : (
              <WeeklyShowtimeSelector
                showtimes={showtimes}
                onShowtimeSelect={handleShowtimeSelect}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            )}
          </View>

          {/* Select Seats Button */}
          <TouchableOpacity
            style={[styles.selectSeatsButton, !selectedShowtime && styles.selectSeatsButtonDisabled]}
            onPress={handleSelectSeats}
            disabled={!selectedShowtime}
          >
            <LinearGradient
              colors={selectedShowtime ? ['#FF6B35', '#FF4500'] : ['#666', '#555']}
              style={styles.selectSeatsGradient}
            >
              <Icon name="ticket-outline" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.selectSeatsText}>
                {selectedShowtime ? 'Chọn ghế' : 'Vui lòng chọn suất chiếu'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    height: height * 0.4,
    position: 'relative',
  },
  backdropImage: {
    width: '100%',
    height: '100%',
  },
  backdropGradient: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: StatusBar.currentHeight || 44,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  movieInfoContainer: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  posterSection: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  posterImage: {
    width: 120,
    height: 180,
    borderRadius: 12,
    marginRight: 16,
  },
  movieDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  duration: {
    color: '#888',
    fontSize: 14,
    marginLeft: 4,
  },
  movieTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  genreTag: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  genreText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  tagline: {
    color: '#ccc',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
    marginRight: 12,
  },
  releaseDate: {
    color: '#888',
    fontSize: 14,
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  description: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
  castContainer: {
    marginBottom: 32,
  },
  castHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  castTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  castBadges: {
    flexDirection: 'row',
  },
  castBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4169E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  castBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  castScrollView: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  castItem: {
    width: 80,
    marginRight: 16,
    alignItems: 'center',
  },
  castImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  castName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 2,
  },
  castCharacter: {
    color: '#888',
    fontSize: 10,
    textAlign: 'center',
  },
  selectSeatsButton: {
    marginBottom: 32,
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectSeatsButtonDisabled: {
    opacity: 0.6,
  },
  selectSeatsGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  selectSeatsText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectedShowtimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  selectedShowtimeText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  crewItem: {
    marginBottom: 12,
  },
  crewRole: {
    color: '#888',
    fontSize: 14,
    marginBottom: 4,
  },
  crewName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  trailerContainer: {
    marginBottom: 24,
  },
  trailerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  youtubeContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  trailerThumbnail: {
    height: 200,
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trailerImage: {
    height: 200,
    width: '100%',
    backgroundColor: '#111',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trailerText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 12,
    backgroundColor: '#111',
  },
  noTrailerContainer: {
    height: 200,
    backgroundColor: '#111',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  noTrailerText: {
    color: '#666',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  // Showtime Styles
  showtimeContainer: {
    marginBottom: 24,
  },
  showtimeTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  loadingShowtimesContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingShowtimesText: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
  },
});

export default MovieDetailScreen;