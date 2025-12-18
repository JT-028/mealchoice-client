const API_BASE_URL = 'http://localhost:5000/api';

export interface Budget {
  _id: string;
  user: string;
  dailyLimit: number;
  weeklyLimit: number;
  alertThreshold: number;
  currency: string;
}

export interface BudgetResponse {
  success: boolean;
  message?: string;
  budget?: Budget;
}

// Get user's budget
export async function getBudget(token: string): Promise<BudgetResponse> {
  const response = await fetch(`${API_BASE_URL}/budget`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

// Update budget settings
export async function updateBudget(
  token: string,
  data: Partial<Pick<Budget, 'dailyLimit' | 'weeklyLimit' | 'alertThreshold'>>
): Promise<BudgetResponse> {
  const response = await fetch(`${API_BASE_URL}/budget`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
}
