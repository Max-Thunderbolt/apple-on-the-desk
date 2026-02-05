import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { initializeSound } from '../utils/sound';
import { inkBlack, white } from '../constants/colors';

export default function RootLayout() {
  useEffect(() => {
    initializeSound();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: inkBlack,
        },
        headerTintColor: white,
        headerTitleStyle: {
          fontWeight: 'bold',
          color: white,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
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
