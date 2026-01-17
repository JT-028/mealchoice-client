import { useEffect, useState } from 'react';
import { SellerLayout } from '@/components/layout/SellerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { getSellerProducts, updateProduct, type Product } from '@/api/products';
import { getSettings, updateSellerSettings as updateSellerApi } from '@/api/settings';
import { toast } from 'sonner';
import {
  Package,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Loader2,
  Save,
  Search,
  Tags,
  Plus,
  X
} from 'lucide-react';

const DEFAULT_CATEGORIES = ['vegetables', 'fruits', 'meat', 'seafood', 'grains', 'dairy', 'spices', 'others'];

export function InventoryPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editedProducts, setEditedProducts] = useState<Record<string, { quantity?: number; lowStockThreshold?: number; isAvailable?: boolean }>>({});

  // Custom categories state
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [lastSavedCategories, setLastSavedCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [savingCategories, setSavingCategories] = useState(false);

  const isCategoriesDirty = JSON.stringify(customCategories) !== JSON.stringify(lastSavedCategories);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        const [productsRes, settingsRes] = await Promise.all([
          getSellerProducts(token),
          getSettings(token)
        ]);

        if (productsRes.success && productsRes.products) {
          setProducts(productsRes.products);
        }
        if (settingsRes.success && settingsRes.settings) {
          const cats = settingsRes.settings.customCategories || [];
          setCustomCategories(cats);
          setLastSavedCategories(cats);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // Calculate stats
  const stats = {
    total: products.length,
    inStock: products.filter(p => p.quantity > p.lowStockThreshold).length,
    lowStock: products.filter(p => p.quantity > 0 && p.quantity <= p.lowStockThreshold).length,
    outOfStock: products.filter(p => p.quantity === 0).length,
    unavailable: products.filter(p => !p.isAvailable).length
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFieldChange = (productId: string, field: 'quantity' | 'lowStockThreshold' | 'isAvailable', value: number | boolean) => {
    setEditedProducts(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value
      }
    }));
  };

  const handleSaveProduct = async (product: Product) => {
    if (!token) return;
    const changes = editedProducts[product._id];
    if (!changes) return;

    setSaving(product._id);
    try {
      const response = await updateProduct(token, product._id, {
        quantity: changes.quantity ?? product.quantity,
        lowStockThreshold: changes.lowStockThreshold ?? product.lowStockThreshold,
        isAvailable: changes.isAvailable ?? product.isAvailable
      });

      if (response.success && response.product) {
        setProducts(prev => prev.map(p => p._id === product._id ? response.product! : p));
        setEditedProducts(prev => {
          const updated = { ...prev };
          delete updated[product._id];
          return updated;
        });
        toast.success(`Updated ${product.name}`);
      } else {
        toast.error(response.message || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Server error. Please try again.');
    } finally {
      setSaving(null);
    }
  };

  const handleAddCategory = () => {
    const trimmed = newCategory.trim().toLowerCase();
    if (!trimmed) return;
    if (DEFAULT_CATEGORIES.includes(trimmed) || customCategories.includes(trimmed)) {
      return; // Already exists
    }
    setCustomCategories(prev => [...prev, trimmed]);
    setNewCategory('');
  };

  const handleRemoveCategory = (category: string) => {
    setCustomCategories(prev => prev.filter(c => c !== category));
  };

  const handleSaveCategories = async () => {
    if (!token) return;
    setSavingCategories(true);
    try {
      const response = await updateSellerApi(token, { customCategories });
      if (response.success) {
        setLastSavedCategories(customCategories);
        toast.success('Product categories updated successfully');
      } else {
        toast.error(response.message || 'Failed to update categories');
      }
    } catch (error) {
      console.error('Error saving categories:', error);
      toast.error('Server error. Please try again.');
    } finally {
      setSavingCategories(false);
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.quantity === 0) return { label: 'Out of Stock', variant: 'destructive' as const, icon: XCircle };
    if (product.quantity <= product.lowStockThreshold) return { label: 'Low Stock', variant: 'outline' as const, icon: AlertTriangle, className: "text-yellow-600 dark:text-yellow-400 border-yellow-500/20 bg-yellow-500/10" };
    return { label: 'In Stock', variant: 'default' as const, icon: CheckCircle };
  };


  if (loading) {
    return (
      <SellerLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground">Manage stock levels, thresholds, and product availability</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.inStock}</p>
                  <p className="text-sm text-muted-foreground">In Stock</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
                  <p className="text-sm text-muted-foreground">Low Stock</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
                  <p className="text-sm text-muted-foreground">Out of Stock</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.unavailable}</p>
                  <p className="text-sm text-muted-foreground">Unavailable</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Custom Categories Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5" />
              Product Categories
            </CardTitle>
            <CardDescription>Manage your custom product categories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {DEFAULT_CATEGORIES.map(cat => (
                <Badge key={cat} variant="secondary" className="capitalize">
                  {cat}
                </Badge>
              ))}
              {customCategories.map(cat => (
                <Badge key={cat} variant="default" className="capitalize flex items-center gap-1">
                  {cat}
                  <button onClick={() => handleRemoveCategory(cat)} className="ml-1 hover:bg-white/20 rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add new category..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                className="max-w-xs"
              />
              <Button onClick={handleAddCategory} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
              {isCategoriesDirty && (
                <div className="flex gap-2">
                  <Button onClick={handleSaveCategories} size="sm" disabled={savingCategories}>
                    {savingCategories ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                    Save Changes
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCustomCategories(lastSavedCategories)}
                    disabled={savingCategories}
                  >
                    Discard
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stock Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Levels</CardTitle>
            <CardDescription>Update quantities and low stock thresholds</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="mb-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Products Table - Desktop */}
            <div className="hidden sm:block border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Product</th>
                      <th className="text-left p-3 font-medium">Category</th>
                      <th className="text-center p-3 font-medium">Stock</th>
                      <th className="text-center p-3 font-medium">Low Threshold</th>
                      <th className="text-center p-3 font-medium">Status</th>
                      <th className="text-center p-3 font-medium">Available</th>
                      <th className="text-center p-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const status = getStockStatus(product);
                      const StatusIcon = status.icon;
                      const edited = editedProducts[product._id];
                      const hasChanges = edited && (
                        edited.quantity !== undefined ||
                        edited.lowStockThreshold !== undefined ||
                        edited.isAvailable !== undefined
                      );

                      return (
                        <tr key={product._id} className="border-t">
                          <td className="p-3">
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">₱{product.price}/{product.unit}</div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="capitalize">{product.category}</Badge>
                          </td>
                          <td className="p-3 text-center">
                            <Input
                              type="number"
                              min="0"
                              value={edited?.quantity ?? product.quantity}
                              onChange={(e) => handleFieldChange(product._id, 'quantity', parseInt(e.target.value) || 0)}
                              className="w-20 mx-auto text-center"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <Input
                              type="number"
                              min="0"
                              value={edited?.lowStockThreshold ?? product.lowStockThreshold}
                              onChange={(e) => handleFieldChange(product._id, 'lowStockThreshold', parseInt(e.target.value) || 0)}
                              className="w-20 mx-auto text-center"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant={status.variant} className={`gap-1 ${(status as any).className || ''}`}>
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            <Switch
                              checked={edited?.isAvailable ?? product.isAvailable}
                              onCheckedChange={(checked) => handleFieldChange(product._id, 'isAvailable', checked)}
                            />
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              size="sm"
                              disabled={!hasChanges || saving === product._id}
                              onClick={() => handleSaveProduct(product)}
                            >
                              {saving === product._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredProducts.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No products found
                </div>
              )}
            </div>

            {/* Products Cards - Mobile */}
            <div className="sm:hidden space-y-3">
              {filteredProducts.map((product) => {
                const status = getStockStatus(product);
                const StatusIcon = status.icon;
                const edited = editedProducts[product._id];
                const hasChanges = edited && (
                  edited.quantity !== undefined ||
                  edited.lowStockThreshold !== undefined ||
                  edited.isAvailable !== undefined
                );

                return (
                  <div key={product._id} className="border rounded-lg p-4 space-y-3">
                    {/* Product Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">₱{product.price}/{product.unit}</div>
                      </div>
                      <Badge variant={status.variant} className={`gap-1 ${(status as any).className || ''}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </div>

                    {/* Category */}
                    <div>
                      <Badge variant="outline" className="capitalize">{product.category}</Badge>
                    </div>

                    {/* Stock and Threshold inputs */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Stock</label>
                        <Input
                          type="number"
                          min="0"
                          value={edited?.quantity ?? product.quantity}
                          onChange={(e) => handleFieldChange(product._id, 'quantity', parseInt(e.target.value) || 0)}
                          className="text-center"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Low Threshold</label>
                        <Input
                          type="number"
                          min="0"
                          value={edited?.lowStockThreshold ?? product.lowStockThreshold}
                          onChange={(e) => handleFieldChange(product._id, 'lowStockThreshold', parseInt(e.target.value) || 0)}
                          className="text-center"
                        />
                      </div>
                    </div>

                    {/* Available toggle and Save */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={edited?.isAvailable ?? product.isAvailable}
                          onCheckedChange={(checked) => handleFieldChange(product._id, 'isAvailable', checked)}
                        />
                        <span className="text-sm text-muted-foreground">Available</span>
                      </div>
                      <Button
                        size="sm"
                        disabled={!hasChanges || saving === product._id}
                        onClick={() => handleSaveProduct(product)}
                      >
                        {saving === product._id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Save className="h-4 w-4 mr-1" />
                        )}
                        Save
                      </Button>
                    </div>
                  </div>
                );
              })}
              {filteredProducts.length === 0 && (
                <div className="p-8 text-center text-muted-foreground border rounded-lg">
                  No products found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </SellerLayout>
  );
}
