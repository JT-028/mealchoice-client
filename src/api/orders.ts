const API_BASE_URL = 'http://localhost:5000/api';

export interface OrderItem {
  product: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  image?: string;
}

export interface Order {
  _id: string;
  buyer: { _id: string; name: string; email?: string };
  seller: { _id: string; name: string };
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  marketLocation: string;
  notes?: string;
  statusHistory: { status: string; timestamp: string; note?: string }[];
  createdAt: string;
  updatedAt: string;
  paymentProof?: string;
  isPaymentVerified?: boolean;
}

export interface OrdersResponse {
  success: boolean;
  message?: string;
  count?: number;
  statusCounts?: Record<string, number>;
  orders?: Order[];
  order?: Order;
}

// Create order
export async function createOrder(
  token: string,
  data: { items: { productId: string; quantity: number }[]; notes?: string } | FormData
): Promise<OrdersResponse> {
  const isFormData = data instanceof FormData;
  
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    },
    body: isFormData ? data : JSON.stringify(data),
  });
  return response.json();
}

// Get customer's orders
export async function getMyOrders(token: string): Promise<OrdersResponse> {
  const response = await fetch(`${API_BASE_URL}/orders/my-orders`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

// Get seller's orders
export async function getSellerOrders(
  token: string,
  status?: string
): Promise<OrdersResponse> {
  const url = status && status !== 'all'
    ? `${API_BASE_URL}/orders/seller?status=${status}`
    : `${API_BASE_URL}/orders/seller`;
    
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

// Update order status
export async function updateOrderStatus(
  token: string,
  orderId: string,
  status: string,
  note?: string
): Promise<OrdersResponse> {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, note }),
  });
  return response.json();
}

// Verify payment
export async function verifyPayment(
  token: string,
  orderId: string
): Promise<OrdersResponse> {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/payment`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

// Get single order
export async function getOrderById(
  token: string,
  orderId: string
): Promise<OrdersResponse> {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

