import { useEffect, useState, useCallback } from 'react';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  ShoppingBasket,
  RefreshCw,
  Loader2,
  Check,
  Calendar,
  ChevronRight,
  ShoppingCart,
  AlertCircle,
  Search,
  Store,
  Trash2,
  ChevronDown,
  ChevronUp,
  UtensilsCrossed
} from 'lucide-react';
import { getAllProducts, type Product } from '@/api/products';
import { useCart } from '@/contexts/CartContext';
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
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ChecklistIngredient {
  name: string;
  checked: boolean;
}

interface MealChecklist {
  mealId: string;
  mealName: string;
  mealType: string;
  ingredients: ChecklistIngredient[];
  addedAt: string;
}

export default function GroceriesPage() {
  const [loading, setLoading] = useState(true);
  const [mealChecklists, setMealChecklists] = useState<Record<string, MealChecklist>>({});
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set());

  // Product search state
  const [searchingProduct, setSearchingProduct] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<{ name: string; mealId: string } | null>(null);
  const [matchingProducts, setMatchingProducts] = useState<Product[]>([]);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [notFoundDialogOpen, setNotFoundDialogOpen] = useState(false);

  // Remove meal confirmation
  const [removeMealDialogOpen, setRemoveMealDialogOpen] = useState(false);
  const [mealToRemove, setMealToRemove] = useState<string | null>(null);

  const { addItem } = useCart();

  const loadChecklists = useCallback(() => {
    setLoading(true);
    try {
      const savedChecklists = localStorage.getItem('meal_checklists');
      if (savedChecklists) {
        const parsed = JSON.parse(savedChecklists);
        setMealChecklists(parsed);
        // Expand all meals by default
        setExpandedMeals(new Set(Object.keys(parsed)));
      }
    } catch (error) {
      console.error('Error loading checklists:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChecklists();
  }, [loadChecklists]);

  const saveChecklists = (checklists: Record<string, MealChecklist>) => {
    localStorage.setItem('meal_checklists', JSON.stringify(checklists));
    setMealChecklists(checklists);
  };

  const handleCheckIngredient = async (mealId: string, ingredientName: string, currentlyChecked: boolean) => {
    // If toggling off, just update locally
    if (currentlyChecked) {
      const updated = { ...mealChecklists };
      const meal = updated[mealId];
      if (meal) {
        const ingredient = meal.ingredients.find(i => i.name === ingredientName);
        if (ingredient) {
          ingredient.checked = false;
          saveChecklists(updated);
        }
      }
      return;
    }

    // Search for matching products
    setSelectedIngredient({ name: ingredientName, mealId });
    setSearchingProduct(true);

    try {
      const response = await getAllProducts({ search: ingredientName });

      if (response.success && response.products && response.products.length > 0) {
        const availableProducts = response.products.filter(p => p.isAvailable && p.quantity > 0);

        if (availableProducts.length > 0) {
          setMatchingProducts(availableProducts);
          setProductDialogOpen(true);
        } else {
          setNotFoundDialogOpen(true);
        }
      } else {
        setNotFoundDialogOpen(true);
      }
    } catch (error) {
      console.error('Error searching products:', error);
      setNotFoundDialogOpen(true);
    } finally {
      setSearchingProduct(false);
    }
  };

  const markIngredientChecked = (mealId: string, ingredientName: string) => {
    const updated = { ...mealChecklists };
    const meal = updated[mealId];
    if (meal) {
      const ingredient = meal.ingredients.find(i => i.name === ingredientName);
      if (ingredient) {
        ingredient.checked = true;
        saveChecklists(updated);
      }
    }
  };

  const handleAddToCart = (product: Product) => {
    addItem(product, 1);
    toast.success(`${product.name} added to cart`);

    // Mark the ingredient as checked
    if (selectedIngredient) {
      markIngredientChecked(selectedIngredient.mealId, selectedIngredient.name);
    }

    setProductDialogOpen(false);
    setSelectedIngredient(null);
    setMatchingProducts([]);
  };

  const handleNotFoundClose = () => {
    setNotFoundDialogOpen(false);
    setSelectedIngredient(null);
  };

  const confirmRemoveMeal = (mealId: string) => {
    setMealToRemove(mealId);
    setRemoveMealDialogOpen(true);
  };

  const handleRemoveMeal = () => {
    if (!mealToRemove) return;

    const updated = { ...mealChecklists };
    const mealName = updated[mealToRemove]?.mealName;
    delete updated[mealToRemove];
    saveChecklists(updated);

    toast.success(`${mealName} removed from checklist`);
    setRemoveMealDialogOpen(false);
    setMealToRemove(null);
  };

  const toggleMealExpanded = (mealId: string) => {
    setExpandedMeals(prev => {
      const next = new Set(prev);
      if (next.has(mealId)) {
        next.delete(mealId);
      } else {
        next.add(mealId);
      }
      return next;
    });
  };

  const clearAllChecklists = () => {
    localStorage.removeItem('meal_checklists');
    setMealChecklists({});
    toast.success('All checklists cleared');
  };

  // Calculate totals
  const mealIds = Object.keys(mealChecklists);
  const totalIngredients = mealIds.reduce((sum, id) => sum + mealChecklists[id].ingredients.length, 0);
  const checkedIngredients = mealIds.reduce((sum, id) =>
    sum + mealChecklists[id].ingredients.filter(i => i.checked).length, 0
  );
  const progressPercent = totalIngredients > 0 ? Math.round((checkedIngredients / totalIngredients) * 100) : 0;

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
              <ShoppingBasket className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Shopping Checklist</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Check List</h1>
            <p className="text-muted-foreground mt-2">
              {mealIds.length > 0
                ? `${mealIds.length} meal${mealIds.length !== 1 ? 's' : ''} with ${totalIngredients} ingredients to shop for.`
                : 'Generate checklists from your saved meals to start shopping.'
              }
            </p>
          </div>
          <div className="flex gap-2">
            {mealIds.length > 0 && (
              <Button
                variant="outline"
                onClick={clearAllChecklists}
                className="gap-2 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </Button>
            )}
            <Button onClick={loadChecklists} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {mealIds.length > 0 ? (
          <>
            {/* Progress Bar */}
            <Card className="mb-8 border-none shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Shopping Progress</span>
                  <span className="text-sm font-bold">{checkedIngredients} / {totalIngredients} items</span>
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

            {/* Meal Checklists */}
            <div className="space-y-4">
              {mealIds.map(mealId => {
                const meal = mealChecklists[mealId];
                const isExpanded = expandedMeals.has(mealId);
                const mealCheckedCount = meal.ingredients.filter(i => i.checked).length;
                const mealProgress = Math.round((mealCheckedCount / meal.ingredients.length) * 100);

                return (
                  <Card key={mealId} className="border-none shadow-lg overflow-hidden">
                    <CardHeader
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleMealExpanded(mealId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <UtensilsCrossed className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{meal.mealName}</CardTitle>
                            <p className="text-sm text-muted-foreground capitalize">
                              {meal.mealType} • {meal.ingredients.length} ingredients
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={mealProgress === 100 ? "default" : "secondary"} className={mealProgress === 100 ? "bg-green-500" : ""}>
                            {mealCheckedCount}/{meal.ingredients.length}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={(e) => { e.stopPropagation(); confirmRemoveMeal(mealId); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      {/* Mini progress bar */}
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-3">
                        <div
                          className={cn(
                            "h-full transition-all duration-300 rounded-full",
                            mealProgress === 100 ? "bg-green-500" : "bg-primary"
                          )}
                          style={{ width: `${mealProgress}%` }}
                        />
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="pt-0">
                        <div className="divide-y">
                          {meal.ingredients.map((ingredient, index) => (
                            <div
                              key={index}
                              className={cn(
                                "flex items-center gap-4 py-3 transition-colors cursor-pointer hover:bg-muted/30 px-2 -mx-2 rounded-lg",
                                ingredient.checked && "bg-green-50 dark:bg-green-950/20"
                              )}
                              onClick={() => handleCheckIngredient(mealId, ingredient.name, ingredient.checked)}
                            >
                              <Checkbox
                                checked={ingredient.checked}
                                onCheckedChange={() => handleCheckIngredient(mealId, ingredient.name, ingredient.checked)}
                                className="h-5 w-5"
                                disabled={searchingProduct && selectedIngredient?.name === ingredient.name}
                              />
                              <div className="flex-1 min-w-0">
                                <p className={cn(
                                  "font-medium transition-all flex items-center gap-2 capitalize",
                                  ingredient.checked && "line-through text-muted-foreground"
                                )}>
                                  {ingredient.name}
                                  {searchingProduct && selectedIngredient?.name === ingredient.name && (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  )}
                                </p>
                              </div>
                              {!ingredient.checked && (
                                <Search className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border-2 border-dashed dark:border-white/20">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <ShoppingBasket className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">No checklists yet</h3>
            <p className="text-muted-foreground mt-2 mb-8 text-center max-w-sm">
              Go to your Meal Planner, click on a saved meal, and tap "Generate Checklist" to add ingredients here.
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

      {/* Remove Meal Confirmation Dialog */}
      <AlertDialog open={removeMealDialogOpen} onOpenChange={setRemoveMealDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Checklist?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{mealToRemove && mealChecklists[mealToRemove]?.mealName}" from your shopping checklist?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMeal} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CustomerLayout>
  );
}
