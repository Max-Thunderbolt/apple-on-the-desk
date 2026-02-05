import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TextInput, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StorageService } from '../../services/storage';
import { Class, Student } from '../../types';
import { useColors } from '../../constants/colors';

export default function AddClassScreen() {
  const router = useRouter();
  const colors = useColors();
  const [className, setClassName] = useState('');
  const [studentList, setStudentList] = useState('');

  const handleSubmit = async () => {
    if (!className.trim()) {
      Alert.alert('Error', 'Please enter a class name');
      return;
    }

    const students = studentList
      .split('\n')
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    if (students.length === 0) {
      Alert.alert('Error', 'Please add at least one student');
      return;
    }

    try {
      const studentListData: Student[] = students.map((name, index) => ({
        id: `student-${Date.now()}-${index}`,
        name,
        points: 0,
      }));

      const newClass: Class = {
        id: `class-${Date.now()}`,
        name: className.trim(),
        experience: 0,
        students: studentListData,
        createdAt: Date.now(),
      };

      await StorageService.saveClass(newClass);
      Alert.alert('Success', `Class "${className}" created with ${students.length} students! 🎉`, [
        { text: 'OK', onPress: () => router.push('/classes') },
      ]);
    } catch (error) {
      console.error('Error saving class:', error);
      Alert.alert('Error', 'Failed to create class. Please try again.');
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
    },
    content: {
      padding: 20,
      alignItems: 'center',
    },
    card: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: colors.cardBackground,
      borderRadius: 32,
      padding: 32,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
    },
    section: {
      marginBottom: 24,
    },
    label: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      padding: 16,
      borderRadius: 16,
      fontSize: 18,
      color: colors.text,
      borderWidth: 2,
      borderColor: colors.border,
    },
    hint: {
      fontSize: 14,
      color: colors.textMuted,
      marginBottom: 8,
    },
    textarea: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      padding: 16,
      borderRadius: 16,
      fontSize: 16,
      color: colors.text,
      borderWidth: 2,
      borderColor: colors.border,
      minHeight: 200,
    },
    hintBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      backgroundColor: 'rgba(26, 147, 111, 0.15)',
      borderRadius: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: 'rgba(26, 147, 111, 0.3)',
    },
    hintBoxText: {
      fontSize: 14,
      color: colors.textLight,
      flex: 1,
    },
    submitButton: {
      width: '100%',
      borderRadius: 24,
      marginTop: 16,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8,
    },
    submitButtonGradient: {
      paddingVertical: 18,
      paddingHorizontal: 32,
      borderRadius: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    submitButtonText: {
      color: colors.white,
      fontSize: 18,
      fontWeight: 'bold',
    },
  }), [colors]);

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add a Class</Text>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.section}>
            <Text style={styles.label}>Class Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Grade 4M"
              value={className}
              onChangeText={setClassName}
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Student Names</Text>
            <Text style={styles.hint}>Enter one student name per line</Text>
            <TextInput
              style={styles.textarea}
              placeholder="John Smith&#10;Jane Doe&#10;Alex Johnson&#10;..."
              value={studentList}
              onChangeText={setStudentList}
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.hintBox}>
            <Ionicons name="cloud-upload-outline" size={20} color={colors.textLight} />
            <Text style={styles.hintBoxText}>
              Tip: Copy and paste names from a spreadsheet!
            </Text>
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary, '#0080c0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitButtonGradient}
            >
              <Ionicons name="sparkles-outline" size={24} color={colors.white} />
              <Text style={styles.submitButtonText}>Create Class</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
