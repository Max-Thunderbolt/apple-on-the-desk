import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { colors } from '../constants/colors';
import { Student } from '../types';

interface StudentCardProps {
  student: Student;
  onPress: () => void;
}

export default function StudentCard({ student, onPress }: StudentCardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text style={styles.name}>{student.name}</Text>
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsLabel}>Points:</Text>
          <Text style={styles.pointsValue}>{student.points}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    marginVertical: 6,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointsLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  pointsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    minWidth: 50,
    textAlign: 'right',
  },
});
