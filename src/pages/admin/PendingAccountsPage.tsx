import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getPendingSellers, 
  verifySeller, 
  rejectSeller, 
  getPendingCustomers,
  approveCustomer,
  rejectPendingCustomer,
  type Seller,
  type Customer
} from '@/api/admin';
import {
  UserCheck,
  UserX,
  Clock,
  Loader2,
  MapPin,
  Mail,
  Calendar,
  Users,
  Store
} from 'lucide-react';

export function PendingAccountsPage() {
  const { token } = useAuth();
  
  // Sellers state
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loadingSellers, setLoadingSellers] = useState(true);
  
  // Customers state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Verify seller dialog
  const [verifyDialog, setVerifyDialog] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<string>('');

  const fetchSellers = async () => {
    if (!token) return;
    
    try {
      const response = await getPendingSellers(token);
      if (response.success && response.sellers) {
        setSellers(response.sellers);
      }
    } catch (error) {
      console.error('Error fetching sellers:', error);
    } finally {
      setLoadingSellers(false);
    }
  };

  const fetchCustomers = async () => {
    if (!token) return;
    
    try {
      const response = await getPendingCustomers(token);
      if (response.success && response.customers) {
        setCustomers(response.customers);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    fetchSellers();
    fetchCustomers();
  }, [token]);

  // Seller handlers
  const handleVerifyClick = (seller: Seller) => {
    setSelectedSeller(seller);
    setSelectedMarket('');
    setVerifyDialog(true);
  };

  const handleVerifySeller = async () => {
    if (!token || !selectedSeller || !selectedMarket) return;

    setProcessingId(selectedSeller._id);
    try {
      const response = await verifySeller(token, selectedSeller._id, selectedMarket);
      if (response.success) {
        setSellers(sellers.filter(s => s._id !== selectedSeller._id));
        setVerifyDialog(false);
      }
    } catch (error) {
      console.error('Error verifying seller:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSeller = async (sellerId: string) => {
    if (!token) return;

    setProcessingId(sellerId);
    try {
      const response = await rejectSeller(token, sellerId);
      if (response.success) {
        setSellers(sellers.filter(s => s._id !== sellerId));
      }
    } catch (error) {
      console.error('Error rejecting seller:', error);
    } finally {
      setProcessingId(null);
    }
  };

  // Customer handlers
  const handleApproveCustomer = async (customerId: string) => {
    if (!token) return;

    setProcessingId(customerId);
    try {
      const response = await approveCustomer(token, customerId);
      if (response.success) {
        setCustomers(customers.filter(c => c._id !== customerId));
      }
    } catch (error) {
      console.error('Error approving customer:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectCustomer = async (customerId: string) => {
    if (!token) return;

    setProcessingId(customerId);
    try {
      const response = await rejectPendingCustomer(token, customerId);
      if (response.success) {
        setCustomers(customers.filter(c => c._id !== customerId));
      }
    } catch (error) {
      console.error('Error rejecting customer:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pending Accounts</h1>
          <p className="text-muted-foreground">Review and approve new registrations</p>
        </div>

        <Tabs defaultValue="customers" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Customers
              {customers.length > 0 && (
                <Badge variant="secondary" className="ml-1">{customers.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sellers" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Sellers
              {sellers.length > 0 && (
                <Badge variant="secondary" className="ml-1">{sellers.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Customers Tab */}
          <TabsContent value="customers" className="mt-6">
            {loadingCustomers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : customers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <UserCheck className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No pending customers</h3>
                  <p className="text-muted-foreground">
                    All customer registrations have been processed.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {customers.map((customer) => {
                  const isProcessing = processingId === customer._id;
                  
                  return (
                    <Card key={customer._id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{customer.name}</CardTitle>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Mail className="h-4 w-4" />
                                {customer.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(customer.createdAt)}
                              </span>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            <Clock className="h-3 w-3 mr-1" />
                            Email Unverified
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleApproveCustomer(customer._id)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <UserCheck className="h-4 w-4 mr-1" />
                            )}
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            className="text-destructive"
                            onClick={() => handleRejectCustomer(customer._id)}
                            disabled={isProcessing}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Sellers Tab */}
          <TabsContent value="sellers" className="mt-6">
            {loadingSellers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : sellers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <UserCheck className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No pending sellers</h3>
                  <p className="text-muted-foreground">
                    All seller registrations have been processed.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {sellers.map((seller) => {
                  const isProcessing = processingId === seller._id;
                  
                  return (
                    <Card key={seller._id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{seller.name}</CardTitle>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Mail className="h-4 w-4" />
                                {seller.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(seller.createdAt)}
                              </span>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleVerifyClick(seller)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <UserCheck className="h-4 w-4 mr-1" />
                            )}
                            Verify & Assign
                          </Button>
                          <Button
                            variant="outline"
                            className="text-destructive"
                            onClick={() => handleRejectSeller(seller._id)}
                            disabled={isProcessing}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Verify Seller Dialog */}
        <Dialog open={verifyDialog} onOpenChange={setVerifyDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Verify Seller</DialogTitle>
              <DialogDescription>
                Assign a market location to {selectedSeller?.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Market Location</label>
                <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select market" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="San Nicolas Market">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        San Nicolas Market
                      </div>
                    </SelectItem>
                    <SelectItem value="Pampanga Market">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Pampanga Market
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setVerifyDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleVerifySeller} 
                disabled={!selectedMarket || processingId !== null}
              >
                {processingId ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : null}
                Verify Seller
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
