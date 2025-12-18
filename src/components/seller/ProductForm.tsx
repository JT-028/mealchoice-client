import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import {
  createProduct,
  updateProduct,
  type Product,
  type ProductFormData,
  PRODUCT_CATEGORIES,
  PRODUCT_UNITS,
} from '@/api/products';
import { Loader2 } from 'lucide-react';

interface ProductFormProps {
  product?: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const { token } = useAuth();
  const isEditing = !!product;

  const [formData, setFormData] = useState<ProductFormData>({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
    quantity: product?.quantity || 0,
    unit: product?.unit || 'piece',
    category: product?.category || 'others',
    isAvailable: product?.isAvailable ?? true,
    lowStockThreshold: product?.lowStockThreshold || 10,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Not authenticated');
      return;
    }

    if (!formData.name.trim()) {
      setError('Product name is required');
      return;
    }

    if (formData.price <= 0) {
      setError('Price must be greater than 0');
      return;
    }



    setLoading(true);

    try {
      let response;
      
      if (isEditing && product) {
        response = await updateProduct(token, product._id, formData);
      } else {
        response = await createProduct(token, formData);
      }

      if (response.success) {
        onSuccess();
      } else {
        setError(response.message || 'Failed to save product');
      }
    } catch (err) {
      setError('Server error. Please try again.');
      console.error('Product form error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
          {error}
        </div>
      )}

      {/* Product Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Product Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Fresh Tomatoes"
          disabled={loading}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of the product..."
          rows={3}
          disabled={loading}
        />
      </div>

      {/* Price and Quantity Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price (₱) *</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity *</Label>
          <Input
            id="quantity"
            type="number"
            min="0"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
            disabled={loading}
          />
        </div>
      </div>

      {/* Unit and Category Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Unit *</Label>
          <Select
            value={formData.unit}
            onValueChange={(value) => setFormData({ ...formData, unit: value })}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_UNITS.map((unit) => (
                <SelectItem key={unit.value} value={unit.value}>
                  {unit.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>



      {/* Low Stock Threshold */}
      <div className="space-y-2">
        <Label htmlFor="lowStockThreshold">Low Stock Alert Threshold</Label>
        <Input
          id="lowStockThreshold"
          type="number"
          min="0"
          value={formData.lowStockThreshold}
          onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 10 })}
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground">
          You'll be alerted when stock falls below this number
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isEditing ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            isEditing ? 'Update Product' : 'Add Product'
          )}
        </Button>
      </div>
    </form>
  );
}
