import { API_BASE_URL } from '../config/api';

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

export interface Spending {
  todaySpent: number;
  weeklySpent: number;
  dailyLimit: number;
  weeklyLimit: number;
  dailyRemaining: number;
  weeklyRemaining: number;
  alertThreshold: number;
}

export interface SpendingResponse {
  success: boolean;
  message?: string;
  spending?: Spending;
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

// Get user's spending summary
export async function getSpending(token: string): Promise<SpendingResponse> {
  const response = await fetch(`${API_BASE_URL}/budget/spending`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}
