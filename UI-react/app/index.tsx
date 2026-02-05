import React, { useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColors, seaGreen, intenseCherry, freshSky } from '../constants/colors';

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    titleContainer: {
      alignItems: 'center',
      marginBottom: 48,
    },
    title: {
      fontSize: 56,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    titleAccent: {
      color: colors.primary,
    },
    subtitle: {
      fontSize: 20,
      color: colors.textMuted,
      fontWeight: '600',
      textAlign: 'center',
    },
    buttonContainer: {
      width: '100%',
      maxWidth: 320,
      gap: 20,
    },
    ctaButton: {
      width: '100%',
      borderRadius: 24,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8,
    },
    secondaryButton: {
      width: '100%',
      borderRadius: 24,
      shadowColor: seaGreen,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 6,
    },
    buttonGradient: {
      paddingVertical: 20,
      paddingHorizontal: 32,
      borderRadius: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    buttonText: {
      color: colors.white,
      fontSize: 20,
      fontWeight: 'bold',
    },
    decorative: {
      position: 'absolute',
      borderRadius: 999,
      opacity: 0.25,
    },
    decorative1: {
      width: 80,
      height: 80,
      top: 40,
      left: 40,
      backgroundColor: seaGreen,
    },
    decorative2: {
      width: 128,
      height: 128,
      bottom: 80,
      right: 40,
      backgroundColor: intenseCherry,
    },
    decorative3: {
      width: 64,
      height: 64,
      top: '33%',
      right: 80,
      backgroundColor: freshSky,
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            Apple On The <Text style={styles.titleAccent}>Desk</Text>
          </Text>
          <Text style={styles.subtitle}>Make learning fun! 🎉</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => router.push('/classes')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary, '#0080c0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Ionicons name="book-outline" size={28} color={colors.white} />
              <Text style={styles.buttonText}>View Classes</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/classes/add')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[seaGreen, intenseCherry]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Ionicons name="add-circle-outline" size={28} color={colors.white} />
              <Text style={styles.buttonText}>Add a Class</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.decorative, styles.decorative1]} />
      <View style={[styles.decorative, styles.decorative2]} />
      <View style={[styles.decorative, styles.decorative3]} />
    </View>
  );
}
