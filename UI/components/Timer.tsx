import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../constants/colors';
import { playTimerSound } from '../utils/sound';

interface TimerProps {
  initialMinutes?: number;
  initialSeconds?: number;
  onComplete?: () => void;
}

export default function Timer({ 
  initialMinutes = 5, 
  initialSeconds = 0,
  onComplete 
}: TimerProps) {
  const [minutes, setMinutes] = useState(initialMinutes);
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(prevSeconds => {
          if (prevSeconds > 0) {
            return prevSeconds - 1;
          } else {
            setMinutes(prevMinutes => {
              if (prevMinutes > 0) {
                return prevMinutes - 1;
              } else {
                // Timer reached 0
                handleTimerComplete();
                return 0;
              }
            });
            return 59;
          }
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const handleTimerComplete = async () => {
    setIsRunning(false);
    await playTimerSound();
    
    if (onComplete) {
      onComplete();
    }
    
    // Auto-reset after a brief pause
    setTimeout(() => {
      setMinutes(initialMinutes);
      setSeconds(initialSeconds);
      setIsRunning(true);
    }, 1000);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setMinutes(initialMinutes);
    setSeconds(initialSeconds);
    setIsRunning(true);
  };

  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.timerDisplay}
        onPress={toggleTimer}
        activeOpacity={0.8}
      >
        <Text style={styles.timerText}>{formatTime(minutes, seconds)}</Text>
      </TouchableOpacity>
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, styles.resetButton]}
          onPress={resetTimer}
        >
          <Text style={styles.controlButtonText}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, isRunning ? styles.pauseButton : styles.playButton]}
          onPress={toggleTimer}
        >
          <Text style={styles.controlButtonText}>
            {isRunning ? 'Pause' : 'Resume'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  timerDisplay: {
    backgroundColor: colors.primary,
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.white,
    fontFamily: 'monospace',
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 15,
    minWidth: 80,
  },
  resetButton: {
    backgroundColor: colors.textLight,
  },
  pauseButton: {
    backgroundColor: colors.warning,
  },
  playButton: {
    backgroundColor: colors.success,
  },
  controlButtonText: {
    color: colors.white,
    fontWeight: '600',
    textAlign: 'center',
  },
});
