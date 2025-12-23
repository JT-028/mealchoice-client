import { useEffect, useState, useRef } from 'react';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { getMyOrders, type Order } from '@/api/orders';
import {
  Package,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  MapPin,
  FileText,
  Printer,
  Truck,
  Store,
  Home
} from 'lucide-react';
import { getImageUrl } from '@/config/api';

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20', icon: <Clock className="h-4 w-4" /> },
  confirmed: { label: 'Confirmed', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', icon: <CheckCircle className="h-4 w-4" /> },
  preparing: { label: 'Preparing', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20', icon: <ChefHat className="h-4 w-4" /> },
  ready: { label: 'Ready', color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20', icon: <Package className="h-4 w-4" /> },
  completed: { label: 'Completed', color: 'bg-muted text-muted-foreground border-border', icon: <CheckCircle className="h-4 w-4" /> },
  cancelled: { label: 'Cancelled', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: <XCircle className="h-4 w-4" /> },
};

type TabType = 'active' | 'completed' | 'cancelled';

export function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) return;

      try {
        const response = await getMyOrders(token);
        if (response.success && response.orders) {
          setOrders(response.orders);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  // Categorize orders
  const activeOrders = orders.filter(o => 
    ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)
  );
  const completedOrders = orders.filter(o => o.status === 'completed');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');

  const getOrdersByTab = (tab: TabType) => {
    switch (tab) {
      case 'active': return activeOrders;
      case 'completed': return completedOrders;
      case 'cancelled': return cancelledOrders;
    }
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

  const handleViewSummary = (order: Order) => {
    setSelectedOrder(order);
    setShowSummary(true);
  };

  const handlePrint = () => {
    const printContent = summaryRef.current;
    if (!printContent || !selectedOrder) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order Summary - MealChoice</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h1 { color: #4CAF50; font-size: 24px; }
            .header { border-bottom: 2px solid #4CAF50; padding-bottom: 10px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #f5f5f5; }
            .total { font-weight: bold; font-size: 18px; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
            .delivery-info { background: #f0f9ff; padding: 12px; border-radius: 8px; margin: 15px 0; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <div class="footer">
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>Thank you for ordering with MealChoice!</p>
          </div>
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();

    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  };

  const renderOrderCard = (order: Order) => {
    const status = statusConfig[order.status] || statusConfig.pending;
    const isDelivery = order.deliveryType === 'delivery';

    return (
      <Card key={order._id}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base">
                Order from {order.seller && typeof order.seller === 'object' ? order.seller.name : 'Seller'}
              </CardTitle>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" />
                {order.marketLocation}
                {order.seller?.stallNumber && ` • Stall ${order.seller.stallNumber}`}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="outline" className={`${status.color} gap-1`}>
                {status.icon}
                {status.label}
              </Badge>
              <Badge variant="outline" className="gap-1 text-xs">
                {isDelivery ? (
                  <>
                    <Truck className="h-3 w-3" />
                    Delivery
                  </>
                ) : (
                  <>
                    <Store className="h-3 w-3" />
                    Pickup
                  </>
                )}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Items */}
            <div className="space-y-2">
              {order.items.slice(0, 2).map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {item.image ? (
                      <img
                        src={getImageUrl(item.image!)}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 flex justify-between">
                    <span>
                      {item.name} x{item.quantity}
                    </span>
                    <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))}
              {order.items.length > 2 && (
                <p className="text-sm text-muted-foreground">
                  +{order.items.length - 2} more item(s)
                </p>
              )}
            </div>

            {/* Delivery Address Preview */}
            {isDelivery && order.deliveryAddress?.fullAddress && (
              <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg text-sm">
                <Home className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground line-clamp-1">
                  {order.deliveryAddress.fullAddress}
                </span>
              </div>
            )}

            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-primary">₱{order.total.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Ordered on {formatDate(order.createdAt)}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => handleViewSummary(order)}
              >
                <FileText className="h-4 w-4" />
                View Summary
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderEmptyState = (tab: TabType) => {
    const messages = {
      active: { title: 'No active orders', desc: 'Your in-progress orders will appear here.' },
      completed: { title: 'No completed orders', desc: 'Orders you\'ve received will appear here.' },
      cancelled: { title: 'No cancelled orders', desc: 'Cancelled orders will appear here.' }
    };
    
    return (
      <div className="text-center py-12 border rounded-lg border-dashed">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2 text-foreground">{messages[tab].title}</h3>
        <p className="text-muted-foreground">{messages[tab].desc}</p>
      </div>
    );
  };

  return (
    <CustomerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Orders</h1>
          <p className="text-muted-foreground">Track your order history and status</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active" className="gap-2">
                Active
                {activeOrders.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {activeOrders.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-2">
                Completed
                {completedOrders.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {completedOrders.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="gap-2">
                Cancelled
                {cancelledOrders.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {cancelledOrders.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {(['active', 'completed', 'cancelled'] as const).map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-4">
                {getOrdersByTab(tab).length === 0 ? (
                  renderEmptyState(tab)
                ) : (
                  <div className="space-y-4">
                    {getOrdersByTab(tab).map(renderOrderCard)}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>

      {/* Order Summary Modal */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Order Summary
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <>
              <div ref={summaryRef} className="space-y-4">
                <div className="header">
                  <h1 style={{ color: '#4CAF50', fontSize: '20px', margin: 0 }}>MealChoice</h1>
                  <p style={{ color: '#666', margin: '4px 0' }}>Order Receipt</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Order ID</p>
                    <p className="font-medium">#{selectedOrder._id.slice(-8).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-medium">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Seller</p>
                    <p className="font-medium">
                      {selectedOrder.seller && typeof selectedOrder.seller === 'object'
                        ? selectedOrder.seller.name
                        : 'Seller'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Market</p>
                    <p className="font-medium">{selectedOrder.marketLocation}</p>
                  </div>
                </div>

                {/* Delivery Info */}
                <div className="p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    {selectedOrder.deliveryType === 'delivery' ? (
                      <Truck className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Store className="h-4 w-4 text-green-500" />
                    )}
                    <span className="font-medium">
                      {selectedOrder.deliveryType === 'delivery' ? 'Home Delivery' : 'Self Pickup'}
                    </span>
                  </div>
                  {selectedOrder.deliveryType === 'delivery' && selectedOrder.deliveryAddress && (
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{selectedOrder.deliveryAddress.fullAddress}</p>
                      {selectedOrder.deliveryAddress.barangay && (
                        <p>{selectedOrder.deliveryAddress.barangay}, {selectedOrder.deliveryAddress.city}</p>
                      )}
                      {selectedOrder.deliveryAddress.contactPhone && (
                        <p>📞 {selectedOrder.deliveryAddress.contactPhone}</p>
                      )}
                      {selectedOrder.deliveryAddress.deliveryNotes && (
                        <p className="italic">"{selectedOrder.deliveryAddress.deliveryNotes}"</p>
                      )}
                    </div>
                  )}
                  {selectedOrder.deliveryType === 'pickup' && selectedOrder.seller?.stallNumber && (
                    <p className="text-sm text-muted-foreground">
                      Pick up at Stall {selectedOrder.seller.stallNumber}
                    </p>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Order Items</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f5f5f5' }}>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Item</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>Qty</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '8px' }}>{item.name}</td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            {item.quantity} {item.unit}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right' }}>
                            ₱{(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#f5f5f5', fontWeight: 'bold' }}>
                        <td colSpan={2} style={{ padding: '10px' }}>Total</td>
                        <td style={{ padding: '10px', textAlign: 'right', color: '#4CAF50' }}>
                          ₱{selectedOrder.total.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p><strong>Status:</strong> {statusConfig[selectedOrder.status]?.label || selectedOrder.status}</p>
                  {selectedOrder.notes && (
                    <p><strong>Notes:</strong> {selectedOrder.notes}</p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button className="w-full gap-2" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                  Print Summary
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </CustomerLayout>
  );
}
