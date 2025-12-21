const API_BASE_URL = 'http://localhost:5000/api';

export interface Address {
  _id?: string;
  label: string;
  fullAddress: string;
  barangay?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  contactPhone?: string;
  isDefault: boolean;
}

export interface AddressResponse {
  success: boolean;
  message?: string;
  addresses?: Address[];
}

// Get saved addresses
export async function getSavedAddresses(token: string): Promise<AddressResponse> {
  const response = await fetch(`${API_BASE_URL}/addresses`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
}

// Add new address
export async function addAddress(
  token: string,
  address: Omit<Address, '_id'>
): Promise<AddressResponse> {
  const response = await fetch(`${API_BASE_URL}/addresses`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(address),
  });
  return response.json();
}

// Update address
export async function updateAddress(
  token: string,
  addressId: string,
  address: Partial<Address>
): Promise<AddressResponse> {
  const response = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(address),
  });
  return response.json();
}

// Delete address
export async function deleteAddress(
  token: string,
  addressId: string
): Promise<AddressResponse> {
  const response = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
}

// Set default address
export async function setDefaultAddress(
  token: string,
  addressId: string
): Promise<AddressResponse> {
  const response = await fetch(`${API_BASE_URL}/addresses/${addressId}/default`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
}
