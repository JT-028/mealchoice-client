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
  nutrition?: {
    fiber: string;
    sodium: string;
    sugar: string;
  };
  estimatedCost: number;
  ingredients: string[];
  healthBenefits?: string[];
  instructions?: string[];
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
  breakfast: { mealName: string; calories: number; description: string; imageUrl?: string; ingredients?: string[] };
  lunch: { mealName: string; calories: number; description: string; imageUrl?: string; ingredients?: string[] };
  dinner: { mealName: string; calories: number; description: string; imageUrl?: string; ingredients?: string[] };
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
  scheduledDate?: string;
  mealType?: MealCategory;
}

export interface SavedMealsResponse {
  success: boolean;
  data: SavedMeal[];
}

export type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface CategoryRecommendationResponse {
  success: boolean;
  mealType: MealCategory;
  data: {
    recommendations: Recommendation[];
    nutritionalAdvice: string;
    summary: string;
  };
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

export const saveMeal = async (
  token: string,
  meal: Partial<Recommendation>,
  scheduledDate?: Date | null,
  mealType?: MealCategory | null
): Promise<{ success: boolean; data: SavedMeal }> => {
  const response = await fetch(`${API_BASE_URL}/meals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...meal,
      scheduledDate: scheduledDate ? scheduledDate.toISOString() : null,
      mealType: mealType || null,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to save meal');
  }

  return response.json();
};

export const deleteAllSavedMeals = async (token: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/meals/all`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to reset meal plan');
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

export const getAIRecommendationsByCategory = async (
  token: string,
  mealType: MealCategory
): Promise<CategoryRecommendationResponse> => {
  const response = await fetch(`${API_BASE_URL}/recommendations/generate/${mealType}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to fetch ${mealType} recommendations`);
  }

  return response.json();
};

export type MealSlot = 'breakfast' | 'lunch' | 'dinner';

export interface MealItem {
  mealName: string;
  calories: number;
  description: string;
  imageUrl?: string;
  ingredients?: string[];
}

export interface GroceryItem {
  name: string;
  meals: string[];
  count: number;
}

// Helper function to aggregate groceries from a meal plan
export const aggregateGroceries = (weekPlan: { [key: string]: MealPlanDay }): GroceryItem[] => {
  const groceryMap = new Map<string, { meals: Set<string>; count: number }>();

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const slots: ('breakfast' | 'lunch' | 'dinner')[] = ['breakfast', 'lunch', 'dinner'];

  days.forEach(day => {
    const dayPlan = weekPlan[day];
    if (!dayPlan) return;

    slots.forEach(slot => {
      const meal = dayPlan[slot];
      if (!meal?.ingredients) return;

      meal.ingredients.forEach(ingredient => {
        const normalizedName = ingredient.toLowerCase().trim();
        const existing = groceryMap.get(normalizedName);

        if (existing) {
          existing.meals.add(`${day} ${slot}`);
          existing.count++;
        } else {
          groceryMap.set(normalizedName, {
            meals: new Set([`${day} ${slot}`]),
            count: 1
          });
        }
      });
    });
  });

  return Array.from(groceryMap.entries())
    .map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      meals: Array.from(data.meals),
      count: data.count
    }))
    .sort((a, b) => b.count - a.count);
};
