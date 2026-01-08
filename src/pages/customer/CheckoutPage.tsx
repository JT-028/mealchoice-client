import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { createOrder } from '@/api/orders';
import { getSellersInfo } from '@/api/settings';
import { getSavedAddresses, type Address } from '@/api/addresses';
import { getSpending, type Spending } from '@/api/budget';
import {
  ShoppingBag,
  ArrowLeft,
  CheckCircle,
  Loader2,
  AlertTriangle,
  QrCode,
  Banknote,
  Store,
  Truck,
  MapPin,
  Plus,
  Wallet
} from 'lucide-react';
import { getImageUrl } from '@/config/api';
import { formatCurrency } from '@/lib/utils';

type PaymentMethod = 'qr' | 'cod';
type DeliveryType = 'pickup' | 'delivery';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { token } = useAuth();

  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sellersInfo, setSellersInfo] = useState<Record<string, { paymentQR?: string; acceptsQR?: boolean; hasOwnDelivery?: boolean }>>({});
  const [receipts, setReceipts] = useState<Record<string, File>>({});
  const [paymentMethods, setPaymentMethods] = useState<Record<string, PaymentMethod>>({});

  // Budget validation
  const [spending, setSpending] = useState<Spending | null>(null);
  const [showBudgetConfirm, setShowBudgetConfirm] = useState(false);

  // Delivery options
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('pickup');
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    fullAddress: '',
    barangay: '',
    city: '',
    province: '',
    postalCode: '',
    contactPhone: '',
    deliveryNotes: ''
  });

  // Group items by seller
  const itemsBySeller = items.reduce((acc, item) => {
    if (!acc[item.sellerId]) {
      acc[item.sellerId] = {
        sellerName: item.sellerName,
        marketLocation: item.marketLocation,
        items: [],
        subtotal: 0
      };
    }
    acc[item.sellerId].items.push(item);
    acc[item.sellerId].subtotal += item.price * item.quantity;
    return acc;
  }, {} as Record<string, { sellerName: string; marketLocation: string; items: typeof items; subtotal: number }>);

  // Calculate seller IDs once for effect dependency
  const sellerIds = Object.keys(itemsBySeller).sort().join(',');

  useEffect(() => {
    const fetchSellersInfo = async () => {
      if (!token) return;
      const ids = sellerIds.split(',').filter(Boolean);
      if (ids.length === 0) return;

      try {
        const response = await getSellersInfo(token, ids);
        if (response.success && response.sellers) {
          const infoMap: Record<string, { paymentQR?: string; acceptsQR?: boolean; hasOwnDelivery?: boolean }> = {};
          response.sellers.forEach(s => {
            infoMap[s._id] = {
              paymentQR: s.paymentQR,
              acceptsQR: s.acceptsQR,
              hasOwnDelivery: s.hasOwnDelivery
            };
          });
          setSellersInfo(infoMap);

          // Only set default payment methods if not already set
          setPaymentMethods(prev => {
            const updated = { ...prev };
            if (response.sellers) {
              response.sellers.forEach(s => {
                if (!(s._id in updated)) {
                  // Default to COD/Cash
                  updated[s._id] = 'cod';
                }
              });
            }
            return updated;
          });
        }
      } catch (err) {
        console.error('Failed to fetch sellers info:', err);
      }
    };

    fetchSellersInfo();
  }, [sellerIds, token]);

  // Fetch saved addresses when delivery is selected
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!token || deliveryType !== 'delivery') return;

      try {
        const response = await getSavedAddresses(token);
        if (response.success && response.addresses) {
          setSavedAddresses(response.addresses);
          // Auto-select default address
          const defaultAddr = response.addresses.find(a => a.isDefault);
          if (defaultAddr?._id) {
            setSelectedAddressId(defaultAddr._id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch addresses:', err);
      }
    };

    fetchAddresses();
  }, [token, deliveryType]);

  // Fetch spending data for budget validation
  useEffect(() => {
    const fetchSpending = async () => {
      if (!token) return;
      try {
        const response = await getSpending(token);
        if (response.success && response.spending) {
          setSpending(response.spending);
        }
      } catch (err) {
        console.error('Failed to fetch spending data:', err);
      }
    };
    fetchSpending();
  }, [token]);

  const handleFileChange = (sellerId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceipts(prev => ({
        ...prev,
        [sellerId]: e.target.files![0]
      }));
    }
  };

  const handlePaymentMethodChange = (sellerId: string, method: PaymentMethod) => {
    setPaymentMethods(prev => ({
      ...prev,
      [sellerId]: method
    }));
    // Clear receipt if switching to COD
    if (method === 'cod') {
      setReceipts(prev => {
        const newReceipts = { ...prev };
        delete newReceipts[sellerId];
        return newReceipts;
      });
    }
  };

  // Check if order exceeds remaining budget
  const exceedsDailyBudget = spending ? totalPrice > spending.dailyRemaining : false;
  const exceedsWeeklyBudget = spending ? totalPrice > spending.weeklyRemaining : false;
  const exceedsBudget = exceedsDailyBudget || exceedsWeeklyBudget;

  const handleConfirmOrder = () => {
    // If over budget, show confirmation dialog first
    if (exceedsBudget) {
      setShowBudgetConfirm(true);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setShowBudgetConfirm(false);

    if (!token) {
      setError('Please log in to place an order');
      return;
    }

    setLoading(true);
    setError('');

    // Mandatory receipt validation for QR payments
    for (const [sellerId, method] of Object.entries(paymentMethods)) {
      if (method === 'qr' && !receipts[sellerId]) {
        const sellerName = itemsBySeller[sellerId]?.sellerName || 'the seller';
        setError(`Please upload a payment receipt for ${sellerName}`);
        setLoading(false);
        return;
      }
    }

    try {
      const orderItems = items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }));

      // Create FormData
      const formData = new FormData();
      formData.append('items', JSON.stringify(orderItems));
      formData.append('paymentMethods', JSON.stringify(paymentMethods));
      formData.append('deliveryType', deliveryType);
      if (notes) formData.append('notes', notes);

      // Add delivery address if delivery type is delivery
      if (deliveryType === 'delivery') {
        const addressToUse = selectedAddressId
          ? savedAddresses.find(a => a._id === selectedAddressId)
          : newAddress;
        if (addressToUse) {
          formData.append('deliveryAddress', JSON.stringify({
            fullAddress: addressToUse.fullAddress,
            barangay: addressToUse.barangay,
            city: addressToUse.city,
            province: addressToUse.province,
            postalCode: addressToUse.postalCode,
            contactPhone: addressToUse.contactPhone || newAddress.contactPhone,
            deliveryNotes: 'deliveryNotes' in addressToUse ? addressToUse.deliveryNotes : newAddress.deliveryNotes
          }));
        }
      }

      // Append receipts with specific keys (proof_{sellerId})
      Object.entries(receipts).forEach(([sellerId, file]) => {
        formData.append(`proof_${sellerId}`, file);
      });

      const response = await createOrder(token, formData);

      if (response.success) {
        setSuccess(true);
        clearCart();
      } else {
        setError(response.message || 'Failed to place order');
      }
    } catch (err) {
      setError('Server error. Please try again.');
      console.error('Checkout error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && !success) {
    return (
      <CustomerLayout>
        <div className="max-w-2xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold mb-2">No items to checkout</h1>
          <p className="text-muted-foreground mb-6">
            Add items to your cart before proceeding to checkout.
          </p>
          <Button asChild>
            <Link to="/customer/browse">Browse Products</Link>
          </Button>
        </div>
      </CustomerLayout>
    );
  }

  if (success) {
    return (
      <CustomerLayout>
        <div className="max-w-md mx-auto text-center py-12">
          <div className="h-20 w-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-foreground">Order Placed Successfully!</h1>
          <p className="text-muted-foreground mb-6">
            Your order has been sent to the seller(s). You'll be notified when they confirm.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" asChild>
              <Link to="/customer/orders">View Orders</Link>
            </Button>
            <Button asChild>
              <Link to="/customer/browse">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/customer/cart')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Checkout</h1>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 text-destructive bg-destructive/10 rounded-lg">
            <AlertTriangle className="h-5 w-5" />
            {error}
          </div>
        )}

        {/* Budget Warning Banner */}
        {spending && exceedsBudget && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Wallet className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-700 dark:text-amber-300">Order Exceeds Budget</h3>
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                  This order of <strong>{formatCurrency(totalPrice)}</strong> will exceed your remaining budget:
                </p>
                <ul className="text-sm text-amber-600 dark:text-amber-400 mt-2 space-y-1">
                  {exceedsDailyBudget && (
                    <li>
                      • Daily: {formatCurrency(spending.dailyRemaining)} remaining of {formatCurrency(spending.dailyLimit)}
                      <span className="font-medium"> ({formatCurrency(totalPrice - spending.dailyRemaining)} over)</span>
                    </li>
                  )}
                  {exceedsWeeklyBudget && (
                    <li>
                      • Weekly: {formatCurrency(spending.weeklyRemaining)} remaining of {formatCurrency(spending.weeklyLimit)}
                      <span className="font-medium"> ({formatCurrency(totalPrice - spending.weeklyRemaining)} over)</span>
                    </li>
                  )}
                </ul>
                <p className="text-xs text-amber-500 mt-2">
                  You can still proceed, but you'll be asked to confirm.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Order Summary by Seller */}
        {Object.entries(itemsBySeller).map(([sellerId, group]) => {
          const sellerInfo = sellersInfo[sellerId];
          const hasQR = sellerInfo?.acceptsQR && sellerInfo?.paymentQR;
          // COD is effectively "Cash" for pickup, or "COD" for delivery
          // It should always be an option if delivery is pickup (Cash at Store)
          // If delivery is "delivery", it's only available if seller has own delivery (which is checked globally for the option to appear, but good to be safe)
          const selectedMethod = paymentMethods[sellerId] || 'cod';

          return (
            <Card key={sellerId}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{group.sellerName}</h3>
                    <p className="text-sm text-muted-foreground">{group.marketLocation}</p>
                  </div>
                  <p className="font-semibold text-primary">{formatCurrency(group.subtotal)}</p>
                </div>

                <div className="space-y-2 mb-6">
                  {group.items.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        <span>{item.name}</span>
                        <span className="text-muted-foreground">x{item.quantity}</span>
                      </div>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Payment Method Selection */}
                <div className="border-t pt-4">
                  <Label className="mb-3 block font-medium">Payment Method</Label>
                  <RadioGroup
                    value={selectedMethod}
                    onValueChange={(value) => handlePaymentMethodChange(sellerId, value as PaymentMethod)}
                    className="space-y-3"
                  >
                    {/* Cash Option (COD/Pick-up) */}
                    <div className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${selectedMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'}`}>
                      <RadioGroupItem value="cod" id={`cod-${sellerId}`} />
                      <Label htmlFor={`cod-${sellerId}`} className="flex items-center gap-3 cursor-pointer flex-1">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Banknote className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {deliveryType === 'pickup' ? 'Cash Payment' : 'Cash on Delivery'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {deliveryType === 'pickup' ? 'Pay at the store upon pickup' : 'Pay when you receive your order'}
                          </p>
                        </div>
                      </Label>
                    </div>

                    {/* QR Payment Option */}
                    <div className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${selectedMethod === 'qr' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'} ${!hasQR ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <RadioGroupItem value="qr" id={`qr-${sellerId}`} disabled={!hasQR} />
                      <Label htmlFor={`qr-${sellerId}`} className={`flex items-center gap-3 cursor-pointer flex-1 ${!hasQR ? 'cursor-not-allowed' : ''}`}>
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <QrCode className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">QR Code Payment</p>
                          <p className="text-xs text-muted-foreground">
                            {hasQR ? 'Scan and pay via GCash/Maya' : 'Seller has not set up QR payment'}
                          </p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

                  {/* QR Code and Upload Section - only show if QR is selected */}
                  {hasQR && selectedMethod === 'qr' && (
                    <div className="mt-4 space-y-4">
                      <div className="p-4 border rounded-lg bg-muted/20">
                        <div className="flex items-start gap-4">
                          <div className="h-32 w-32 bg-white p-2 rounded border flex-shrink-0">
                            <img
                              src={getImageUrl(sellerInfo.paymentQR!)}
                              alt="Payment QR"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 font-medium mb-1">
                              <QrCode className="h-4 w-4" />
                              <span>Scan to Pay</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Please scan this QR code to make your payment before confirming.
                            </p>
                            <div className="text-sm font-medium bg-primary/10 text-primary px-2 py-1 rounded inline-block">
                              Amount to Pay: {formatCurrency(group.subtotal)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Receipt Upload */}
                      <div>
                        <Label htmlFor={`receipt-${sellerId}`} className="mb-2 block">
                          Upload Payment Receipt <span className="text-destructive">*</span>
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id={`receipt-${sellerId}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(sellerId, e)}
                            className={`cursor-pointer ${selectedMethod === 'qr' && !receipts[sellerId] ? 'border-destructive' : ''}`}
                            required
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedMethod === 'qr' && !receipts[sellerId]
                            ? "A receipt is required for QR payments."
                            : "Upload a screenshot or photo of your payment confirmation."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Delivery Options */}
        <Card>
          <CardContent className="pt-6">
            <Label className="text-base font-semibold mb-4 block">How would you like to receive your order?</Label>
            <RadioGroup value={deliveryType} onValueChange={(v) => setDeliveryType(v as DeliveryType)} className="space-y-3">
              <div className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="pickup" id="pickup" />
                <Label htmlFor="pickup" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Store className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Self Pickup</p>
                    <p className="text-sm text-muted-foreground">Pick up at the market stall</p>
                  </div>
                </Label>
              </div>

              {/* Only show delivery if all sellers support it */}
              {Object.keys(itemsBySeller).every(id => sellersInfo[id]?.hasOwnDelivery) ? (
                <div className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Truck className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Home Delivery</p>
                      <p className="text-sm text-muted-foreground">Seller will arrange delivery</p>
                    </div>
                  </Label>
                </div>
              ) : (
                <div className="flex items-center space-x-3 p-3 border rounded-lg bg-muted/20 opacity-60">
                  <RadioGroupItem value="delivery" id="delivery" disabled />
                  <Label htmlFor="delivery" className="flex items-center gap-2 flex-1">
                    <Truck className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-muted-foreground">Home Delivery Unavailable</p>
                      <p className="text-sm text-muted-foreground">One or more sellers do not offer delivery</p>
                    </div>
                  </Label>
                </div>
              )}
            </RadioGroup>

            {/* Address Form for Delivery */}
            {deliveryType === 'delivery' && (
              <div className="mt-4 space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4" />
                  Delivery Address
                </div>

                {savedAddresses.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm">Saved Addresses</Label>
                    {savedAddresses.map((addr) => (
                      <div
                        key={addr._id}
                        className={`p-3 border rounded-lg cursor-pointer ${selectedAddressId === addr._id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                        onClick={() => { setSelectedAddressId(addr._id!); setShowNewAddressForm(false); }}
                      >
                        <p className="font-medium">{addr.label}</p>
                        <p className="text-sm text-muted-foreground">{addr.fullAddress}</p>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                      onClick={() => { setSelectedAddressId(null); setShowNewAddressForm(true); }}
                    >
                      <Plus className="h-4 w-4" />
                      Use a different address
                    </Button>
                  </div>
                )}

                {(savedAddresses.length === 0 || showNewAddressForm) && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="fullAddress">Complete Address *</Label>
                      <Input
                        id="fullAddress"
                        placeholder="House #, Street, Building"
                        value={newAddress.fullAddress}
                        onChange={(e) => setNewAddress({ ...newAddress, fullAddress: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="barangay">Barangay</Label>
                        <Input
                          id="barangay"
                          placeholder="Barangay"
                          value={newAddress.barangay}
                          onChange={(e) => setNewAddress({ ...newAddress, barangay: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">City/Municipality</Label>
                        <Input
                          id="city"
                          placeholder="City"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="province">Province</Label>
                        <Input
                          id="province"
                          placeholder="Province"
                          value={newAddress.province}
                          onChange={(e) => setNewAddress({ ...newAddress, province: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contactPhone">Contact Phone *</Label>
                        <Input
                          id="contactPhone"
                          placeholder="09XX XXX XXXX"
                          value={newAddress.contactPhone}
                          onChange={(e) => setNewAddress({ ...newAddress, contactPhone: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="deliveryNotes">Delivery Notes</Label>
                      <Input
                        id="deliveryNotes"
                        placeholder="Landmarks, instructions for rider..."
                        value={newAddress.deliveryNotes}
                        onChange={(e) => setNewAddress({ ...newAddress, deliveryNotes: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardContent className="pt-6">
            <Label htmlFor="notes">Order Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any special instructions for the seller..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Total */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between text-lg font-bold mb-4">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(totalPrice)}</span>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleConfirmOrder}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Placing Order...
                </>
              ) : exceedsBudget ? (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Confirm Order (Exceeds Budget)
                </>
              ) : (
                'Confirm Order'
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-4">
              {deliveryType === 'delivery'
                ? 'The seller will contact you to arrange delivery.'
                : 'Please pick up your items at the specified market location.'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Confirmation Dialog */}
      <AlertDialog open={showBudgetConfirm} onOpenChange={setShowBudgetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Order Exceeds Budget
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left space-y-2">
              <p>
                This order of <strong>{formatCurrency(totalPrice)}</strong> will put you over your budget:
              </p>
              {spending && (
                <ul className="list-disc pl-5 space-y-1">
                  {exceedsDailyBudget && spending && (
                    <li>
                      Daily budget: {formatCurrency(spending.dailyRemaining)} remaining →
                      <span className="text-destructive font-medium"> {formatCurrency(totalPrice - spending.dailyRemaining)} over</span>
                    </li>
                  )}
                  {exceedsWeeklyBudget && spending && (
                    <li>
                      Weekly budget: {formatCurrency(spending.weeklyRemaining)} remaining →
                      <span className="text-destructive font-medium"> {formatCurrency(totalPrice - spending.weeklyRemaining)} over</span>
                    </li>
                  )}
                </ul>
              )}
              <p className="pt-2">
                Are you sure you want to proceed with this order?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} className="bg-amber-600 hover:bg-amber-700">
              Place Order Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CustomerLayout >
  );
}
