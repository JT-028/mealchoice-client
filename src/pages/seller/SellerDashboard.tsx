import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SellerLayout } from '@/components/layout/SellerLayout';
import { PendingVerification } from '@/components/seller/PendingVerification';
import { useAuth } from '@/contexts/AuthContext';
import { getSellerProducts, type Product } from '@/api/products';
import {
  Package,
  AlertTriangle,
  PackageX,
  Plus,
  ArrowRight,
  ShoppingCart,
  Loader2
} from 'lucide-react';

export function SellerDashboard() {
  const { token, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    lowStock: 0,
    outOfStock: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!token || !user?.isVerified) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await getSellerProducts(token);
        if (response.success && response.products) {
          setProducts(response.products);
          setStats({
            total: response.count || 0,
            lowStock: response.lowStockCount || 0,
            outOfStock: response.outOfStockCount || 0
          });
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [token, user?.isVerified]);

  const lowStockProducts = products.filter(p => p.quantity > 0 && p.quantity <= p.lowStockThreshold);

  // Show pending verification message for unverified sellers
  if (!user?.isVerified) {
    return (
      <SellerLayout>
        <PendingVerification />
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Seller Dashboard</h1>
            <p className="text-muted-foreground">Manage your products and orders</p>
          </div>
          <Button asChild>
            <Link to="/seller/products">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">Products in your inventory</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
                  <p className="text-xs text-muted-foreground">Products need restocking</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                  <PackageX className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{stats.outOfStock}</div>
                  <p className="text-xs text-muted-foreground">Products unavailable</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">Orders to fulfill</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Low Stock Alert */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Low Stock Alert
                  </CardTitle>
                  <CardDescription>Products running low on inventory</CardDescription>
                </CardHeader>
                <CardContent>
                  {lowStockProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      ✅ All products are well stocked!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {lowStockProducts.slice(0, 5).map((product) => (
                        <div key={product._id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {product.quantity} {product.unit} remaining
                            </p>
                          </div>
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            Low Stock
                          </Badge>
                        </div>
                      ))}
                      {lowStockProducts.length > 5 && (
                        <Button variant="ghost" asChild className="w-full">
                          <Link to="/seller/products">
                            View all {lowStockProducts.length} items
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Products */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Recent Products
                  </CardTitle>
                  <CardDescription>Your latest product additions</CardDescription>
                </CardHeader>
                <CardContent>
                  {products.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        No products yet. Add your first product!
                      </p>
                      <Button asChild size="sm">
                        <Link to="/seller/products">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Product
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {products.slice(0, 5).map((product) => (
                        <div key={product._id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              ₱{product.price.toFixed(2)} / {product.unit}
                            </p>
                          </div>
                          <Badge variant="secondary" className="capitalize">
                            {product.category}
                          </Badge>
                        </div>
                      ))}
                      <Button variant="ghost" asChild className="w-full">
                        <Link to="/seller/products">
                          View all products
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </SellerLayout>
  );
}
