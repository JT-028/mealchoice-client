import { API_BASE_URL } from '../config/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'seller' | 'admin';
  marketLocation?: string;
  isVerified?: boolean;
  hasCompletedOnboarding?: boolean;
  hasWatchedTutorial?: boolean;
  theme?: 'light' | 'dark' | 'system';
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'customer' | 'seller';
}

export interface LoginData {
  email: string;
  password: string;
}

// Register new user
export async function registerUser(data: RegisterData): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return response.json();
}

// Login user
export async function loginUser(data: LoginData): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return response.json();
}

// Get user profile
export async function getProfile(token: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/profile`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return response.json();
}

// Mark tutorial as watched
export async function markTutorialWatched(token: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/tutorial-watched`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return response.json();
}

// Request password reset
export async function forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  return response.json();
}

// Reset password with token
export async function resetPassword(token: string, password: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password/${token}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });

  return response.json();
}
