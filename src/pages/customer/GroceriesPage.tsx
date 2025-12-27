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
  ChevronRight
} from 'lucide-react';
import { 
  type MealPlanResponse
} from '@/api/recommendations';
import { Link } from 'react-router-dom';

interface GroceryItem {
  name: string;
  meals: string[];
  count: number;
  checked: boolean;
}

const aggregateGroceries = (weekPlan: MealPlanResponse['data']['weekPlan']): GroceryItem[] => {
  const groceryMap = new Map<string, { meals: Set<string>; count: number }>();
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const slots: ('breakfast' | 'lunch' | 'dinner')[] = ['breakfast', 'lunch', 'dinner'];
  
  days.forEach(day => {
    const dayPlan = weekPlan[day];
    if (!dayPlan) return;
    
    slots.forEach(slot => {
      const meal = dayPlan[slot];
      if (!meal?.ingredients) return;
      
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
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<MealPlanResponse['data'] | null>(null);
  const [groceries, setGroceries] = useState<GroceryItem[]>([]);

  const loadPlan = useCallback(() => {
    setLoading(true);
    try {
      const cached = localStorage.getItem('ai_meal_plan');
      if (cached) {
        const parsedPlan = JSON.parse(cached);
        setPlan(parsedPlan);
        
        // Load checked state from localStorage
        const savedChecked = localStorage.getItem('groceries_checked');
        const checkedMap = savedChecked ? JSON.parse(savedChecked) : {};
        
        const aggregated = aggregateGroceries(parsedPlan.weekPlan);
        const withCheckedState = aggregated.map(item => ({
          ...item,
          checked: checkedMap[item.name.toLowerCase()] || false
        }));
        setGroceries(withCheckedState);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlan();
    
    // Listen for storage changes (when meal plan is regenerated)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ai_meal_plan') {
        loadPlan();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadPlan]);

  const toggleItem = (index: number) => {
    setGroceries(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], checked: !updated[index].checked };
      
      // Save checked state to localStorage
      const checkedMap: Record<string, boolean> = {};
      updated.forEach(item => {
        checkedMap[item.name.toLowerCase()] = item.checked;
      });
      localStorage.setItem('groceries_checked', JSON.stringify(checkedMap));
      
      return updated;
    });
  };

  const clearAllChecks = () => {
    setGroceries(prev => prev.map(item => ({ ...item, checked: false })));
    localStorage.removeItem('groceries_checked');
  };

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
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">AI Generated</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Grocery List</h1>
            <p className="text-muted-foreground mt-2">All ingredients from your weekly meal plan.</p>
          </div>
          {groceries.length > 0 && (
            <Button 
              variant="outline" 
              onClick={clearAllChecks}
              disabled={checkedCount === 0}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reset Checks
            </Button>
          )}
        </div>

        {plan && groceries.length > 0 ? (
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
                      onClick={() => toggleItem(index)}
                    >
                      <Checkbox 
                        checked={item.checked}
                        onCheckedChange={() => toggleItem(index)}
                        className="h-5 w-5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-medium transition-all",
                          item.checked && "line-through text-muted-foreground"
                        )}>
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          Used in: {item.meals.slice(0, 3).join(', ')}{item.meals.length > 3 ? ` +${item.meals.length - 3} more` : ''}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        ×{item.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border-2 border-dashed">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <ShoppingBasket className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold">No grocery list yet</h3>
            <p className="text-muted-foreground mt-2 mb-8 text-center max-w-sm">
              {plan ? 
                "Your meal plan doesn't have ingredient data. Try regenerating it to get a grocery list." :
                "Generate a meal plan first to see your grocery list here."
              }
            </p>
            <Link to="/customer/ai-meal-planner">
              <Button className="rounded-xl h-12 px-8 font-bold gap-2">
                <Calendar className="h-5 w-5" />
                Go to Meal Planner
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
