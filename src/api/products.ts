const API_BASE_URL = 'http://localhost:5000/api';

export interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  unit: string;
  category: string;
  seller: string | { _id: string; name: string };
  marketLocation: string;
  isAvailable: boolean;
  image?: string;
  lowStockThreshold: number;
  isLowStock?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormData {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  unit: string;
  category: string;
  marketLocation?: string;
  isAvailable?: boolean;
  lowStockThreshold?: number;
  image?: string;
}

export interface ProductsResponse {
  success: boolean;
  message?: string;
  count?: number;
  lowStockCount?: number;
  outOfStockCount?: number;
  products?: Product[];
  product?: Product;
}

export interface Seller {
  _id: string;
  name: string;
  email: string;
  marketLocation: string | null;
}

export interface SellersResponse {
  success: boolean;
  message?: string;
  sellers?: Seller[];
}

// Get verified sellers (for starting chat)
export async function getVerifiedSellers(token: string): Promise<SellersResponse> {
  const response = await fetch(`${API_BASE_URL}/products/sellers/list`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

// Get all products (public)
export async function getAllProducts(filters?: {
  category?: string;
  market?: string;
  search?: string;
}): Promise<ProductsResponse> {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.market) params.append('market', filters.market);
  if (filters?.search) params.append('search', filters.search);

  const url = `${API_BASE_URL}/products${params.toString() ? `?${params}` : ''}`;
  const response = await fetch(url);
  return response.json();
}

// Get seller's products
export async function getSellerProducts(token: string): Promise<ProductsResponse> {
  const response = await fetch(`${API_BASE_URL}/products/seller/my-products`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

// Get single product
export async function getProduct(id: string): Promise<ProductsResponse> {
  const response = await fetch(`${API_BASE_URL}/products/${id}`);
  return response.json();
}

// Create product (seller only)
export async function createProduct(
  token: string,
  data: ProductFormData
): Promise<ProductsResponse> {
  const response = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

// Update product (seller only)
export async function updateProduct(
  token: string,
  id: string,
  data: Partial<ProductFormData>
): Promise<ProductsResponse> {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

// Delete product (seller only)
export async function deleteProduct(
  token: string,
  id: string
): Promise<ProductsResponse> {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

// Upload product image
export async function uploadProductImage(
  token: string,
  productId: string,
  imageFile: File
): Promise<ProductsResponse> {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch(`${API_BASE_URL}/products/${productId}/image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  return response.json();
}

// Product categories
export const PRODUCT_CATEGORIES = [
  { value: 'vegetables', label: 'Vegetables' },
  { value: 'fruits', label: 'Fruits' },
  { value: 'meat', label: 'Meat' },
  { value: 'seafood', label: 'Seafood' },
  { value: 'grains', label: 'Grains & Rice' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'spices', label: 'Spices & Condiments' },
  { value: 'others', label: 'Others' },
];

// Product units
export const PRODUCT_UNITS = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'piece', label: 'Piece' },
  { value: 'bundle', label: 'Bundle' },
  { value: 'pack', label: 'Pack' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'liter', label: 'Liter (L)' },
  { value: 'ml', label: 'Milliliter (ml)' },
];

// Market locations
export const MARKET_LOCATIONS = [
  { value: 'San Nicolas Market', label: 'San Nicolas Market' },
  { value: 'Pampanga Market', label: 'Pampanga Market' },
];

// Bulk delete products
export async function bulkDeleteProducts(
  token: string,
  productIds: string[]
): Promise<ProductsResponse & { count?: number }> {
  const response = await fetch(`${API_BASE_URL}/products/bulk`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productIds }),
  });
  return response.json();
}

// Bulk toggle availability
export async function bulkToggleAvailability(
  token: string,
  productIds: string[],
  isAvailable: boolean
): Promise<ProductsResponse & { count?: number }> {
  const response = await fetch(`${API_BASE_URL}/products/bulk-availability`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productIds, isAvailable }),
  });
  return response.json();
}
