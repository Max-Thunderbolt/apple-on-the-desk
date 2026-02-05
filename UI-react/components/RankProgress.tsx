import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useColors } from '../constants/colors';
import { getRankProgress } from '../constants/ranks';

interface RankProgressProps {
  totalExperience: number;
}

const RankProgress = ({ totalExperience }: RankProgressProps) => {
  const colors = useColors();
  const { currentRank, nextRank, progress } = getRankProgress(totalExperience);
  const isMaxRank = !nextRank;
  const progressPercent = progress * 100;

  const xpToNext = nextRank
    ? nextRank.minExperience - totalExperience
    : 0;

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.cardBackground,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 12,
    },
    inner: {
      maxWidth: 400,
      alignSelf: 'center',
      width: '100%',
    },
    xpText: {
      textAlign: 'center',
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.textMuted,
      marginBottom: 12,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    badge: {
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: currentRank.color,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: currentRank.color,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
      elevation: 6,
    },
    badgeNext: {
      backgroundColor: nextRank?.color ?? currentRank.color,
      opacity: isMaxRank ? 1 : 0.6,
    },
    badgeEmoji: {
      fontSize: 24,
    },
    badgeLabel: {
      fontSize: 10,
      fontWeight: 'bold',
      color: colors.white,
      marginTop: 2,
    },
    progressSection: {
      flex: 1,
    },
    progressBarBg: {
      height: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: 8,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: currentRank.color,
      borderRadius: 8,
      width: `${progressPercent}%`,
    },
    progressHint: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 6,
      textAlign: 'center',
      fontWeight: '600',
    },
    progressMax: {
      fontSize: 12,
      color: colors.primary,
      marginTop: 6,
      textAlign: 'center',
      fontWeight: 'bold',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.xpText}>Class Total: {totalExperience} XP</Text>

        <View style={styles.row}>
          <View style={styles.badge}>
            <Text style={styles.badgeEmoji}>{currentRank.icon}</Text>
            <Text style={styles.badgeLabel}>{currentRank.name}</Text>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressBarBg}>
              <View style={styles.progressBarFill} />
            </View>
            {!isMaxRank && nextRank && (
              <Text style={styles.progressHint}>
                {xpToNext} XP to {nextRank.name}
              </Text>
            )}
            {isMaxRank && (
              <Text style={styles.progressMax}>Max Rank Achieved! 🎉</Text>
            )}
          </View>

          <View style={[styles.badge, styles.badgeNext]}>
            <Text style={styles.badgeEmoji}>
              {isMaxRank ? currentRank.icon : nextRank?.icon ?? '👑'}
            </Text>
            <Text style={styles.badgeLabel}>
              {isMaxRank ? currentRank.name : nextRank?.name ?? '—'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default RankProgress;
