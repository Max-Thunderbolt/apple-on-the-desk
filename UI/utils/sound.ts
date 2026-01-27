import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

export async function playTimerSound(): Promise<void> {
  try {
    // Use haptic feedback as primary notification
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Try to play a system sound if available
    // In a production app, you'd include a local sound file
    // For now, haptic feedback provides the notification
    console.log('Timer completed - sound notification');
  } catch (error) {
    console.error('Error playing sound:', error);
    // Fallback: just log that sound should play
    console.log('Timer sound should play here');
  }
}

export async function initializeSound(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    });
  } catch (error) {
    console.error('Error initializing audio:', error);
  }
}
