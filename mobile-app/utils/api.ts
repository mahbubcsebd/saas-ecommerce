import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.31.57:8000/api'; 
const BASE_WEB_URL = 'http://192.168.31.57:8000'; // For images starting with /uploads

export const api = {
  getImageUrl(path: string | undefined): string {
    if (!path) return 'https://via.placeholder.com/150';
    const normalizedPath = path.replace(/\\/g, '/');
    if (normalizedPath.startsWith('http')) return normalizedPath.replace('localhost', '192.168.31.57');
    return `${BASE_WEB_URL}${normalizedPath.startsWith('/') ? '' : '/'}${normalizedPath}`;
  },

  async get<T>(endpoint: string): Promise<T> {
// ... rest of the file
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add auth header if needed
        },
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API GET Error [${endpoint}]:`, error);
      throw error;
    }
  },

  async post<T>(endpoint: string, body: any): Promise<T> {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API POST Error [${endpoint}]:`, error);
      throw error;
    }
  },
};
