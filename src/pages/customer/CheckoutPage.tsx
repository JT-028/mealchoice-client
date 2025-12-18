import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { createOrder } from '@/api/orders';
import {
  ShoppingBag,
  ArrowLeft,
  CheckCircle,
  Loader2,
  AlertTriangle
} from 'lucide-react';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { token } = useAuth();
  
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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

  const handleSubmit = async () => {
    if (!token) {
      setError('Please log in to place an order');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderItems = items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }));

      const response = await createOrder(token, orderItems, notes);

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
          <div className="h-20 w-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Order Placed Successfully!</h1>
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

        {/* Order Summary by Seller */}
        {Object.entries(itemsBySeller).map(([sellerId, group]) => (
          <Card key={sellerId}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">{group.sellerName}</h3>
                  <p className="text-sm text-muted-foreground">{group.marketLocation}</p>
                </div>
                <p className="font-semibold text-primary">₱{group.subtotal.toFixed(2)}</p>
              </div>
              
              <div className="space-y-2">
                {group.items.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                      <span>{item.name}</span>
                      <span className="text-muted-foreground">x{item.quantity}</span>
                    </div>
                    <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

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
              <span className="text-primary">₱{totalPrice.toFixed(2)}</span>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Placing Order...
                </>
              ) : (
                'Confirm Order'
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-4">
              By placing this order, you agree to pick up your items at the specified market location.
            </p>
          </CardContent>
        </Card>
      </div>
    </CustomerLayout>
  );
}
