const API_BASE_URL = 'http://localhost:5000/api';

export interface Seller {
  _id: string;
  name: string;
  email: string;
  role: string;
  marketLocation: string | null;
  isActive: boolean;
  isVerified: boolean;
  verifiedAt: string | null;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalSellers: number;
  pendingSellers: number;
  verifiedSellers: number;
  totalCustomers: number;
  totalOrders: number;
  totalProducts: number;
  totalRevenue: number;
  sellersByMarket: {
    sanNicolas: number;
    pampanga: number;
  };
}

export interface AdminResponse {
  success: boolean;
  message?: string;
  stats?: AdminStats;
  count?: number;
  sellers?: Seller[];
  seller?: Seller;
}

// Get dashboard stats
export async function getAdminStats(token: string): Promise<AdminResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/stats`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
}

// Get pending sellers
export async function getPendingSellers(token: string): Promise<AdminResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/sellers/pending`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
}

// Get all sellers
export async function getAllSellers(token: string, filters?: {
  verified?: boolean;
  market?: string;
  active?: boolean;
}): Promise<AdminResponse> {
  const params = new URLSearchParams();
  if (filters?.verified !== undefined) params.append('verified', String(filters.verified));
  if (filters?.market) params.append('market', filters.market);
  if (filters?.active !== undefined) params.append('active', String(filters.active));
  
  const url = `${API_BASE_URL}/admin/sellers${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
}

// Verify seller
export async function verifySeller(
  token: string,
  sellerId: string,
  marketLocation: string
): Promise<AdminResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/sellers/${sellerId}/verify`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ marketLocation }),
  });
  return response.json();
}

// Update seller
export async function updateSeller(
  token: string,
  sellerId: string,
  data: Partial<{ name: string; email: string; marketLocation: string; isActive: boolean; isVerified: boolean }>
): Promise<AdminResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/sellers/${sellerId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

// Delete seller
export async function deleteSeller(token: string, sellerId: string): Promise<AdminResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/sellers/${sellerId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
}

// Reject pending seller
export async function rejectSeller(token: string, sellerId: string): Promise<AdminResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/sellers/${sellerId}/reject`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
}
