import { API_BASE_URL } from '../config/api';

export interface DayHours {
  open: string;
  close: string;
  isClosed: boolean;
}

export interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface UserSettings {
  name: string;
  email: string;
  phone?: string;
  theme: 'light' | 'dark' | 'system';
  role: string;
  // Seller-specific
  marketLocation?: string;
  stallName?: string;
  stallNumber?: string;
  operatingHours?: OperatingHours;
  customCategories?: string[];
  notifyNewOrders?: boolean;
  notifyLowStock?: boolean;
  paymentQR?: string;
  acceptsQR?: boolean;
  hasOwnDelivery?: boolean;
}

export interface SettingsResponse {
  success: boolean;
  message?: string;
  settings?: UserSettings;
  theme?: string;
  paymentQR?: string;
}

// Get user settings
export async function getSettings(token: string): Promise<SettingsResponse> {
  const response = await fetch(`${API_BASE_URL}/settings`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
}

// Update profile (name, phone)
export async function updateProfile(
  token: string,
  data: { name?: string; phone?: string }
): Promise<SettingsResponse> {
  const response = await fetch(`${API_BASE_URL}/settings/profile`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

// Change password
export async function changePassword(
  token: string,
  data: { currentPassword: string; newPassword: string }
): Promise<SettingsResponse> {
  const response = await fetch(`${API_BASE_URL}/settings/password`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

// Update theme
export async function updateTheme(
  token: string,
  theme: 'light' | 'dark' | 'system'
): Promise<SettingsResponse> {
  const response = await fetch(`${API_BASE_URL}/settings/theme`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ theme }),
  });
  return response.json();
}

// Delete account
export async function deleteAccount(
  token: string,
  password: string
): Promise<SettingsResponse> {
  const response = await fetch(`${API_BASE_URL}/settings/account`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });
  return response.json();
}

// Export orders (returns CSV blob)
export async function exportOrders(token: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/settings/export-orders`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.blob();
}

// Update seller settings
export async function updateSellerSettings(
  token: string,
  data: {
    operatingHours?: Partial<OperatingHours>;
    notifyNewOrders?: boolean;
    notifyLowStock?: boolean;
    acceptsQR?: boolean;
    hasOwnDelivery?: boolean;
  }
): Promise<SettingsResponse> {
  const response = await fetch(`${API_BASE_URL}/settings/seller`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

// Upload payment QR
export async function uploadPaymentQR(
  token: string,
  file: File
): Promise<SettingsResponse> {
  const formData = new FormData();
  formData.append('qr', file);

  const response = await fetch(`${API_BASE_URL}/settings/payment-qr`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });
  return response.json();
}

// Delete payment QR
export async function deletePaymentQR(token: string): Promise<SettingsResponse> {
  const response = await fetch(`${API_BASE_URL}/settings/payment-qr`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
}

// Get public sellers info
export async function getSellersInfo(
  token: string,
  sellerIds: string[]
): Promise<{ success: boolean; sellers?: Array<{ _id: string; name: string; marketLocation: string; paymentQR?: string; acceptsQR?: boolean; hasOwnDelivery?: boolean }> }> {
  const response = await fetch(`${API_BASE_URL}/settings/sellers-info`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sellerIds }),
  });
  return response.json();
}
