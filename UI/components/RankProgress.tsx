import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/colors';
import { Rank } from '../types';
import { getRankProgress } from '../constants/ranks';

interface RankProgressProps {
  experience: number;
}

export default function RankProgress({ experience }: RankProgressProps) {
  const { currentRank, nextRank, progress } = getRankProgress(experience);

  return (
    <View style={styles.container}>
      <View style={styles.rankBadges}>
        <View style={styles.badgeContainer}>
          <View style={[styles.badge, { backgroundColor: currentRank.color }]}>
            <Text style={styles.badgeIcon}>{currentRank.icon}</Text>
            <Text style={styles.badgeName}>{currentRank.name}</Text>
          </View>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <LinearGradient
              colors={[currentRank.color, nextRank?.color || currentRank.color]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(progress * 100)}%
          </Text>
        </View>

        {nextRank ? (
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, { backgroundColor: nextRank.color }]}>
              <Text style={styles.badgeIcon}>{nextRank.icon}</Text>
              <Text style={styles.badgeName}>{nextRank.name}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, { backgroundColor: currentRank.color }]}>
              <Text style={styles.badgeIcon}>{currentRank.icon}</Text>
              <Text style={styles.badgeName}>Max Rank</Text>
            </View>
          </View>
        )}
      </View>
      <Text style={styles.experienceText}>
        {experience} XP
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: colors.white,
    borderRadius: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4.65,
    elevation: 8,
  },
  rankBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badgeContainer: {
    flex: 1,
    alignItems: 'center',
  },
  badge: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 15,
    alignItems: 'center',
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
  },
  progressContainer: {
    flex: 2,
    marginHorizontal: 12,
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 20,
    backgroundColor: colors.background,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  experienceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginTop: 8,
  },
});
