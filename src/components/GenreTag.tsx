import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface GenreTagProps {
  genre: string;
  onPress?: () => void;
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'small' | 'medium' | 'large';
}

export const GenreTag: React.FC<GenreTagProps> = ({ 
  genre, 
  onPress, 
  variant = 'default',
  size = 'medium'
}) => {
  const Component = onPress ? TouchableOpacity : View;
  
  return (
    <Component 
      style={[
        styles.container, 
        styles[variant],
        styles[size]
      ]} 
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={[styles.text, styles[`${variant}Text`], styles[`${size}Text`]]}>
        {genre}
      </Text>
    </Component>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Variants
  default: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF4500',
  },
  filled: {
    backgroundColor: '#FF4500',
    borderWidth: 0,
  },
  
  // Sizes
  small: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  medium: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  large: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  
  // Text styles
  text: {
    fontWeight: '500',
  },
  defaultText: {
    color: '#fff',
  },
  outlinedText: {
    color: '#FF4500',
  },
  filledText: {
    color: '#fff',
  },
  
  // Text sizes
  smallText: {
    fontSize: 10,
  },
  mediumText: {
    fontSize: 12,
  },
  largeText: {
    fontSize: 14,
  },
});