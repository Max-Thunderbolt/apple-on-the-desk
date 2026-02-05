import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ClassCard from '../../components/ClassCard';
import { StorageService } from '../../services/storage';
import { Class } from '../../types';
import { useColors } from '../../constants/colors';

export default function ClassesScreen() {
  const router = useRouter();
  const colors = useColors();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  const loadClasses = async () => {
    try {
      const loadedClasses = await StorageService.getClasses();
      setClasses(loadedClasses);
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadClasses();
    }, [])
  );

  const handleClassPress = (classData: Class) => {
    router.push(`/class/${classData.id}`);
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
    listContent: {
      padding: 20,
      gap: 20,
    },
    loadingText: {
      fontSize: 18,
      color: colors.textLight,
      textAlign: 'center',
      marginTop: 50,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    emptyText: {
      fontSize: 20,
      color: colors.textLight,
      marginBottom: 24,
      textAlign: 'center',
    },
    emptyButton: {
      borderRadius: 24,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8,
    },
    emptyButtonGradient: {
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 24,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    emptyButtonText: {
      color: colors.white,
      fontSize: 18,
      fontWeight: 'bold',
    },
  }), [colors]);

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <Text style={styles.loadingText}>Loading classes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Classes</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push('/classes/add')}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {classes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No classes yet! Let's create one 🎓</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/classes/add')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary, '#0080c0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyButtonGradient}
            >
              <Ionicons name="add-circle-outline" size={24} color={colors.white} />
              <Text style={styles.emptyButtonText}>Add Your First Class</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={classes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ClassCard
              classData={item}
              onPress={() => handleClassPress(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          numColumns={1}
        />
      )}
    </View>
  );
}
