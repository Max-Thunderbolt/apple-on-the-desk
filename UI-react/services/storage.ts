
import { Class } from '../types';
import Constants from 'expo-constants';

// Get API URL from environment or use default
const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://192.168.101.222:3000/api';

// Helper function for API calls with error 
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const token = getAuthToken(); // Get auth token if needed

    console.log(`making call to ${API_BASE_URL}${endpoint}`);

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: `HTTP error! status: ${response.status}`
      }));
      throw new Error(error.message || `Request failed with status ${response.status}`);
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json();
    console.log(`response:`, data);
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`API request timed out for ${endpoint}`);
      throw new Error('Request timed out. Please check your network connection and ensure the server is running.');
    }
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// Get authentication token (implement based on your auth system)
function getAuthToken(): string | null {
  // TODO: Implement token retrieval from AsyncStorage or secure storage
  // Example:
  // return await AsyncStorage.getItem('auth_token');
  return null;
}

// Storage service using MongoDB via REST API
export class StorageService {
  // Get all classes
  static async getClasses(): Promise<Class[]> {
    try {
      const response = await apiRequest<{ classes: Class[] }>('/classes');
      return response.classes || [];
    } catch (error) {
      console.error('Error getting classes:', error);
      return [];
    }
  }

  // Get a single class by ID
  static async getClass(id: string): Promise<Class | null> {
    try {
      const response = await apiRequest<{ class: Class }>(`/classes/${id}`);
      return response.class || null;
    } catch (error) {
      console.error('Error getting class:', error);
      return null;
    }
  }

  // Save a class (create or update)
  static async saveClass(classData: Class): Promise<void> {
    try {
      // Check if class exists to determine create vs update
      const existing = await this.getClass(classData.id);

      if (existing) {
        // Update existing class
        await apiRequest(`/classes/${classData.id}`, {
          method: 'PUT',
          body: JSON.stringify(classData),
        });
      } else {
        // Create new class
        await apiRequest<{ class: Class }>('/classes', {
          method: 'POST',
          body: JSON.stringify(classData),
        });
      }
    } catch (error) {
      console.error('Error saving class:', error);
      throw error;
    }
  }

  // Delete a class
  static async deleteClass(id: string): Promise<void> {
    try {
      await apiRequest(`/classes/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting class:', error);
      throw error;
    }
  }

  // Update class experience
  static async updateClassExperience(id: string, experience: number): Promise<void> {
    try {
      await apiRequest(`/classes/${id}/experience`, {
        method: 'PATCH',
        body: JSON.stringify({ experience }),
      });
    } catch (error) {
      console.error('Error updating class experience:', error);
      throw error;
    }
  }

  // Update student points
  static async updateStudentPoints(
    classId: string,
    studentId: string,
    points: number
  ): Promise<void> {
    try {
      await apiRequest(`/classes/${classId}/students/${studentId}/points`, {
        method: 'PATCH',
        body: JSON.stringify({ points }),
      });
    } catch (error) {
      console.error('Error updating student points:', error);
      throw error;
    }
  }
}