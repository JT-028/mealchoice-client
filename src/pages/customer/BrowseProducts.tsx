import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAllProducts, PRODUCT_CATEGORIES, type Product } from '@/api/products';
import { useCart } from '@/contexts/CartContext';
import {
  Search,
  ShoppingBag,
  MapPin,
  Loader2,
  Package,
  ShoppingCart,
  Plus,
  Check
} from 'lucide-react';

export function BrowseProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  
  const { addItem, getItemQuantity, totalItems } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await getAllProducts({
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          market: selectedMarket || undefined,
          search: searchQuery || undefined,
        });
        if (response.success && response.products) {
          setProducts(response.products);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchProducts, 300);
    return () => clearTimeout(debounce);
  }, [selectedCategory, selectedMarket, searchQuery]);

  const categories = [
    { value: 'all', label: 'All' },
    ...PRODUCT_CATEGORIES
  ];

  const handleAddToCart = (product: Product) => {
    addItem(product, 1);
  };

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Browse Products</h1>
            <p className="text-muted-foreground">Fresh products from local Angeles City markets</p>
          </div>
          {totalItems > 0 && (
            <Button asChild>
              <Link to="/customer/cart">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart ({totalItems})
              </Link>
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={selectedMarket === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMarket(null)}
            >
              All Markets
            </Button>
            <Button
              variant={selectedMarket === 'San Nicolas Market' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMarket('San Nicolas Market')}
            >
              <MapPin className="h-4 w-4 mr-1" />
              San Nicolas
            </Button>
            <Button
              variant={selectedMarket === 'Pampanga Market' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMarket('Pampanga Market')}
            >
              <MapPin className="h-4 w-4 mr-1" />
              Pampanga
            </Button>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="flex-wrap h-auto gap-1">
            {categories.map((cat) => (
              <TabsTrigger key={cat.value} value={cat.value} className="capitalize">
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 border rounded-lg border-dashed">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? 'Try a different search term'
                    : 'No products available in this category yet'
                  }
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => {
                  const inCart = getItemQuantity(product._id) > 0;
                  
                  return (
                    <Card key={product._id}>
                      <div className="h-36 bg-muted flex items-center justify-center overflow-hidden">
                        {product.image ? (
                          <img
                            src={`http://localhost:5000${product.image}`}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
                        )}
                      </div>
                      <CardContent>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                          <Badge variant="secondary" className="capitalize shrink-0">
                            {product.category}
                          </Badge>
                        </div>
                        
                        {product.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {product.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-bold text-primary">
                              ₱{product.price.toFixed(2)}
                              <span className="text-sm font-normal text-muted-foreground">
                                /{product.unit}
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {product.marketLocation}
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            variant={inCart ? 'secondary' : 'default'}
                            onClick={() => handleAddToCart(product)}
                          >
                            {inCart ? (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Added
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                              </>
                            )}
                          </Button>
                        </div>

                        {typeof product.seller === 'object' && product.seller && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Sold by: {product.seller.name}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </CustomerLayout>
  );
}
