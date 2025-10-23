import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, Image, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface Movie {
  id: number;
  title: string;
  image: string;
}

const allMovies: Movie[] = [
  { id: 1, title: 'John Wick: Chapter 4', image: 'https://image.tmdb.org/t/p/original/mj2Z9HnRSIEk3n7yVPoOY4Uzzfh.jpg' },
  { id: 2, title: 'Shazam', image: 'https://static1.srcdn.com/wordpress/wp-content/uploads/2023/03/dc-shazam-2-poster.jpg' },
  { id: 3, title: 'The Flash', image: 'https://m.media-amazon.com/images/M/MV5BZDcwMzU4NWYtODIzZi00Yzg4LWJhOTAtOTQ2ZDA4NmFlYmFlXkEyXkFqcGdeQXVyMTY1MTU3NDY5._V1_.jpg' },
  { id: 4, title: 'Transformers', image: 'https://sportshub.cbsistatic.com/i/2023/05/08/b3064901-06b9-4c52-8905-456de0b2e435/transformers-rise-of-the-beasts-wheeljack-poster.jpg?auto=webp&width=2025&height=3000&crop=0.675:1,smart' },
];

export default function SearchScreen() {
  const [query, setQuery] = useState('');

  const filteredMovies = allMovies.filter((movie) =>
    movie.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Search bar */}
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

      {filteredMovies.length > 0 ? (
        <FlatList
          data={filteredMovies}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.movieCard}>
              <Image source={{ uri: item.image }} style={styles.image} />
              <Text style={styles.title}>{item.title}</Text>
            </View>
          )}
        />
      ) : (
        <View style={styles.emptyView}>
          <Text style={styles.emptyText}>No movies found.</Text>
        </View>
      )}
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
    alignItems: 'center',
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
    fontWeight: '500',
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
});
