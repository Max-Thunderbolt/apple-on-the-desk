import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Class } from '../types';
import { gradients, white } from '../constants/colors';

interface ClassCardProps {
  classData: Class;
  onPress: () => void;
}

const ClassCard = ({ classData, onPress }: ClassCardProps) => {
  const gradientIndex = classData.id.charCodeAt(0) % gradients.length;
  const gradient = gradients[gradientIndex];
  const studentCount = classData.students?.length || 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.cardContainer}
    >
      <LinearGradient
        colors={[gradient.start, gradient.end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <Text style={styles.name}>{classData.name}</Text>
        <View style={styles.studentInfo}>
          <Ionicons name="people-outline" size={20} color={white} />
          <Text style={styles.studentCount}>{studentCount} students</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  card: {
    padding: 24,
    borderRadius: 24,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: white,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  studentCount: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
});

export default ClassCard;
