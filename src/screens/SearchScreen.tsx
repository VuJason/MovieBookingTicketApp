import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, Image, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigate } from 'react-router-native';

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
  categoryNames: string[];
}

export default function SearchScreen() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hàm gọi API
  const fetchMovies = async (searchText: string) => {
    if (!searchText.trim()) {
      setMovies([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://10.0.2.2:8080/api/movies/search?name=${encodeURIComponent(searchText)}`
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data: Movie[] = await response.json();
      setMovies(data);
    } catch (err: any) {
      setError(err.message);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  // Gọi API sau khi người dùng dừng nhập 0.5 giây (debounce)
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchMovies(query);
    }, 500);
    return () => clearTimeout(delay);
  }, [query]);

  return (
    <View style={styles.container}>
      {/* Ô tìm kiếm */}
      <View style={styles.searchContainer}>
        <Icon name="search-outline" size={20} color="#aaa" />
        <TextInput
          placeholder="Search movies..."
          placeholderTextColor="#aaa"
          style={styles.input}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={styles.errorText}>Error: {error}</Text>
      ) : movies.length > 0 ? (
        <FlatList
          data={movies}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.movieCard}
              onPress={() => navigate(`/movie/${item.id}`)}
              activeOpacity={0.7}
            >
              <Image source={{ uri: item.posterUrl }} style={styles.image} />
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.desc} numberOfLines={2}>
                  {item.description}
                </Text>
                <Text style={styles.category}>
                  {item.categoryNames.join(', ')}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : query ? (
        <View style={styles.emptyView}>
          <Text style={styles.emptyText}>No movies found.</Text>
        </View>
      ) : null}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    color: '#fff',
    marginLeft: 8,
  },
  movieCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 8,
  },
  image: {
    width: 70,
    height: 100,
    borderRadius: 8,
    marginRight: 12,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  desc: {
    color: '#bbb',
    fontSize: 13,
    marginBottom: 4,
  },
  category: {
    color: '#888',
    fontSize: 12,
  },
  emptyView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginTop: 40,
    textAlign: 'center',
  },
});
