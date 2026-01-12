import { useEffect, useState, useMemo } from 'react';
import { SellerLayout } from '@/components/layout/SellerLayout';
import { PendingVerification } from '@/components/seller/PendingVerification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { getSellerOrders, updateOrderStatus, verifyPayment, archiveOrder, bulkArchiveOrders, type Order } from '@/api/orders';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Package,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  User,
  CreditCard,
  Archive,
  ArchiveRestore,
  Search,
  Calendar,
  X,
  ExternalLink,
  Eye,
  FileImage
} from 'lucide-react';
import { getImageUrl } from '@/config/api';

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20', icon: <Clock className="h-4 w-4" /> },
  preparing: { label: 'Preparing', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20', icon: <ChefHat className="h-4 w-4" /> },
  completed: { label: 'Completed', color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20', icon: <CheckCircle className="h-4 w-4" /> },
  cancelled: { label: 'Cancelled', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: <XCircle className="h-4 w-4" /> },
};

// Simplified status flow: pending -> preparing -> completed
const statusFlow = ['pending', 'preparing', 'completed'];

type DateFilter = 'all' | 'today' | 'week' | 'month';

export function SellerOrdersPage() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // New state for filters and selection
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  const fetchOrders = async () => {
    if (!token || !user?.isVerified) {
      setLoading(false);
      return;
    }

    try {
      const isArchivedTab = selectedStatus === 'archived';
      const response = await getSellerOrders(token, isArchivedTab ? 'all' : selectedStatus, isArchivedTab);
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
    setSelectedOrders(new Set()); // Clear selection when changing tabs
  }, [token, selectedStatus, user?.isVerified]);

  // Filter orders based on search and date
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Search filter - by customer name or order ID
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => {
        const buyerName = typeof order.buyer === 'object' ? order.buyer.name.toLowerCase() : '';
        return buyerName.includes(query) || order._id.toLowerCase().includes(query);
      });
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);

        if (dateFilter === 'today') {
          return orderDate >= startOfToday;
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(startOfToday);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return orderDate >= weekAgo;
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(startOfToday);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return orderDate >= monthAgo;
        }
        return true;
      });
    }

    return filtered;
  }, [orders, searchQuery, dateFilter]);

  // Get archivable orders from selection (completed or cancelled, not already archived)
  const archivableSelectedOrders = useMemo(() => {
    return filteredOrders.filter(o =>
      selectedOrders.has(o._id) &&
      ['completed', 'cancelled'].includes(o.status) &&
      !o.isArchived
    );
  }, [filteredOrders, selectedOrders]);

  // Get unarchivable orders from selection (archived orders)
  const unarchivableSelectedOrders = useMemo(() => {
    return filteredOrders.filter(o =>
      selectedOrders.has(o._id) && o.isArchived
    );
  }, [filteredOrders, selectedOrders]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    if (!token) return;

    setUpdating(orderId);
    try {
      const response = await updateOrderStatus(token, orderId, newStatus);
      if (response.success) {
        // If marking as completed, auto-archive the order
        if (newStatus === 'completed') {
          await archiveOrder(token, orderId, true);
        }
        fetchOrders();
      }
    } catch (error) {
      console.error('Error updating order:', error);
    } finally {
      setUpdating(null);
    }
  };

  const handleVerifyPayment = async (orderId: string) => {
    if (!token) return;

    setVerifyingPayment(orderId);
    try {
      const response = await verifyPayment(token, orderId);
      if (response.success) {
        fetchOrders();
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
    } finally {
      setVerifyingPayment(null);
    }
  };

  const handleArchiveOrder = async (orderId: string, archive: boolean = true) => {
    if (!token) return;

    setArchiving(orderId);
    try {
      const response = await archiveOrder(token, orderId, archive);
      if (response.success) {
        fetchOrders();
      }
    } catch (error) {
      console.error('Error archiving order:', error);
    } finally {
      setArchiving(null);
    }
  };

  const handleBulkArchive = async (archive: boolean) => {
    if (!token) return;

    const orderIds = archive
      ? archivableSelectedOrders.map(o => o._id)
      : unarchivableSelectedOrders.map(o => o._id);

    if (orderIds.length === 0) return;

    setBulkProcessing(true);
    try {
      const response = await bulkArchiveOrders(token, orderIds, archive);
      if (response.success) {
        setSelectedOrders(new Set());
        fetchOrders();
      }
    } catch (error) {
      console.error('Error bulk archiving:', error);
    } finally {
      setBulkProcessing(false);
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o._id)));
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

  const totalActive = (statusCounts.pending || 0) + (statusCounts.preparing || 0);

  // Block unverified sellers
  if (!user?.isVerified) {
    return (
      <SellerLayout>
        <PendingVerification message="You cannot view orders until your account is verified by an admin." showSteps={false} />
      </SellerLayout>
    );
  }

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

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant={dateFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateFilter('all')}
            >
              <Calendar className="h-3 w-3 mr-1" />
              All Time
            </Button>
            <Button
              variant={dateFilter === 'today' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateFilter('today')}
            >
              Today
            </Button>
            <Button
              variant={dateFilter === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateFilter('week')}
            >
              This Week
            </Button>
            <Button
              variant={dateFilter === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateFilter('month')}
            >
              This Month
            </Button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedOrders.size > 0 && (
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg border">
            <Checkbox
              checked={selectedOrders.size === filteredOrders.length}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm font-medium">
              {selectedOrders.size} order{selectedOrders.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex-1" />

            {archivableSelectedOrders.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkArchive(true)}
                disabled={bulkProcessing}
                className="gap-1"
              >
                {bulkProcessing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Archive className="h-3 w-3" />
                )}
                Archive ({archivableSelectedOrders.length})
              </Button>
            )}

            {unarchivableSelectedOrders.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkArchive(false)}
                disabled={bulkProcessing}
                className="gap-1"
              >
                {bulkProcessing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <ArchiveRestore className="h-3 w-3" />
                )}
                Unarchive ({unarchivableSelectedOrders.length})
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedOrders(new Set())}
            >
              Clear
            </Button>
          </div>
        )}

        <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="preparing" className="gap-1">
              <ChefHat className="h-3 w-3" />
              Preparing {statusCounts.preparing ? `(${statusCounts.preparing})` : ''}
            </TabsTrigger>
            <TabsTrigger value="archived" className="gap-1">
              <Archive className="h-3 w-3" />
              Completed (Archived) {statusCounts.archived ? `(${statusCounts.archived})` : ''}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedStatus} className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12 border rounded-lg border-dashed">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || dateFilter !== 'all'
                    ? 'Try adjusting your search or filters.'
                    : selectedStatus === 'all'
                      ? 'Orders from customers will appear here.'
                      : `No ${selectedStatus} orders at the moment.`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Select All Header */}
                {filteredOrders.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Checkbox
                      checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                    <span>Select all ({filteredOrders.length})</span>
                  </div>
                )}

                {filteredOrders.map((order) => {
                  const status = statusConfig[order.status] || statusConfig.pending;
                  const nextStatus = getNextStatus(order.status);
                  const isUpdating = updating === order._id;
                  const isVerifying = verifyingPayment === order._id;
                  const isSelected = selectedOrders.has(order._id);

                  return (
                    <Card key={order._id} className={isSelected ? 'ring-2 ring-primary' : ''}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleOrderSelection(order._id)}
                              className="mt-1"
                            />
                            <div>
                              <CardTitle className="text-base flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {typeof order.buyer === 'object' ? order.buyer.name : 'Customer'}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                {formatDate(order.createdAt)}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className={`${status.color} gap-1`}>
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
                              <div key={idx} className="flex justify-between items-center text-sm py-1">
                                <div className="flex items-center gap-2">
                                  {item.image && (
                                    <img
                                      src={getImageUrl(item.image)}
                                      alt={item.name}
                                      className="h-8 w-8 rounded object-cover border bg-background"
                                    />
                                  )}
                                  <span>
                                    {item.name} x{item.quantity} {item.unit}
                                  </span>
                                </div>
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

                          {/* Payment Verification Section */}
                          <div className="border-t pt-3 mt-3">
                            <div className="flex items-center justify-between">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">
                                    Payment Method: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'QR Payment'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-muted-foreground">Status: </span>
                                  {order.isPaymentVerified ? (
                                    <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-500/20 bg-green-500/10 h-5 text-[10px] flex gap-1">
                                      <CheckCircle className="h-3 w-3" />
                                      Verified
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-yellow-600 dark:text-yellow-400 border-yellow-500/20 bg-yellow-500/10 h-5 text-[10px]">
                                      Unverified
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {order.paymentMethod === 'cod' && !order.isPaymentVerified && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleVerifyPayment(order._id)}
                                  disabled={isVerifying}
                                  className="border-green-200 hover:bg-green-50 text-green-700"
                                >
                                  {isVerifying ? (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                  ) : (
                                    <CreditCard className="h-3 w-3 mr-1" />
                                  )}
                                  Mark as Paid
                                </Button>
                              )}
                            </div>

                            {/* Payment Proof Image (QR only) */}
                            {order.paymentProof && (
                              <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                                <div className="flex items-center gap-2 mb-3">
                                  <FileImage className="h-4 w-4 text-primary" />
                                  <span className="text-sm font-semibold">Payment Receipt</span>
                                </div>
                                <div className="flex items-start gap-4">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <div className="group relative h-24 w-24 bg-muted rounded border overflow-hidden shrink-0 cursor-zoom-in">
                                        <img
                                          src={getImageUrl(order.paymentProof!)}
                                          alt="Payment Receipt"
                                          className="h-full w-full object-cover group-hover:opacity-80 transition-opacity"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                          <Eye className="h-6 w-6 text-white" />
                                        </div>
                                      </div>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-3xl border-none bg-transparent shadow-none p-0 overflow-hidden">
                                      <div className="relative w-full h-[80vh] flex items-center justify-center bg-black/90 p-4 rounded-lg">
                                        <img
                                          src={getImageUrl(order.paymentProof!)}
                                          alt="Full Payment Receipt"
                                          className="max-w-full max-h-full object-contain"
                                        />
                                        <div className="absolute top-4 right-4 flex gap-2">
                                          <a
                                            href={getImageUrl(order.paymentProof!)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="h-9 w-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-colors"
                                            title="Open Original"
                                          >
                                            <ExternalLink className="h-4 w-4" />
                                          </a>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>

                                  {!order.isPaymentVerified && (
                                    <div className="flex flex-col gap-2 flex-1">
                                      <p className="text-xs text-muted-foreground leading-relaxed">
                                        Please confirm the receipt of funds in your payment account matching the order total before verifying.
                                      </p>
                                      <Button
                                        size="sm"
                                        onClick={() => handleVerifyPayment(order._id)}
                                        disabled={isVerifying}
                                        className="w-fit bg-green-600 hover:bg-green-700 text-white"
                                      >
                                        {isVerifying ? (
                                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                        ) : (
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                        )}
                                        Verify QR Payment
                                      </Button>
                                    </div>
                                  )}
                                  {order.isPaymentVerified && (
                                    <div className="flex-1 flex items-center text-green-600 text-xs font-medium bg-green-500/10 h-10 px-3 rounded-md border border-green-500/20">
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Payment verified and confirmed.
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 pt-2 mt-2 border-t">
                          {nextStatus && order.status !== 'cancelled' && !order.isArchived && (
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
                          )}

                          {order.status === 'pending' && !order.isArchived && (
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

                          {(order.status === 'completed' || order.status === 'cancelled') && !order.isArchived && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleArchiveOrder(order._id, true)}
                              disabled={archiving === order._id}
                              className="ml-auto flex gap-1 items-center border-dashed"
                            >
                              {archiving === order._id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Archive className="h-3 w-3" />
                              )}
                              Archive
                            </Button>
                          )}

                          {order.isArchived && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleArchiveOrder(order._id, false)}
                              disabled={archiving === order._id}
                              className="ml-auto flex gap-1 items-center border-green-200 text-green-700 hover:bg-green-50"
                            >
                              {archiving === order._id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <ArchiveRestore className="h-3 w-3" />
                              )}
                              Unarchive
                            </Button>
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
