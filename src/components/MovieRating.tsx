import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface MovieRatingProps {
  rating: number;
  totalRatings: number;
  size?: 'small' | 'medium' | 'large';
}

export const MovieRating: React.FC<MovieRatingProps> = ({ 
  rating, 
  totalRatings, 
  size = 'medium' 
}) => {
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating / 2);
    const hasHalfStar = rating % 2 >= 1;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Icon 
            key={i} 
            name="star" 
            size={styles[size].starSize} 
            color="#FFD700" 
          />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Icon 
            key={i} 
            name="star-half" 
            size={styles[size].starSize} 
            color="#FFD700" 
          />
        );
      } else {
        stars.push(
          <Icon 
            key={i} 
            name="star-outline" 
            size={styles[size].starSize} 
            color="#666" 
          />
        );
      }
    }
    
    return stars;
  };

  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>
        {renderStars()}
      </View>
      <Text style={[styles.ratingText, styles[size].text]}>
        {rating.toFixed(1)} ({totalRatings.toLocaleString()})
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    color: '#fff',
    fontWeight: '600',
  },
  small: {
    starSize: 12,
    text: {
      fontSize: 12,
    },
  },
  medium: {
    starSize: 16,
    text: {
      fontSize: 14,
    },
  },
  large: {
    starSize: 20,
    text: {
      fontSize: 16,
    },
  },
});