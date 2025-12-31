import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Calendar,
  ChevronRight,
  Loader2,
  Info,
  Trash2,
  Flame,
  List,
  Coffee,
  Sun,
  Moon,
  Candy,
  Sparkles,
  Plus
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import {
  getSavedMeals,
  deleteSavedMeal,
  deleteAllSavedMeals,
  type SavedMeal,
  type MealCategory
} from '@/api/recommendations';
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
import { toast } from 'sonner';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MEAL_CATEGORIES: { id: MealCategory; label: string; icon: typeof Sun }[] = [
  { id: 'breakfast', label: 'Breakfast', icon: Coffee },
  { id: 'lunch', label: 'Lunch', icon: Sun },
  { id: 'dinner', label: 'Dinner', icon: Moon },
  { id: 'snacks', label: 'Snacks', icon: Candy },
];

function ImageWithSkeleton({ src, alt, className, containerClassName }: { src: string; alt: string; className?: string; containerClassName?: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      {!loaded && <Skeleton className="absolute inset-0 w-full h-full" />}
      <img
        src={src}
        alt={alt}
        className={cn(className, "transition-opacity duration-500", !loaded ? "opacity-0" : "opacity-100")}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

// Helper to get the start of the week (Sunday)
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function AIMealPlannerPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [activeDay, setActiveDay] = useState(DAYS[new Date().getDay()]);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mealToDelete, setMealToDelete] = useState<SavedMeal | null>(null);
  const [deletingMealId, setDeletingMealId] = useState<string | null>(null);

  // Reset plan state
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Ingredients modal state
  const [ingredientsDialogOpen, setIngredientsDialogOpen] = useState(false);
  const [selectedMealForIngredients, setSelectedMealForIngredients] = useState<SavedMeal | null>(null);

  const dayNavRef = useRef<HTMLDivElement>(null);

  const loadSavedMeals = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const saved = await getSavedMeals(token);
      setSavedMeals(saved.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadSavedMeals();
    }
  }, [token, loadSavedMeals]);

  // Auto-scroll to current day on mobile
  useEffect(() => {
    if (dayNavRef.current) {
      const todayIndex = new Date().getDay();
      const buttons = dayNavRef.current.querySelectorAll('button');
      if (buttons[todayIndex]) {
        buttons[todayIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [savedMeals]);

  // Get meals for a specific day and category
  const getMealsForDayAndCategory = (dayName: string, category: MealCategory): SavedMeal[] => {
    const weekStart = getWeekStart(new Date());
    const dayIndex = DAYS.indexOf(dayName);
    const targetDate = new Date(weekStart);
    targetDate.setDate(weekStart.getDate() + dayIndex);

    return savedMeals.filter(meal => {
      if (!meal.scheduledDate || !meal.mealType) return false;
      const mealDate = new Date(meal.scheduledDate);
      return (
        mealDate.toDateString() === targetDate.toDateString() &&
        meal.mealType === category
      );
    });
  };

  // Get all meals for a specific day (for calorie count)
  const getMealsForDay = (dayName: string): SavedMeal[] => {
    const weekStart = getWeekStart(new Date());
    const dayIndex = DAYS.indexOf(dayName);
    const targetDate = new Date(weekStart);
    targetDate.setDate(weekStart.getDate() + dayIndex);

    return savedMeals.filter(meal => {
      if (!meal.scheduledDate) return false;
      const mealDate = new Date(meal.scheduledDate);
      return mealDate.toDateString() === targetDate.toDateString();
    });
  };

  const handleDeleteMeal = (meal: SavedMeal) => {
    setMealToDelete(meal);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteMeal = async () => {
    if (!token || !mealToDelete) return;

    setDeletingMealId(mealToDelete._id);
    setDeleteDialogOpen(false);

    try {
      await deleteSavedMeal(token, mealToDelete._id);
      setSavedMeals(prev => prev.filter(m => m._id !== mealToDelete._id));
      toast.success(`${mealToDelete.mealName} removed from schedule`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete meal';
      toast.error(message);
    } finally {
      setDeletingMealId(null);
      setMealToDelete(null);
    }
  };

  const handleResetPlan = async () => {
    if (!token) return;
    setResetting(true);
    try {
      await deleteAllSavedMeals(token);
      setSavedMeals([]);
      setResetDialogOpen(false);
      toast.success('Meal plan reset successfully');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reset plan';
      toast.error(message);
    } finally {
      setResetting(false);
    }
  };

  const handleViewIngredients = (meal: SavedMeal) => {
    setSelectedMealForIngredients(meal);
    setIngredientsDialogOpen(true);
  };

  // Calculate per-day stats
  const getDayStats = (dayName: string) => {
    const dayMeals = getMealsForDay(dayName);
    const totalCalories = dayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
    const mealCount = dayMeals.length;
    return { totalCalories, mealCount };
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CustomerLayout>
    );
  }

  const dayStats = getDayStats(activeDay);
  const hasAnyMeals = savedMeals.some(m => m.scheduledDate && m.mealType);

  return (
    <CustomerLayout noPadding>
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Weekly Schedule</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Meal Planner</h1>
            <p className="text-muted-foreground mt-2">Your scheduled meals from Generate Meals.</p>
          </div>
          <div className="flex items-center gap-3">
            {savedMeals.length > 0 && (
              <Button
                variant="outline"
                className="h-12 px-6 rounded-xl font-bold gap-2 text-destructive border-destructive/20 hover:bg-destructive/10 hover:border-destructive/30"
                onClick={() => setResetDialogOpen(true)}
              >
                <Trash2 className="h-5 w-5" />
                Reset Schedule
              </Button>
            )}
            <Button
              onClick={() => navigate('/customer/generate-meals')}
              className="h-12 px-8 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-bold gap-2"
            >
              <Sparkles className="h-5 w-5" />
              Generate More Meals
            </Button>
          </div>
        </div>

        {/* Day Navigation */}
        <div ref={dayNavRef} className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-6">
          {DAYS.map((day) => {
            const stats = getDayStats(day);
            const isToday = day === DAYS[new Date().getDay()];
            return (
              <Button
                key={day}
                variant={activeDay === day ? 'default' : 'outline'}
                onClick={() => setActiveDay(day)}
                className={cn(
                  "min-w-[130px] rounded-xl font-bold flex flex-col h-auto py-3",
                  activeDay === day && 'shadow-md shadow-primary/20'
                )}
              >
                <span>{isToday ? 'Today' : day}</span>
                {stats.mealCount > 0 && (
                  <span className="text-[10px] opacity-70 mt-1">
                    {stats.mealCount} meal{stats.mealCount !== 1 ? 's' : ''} • {stats.totalCalories} kcal
                  </span>
                )}
              </Button>
            );
          })}
        </div>

        {/* Per-Day Summary */}
        {dayStats.mealCount > 0 && (
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 flex items-center justify-between mb-8">
            <span className="text-sm font-medium text-muted-foreground">{activeDay}'s Schedule</span>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="gap-1">
                <Flame className="h-3 w-3 text-orange-500" />
                {dayStats.totalCalories} kcal total
              </Badge>
              <Badge variant="outline">
                {dayStats.mealCount} meal{dayStats.mealCount !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        )}

        {/* Main Content */}
        {hasAnyMeals ? (
          <div className="space-y-8">
            {MEAL_CATEGORIES.map((category) => {
              const meals = getMealsForDayAndCategory(activeDay, category.id);
              const Icon = category.icon;

              return (
                <div key={category.id} className="space-y-4">
                  {/* Category Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-foreground">{category.label}</h2>
                        <p className="text-sm text-muted-foreground">
                          {meals.length} meal{meals.length !== 1 ? 's' : ''} scheduled
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/customer/generate-meals')}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add {category.label}
                    </Button>
                  </div>

                  {/* Meals Grid */}
                  {meals.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {meals.map((meal) => (
                        <Card key={meal._id} className="overflow-hidden border-none shadow-lg group hover:shadow-xl transition-all duration-300">
                          <div className="flex flex-col">
                            <div className="h-32 w-full relative">
                              <ImageWithSkeleton
                                src={meal.imageUrl || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=800&auto=format&fit=crop'}
                                alt={meal.mealName}
                                containerClassName="w-full h-full"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                              <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                                <Badge variant="secondary" className="bg-white/20 backdrop-blur-md text-white border-white/20">
                                  {meal.calories} kcal
                                </Badge>
                              </div>
                              {/* Delete button */}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteMeal(meal); }}
                                disabled={deletingMealId === meal._id}
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-destructive text-white opacity-0 group-hover:opacity-100 transition-all"
                              >
                                {deletingMealId === meal._id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                            <CardContent className="p-4">
                              <h3 className="font-bold text-foreground mb-1 line-clamp-1">{meal.mealName}</h3>
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{meal.description}</p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full gap-2"
                                onClick={() => handleViewIngredients(meal)}
                              >
                                <List className="h-4 w-4" />
                                View Ingredients
                              </Button>
                            </CardContent>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="border-dashed border-2 bg-muted/10">
                      <CardContent className="flex flex-col items-center justify-center py-8">
                        <Icon className="h-8 w-8 text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground text-center">
                          No {category.label.toLowerCase()} scheduled for {activeDay}
                        </p>
                        <Button
                          variant="link"
                          size="sm"
                          className="mt-2"
                          onClick={() => navigate('/customer/generate-meals')}
                        >
                          Generate {category.label} <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border-2 border-dashed">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Calendar className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">No Meals Scheduled</h3>
            <p className="text-muted-foreground mt-2 mb-8 text-center max-w-sm">
              Start by generating meals and saving them to your weekly schedule.
            </p>
            <Button
              onClick={() => navigate('/customer/generate-meals')}
              className="rounded-xl h-12 px-8 font-bold gap-2"
            >
              <Sparkles className="h-5 w-5" />
              Generate Meals
            </Button>
          </div>
        )}

        {/* Info Card */}
        {hasAnyMeals && (
          <Card className="bg-primary/5 border-primary/20 mt-8">
            <CardContent className="p-6">
              <h3 className="font-bold flex items-center gap-2 mb-2">
                <Info className="h-5 w-5 text-primary" />
                How it works
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Meals shown here are the ones you've saved from the Generate Meals page.
                Each meal is organized by the day and category you selected when saving.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Meal Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{mealToDelete?.mealName}" from your schedule? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteMeal} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Plan Confirmation Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Weekly Schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove ALL saved meals from your schedule. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetPlan}
              disabled={resetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {resetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Reset All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ingredients Modal */}

      <Dialog open={ingredientsDialogOpen} onOpenChange={setIngredientsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <List className="h-5 w-5 text-primary" />
              {selectedMealForIngredients?.mealName}
            </DialogTitle>
            <DialogDescription>
              {selectedMealForIngredients?.mealType && (
                <span className="capitalize">{selectedMealForIngredients.mealType}</span>
              )}
              {' • '}{selectedMealForIngredients?.calories} kcal
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedMealForIngredients?.ingredients && selectedMealForIngredients.ingredients.length > 0 ? (
              <ul className="space-y-2">
                {selectedMealForIngredients.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="capitalize">{ingredient}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <List className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No ingredients available for this meal.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIngredientsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CustomerLayout>
  );
}
