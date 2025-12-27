import { useEffect, useState, useRef, useCallback } from 'react';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Calendar,
  Sparkles, 
  ChevronRight, 
  CheckCircle2, 
  RefreshCw,
  Loader2,
  Bookmark,
  Info,
  Trash2,
  Flame,
  Beef,
  Wheat,
  Droplets,
  X
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getAIMealPlan, 
  getSavedMeals, 
  deleteSavedMeal,
  type MealPlanResponse, 
  type SavedMeal,
  type MealSlot,
  type MealItem
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
const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner'];

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

export default function AIMealPlannerPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadingSavedMeals, setLoadingSavedMeals] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<MealPlanResponse['data'] | null>(null);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [activeDay, setActiveDay] = useState(DAYS[new Date().getDay()]);
  
  // Dialog states
  const [slotDialogOpen, setSlotDialogOpen] = useState(false);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMealForSlot, setSelectedMealForSlot] = useState<SavedMeal | null>(null);
  const [mealToDelete, setMealToDelete] = useState<SavedMeal | null>(null);
  const [deletingMealId, setDeletingMealId] = useState<string | null>(null);
  
  const dayNavRef = useRef<HTMLDivElement>(null);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const cached = localStorage.getItem('ai_meal_plan');
      if (cached) {
        setPlan(JSON.parse(cached));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSavedMeals = useCallback(async () => {
    if (!token) return;
    setLoadingSavedMeals(true);
    try {
      const saved = await getSavedMeals(token);
      setSavedMeals(saved.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSavedMeals(false);
    }
  }, [token]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

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
  }, [plan]);

  const generatePlan = async () => {
    if (!token) return;
    
    // Show confirmation if plan exists
    if (plan) {
      setRegenerateDialogOpen(true);
      return;
    }
    
    await doGeneratePlan();
  };

  const doGeneratePlan = async () => {
    if (!token) return;
    setGenerating(true);
    setError(null);
    setRegenerateDialogOpen(false);
    
    try {
      const response = await getAIMealPlan(token);
      setPlan(response.data);
      localStorage.setItem('ai_meal_plan', JSON.stringify(response.data));
      toast.success('Meal plan generated successfully!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate meal plan';
      setError(message);
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleAddToDay = (meal: SavedMeal) => {
    setSelectedMealForSlot(meal);
    setSlotDialogOpen(true);
  };

  const confirmAddToSlot = (slot: MealSlot) => {
    if (!plan || !selectedMealForSlot) return;
    
    const newPlan = JSON.parse(JSON.stringify(plan)) as MealPlanResponse['data'];
    const dayPlan = newPlan.weekPlan[activeDay];
    
    if (dayPlan) {
      dayPlan[slot] = { 
        mealName: selectedMealForSlot.mealName, 
        calories: selectedMealForSlot.calories, 
        description: selectedMealForSlot.description, 
        imageUrl: selectedMealForSlot.imageUrl 
      };
      
      setPlan(newPlan);
      localStorage.setItem('ai_meal_plan', JSON.stringify(newPlan));
      toast.success(`Added ${selectedMealForSlot.mealName} to ${activeDay}'s ${slot}`);
    }
    
    setSlotDialogOpen(false);
    setSelectedMealForSlot(null);
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
      toast.success(`${mealToDelete.mealName} deleted`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete meal';
      toast.error(message);
    } finally {
      setDeletingMealId(null);
      setMealToDelete(null);
    }
  };


  // Calculate per-day macros
  const getDayMacros = (day: string) => {
    if (!plan) return null;
    const dayPlan = plan.weekPlan[day];
    if (!dayPlan) return null;
    
    const totalCalories = dayPlan.breakfast.calories + dayPlan.lunch.calories + dayPlan.dinner.calories;
    return { totalCalories };
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

  const dayMacros = getDayMacros(activeDay);

  return (
    <CustomerLayout noPadding>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">AI Integration</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">AI Meal Planner</h1>
            <p className="text-muted-foreground mt-2">Your data-driven weekly nutrition strategy.</p>
          </div>
          <Button 
            onClick={generatePlan} 
            disabled={generating} 
            className="h-12 px-8 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-bold gap-2"
          >
            {generating ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            {plan ? 'Regenerate Weekly Plan' : 'Generate 7-Day Plan'}
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-xl border border-destructive/20 mb-8 flex items-center gap-3">
            <Info className="h-5 w-5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Planner Content */}
          <div className="lg:col-span-3 space-y-8">
            {plan ? (
              <>
                {/* Weekly Stats Bar with Icons */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Avg Calories', value: plan.weeklyMacros.avgCalories, unit: 'kcal', icon: Flame, color: 'text-orange-500' },
                    { label: 'Protein', value: plan.weeklyMacros.avgProtein, unit: '', icon: Beef, color: 'text-red-500' },
                    { label: 'Carbs', value: plan.weeklyMacros.avgCarbs, unit: '', icon: Wheat, color: 'text-amber-500' },
                    { label: 'Fats', value: plan.weeklyMacros.avgFats, unit: '', icon: Droplets, color: 'text-blue-500' },
                  ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <stat.icon className={cn("h-4 w-4", stat.color)} />
                          <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{stat.label}</p>
                        </div>
                        <p className="text-xl font-black mt-1 text-foreground">{stat.value}<span className="text-xs ml-1 font-normal opacity-60 text-muted-foreground">{stat.unit}</span></p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Day Navigation */}
                <div ref={dayNavRef} className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none print:flex-wrap">
                  {DAYS.map((day) => (
                    <Button
                      key={day}
                      variant={activeDay === day ? 'default' : 'outline'}
                      onClick={() => setActiveDay(day)}
                      className={`min-w-[120px] rounded-xl font-bold text-foreground ${activeDay === day ? 'shadow-md shadow-primary/20' : ''} print:min-w-0`}
                    >
                      {day === DAYS[new Date().getDay()] ? 'Today' : day}
                    </Button>
                  ))}
                </div>

                {/* Per-Day Macro Summary */}
                {dayMacros && (
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 flex items-center justify-between print:hidden">
                    <span className="text-sm font-medium text-muted-foreground">{activeDay}'s Total</span>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary" className="gap-1">
                        <Flame className="h-3 w-3 text-orange-500" />
                        {dayMacros.totalCalories} kcal
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Active Day Plan */}
                <div className="space-y-6">
                  {MEAL_SLOTS.map((mealType) => {
                    const dayPlan = plan.weekPlan[activeDay];
                    if (!dayPlan) return null;
                    const meal: MealItem = dayPlan[mealType];
                    if (!meal) return null;
                    
                    return (
                      <Card key={mealType} className="overflow-hidden border-none shadow-lg group hover:shadow-xl transition-all duration-300 print:shadow-none print:border">
                        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x dark:divide-slate-800">
                          <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[240px] print:min-h-[120px]">
                            <ImageWithSkeleton 
                              src={meal.imageUrl || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=800&auto=format&fit=crop'} 
                              alt={meal.mealName}
                              containerClassName="absolute inset-0 w-full h-full"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 print:group-hover:scale-100"
                            />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-500 print:bg-black/20" />
                            <div className="relative z-10 p-6">
                              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 shadow-lg inline-block mb-2">
                                <h3 className="text-xs font-black uppercase text-primary tracking-widest">{mealType}</h3>
                              </div>
                              <div className="block">
                                <Badge variant="secondary" className="font-bold bg-white/20 text-white border-white/30 backdrop-blur-sm pointer-events-none tracking-tight">
                                  {meal.calories} kcal
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 p-6 flex flex-col justify-between">
                            <div>
                              <h4 className="text-2xl font-black mb-2 group-hover:text-primary transition-colors print:text-lg">{meal.mealName}</h4>
                              <p className="text-muted-foreground leading-relaxed print:text-sm">{meal.description}</p>
                            </div>
                            <div className="mt-6 flex items-center justify-between print:hidden">
                              <div className="flex items-center gap-2 text-green-500 font-bold text-sm">
                                <CheckCircle2 className="h-4 w-4" />
                                Personalized Choice
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                <Card className="bg-primary/5 border-primary/20 print:hidden">
                  <CardContent className="p-6">
                    <h3 className="font-bold flex items-center gap-2 mb-2">
                      <Info className="h-5 w-5 text-primary" />
                      Weekly Nutrition Insight
                    </h3>
                    <p className="text-muted-foreground italic leading-relaxed">"{plan.advice}"</p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border-2 border-dashed">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Calendar className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">No plan generated yet</h3>
                <p className="text-muted-foreground mt-2 mb-8 text-center max-w-sm">
                  Let our AI analyze your preferences and create a 7-day nutritional strategy just for you.
                </p>
                <Button onClick={generatePlan} className="rounded-xl h-12 px-8 font-bold">Start AI Planning</Button>
              </div>
            )}
          </div>

          {/* Sidebar - Saved Meals */}
          <div className="space-y-6 print:hidden">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xl font-black flex items-center gap-2 text-foreground">
                <Bookmark className="h-5 w-5 text-primary" />
                Saved Meals
              </h2>
              <Badge variant="secondary" className="rounded-full">{savedMeals.length}</Badge>
            </div>
            
            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 scrollbar-thin">
              {loadingSavedMeals ? (
                // Loading skeletons
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="border-none bg-slate-50 dark:bg-slate-900">
                    <CardContent className="p-0 overflow-hidden">
                      <Skeleton className="h-24 w-full" />
                      <div className="p-3 space-y-2">
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-7 w-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : savedMeals.length > 0 ? (
                savedMeals.map((meal) => (
                  <Card key={meal._id} className="border-none bg-slate-50 dark:bg-slate-900 hover:shadow-md transition-all group">
                    <CardContent className="p-0 overflow-hidden">
                      <div className="h-24 w-full relative">
                        <ImageWithSkeleton 
                          src={meal.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop'} 
                          alt={meal.mealName}
                          containerClassName="w-full h-full"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-2 left-3 right-3 flex justify-between items-end">
                          <h4 className="font-bold text-white text-sm line-clamp-1 drop-shadow-sm">{meal.mealName}</h4>
                          <span className="text-[10px] font-black text-white bg-primary/80 px-1.5 py-0.5 rounded backdrop-blur-sm whitespace-nowrap ml-2">
                            {meal.calories} kcal
                          </span>
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
                      <div className="p-3">
                        <p className="text-[10px] text-muted-foreground line-clamp-1 mb-3">{meal.description}</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-[10px] font-bold gap-1 h-7 rounded-lg"
                          onClick={() => handleAddToDay(meal)}
                          disabled={!plan}
                        >
                          <ChevronRight className="h-3 w-3" />
                          Add to Day
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-950/30 rounded-2xl border border-dashed">
                  <Bookmark className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-xs text-muted-foreground">Save recommendations to see them here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Meal Slot Selection Dialog */}
      <Dialog open={slotDialogOpen} onOpenChange={setSlotDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to {activeDay}</DialogTitle>
            <DialogDescription>
              Choose which meal slot to replace with {selectedMealForSlot?.mealName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 py-4">
            {MEAL_SLOTS.map((slot) => (
              <Button
                key={slot}
                variant="outline"
                className="h-20 flex flex-col gap-1 capitalize hover:bg-primary hover:text-primary-foreground"
                onClick={() => confirmAddToSlot(slot)}
              >
                <span className="text-lg font-bold">{slot}</span>
                <span className="text-[10px] opacity-60">
                  {plan?.weekPlan[activeDay]?.[slot]?.mealName || 'Empty'}
                </span>
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSlotDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate Confirmation Dialog */}
      <AlertDialog open={regenerateDialogOpen} onOpenChange={setRegenerateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate Meal Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace your current 7-day meal plan with a new AI-generated plan. Any customizations you've made will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Current Plan</AlertDialogCancel>
            <AlertDialogAction onClick={doGeneratePlan} className="bg-primary">
              Generate New Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Meal Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Saved Meal?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{mealToDelete?.mealName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteMeal} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CustomerLayout>
  );
}
