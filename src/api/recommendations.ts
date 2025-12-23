import { API_BASE_URL } from '../config/api';

export interface Recommendation {
  mealName: string;
  description: string;
  calories: number;
  macros: {
    protein: string;
    carbs: string;
    fats: string;
  };
  estimatedCost: number;
  ingredients: string[];
  imageUrl?: string;
}

export interface RecommendationResponse {
  success: boolean;
  data: {
    recommendations: Recommendation[];
    nutritionalAdvice: string;
    summary: string;
  };
}

export interface MealPlanDay {
  breakfast: { mealName: string; calories: number; description: string; imageUrl?: string };
  lunch: { mealName: string; calories: number; description: string; imageUrl?: string };
  dinner: { mealName: string; calories: number; description: string; imageUrl?: string };
}

export interface MealPlanResponse {
  success: boolean;
  data: {
    weekPlan: {
      [key: string]: MealPlanDay;
    };
    weeklyMacros: {
      avgProtein: string;
      avgCarbs: string;
      avgFats: string;
      avgCalories: number;
    };
    advice: string;
  };
}

export interface SavedMeal extends Recommendation {
  _id: string;
  user: string;
  createdAt: string;
}

export interface SavedMealsResponse {
  success: boolean;
  data: SavedMeal[];
}

export const getAIRecommendations = async (token: string): Promise<RecommendationResponse> => {
  const response = await fetch(`${API_BASE_URL}/recommendations`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch recommendations');
  }

  return response.json();
};

export const getAIMealPlan = async (token: string): Promise<MealPlanResponse> => {
  const response = await fetch(`${API_BASE_URL}/recommendations/meal-plan`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to generate meal plan');
  }

  return response.json();
};

export const saveMeal = async (token: string, meal: Partial<Recommendation>): Promise<{ success: boolean; data: SavedMeal }> => {
  const response = await fetch(`${API_BASE_URL}/meals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(meal),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to save meal');
  }

  return response.json();
};

export const getSavedMeals = async (token: string): Promise<SavedMealsResponse> => {
  const response = await fetch(`${API_BASE_URL}/meals`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch saved meals');
  }

  return response.json();
};

export const deleteSavedMeal = async (token: string, mealId: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/meals/${mealId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete meal');
  }

  return response.json();
};

export type MealSlot = 'breakfast' | 'lunch' | 'dinner';

export interface MealItem {
  mealName: string;
  calories: number;
  description: string;
  imageUrl?: string;
}

