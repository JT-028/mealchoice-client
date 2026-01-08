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
  Coffee,
  Sun,
  Moon,
  Candy,
  Sparkles,
  Plus,
  Beef,
  Apple,
  Droplets,
  ChefHat,
  Salad,
  Cookie,
  UtensilsCrossed,
  Heart,
  CheckCircle2,
  ClipboardList,
  Coins,
  ChevronLeft
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

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
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(getWeekStart(new Date()));

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
    const dayIndex = DAYS.indexOf(dayName);
    const targetDate = new Date(selectedWeekStart);
    targetDate.setDate(selectedWeekStart.getDate() + dayIndex);

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
    const dayIndex = DAYS.indexOf(dayName);
    const targetDate = new Date(selectedWeekStart);
    targetDate.setDate(selectedWeekStart.getDate() + dayIndex);

    return savedMeals.filter(meal => {
      if (!meal.scheduledDate) return false;
      const mealDate = new Date(meal.scheduledDate);
      return mealDate.toDateString() === targetDate.toDateString();
    });
  };

  const handlePrevWeek = () => {
    const newDate = new Date(selectedWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedWeekStart(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedWeekStart(newDate);
  };

  const handleToday = () => {
    setSelectedWeekStart(getWeekStart(new Date()));
    setActiveDay(DAYS[new Date().getDay()]);
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
        {/* Week Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Weekly Schedule</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Meal Planner</h1>
            <p className="text-muted-foreground mt-2">
              Viewing week of {selectedWeekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} -
              {new Date(new Date(selectedWeekStart).setDate(selectedWeekStart.getDate() + 6)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-muted/50 rounded-xl p-1 border border-border mr-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevWeek}
                className="h-9 w-9 rounded-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToday}
                className="px-3 h-9 text-xs font-bold"
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextWeek}
                className="h-9 w-9 rounded-lg"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            {savedMeals.length > 0 && (
              <Button
                variant="outline"
                className="h-12 px-6 rounded-xl font-bold gap-2 text-destructive border-destructive/20 hover:bg-destructive/10 hover:border-destructive/30"
                onClick={() => setResetDialogOpen(true)}
              >
                <Trash2 className="h-5 w-5" />
                Reset
              </Button>
            )}
            <Button
              onClick={() => navigate('/customer/generate-meals')}
              className="h-12 px-8 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-bold gap-2"
            >
              <Sparkles className="h-5 w-5" />
              Add Meals
            </Button>
          </div>
        </div>

        {/* Day Navigation */}
        <div ref={dayNavRef} className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-6">
          {DAYS.map((day, index) => {
            const stats = getDayStats(day);
            const date = new Date(selectedWeekStart);
            date.setDate(selectedWeekStart.getDate() + index);
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <Button
                key={day}
                variant={activeDay === day ? 'default' : 'outline'}
                onClick={() => setActiveDay(day)}
                className={cn(
                  "min-w-[130px] rounded-xl font-bold flex flex-col h-auto py-3",
                  activeDay === day && 'shadow-md shadow-primary/20',
                  isToday && activeDay !== day && 'border-primary/50 text-primary'
                )}
              >
                <span className="text-xs opacity-70 mb-1">{day}</span>
                <span className="text-lg">
                  {date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                </span>
                {isToday && <Badge variant="secondary" className="mt-1 text-[8px] h-4 py-0">TODAY</Badge>}
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
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
              {activeDay}, {new Date(new Date(selectedWeekStart).setDate(selectedWeekStart.getDate() + DAYS.indexOf(activeDay))).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}'s Schedule
            </span>
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
                                <Info className="h-4 w-4" />
                                View Details
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

      {/* Meal Details Modal with Tabs */}
      <Dialog open={ingredientsDialogOpen} onOpenChange={setIngredientsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedMealForIngredients && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary capitalize">
                    {selectedMealForIngredients.mealType}
                  </Badge>
                  {selectedMealForIngredients.estimatedCost && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Coins className="h-3 w-3 mr-1" />
                      {formatCurrency(selectedMealForIngredients.estimatedCost)}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    <Flame className="h-3 w-3 mr-1" />
                    {selectedMealForIngredients.calories} kcal
                  </Badge>
                </div>
                <DialogTitle className="text-2xl">{selectedMealForIngredients.mealName}</DialogTitle>
                <DialogDescription className="text-base">
                  {selectedMealForIngredients.description}
                </DialogDescription>
              </DialogHeader>

              {/* Health Benefits */}
              {selectedMealForIngredients.healthBenefits && selectedMealForIngredients.healthBenefits.length > 0 && (
                <div className="mt-4 p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground mb-3">
                    <Heart className="h-4 w-4 text-red-500" />
                    Health Benefits
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedMealForIngredients.healthBenefits.map((benefit, i) => (
                      <Badge key={i} variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabbed Content */}
              <Tabs defaultValue="ingredients" className="mt-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="ingredients" className="gap-2">
                    <Salad className="h-4 w-4" />
                    <span className="hidden sm:inline">Ingredients</span>
                  </TabsTrigger>
                  <TabsTrigger value="instructions" className="gap-2">
                    <ChefHat className="h-4 w-4" />
                    <span className="hidden sm:inline">Instructions</span>
                  </TabsTrigger>
                  <TabsTrigger value="nutrition" className="gap-2">
                    <UtensilsCrossed className="h-4 w-4" />
                    <span className="hidden sm:inline">Nutrition</span>
                  </TabsTrigger>
                </TabsList>

                {/* Ingredients Tab */}
                <TabsContent value="ingredients" className="mt-4 space-y-4">
                  {selectedMealForIngredients.ingredients && selectedMealForIngredients.ingredients.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {selectedMealForIngredients.ingredients.length} ingredients needed
                        </span>
                        <Button
                          size="sm"
                          onClick={() => {
                            // Add to checklist in localStorage
                            const existingChecklistRaw = localStorage.getItem('meal_checklists');
                            const existingChecklist = existingChecklistRaw ? JSON.parse(existingChecklistRaw) : {};

                            existingChecklist[selectedMealForIngredients._id] = {
                              mealId: selectedMealForIngredients._id,
                              mealName: selectedMealForIngredients.mealName,
                              mealType: selectedMealForIngredients.mealType,
                              ingredients: selectedMealForIngredients.ingredients.map(ing => ({
                                name: ing,
                                checked: false
                              })),
                              addedAt: new Date().toISOString()
                            };

                            localStorage.setItem('meal_checklists', JSON.stringify(existingChecklist));
                            toast.success(`${selectedMealForIngredients.mealName} added to your checklist!`);
                            setIngredientsDialogOpen(false);
                          }}
                          className="gap-2"
                        >
                          <ClipboardList className="h-4 w-4" />
                          Generate Checklist
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedMealForIngredients.ingredients.map((ingredient, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors">
                            <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                            <span className="text-sm text-foreground capitalize">{ingredient}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Salad className="h-12 w-12 text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground">No ingredients available</p>
                    </div>
                  )}
                </TabsContent>

                {/* Instructions Tab */}
                <TabsContent value="instructions" className="mt-4 space-y-4">
                  {selectedMealForIngredients.instructions && selectedMealForIngredients.instructions.length > 0 ? (
                    <>
                      <div className="text-sm text-muted-foreground mb-4">
                        {selectedMealForIngredients.instructions.length} steps to prepare
                      </div>
                      <div className="space-y-3">
                        {selectedMealForIngredients.instructions.map((step, i) => (
                          <div key={i} className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                              {i + 1}
                            </span>
                            <div className="flex-1 pt-1">
                              <p className="text-sm text-foreground leading-relaxed">{step}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <ChefHat className="h-12 w-12 text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground">No cooking instructions available</p>
                      <p className="text-sm text-muted-foreground/70 mt-1">Instructions may not be available for this saved meal</p>
                    </div>
                  )}
                </TabsContent>

                {/* Nutrition Tab */}
                <TabsContent value="nutrition" className="mt-4 space-y-6">
                  {/* Macros Grid */}
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3">Macronutrients</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="flex flex-col items-center p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                        <Flame className="h-6 w-6 text-orange-500 mb-2" />
                        <span className="text-2xl font-bold text-foreground">{selectedMealForIngredients.calories}</span>
                        <span className="text-xs text-muted-foreground">Calories</span>
                      </div>
                      <div className="flex flex-col items-center p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                        <Beef className="h-6 w-6 text-red-500 mb-2" />
                        <span className="text-2xl font-bold text-foreground">{selectedMealForIngredients.macros?.protein || 'N/A'}</span>
                        <span className="text-xs text-muted-foreground">Protein</span>
                      </div>
                      <div className="flex flex-col items-center p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <Apple className="h-6 w-6 text-amber-500 mb-2" />
                        <span className="text-2xl font-bold text-foreground">{selectedMealForIngredients.macros?.carbs || 'N/A'}</span>
                        <span className="text-xs text-muted-foreground">Carbs</span>
                      </div>
                      <div className="flex flex-col items-center p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                        <Droplets className="h-6 w-6 text-yellow-500 mb-2" />
                        <span className="text-2xl font-bold text-foreground">{selectedMealForIngredients.macros?.fats || 'N/A'}</span>
                        <span className="text-xs text-muted-foreground">Fats</span>
                      </div>
                    </div>
                  </div>

                  {/* Additional Nutrition */}
                  {selectedMealForIngredients.nutrition && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-3">Additional Nutrition</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col items-center p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                          <Salad className="h-5 w-5 text-green-500 mb-2" />
                          <span className="text-xl font-bold text-foreground">{selectedMealForIngredients.nutrition.fiber}</span>
                          <span className="text-xs text-muted-foreground">Fiber</span>
                        </div>
                        <div className="flex flex-col items-center p-4 rounded-xl bg-pink-500/10 border border-pink-500/20">
                          <Cookie className="h-5 w-5 text-pink-500 mb-2" />
                          <span className="text-xl font-bold text-foreground">{selectedMealForIngredients.nutrition.sugar}</span>
                          <span className="text-xs text-muted-foreground">Sugar</span>
                        </div>
                        <div className="flex flex-col items-center p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                          <Info className="h-5 w-5 text-blue-500 mb-2" />
                          <span className="text-xl font-bold text-foreground">{selectedMealForIngredients.nutrition.sodium}</span>
                          <span className="text-xs text-muted-foreground">Sodium</span>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setIngredientsDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </CustomerLayout>
  );
}
