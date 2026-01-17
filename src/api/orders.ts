import { API_BASE_URL } from '../config/api';

export interface OrderItem {
  product: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  image?: string;
}

export interface DeliveryAddress {
  fullAddress?: string;
  barangay?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  contactPhone?: string;
  deliveryNotes?: string;
}

export interface Order {
  _id: string;
  buyer: { _id: string; name: string; email?: string };
  seller: { _id: string; name: string; stallName?: string; stallNumber?: string };
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  paymentMethod?: 'qr' | 'cod';
  marketLocation: string;
  notes?: string;
  statusHistory: { status: string; timestamp: string; note?: string }[];
  createdAt: string;
  updatedAt: string;
  paymentProof?: string;
  isPaymentVerified?: boolean;
  isArchived?: boolean;
  deliveryType: 'pickup' | 'delivery';
  deliveryAddress?: DeliveryAddress;
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
  status?: string,
  archived?: boolean
): Promise<OrdersResponse> {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.append('status', status);
  if (archived !== undefined) params.append('archived', String(archived));

  const queryString = params.toString();
  const url = queryString
    ? `${API_BASE_URL}/orders/seller?${queryString}`
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

// Archive/unarchive order
export async function archiveOrder(
  token: string,
  orderId: string,
  archive: boolean = true
): Promise<OrdersResponse> {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/archive`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ archive }),
  });
  return response.json();
}

// Bulk archive/unarchive orders
export async function bulkArchiveOrders(
  token: string,
  orderIds: string[],
  archive: boolean = true
): Promise<OrdersResponse & { count?: number }> {
  const response = await fetch(`${API_BASE_URL}/orders/bulk-archive`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orderIds, archive }),
  });
  return response.json();
}

// Cancel order by customer
export async function cancelOrderByCustomer(
  token: string,
  orderId: string,
  reason: string
): Promise<OrdersResponse> {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel-customer`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  });
  return response.json();
}

// Hide order for buyer
export async function hideOrderForBuyer(
  token: string,
  orderId: string
): Promise<OrdersResponse> {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/hide-buyer`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

// Bulk hide orders for buyer
export async function bulkHideOrdersForBuyer(
  token: string,
  orderIds: string[]
): Promise<OrdersResponse & { count?: number }> {
  const response = await fetch(`${API_BASE_URL}/orders/bulk-hide-buyer`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orderIds }),
  });
  return response.json();
}

// Seller Analytics
export interface SellerAnalytics {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
    averageOrderValue: number;
    revenueChange: number;
  };
  paymentBreakdown: {
    qr: number;
    cod: number;
  };
  statusBreakdown: {
    pending: number;
    confirmed: number;
    preparing: number;
    ready: number;
    completed: number;
    cancelled: number;
  };
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
    image?: string;
  }>;
  salesOverTime: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
  marketComparison: Array<{
    name: string;
    revenue: number;
    orders: number;
  }>;
  sellerIncomeOverTime?: Array<{
    sellerId: string;
    sellerName: string;
    marketLocation: string;
    totalRevenue: number;
    timeSeries: Array<{
      date: string;
      revenue: number;
    }>;
  }>;
}

export interface AnalyticsResponse {
  success: boolean;
  message?: string;
  analytics?: SellerAnalytics;
}

export async function getSellerAnalytics(
  token: string,
  options?: { period?: string; startDate?: string; endDate?: string }
): Promise<AnalyticsResponse> {
  const params = new URLSearchParams();
  if (options?.period) params.append('period', options.period);
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);

  const url = `${API_BASE_URL}/orders/seller/analytics${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
}
