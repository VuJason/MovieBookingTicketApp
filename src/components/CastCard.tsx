import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { CastMember } from '../types/Movie';

interface CastCardProps {
  cast: CastMember;
  onPress?: (cast: CastMember) => void;
  size?: 'small' | 'medium' | 'large';
}

export const CastCard: React.FC<CastCardProps> = ({ 
  cast, 
  onPress, 
  size = 'medium' 
}) => {
  const Component = onPress ? TouchableOpacity : View;
  
  return (
    <Component 
      style={[styles.container, styles[size]]} 
      onPress={() => onPress?.(cast)}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.imageContainer, styles[`${size}Image`]]}>
        <Image 
          source={{ uri: cast.profileImage }} 
          style={[styles.image, styles[`${size}Image`]]}
          defaultSource={require('../assets/default-avatar.png')} // Add default avatar
        />
      </View>
      
      <Text 
        style={[styles.name, styles[`${size}Name`]]} 
        numberOfLines={1}
      >
        {cast.name}
      </Text>
      
      <Text 
        style={[styles.character, styles[`${size}Character`]]} 
        numberOfLines={1}
      >
        {cast.character}
      </Text>
    </Component>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: 12,
  },
  
  imageContainer: {
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: '#333',
  },
  
  image: {
    backgroundColor: '#333',
  },
  
  name: {
    color: '#fff',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 2,
  },
  
  character: {
    color: '#888',
    textAlign: 'center',
  },
  
  // Small size
  small: {
    width: 60,
  },
  smallImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  smallName: {
    fontSize: 10,
  },
  smallCharacter: {
    fontSize: 8,
  },
  
  // Medium size
  medium: {
    width: 80,
  },
  mediumImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  mediumName: {
    fontSize: 12,
  },
  mediumCharacter: {
    fontSize: 10,
  },
  
  // Large size
  large: {
    width: 100,
  },
  largeImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  largeName: {
    fontSize: 14,
  },
  largeCharacter: {
    fontSize: 12,
  },
});