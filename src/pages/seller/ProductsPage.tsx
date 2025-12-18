import { useEffect, useState } from 'react';
import { SellerLayout } from '@/components/layout/SellerLayout';
import { PendingVerification } from '@/components/seller/PendingVerification';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useAuth } from '@/contexts/AuthContext';
import {
  getSellerProducts,
  deleteProduct,
  type Product,
} from '@/api/products';
import { ProductForm } from '@/components/seller/ProductForm';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Package,
  AlertTriangle
} from 'lucide-react';

export function ProductsPage() {
  const { token, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = async () => {
    if (!token || !user?.isVerified) {
      setLoading(false);
      return;
    }
    
    try {
      const response = await getSellerProducts(token);
      if (response.success && response.products) {
        setProducts(response.products);
        setFilteredProducts(response.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [token, user?.isVerified]);

  // Filter products based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const handleAddClick = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!token || !productToDelete) return;

    setDeleting(true);
    try {
      const response = await deleteProduct(token, productToDelete._id);
      if (response.success) {
        setProducts(products.filter(p => p._id !== productToDelete._id));
        setDeleteDialogOpen(false);
        setProductToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingProduct(null);
    fetchProducts();
  };

  const getStockBadge = (product: Product) => {
    if (product.quantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }
    if (product.quantity <= product.lowStockThreshold) {
      return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Low Stock</Badge>;
    }
    return <Badge variant="secondary">In Stock</Badge>;
  };

  // Block unverified sellers
  if (!user?.isVerified) {
    return (
      <SellerLayout>
        <PendingVerification message="You cannot add products until your account is verified by an admin." />
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Products</h1>
            <p className="text-muted-foreground">Manage your product inventory</p>
          </div>
          <Button onClick={handleAddClick}>
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Products Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 border rounded-lg border-dashed">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No products yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by adding your first product to your inventory.
            </p>
            <Button onClick={handleAddClick}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Product
            </Button>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₱{product.price.toFixed(2)}
                      <span className="text-muted-foreground text-sm">/{product.unit}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {product.quantity <= product.lowStockThreshold && product.quantity > 0 && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                        {product.quantity} {product.unit}
                      </div>
                    </TableCell>
                    <TableCell>{getStockBadge(product)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(product)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
              <DialogDescription>
                {editingProduct
                  ? 'Update the product details below.'
                  : 'Fill in the details to add a new product.'}
              </DialogDescription>
            </DialogHeader>
            <ProductForm
              product={editingProduct}
              onSuccess={handleFormSuccess}
              onCancel={() => setFormOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Product</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SellerLayout>
  );
}
