import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { initializeSound } from '../utils/sound';

export default function RootLayout() {
  useEffect(() => {
    initializeSound();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#7B2CBF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Apex Scholar',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="classes/index" 
        options={{ 
          title: 'My Classes',
        }} 
      />
      <Stack.Screen 
        name="classes/add" 
        options={{ 
          title: 'Add Class',
        }} 
      />
      <Stack.Screen 
        name="class/[id]" 
        options={{ 
          title: 'Class Details',
        }} 
      />
    </Stack>
  );
}
