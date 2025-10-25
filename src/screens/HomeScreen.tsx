import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigate } from 'react-router-native';

const { width } = Dimensions.get('window');

interface Movie {
  id: number;
  name: string;
  description: string;
  duration: number;
  director: string;
  actor: string;
  releaseDate: string;
  trailer: string;
  posterUrl: string;
  isComingSoon: boolean;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  categoryNames: string[];
}

export default function HomeScreen() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const nowPlayingRef = useRef<FlatList>(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await fetch('http://10.0.2.2:8080/api/movies');
        const data = await res.json();
        setMovies(data);
      } catch (error) {
        console.error('Error fetching movies:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  const nowPlayingMovies = movies.filter((m) => !m.isComingSoon);
  const upcomingMovies = movies.filter((m) => m.isComingSoon);

  // 🚀 Auto-scroll logic
  useEffect(() => {
    if (nowPlayingMovies.length === 0) return;

    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % nowPlayingMovies.length;
      nowPlayingRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    }, 4000); // 4 giây đổi phim

    return () => clearInterval(interval);
  }, [currentIndex, nowPlayingMovies.length]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ✅ Now Playing */}
        <Text style={styles.sectionTitle}>Now Playing</Text>
        {nowPlayingMovies.length > 0 ? (
          <>
            <FlatList
              ref={nowPlayingRef}
              horizontal
              data={nowPlayingMovies}
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              onScroll={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                setCurrentIndex(index);
              }}
              onScrollToIndexFailed={() => {}}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => navigate(`/movie/${item.id}`)}
                  activeOpacity={0.8}
                  style={{ width }}
                >
                  <Image source={{ uri: item.posterUrl }} style={styles.nowPlayingImage} />
                  <View style={styles.ratingRow}>
                    <Icon name="star" color="gold" size={14} />
                    <Text style={styles.ratingText}>8.0 (1024)</Text>
                  </View>
                  <Text style={styles.movieTitle}>{item.name}</Text>
                  <View style={styles.tagsRow}>
                    {item.categoryNames.map((cat: string) => (
  <View key={cat} style={styles.tag}>
    <Text style={styles.tagText}>{cat}</Text>
  </View>
))}
                  </View>
                </TouchableOpacity>
              )}
            />

            {/* 🔵 Dots Indicator */}
            <View style={styles.dotsContainer}>
              {nowPlayingMovies.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    currentIndex === i ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              ))}
            </View>
          </>
        ) : (
          <Text style={{ color: '#ccc' }}>No movies currently playing.</Text>
        )}

        {/* ✅ Popular */}
        <Text style={styles.sectionTitle}>Popular</Text>
        <FlatList
          horizontal
          data={nowPlayingMovies}
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.movieCard}
              onPress={() => navigate(`/movie/${item.id}`)}
            >
              <Image source={{ uri: item.posterUrl }} style={styles.movieImage} />
              <Text style={styles.movieName}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />

        {/* ✅ Upcoming */}
        <Text style={styles.sectionTitle}>Upcoming</Text>
        <FlatList
          horizontal
          data={upcomingMovies}
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.movieCard}
              onPress={() => navigate(`/movie/${item.id}`)}
            >
              <Image source={{ uri: item.posterUrl }} style={styles.movieImage} />
              <Text style={styles.movieName}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 10,
  },
  nowPlayingImage: {
    width: width * 0.8,
    height: width * 1.1,
    borderRadius: 16,
    alignSelf: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingText: {
    color: '#ccc',
    marginLeft: 4,
  },
  movieTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tag: {
    backgroundColor: '#222',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    margin: 2,
  },
  tagText: {
    color: '#ccc',
    fontSize: 12,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#fff',
  },
  dotInactive: {
    backgroundColor: '#555',
  },
  movieCard: {
    marginRight: 12,
    alignItems: 'center',
  },
  movieImage: {
    width: 120,
    height: 160,
    borderRadius: 12,
  },
  movieName: {
    color: '#fff',
    marginTop: 6,
    fontSize: 13,
    width: 120,
    textAlign: 'center',
  },
});
