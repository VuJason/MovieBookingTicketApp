import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

export const LoginBackground: React.FC = () => {
  const animatedValue1 = useRef(new Animated.Value(0)).current;
  const animatedValue2 = useRef(new Animated.Value(0)).current;
  const animatedValue3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (animatedValue: Animated.Value, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation1 = createAnimation(animatedValue1, 3000);
    const animation2 = createAnimation(animatedValue2, 4000);
    const animation3 = createAnimation(animatedValue3, 5000);

    animation1.start();
    animation2.start();
    animation3.start();

    return () => {
      animation1.stop();
      animation2.stop();
      animation3.stop();
    };
  }, []);

  const getAnimatedStyle = (animatedValue: Animated.Value, scale: number) => ({
    transform: [
      {
        scale: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, scale],
        }),
      },
      {
        rotate: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
    opacity: animatedValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.3, 0.8, 0.3],
    }),
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000', '#1a0a00', '#000']}
        style={styles.gradient}
      >
        <Animated.View
          style={[
            styles.animatedCircle,
            styles.circle1,
            getAnimatedStyle(animatedValue1, 1.2),
          ]}
        />
        <Animated.View
          style={[
            styles.animatedCircle,
            styles.circle2,
            getAnimatedStyle(animatedValue2, 1.5),
          ]}
        />
        <Animated.View
          style={[
            styles.animatedCircle,
            styles.circle3,
            getAnimatedStyle(animatedValue3, 1.3),
          ]}
        />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradient: {
    flex: 1,
  },
  animatedCircle: {
    position: 'absolute',
    borderRadius: 100,
  },
  circle1: {
    width: 200,
    height: 200,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    top: height * 0.1,
    left: -50,
  },
  circle2: {
    width: 150,
    height: 150,
    backgroundColor: 'rgba(255, 69, 0, 0.15)',
    top: height * 0.6,
    right: -30,
  },
  circle3: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
    top: height * 0.3,
    left: width * 0.7,
  },
});