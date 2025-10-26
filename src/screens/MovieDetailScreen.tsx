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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useParams, useNavigate } from 'react-router-native';
import { Movie, CastMember } from '../types/Movie';
import { apiService } from '../api/apicall';

const { width, height } = Dimensions.get('window');

interface MovieDetailScreenProps {
  navigation: any;
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

  // React Router navigation
  const navigate = useNavigate();
  
  // Get movie ID from React Router params
  const { id } = useParams<{ id: string }>();
  const movieId = id ? parseInt(id, 10) : route?.params?.movieId;

  useEffect(() => {
    if (movieId) {
      fetchMovieDetail();
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
        'Connection Error',
        'Unable to connect to the server. Please check your internet connection and try again.',
        [
          { text: 'Retry', onPress: fetchMovieDetail },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setIsLoading(false);
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

  const handleSelectSeats = () => {
    navigation?.navigate?.('SeatBooking', { movieId: movie?.id });
  };

  const handlePlayTrailer = () => {
    // Implement trailer playback
    console.log('Play trailer');
  };


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
        <Text style={styles.loadingText}>Loading movie details...</Text>
      </View>
    );
  }

  if (error || !movie) {
    return (
      <View style={styles.loadingContainer}>
        <Icon name="alert-circle-outline" size={48} color="#FF4500" />
        <Text style={styles.errorText}>{error || 'Failed to load movie'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchMovieDetail}>
          <Text style={styles.retryButtonText}>Retry</Text>
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

              {/* Play button */}
              <TouchableOpacity style={styles.playButton} onPress={handlePlayTrailer}>
                <Icon name="play" size={32} color="#fff" />
              </TouchableOpacity>
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
              <Text style={styles.castTitle}>Cast & Crew</Text>
            </View>
            
            {/* Director */}
            <View style={styles.crewItem}>
              <Text style={styles.crewRole}>Director</Text>
              <Text style={styles.crewName}>{movie.director}</Text>
            </View>
            
            {/* Actor */}
            <View style={styles.crewItem}>
              <Text style={styles.crewRole}>Actor</Text>
              <Text style={styles.crewName}>{movie.actor}</Text>
            </View>
            
            {/* Movie Status */}
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, { backgroundColor: movie.isComingSoon ? '#FF6B35' : '#4CAF50' }]}>
                <Text style={styles.statusText}>
                  {movie.isComingSoon ? 'Coming Soon' : 'Now Showing'}
                </Text>
              </View>
            </View>
          </View>

          {/* Select Seats Button */}
          <TouchableOpacity style={styles.selectSeatsButton} onPress={handleSelectSeats}>
            <LinearGradient
              colors={['#FF6B35', '#FF4500']}
              style={styles.selectSeatsGradient}
            >
              <Text style={styles.selectSeatsText}>Select Seats</Text>
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
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
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
  selectSeatsGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  selectSeatsText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
  statusContainer: {
    marginTop: 16,
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default MovieDetailScreen;