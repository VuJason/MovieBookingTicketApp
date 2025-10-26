import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigate } from 'react-router-native';

export default function MovieDetailScreen() {
  const navigate = useNavigate();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎬 Movie Details</Text>

      {/* 👇 Nút quay lại trang Home */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigate('/')} // ✅ Điều hướng về HomeScreen
      >
        <Text style={styles.backText}>← Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#FF4500',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
