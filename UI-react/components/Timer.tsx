import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../constants/colors';

interface TimerProps {
  initialSeconds?: number;
  autoRepeat?: boolean;
}

const Timer = ({ initialSeconds = 60, autoRepeat = true }: TimerProps) => {
  const colors = useColors();
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);

  const resetTimer = useCallback(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
    } else if (seconds === 0 && autoRepeat) {
      resetTimer();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, seconds, autoRepeat, resetTimer]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (seconds / initialSeconds) * 100;

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 24,
      padding: 24,
      marginHorizontal: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
    },
    timerDisplay: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    timeWrapper: {
      alignItems: 'center',
      marginBottom: 12,
    },
    timeText: {
      fontSize: 42,
      fontWeight: '800',
      color: colors.text,
    },
    progressBarBg: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      width: '100%',
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 4,
      width: `${progress}%`,
    },
    controls: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
    },
    controlButton: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 6,
      elevation: 6,
    },
    controlButtonSecondary: {
      backgroundColor: colors.secondary,
      shadowColor: colors.secondary,
    },
    autoRepeatText: {
      textAlign: 'center',
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 12,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.card}>
      <View style={styles.timerDisplay}>
        <View style={styles.timeWrapper}>
          <Text style={styles.timeText}>{formatTime(seconds)}</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={styles.progressBarFill} />
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setIsRunning(!isRunning)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isRunning ? 'pause' : 'play'}
            size={24}
            color={colors.white}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, styles.controlButtonSecondary]}
          onPress={resetTimer}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {autoRepeat && (
        <Text style={styles.autoRepeatText}>Auto-repeats when finished</Text>
      )}
    </View>
  );
};

export default Timer;
