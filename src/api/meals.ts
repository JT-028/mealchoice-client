const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Meal {
  _id: string;
  name: string;
  calories: number;
  createdAt: string;
}

export const fetchMeals = async (): Promise<Meal[]> => {
  const response = await fetch(`${API_BASE_URL}/meals`);
  if (!response.ok) throw new Error('Failed to fetch meals');
  return response.json();
};

export const createMeal = async (name: string, calories: number): Promise<Meal> => {
  const response = await fetch(`${API_BASE_URL}/meals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, calories }),
  });
  if (!response.ok) throw new Error('Failed to create meal');
  return response.json();
};
