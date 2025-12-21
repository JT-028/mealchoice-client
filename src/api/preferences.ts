import { API_BASE_URL } from '../config/api';

export interface Preferences {
  height: number | null;
  weight: number | null;
  age: number | null;
  sex: 'male' | 'female' | 'other' | null;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null;
  dietaryRestrictions: string[];
  preferredMealTypes: string[];
  preferredCuisines: string[];
  preferredIngredients: string[];
  avoidedIngredients: string[];
  calorieMin: number;
  calorieMax: number;
  maxSodium: number;
  maxSugar: number;
  maxFats: number;
  weeklyBudget: number | null;
  budgetPerMeal: number | null;
  prefersPriceRange: 'budget' | 'moderate' | 'premium' | null;
}

export interface PreferencesResponse {
  success: boolean;
  message?: string;
  preferences?: Preferences;
  hasCompletedOnboarding?: boolean;
}

export async function getPreferences(token: string): Promise<PreferencesResponse> {
  const response = await fetch(`${API_BASE_URL}/preferences`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
}

export async function updatePreferences(
  token: string,
  updates: Partial<Preferences>
): Promise<PreferencesResponse> {
  const response = await fetch(`${API_BASE_URL}/preferences`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  return response.json();
}
