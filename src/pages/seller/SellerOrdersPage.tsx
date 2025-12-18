import { useEffect, useState } from 'react';
import { SellerLayout } from '@/components/layout/SellerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { getSellerOrders, updateOrderStatus, type Order } from '@/api/orders';
import {
  Package,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  User
} from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-4 w-4" /> },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="h-4 w-4" /> },
  preparing: { label: 'Preparing', color: 'bg-purple-100 text-purple-800', icon: <ChefHat className="h-4 w-4" /> },
  ready: { label: 'Ready', color: 'bg-green-100 text-green-800', icon: <Package className="h-4 w-4" /> },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-800', icon: <CheckCircle className="h-4 w-4" /> },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: <XCircle className="h-4 w-4" /> },
};

const statusFlow = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];

export function SellerOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!token) return;
    
    try {
      const response = await getSellerOrders(token, selectedStatus);
      if (response.success) {
        setOrders(response.orders || []);
        setStatusCounts(response.statusCounts || {});
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token, selectedStatus]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    if (!token) return;
    
    setUpdating(orderId);
    try {
      const response = await updateOrderStatus(token, orderId, newStatus);
      if (response.success) {
        fetchOrders();
      }
    } catch (error) {
      console.error('Error updating order:', error);
    } finally {
      setUpdating(null);
    }
  };

  const getNextStatus = (currentStatus: string) => {
    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentIndex >= 0 && currentIndex < statusFlow.length - 1) {
      return statusFlow[currentIndex + 1];
    }
    return null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalActive = (statusCounts.pending || 0) + (statusCounts.confirmed || 0) + 
                      (statusCounts.preparing || 0) + (statusCounts.ready || 0);

  return (
    <SellerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Orders</h1>
            <p className="text-muted-foreground">Manage incoming customer orders</p>
          </div>
          {totalActive > 0 && (
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {totalActive} Active
            </Badge>
          )}
        </div>

        <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending" className="gap-1">
              Pending {statusCounts.pending ? `(${statusCounts.pending})` : ''}
            </TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
            <TabsTrigger value="preparing">Preparing</TabsTrigger>
            <TabsTrigger value="ready">Ready</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedStatus} className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 border rounded-lg border-dashed">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                <p className="text-muted-foreground">
                  {selectedStatus === 'all' 
                    ? 'Orders from customers will appear here.'
                    : `No ${selectedStatus} orders at the moment.`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const status = statusConfig[order.status] || statusConfig.pending;
                  const nextStatus = getNextStatus(order.status);
                  const isUpdating = updating === order._id;
                  
                  return (
                    <Card key={order._id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {typeof order.buyer === 'object' ? order.buyer.name : 'Customer'}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                          <Badge className={`${status.color} gap-1`}>
                            {status.icon}
                            {status.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {/* Items */}
                          <div className="space-y-1 bg-muted/50 p-3 rounded-lg">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span>
                                  {item.name} x{item.quantity} {item.unit}
                                </span>
                                <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-between font-semibold pt-2">
                            <span>Total</span>
                            <span className="text-primary">₱{order.total.toFixed(2)}</span>
                          </div>

                          {order.notes && (
                            <p className="text-sm text-muted-foreground italic">
                              Note: {order.notes}
                            </p>
                          )}

                          {/* Actions */}
                          {nextStatus && order.status !== 'cancelled' && (
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(order._id, nextStatus)}
                                disabled={isUpdating}
                              >
                                {isUpdating ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                ) : null}
                                Mark as {statusConfig[nextStatus]?.label}
                              </Button>
                              {order.status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive"
                                  onClick={() => handleStatusUpdate(order._id, 'cancelled')}
                                  disabled={isUpdating}
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </SellerLayout>
  );
}
