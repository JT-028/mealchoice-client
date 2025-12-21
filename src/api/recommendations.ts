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
}

export interface RecommendationResponse {
  success: boolean;
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
