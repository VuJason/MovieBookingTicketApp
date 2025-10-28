import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

interface MembershipCardProps {
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  points: number;
  nextTierPoints?: number;
  onPress?: () => void;
}

export const MembershipCard: React.FC<MembershipCardProps> = ({
  tier,
  points,
  nextTierPoints,
  onPress,
}) => {
  const getTierColors = () => {
    switch (tier) {
      case 'Bronze':
        return ['#CD7F32', '#8B4513'];
      case 'Silver':
        return ['#C0C0C0', '#808080'];
      case 'Gold':
        return ['#FFD700', '#FFA500'];
      case 'Platinum':
        return ['#E5E4E2', '#B8B8B8'];
      default:
        return ['#FF4500', '#FF2500'];
    }
  };

  const getTierIcon = () => {
    switch (tier) {
      case 'Bronze':
        return 'medal-outline';
      case 'Silver':
        return 'trophy-outline';
      case 'Gold':
        return 'star-outline';
      case 'Platinum':
        return 'diamond-outline';
      default:
        return 'star-outline';
    }
  };

  const progress = nextTierPoints ? (points / nextTierPoints) * 100 : 100;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={getTierColors()}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.tierInfo}>
            <Icon name={getTierIcon()} size={24} color="#fff" />
            <Text style={styles.tierText}>{tier} Member</Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#fff" />
        </View>

        <View style={styles.pointsContainer}>
          <Text style={styles.pointsLabel}>Current Points</Text>
          <Text style={styles.pointsValue}>{points.toLocaleString()}</Text>
        </View>

        {nextTierPoints && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {nextTierPoints - points} points to next tier
            </Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.benefitsText}>Tap to view benefits</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    minHeight: 140,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  pointsContainer: {
    marginBottom: 16,
  },
  pointsLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginBottom: 4,
  },
  pointsValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  progressText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  cardFooter: {
    alignItems: 'center',
  },
  benefitsText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontStyle: 'italic',
  },
});