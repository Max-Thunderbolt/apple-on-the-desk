import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Button from '../components/Button';
import { colors } from '../constants/colors';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <Text style={styles.title}>Apex Scholar</Text>
        <Text style={styles.subtitle}>Manage your classes with style</Text>
        
        <View style={styles.buttonContainer}>
          <Button
            title="My Classes"
            onPress={() => router.push('/classes')}
            variant="primary"
            style={styles.button}
          />
          <Button
            title="Add Class"
            onPress={() => router.push('/classes/add')}
            variant="secondary"
            style={styles.button}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: colors.textLight,
    marginBottom: 48,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  button: {
    width: '80%',
    maxWidth: 300,
  },
});
