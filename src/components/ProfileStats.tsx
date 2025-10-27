import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface StatItem {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
}

interface ProfileStatsProps {
  stats: StatItem[];
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({ stats }) => {
  const renderStatItem = (stat: StatItem, index: number) => (
    <View key={index} style={styles.statItem}>
      <View style={[styles.statIcon, { backgroundColor: stat.color || '#FF4500' }]}>
        <Icon name={stat.icon} size={20} color="#fff" />
      </View>
      <Text style={styles.statValue}>{stat.value}</Text>
      <Text style={styles.statLabel}>{stat.label}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {stats.map(renderStatItem)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
  },
});