import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Timer from '../../components/Timer';
import StudentCard from '../../components/StudentCard';
import RankProgress from '../../components/RankProgress';
import Button from '../../components/Button';
import { StorageService } from '../../services/storage';
import { Class, Student } from '../../types';
import { useColors } from '../../constants/colors';

export default function ClassDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const [classData, setClassData] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddPointsModal, setShowAddPointsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [pointsToAdd, setPointsToAdd] = useState('');
  const [showAddExperienceModal, setShowAddExperienceModal] = useState(false);
  const [experienceToAdd, setExperienceToAdd] = useState('');

  const loadClass = async () => {
    if (!id) return;
    
    try {
      const loaded = await StorageService.getClass(id);
      if (loaded) {
        setClassData(loaded);
      } else {
        Alert.alert('Error', 'Class not found', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      console.error('Error loading class:', error);
      Alert.alert('Error', 'Failed to load class');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadClass();
    }, [id])
  );

  const handleAddExperience = async () => {
    const exp = parseInt(experienceToAdd);
    if (isNaN(exp) || exp <= 0) {
      Alert.alert('Error', 'Please enter a valid positive number');
      return;
    }

    if (!classData) return;

    try {
      const newExperience = classData.experience + exp;
      await StorageService.updateClassExperience(classData.id, newExperience);
      setClassData({ ...classData, experience: newExperience });
      setShowAddExperienceModal(false);
      setExperienceToAdd('');
      Alert.alert('Success', `Added ${exp} experience to class!`);
    } catch (error) {
      console.error('Error adding experience:', error);
      Alert.alert('Error', 'Failed to add experience');
    }
  };

  const handleAddPoints = async () => {
    const points = parseInt(pointsToAdd);
    if (isNaN(points) || points <= 0) {
      Alert.alert('Error', 'Please enter a valid positive number');
      return;
    }

    if (!selectedStudent || !classData) return;

    try {
      const newPoints = selectedStudent.points + points;
      await StorageService.updateStudentPoints(classData.id, selectedStudent.id, newPoints);
      
      // Update class experience when student earns points
      const experienceGain = points; // 1 point = 1 experience
      const newExperience = classData.experience + experienceGain;
      await StorageService.updateClassExperience(classData.id, newExperience);
      
      // Update local state
      const updatedStudents = classData.students.map(s =>
        s.id === selectedStudent.id ? { ...s, points: newPoints } : s
      );
      setClassData({ ...classData, students: updatedStudents, experience: newExperience });
      
      setShowAddPointsModal(false);
      setSelectedStudent(null);
      setPointsToAdd('');
      Alert.alert('Success', `Added ${points} points to ${selectedStudent.name}!`);
    } catch (error) {
      console.error('Error adding points:', error);
      Alert.alert('Error', 'Failed to add points');
    }
  };

  const handleStudentPress = (student: Student) => {
    setSelectedStudent(student);
    setShowAddPointsModal(true);
  };

  const handleQuickAddPoints = async (student: Student, points: number) => {
    if (!classData) return;

    try {
      const newPoints = student.points + points;
      await StorageService.updateStudentPoints(classData.id, student.id, newPoints);
      
      // Update class experience
      const newExperience = classData.experience + points;
      await StorageService.updateClassExperience(classData.id, newExperience);
      
      // Update local state
      const updatedStudents = classData.students.map(s =>
        s.id === student.id ? { ...s, points: newPoints } : s
      );
      setClassData({ ...classData, students: updatedStudents, experience: newExperience });
    } catch (error) {
      console.error('Error adding points:', error);
      Alert.alert('Error', 'Failed to add points');
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 140,
    },
    loadingText: {
      fontSize: 18,
      color: colors.textLight,
      textAlign: 'center',
      marginTop: 50,
    },
    errorText: {
      fontSize: 18,
      color: colors.error,
      textAlign: 'center',
      marginTop: 50,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingHorizontal: 16,
      marginBottom: 20,
      gap: 12,
    },
    actionButton: {
      flex: 1,
      minWidth: 140,
    },
    studentListContainer: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginHorizontal: 16,
      marginBottom: 12,
    },
    studentCardWrapper: {
      marginBottom: 8,
    },
    quickActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: 16,
      gap: 8,
      marginTop: -8,
      marginBottom: 8,
    },
    quickButton: {
      backgroundColor: colors.secondary,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 12,
      minWidth: 50,
      alignItems: 'center',
    },
    quickButtonText: {
      color: colors.white,
      fontWeight: 'bold',
      fontSize: 14,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      padding: 24,
      width: '80%',
      maxWidth: 400,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    modalSubtitle: {
      fontSize: 16,
      color: colors.textLight,
      marginBottom: 16,
      textAlign: 'center',
    },
    modalInput: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      padding: 16,
      borderRadius: 15,
      fontSize: 18,
      color: colors.text,
      marginBottom: 20,
      borderWidth: 2,
      borderColor: colors.border,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    modalButton: {
      flex: 1,
      padding: 16,
      borderRadius: 15,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: colors.textMuted,
    },
    confirmButton: {
      backgroundColor: colors.primary,
    },
    modalButtonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: 'bold',
    },
  }), [colors]);

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <Text style={styles.loadingText}>Loading class...</Text>
      </View>
    );
  }

  if (!classData) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <Text style={styles.errorText}>Class not found</Text>
      </View>
    );
  }

  const sortedStudents = [...classData.students].sort((a, b) => b.points - a.points);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Timer initialSeconds={300} autoRepeat={false} />

        <View style={styles.actionButtons}>
          <Button
            title="Add Experience"
            onPress={() => setShowAddExperienceModal(true)}
            variant="primary"
            style={styles.actionButton}
          />
          <Button
            title="Add Points"
            onPress={() => {
              if (classData.students.length > 0) {
                setSelectedStudent(classData.students[0]);
                setShowAddPointsModal(true);
              } else {
                Alert.alert('No Students', 'Please add students to the class first');
              }
            }}
            variant="secondary"
            style={styles.actionButton}
          />
        </View>

        <View style={styles.studentListContainer}>
          <Text style={styles.sectionTitle}>Students</Text>
          <FlatList
            data={sortedStudents}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.studentCardWrapper}>
                <StudentCard
                  student={item}
                  onPress={() => handleStudentPress(item)}
                />
                <View style={styles.quickActions}>
                  <TouchableOpacity
                    style={styles.quickButton}
                    onPress={() => handleQuickAddPoints(item, 1)}
                  >
                    <Text style={styles.quickButtonText}>+1</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickButton}
                    onPress={() => handleQuickAddPoints(item, 5)}
                  >
                    <Text style={styles.quickButtonText}>+5</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickButton}
                    onPress={() => handleQuickAddPoints(item, 10)}
                  >
                    <Text style={styles.quickButtonText}>+10</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            scrollEnabled={false}
          />
        </View>

      </ScrollView>
      <RankProgress totalExperience={classData.experience} />

      {/* Add Experience Modal */}
      <Modal
        visible={showAddExperienceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddExperienceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Experience</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter experience amount"
              value={experienceToAdd}
              onChangeText={setExperienceToAdd}
              keyboardType="numeric"
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddExperienceModal(false);
                  setExperienceToAdd('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddExperience}
              >
                <Text style={styles.modalButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Points Modal */}
      <Modal
        visible={showAddPointsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowAddPointsModal(false);
          setSelectedStudent(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Points</Text>
            {selectedStudent && (
              <Text style={styles.modalSubtitle}>To: {selectedStudent.name}</Text>
            )}
            <TextInput
              style={styles.modalInput}
              placeholder="Enter points amount"
              value={pointsToAdd}
              onChangeText={setPointsToAdd}
              keyboardType="numeric"
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddPointsModal(false);
                  setSelectedStudent(null);
                  setPointsToAdd('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddPoints}
              >
                <Text style={styles.modalButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
