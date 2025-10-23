import React from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  FlatList,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

interface Movie {
  id: number;
  title: string;
  image: string;
}

const popularMovies: Movie[] = [
  { id: 1, title: 'Shazam', image: 'https://static1.srcdn.com/wordpress/wp-content/uploads/2023/03/dc-shazam-2-poster.jpg' },
  { id: 2, title: 'John Wick: Chapter 4', image: 'https://image.tmdb.org/t/p/original/mj2Z9HnRSIEk3n7yVPoOY4Uzzfh.jpg' },
];

const upcomingMovies: Movie[] = [
  { id: 3, title: 'The Flash', image: 'https://m.media-amazon.com/images/M/MV5BZDcwMzU4NWYtODIzZi00Yzg4LWJhOTAtOTQ2ZDA4NmFlYmFlXkEyXkFqcGdeQXVyMTY1MTU3NDY5._V1_.jpg' },
  { id: 4, title: 'Transformers: Rise of the Beasts', image: 'https://sportshub.cbsistatic.com/i/2023/05/08/b3064901-06b9-4c52-8905-456de0b2e435/transformers-rise-of-the-beasts-wheeljack-poster.jpg?auto=webp&width=2025&height=3000&crop=0.675:1,smart' },
];

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search-outline" size={20} color="#aaa" />
        <TextInput
          placeholder="Search your Movies..."
          placeholderTextColor="#aaa"
          style={styles.searchInput}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Now Playing */}
        <Text style={styles.sectionTitle}>Now Playing</Text>
        <View style={styles.nowPlayingCard}>
          <Image
            source={{ uri: 'https://image.tmdb.org/t/p/original/mj2Z9HnRSIEk3n7yVPoOY4Uzzfh.jpg' }}
            style={styles.nowPlayingImage}
          />
          <View style={styles.ratingRow}>
            <Icon name="star" color="gold" size={14} />
            <Text style={styles.ratingText}>8.0 (1024)</Text>
          </View>
          <Text style={styles.movieTitle}>John Wick: Chapter 4</Text>
          <View style={styles.tagsRow}>
            <View style={styles.tag}><Text style={styles.tagText}>Action</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>Thriller</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>Crime</Text></View>
          </View>
        </View>

        {/* Popular */}
        <Text style={styles.sectionTitle}>Popular</Text>
        <FlatList
          horizontal
          data={popularMovies}
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.movieCard}>
              <Image source={{ uri: item.image }} style={styles.movieImage} />
              <Text style={styles.movieName}>{item.title}</Text>
            </View>
          )}
        />

        {/* Upcoming */}
        <Text style={styles.sectionTitle}>Upcoming</Text>
        <FlatList
          horizontal
          data={upcomingMovies}
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.movieCard}>
              <Image source={{ uri: item.image }} style={styles.movieImage} />
              <Text style={styles.movieName}>{item.title}</Text>
            </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    marginLeft: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 10,
  },
  nowPlayingCard: {
    alignItems: 'center',
  },
  nowPlayingImage: {
    width: width * 0.8,
    height: width * 1.1,
    borderRadius: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    marginTop: 6,
    alignItems: 'center',
  },
  ratingText: {
    color: '#ccc',
    marginLeft: 4,
  },
  movieTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: '#222',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  tagText: {
    color: '#ccc',
    fontSize: 12,
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
  },
});
