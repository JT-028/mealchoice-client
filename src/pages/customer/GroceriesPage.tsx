import { useEffect, useState, useCallback } from 'react';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  ShoppingBasket,
  Sparkles,
  RefreshCw,
  Loader2,
  Check,
  Calendar,
  ChevronRight,
  ShoppingCart,
  AlertCircle,
  Search,
  Store
} from 'lucide-react';
import {
  getSavedMeals,
  type SavedMeal
} from '@/api/recommendations';
import { getAllProducts, type Product } from '@/api/products';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface GroceryItem {
  name: string;
  meals: string[];
  count: number;
  checked: boolean;
}

// Get the start of the current week (Sunday)
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Get the end of the current week (Saturday)
function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
}

// Aggregate ingredients from saved meals for the current week
const aggregateGroceriesFromMeals = (meals: SavedMeal[]): GroceryItem[] => {
  const groceryMap = new Map<string, { meals: Set<string>; count: number }>();

  const weekStart = getWeekStart(new Date());
  const weekEnd = getWeekEnd(new Date());

  // Filter meals to only this week
  const thisWeekMeals = meals.filter(meal => {
    if (!meal.scheduledDate) return false;
    const mealDate = new Date(meal.scheduledDate);
    return mealDate >= weekStart && mealDate <= weekEnd;
  });

  thisWeekMeals.forEach(meal => {
    if (!meal.ingredients || !Array.isArray(meal.ingredients)) return;

    meal.ingredients.forEach(ingredient => {
      const normalizedName = ingredient.toLowerCase().trim();
      const existing = groceryMap.get(normalizedName);

      if (existing) {
        existing.meals.add(meal.mealName);
        existing.count++;
      } else {
        groceryMap.set(normalizedName, {
          meals: new Set([meal.mealName]),
          count: 1
        });
      }
    });
  });

  return Array.from(groceryMap.entries())
    .map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      meals: Array.from(data.meals),
      count: data.count,
      checked: false
    }))
    .sort((a, b) => b.count - a.count);
};

export default function GroceriesPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [groceries, setGroceries] = useState<GroceryItem[]>([]);

  // Product search state
  const [searchingProduct, setSearchingProduct] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<GroceryItem | null>(null);
  const [matchingProducts, setMatchingProducts] = useState<Product[]>([]);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [notFoundDialogOpen, setNotFoundDialogOpen] = useState(false);

  const { addItem } = useCart();

  const loadSavedMeals = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await getSavedMeals(token);
      const meals = response.data || [];
      setSavedMeals(meals);

      // Load checked state from localStorage
      const savedChecked = localStorage.getItem('groceries_checked');
      const checkedMap = savedChecked ? JSON.parse(savedChecked) : {};

      const aggregated = aggregateGroceriesFromMeals(meals);
      const withCheckedState = aggregated.map(item => ({
        ...item,
        checked: checkedMap[item.name.toLowerCase()] || false
      }));
      setGroceries(withCheckedState);
    } catch (error) {
      console.error('Error loading saved meals:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadSavedMeals();
    }
  }, [token, loadSavedMeals]);

  const handleCheckIngredient = async (item: GroceryItem, index: number) => {
    // If already checked, just toggle off
    if (item.checked) {
      toggleItemChecked(index, false);
      return;
    }

    // Search for matching products
    setSelectedIngredient(item);
    setSearchingProduct(true);

    try {
      const response = await getAllProducts({ search: item.name });

      if (response.success && response.products && response.products.length > 0) {
        // Filter to only available products
        const availableProducts = response.products.filter(p => p.isAvailable && p.quantity > 0);

        if (availableProducts.length > 0) {
          setMatchingProducts(availableProducts);
          setProductDialogOpen(true);
        } else {
          // Products exist but none available
          setNotFoundDialogOpen(true);
        }
      } else {
        // No products found at all
        setNotFoundDialogOpen(true);
      }
    } catch (error) {
      console.error('Error searching products:', error);
      setNotFoundDialogOpen(true);
    } finally {
      setSearchingProduct(false);
    }
  };

  const toggleItemChecked = (index: number, checked: boolean) => {
    setGroceries(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], checked };

      // Save checked state to localStorage
      const checkedMap: Record<string, boolean> = {};
      updated.forEach(item => {
        checkedMap[item.name.toLowerCase()] = item.checked;
      });
      localStorage.setItem('groceries_checked', JSON.stringify(checkedMap));

      return updated;
    });
  };

  const handleAddToCart = (product: Product) => {
    addItem(product, 1);
    toast.success(`${product.name} added to cart`);

    // Mark the ingredient as checked
    const index = groceries.findIndex(g => g.name.toLowerCase() === selectedIngredient?.name.toLowerCase());
    if (index !== -1) {
      toggleItemChecked(index, true);
    }

    setProductDialogOpen(false);
    setSelectedIngredient(null);
    setMatchingProducts([]);
  };

  const handleNotFoundClose = () => {
    setNotFoundDialogOpen(false);
    setSelectedIngredient(null);
  };

  const clearAllChecks = () => {
    setGroceries(prev => prev.map(item => ({ ...item, checked: false })));
    localStorage.removeItem('groceries_checked');
  };

  // Count meals scheduled for this week
  const weekStart = getWeekStart(new Date());
  const weekEnd = getWeekEnd(new Date());
  const thisWeekMealCount = savedMeals.filter(meal => {
    if (!meal.scheduledDate) return false;
    const mealDate = new Date(meal.scheduledDate);
    return mealDate >= weekStart && mealDate <= weekEnd;
  }).length;

  const checkedCount = groceries.filter(g => g.checked).length;
  const totalCount = groceries.length;
  const progressPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">From Your Meal Plan</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Grocery List</h1>
            <p className="text-muted-foreground mt-2">
              {thisWeekMealCount > 0
                ? `Ingredients from ${thisWeekMealCount} meal${thisWeekMealCount !== 1 ? 's' : ''} scheduled this week.`
                : 'Click an ingredient to find it in our partner markets.'
              }
            </p>
          </div>
          <div className="flex gap-2">
            {groceries.length > 0 && (
              <Button
                variant="outline"
                onClick={clearAllChecks}
                disabled={checkedCount === 0}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </Button>
            )}
            <Button onClick={loadSavedMeals} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {groceries.length > 0 ? (
          <>
            {/* Progress Bar */}
            <Card className="mb-8 border-none shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Shopping Progress</span>
                  <span className="text-sm font-bold">{checkedCount} / {totalCount} items</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-green-500 transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                {progressPercent === 100 && (
                  <div className="flex items-center gap-2 mt-3 text-green-600 font-medium">
                    <Check className="h-5 w-5" />
                    All items checked! You're ready to cook!
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Grocery List */}
            <Card className="border-none shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBasket className="h-5 w-5 text-primary" />
                  Ingredients ({totalCount})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {groceries.map((item, index) => (
                    <div
                      key={item.name}
                      className={cn(
                        "flex items-center gap-4 px-6 py-4 transition-colors cursor-pointer hover:bg-muted/50",
                        item.checked && "bg-green-50 dark:bg-green-950/20"
                      )}
                      onClick={() => handleCheckIngredient(item, index)}
                    >
                      <Checkbox
                        checked={item.checked}
                        onCheckedChange={() => handleCheckIngredient(item, index)}
                        className="h-5 w-5"
                        disabled={searchingProduct && selectedIngredient?.name === item.name}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-medium transition-all flex items-center gap-2",
                          item.checked && "line-through text-muted-foreground"
                        )}>
                          {item.name}
                          {searchingProduct && selectedIngredient?.name === item.name && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          Used in: {item.meals.slice(0, 3).join(', ')}{item.meals.length > 3 ? ` +${item.meals.length - 3} more` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="shrink-0">
                          ×{item.count}
                        </Badge>
                        {!item.checked && (
                          <Search className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border-2 border-dashed dark:border-white/20">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <ShoppingBasket className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">No grocery list yet</h3>
            <p className="text-muted-foreground mt-2 mb-8 text-center max-w-sm">
              Save meals to your weekly schedule from Generate Meals to see your grocery list here.
            </p>
            <Link to="/customer/meal-planner">
              <Button className="rounded-xl h-12 px-8 font-bold gap-2">
                <Calendar className="h-5 w-5" />
                Go to Meal Planner
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Product Selection Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Products matching "{selectedIngredient?.name}"
            </DialogTitle>
            <DialogDescription>
              Found {matchingProducts.length} product(s) in our partner markets. Click to add to cart.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto py-4 space-y-3">
            {matchingProducts.map(product => {
              const seller = typeof product.seller === 'object' ? product.seller : null;
              return (
                <div
                  key={product._id}
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleAddToCart(product)}
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                      <ShoppingBasket className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {seller?.name || 'Seller'} • {product.marketLocation}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">{formatCurrency(product.price)}/{product.unit}</Badge>
                      <Badge variant="outline">{product.quantity} available</Badge>
                    </div>
                  </div>
                  <Button size="sm" className="shrink-0 gap-1">
                    <ShoppingCart className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Not Found Alert Dialog */}
      <AlertDialog open={notFoundDialogOpen} onOpenChange={setNotFoundDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Ingredient Not Available
            </AlertDialogTitle>
            <AlertDialogDescription>
              Sorry, we couldn't find <strong>"{selectedIngredient?.name}"</strong> in any of our partner markets right now.
              <br /><br />
              You may need to purchase this ingredient from another store.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleNotFoundClose}>
              I Understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CustomerLayout>
  );
}
