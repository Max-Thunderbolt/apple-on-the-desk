import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { StorageService } from '../../services/storage';
import { Class, Student } from '../../types';
import { colors } from '../../constants/colors';

export default function AddClassScreen() {
  const router = useRouter();
  const [className, setClassName] = useState('');
  const [studentNames, setStudentNames] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState('');

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/plain',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const fileUri = result.assets[0].uri;
        const fileContent = await FileSystem.readAsStringAsync(fileUri);
        
        // Parse student names (one per line)
        const names = fileContent
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
        
        setStudentNames(names);
        Alert.alert('Success', `Loaded ${names.length} students from file`);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to load file. Please try again.');
    }
  };

  const addManualStudent = () => {
    const name = manualInput.trim();
    if (name && !studentNames.includes(name)) {
      setStudentNames([...studentNames, name]);
      setManualInput('');
    } else if (studentNames.includes(name)) {
      Alert.alert('Duplicate', 'This student is already in the list');
    }
  };

  const removeStudent = (index: number) => {
    const updated = studentNames.filter((_, i) => i !== index);
    setStudentNames(updated);
  };

  const saveClass = async () => {
    if (!className.trim()) {
      Alert.alert('Error', 'Please enter a class name');
      return;
    }

    if (studentNames.length === 0) {
      Alert.alert('Error', 'Please add at least one student');
      return;
    }

    try {
      const students: Student[] = studentNames.map((name, index) => ({
        id: `student-${Date.now()}-${index}`,
        name,
        points: 0,
      }));

      const newClass: Class = {
        id: `class-${Date.now()}`,
        name: className.trim(),
        experience: 0,
        students,
        createdAt: Date.now(),
      };

      await StorageService.saveClass(newClass);
      Alert.alert('Success', 'Class created successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error saving class:', error);
      Alert.alert('Error', 'Failed to create class. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Class Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Grade 4M"
            value={className}
            onChangeText={setClassName}
            placeholderTextColor={colors.textLight}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Students</Text>
          <TouchableOpacity
            style={styles.fileButton}
            onPress={pickDocument}
          >
            <Text style={styles.fileButtonText}>Upload Text File</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>
            Upload a text file with one student name per line
          </Text>

          <View style={styles.manualInputContainer}>
            <TextInput
              style={styles.manualInput}
              placeholder="Or add student name manually"
              value={manualInput}
              onChangeText={setManualInput}
              placeholderTextColor={colors.textLight}
              onSubmitEditing={addManualStudent}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={addManualStudent}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {studentNames.length > 0 && (
            <View style={styles.studentList}>
              <Text style={styles.studentListTitle}>
                Students ({studentNames.length})
              </Text>
              {studentNames.map((name, index) => (
                <View key={index} style={styles.studentItem}>
                  <Text style={styles.studentName}>{name}</Text>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeStudent(index)}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveClass}
        >
          <Text style={styles.saveButtonText}>Create Class</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 15,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.textLight,
  },
  fileButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 8,
  },
  fileButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  manualInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  manualInput: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 15,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.textLight,
  },
  addButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 15,
    justifyContent: 'center',
  },
  addButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  studentList: {
    marginTop: 16,
  },
  studentListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  studentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  studentName: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.error,
    borderRadius: 8,
  },
  removeButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
