// Centralized API configuration
// Uses environment variable VITE_API_URL, falls back to localhost for development

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const API_ROOT_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Helper to construct image URLs
export const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  return `${API_ROOT_URL}${imagePath}`;
};
