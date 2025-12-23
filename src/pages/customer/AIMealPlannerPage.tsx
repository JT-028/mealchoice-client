import { useEffect, useState } from 'react';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  Sparkles, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  RefreshCw,
  Loader2,
  Bookmark,
  Info,
  History
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAIMealPlan, getSavedMeals, type MealPlanResponse, type SavedMeal } from '@/api/recommendations';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AIMealPlannerPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<MealPlanResponse['data'] | null>(null);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [activeDay, setActiveDay] = useState(DAYS[new Date().getDay()]);

  useEffect(() => {
    if (token) {
      loadInitialData();
    }
  }, [token]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const saved = await getSavedMeals(token!);
      setSavedMeals(saved.data || []);
      
      const cached = localStorage.getItem('ai_meal_plan');
      if (cached) {
        setPlan(JSON.parse(cached));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    if (!token) return;
    setGenerating(true);
    setError(null);
    try {
      const response = await getAIMealPlan(token);
      setPlan(response.data);
      localStorage.setItem('ai_meal_plan', JSON.stringify(response.data));
    } catch (err: any) {
      setError(err.message || 'Failed to generate meal plan');
    } finally {
      setGenerating(false);
    }
  };

  const handleAddToDay = (meal: SavedMeal) => {
    if (!plan) return;
    
    // Default to adding to the active day's lunch for now, or we could add a selector
    const newPlan = JSON.parse(JSON.stringify(plan)); // Deep copy
    const dayPlan = newPlan.weekPlan[activeDay];
    
    if (dayPlan) {
      // Logic: If breakfast is empty, add there, else lunch, else dinner
      if (!dayPlan.breakfast.mealName) dayPlan.breakfast = { mealName: meal.mealName, calories: meal.calories, description: meal.description, imageUrl: meal.imageUrl };
      else if (!dayPlan.lunch.mealName) dayPlan.lunch = { mealName: meal.mealName, calories: meal.calories, description: meal.description, imageUrl: meal.imageUrl };
      else dayPlan.dinner = { mealName: meal.mealName, calories: meal.calories, description: meal.description, imageUrl: meal.imageUrl };
      
      setPlan(newPlan);
      localStorage.setItem('ai_meal_plan', JSON.stringify(newPlan));
      
      // Optional: show success toast (simulated here)
      alert(`Added ${meal.mealName} to ${activeDay}`);
    }
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

  return (
    <CustomerLayout noPadding>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">AI Integration</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">AI Meal Planner</h1>
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
                {/* Weekly Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Avg Calories', value: plan.weeklyMacros.avgCalories, unit: 'kcal' },
                    { label: 'Protein', value: plan.weeklyMacros.avgProtein, unit: '' },
                    { label: 'Carbs', value: plan.weeklyMacros.avgCarbs, unit: '' },
                    { label: 'Fats', value: plan.weeklyMacros.avgFats, unit: '' },
                  ].map((stat, i) => (
                    <Card key={i} className="border-none bg-slate-50 dark:bg-slate-900 shadow-sm">
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{stat.label}</p>
                        <p className="text-xl font-black mt-1">{stat.value}<span className="text-xs ml-1 font-normal opacity-60">{stat.unit}</span></p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Day Navigation */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {DAYS.map((day) => (
                    <Button
                      key={day}
                      variant={activeDay === day ? 'default' : 'outline'}
                      onClick={() => setActiveDay(day)}
                      className={`min-w-[120px] rounded-xl font-bold ${activeDay === day ? 'shadow-md shadow-primary/20' : ''}`}
                    >
                      {day === DAYS[new Date().getDay()] ? 'Today' : day}
                    </Button>
                  ))}
                </div>

                {/* Active Day Plan */}
                <div className="space-y-6">
                  {['breakfast', 'lunch', 'dinner'].map((mealType) => {
                    const dayPlan = plan.weekPlan[activeDay];
                    if (!dayPlan) return null;
                    const meal = (dayPlan as any)[mealType];
                    if (!meal) return null;
                    
                    return (
                      <Card key={mealType} className="overflow-hidden border-none shadow-lg group hover:shadow-xl transition-all duration-300">
                        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x dark:divide-slate-800">
                          <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center text-center relative overflow-hidden">
                            <img 
                              src={meal.imageUrl || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=800&auto=format&fit=crop'} 
                              alt={meal.mealName}
                              className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity duration-500"
                            />
                            <div className="relative z-10 p-6">
                              <h3 className="text-sm font-black uppercase text-primary tracking-widest mb-1 drop-shadow-md">{mealType}</h3>
                              <Badge variant="secondary" className="font-bold bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">{meal.calories} kcal</Badge>
                            </div>
                          </div>
                          <div className="flex-1 p-6 flex flex-col justify-between">
                            <div>
                              <h4 className="text-2xl font-black mb-2 group-hover:text-primary transition-colors">{meal.mealName}</h4>
                              <p className="text-muted-foreground leading-relaxed">{meal.description}</p>
                            </div>
                            <div className="mt-6 flex items-center justify-between">
                              <div className="flex items-center gap-2 text-green-500 font-bold text-sm">
                                <CheckCircle2 className="h-4 w-4" />
                                Personalized Choice
                              </div>
                              <Button variant="ghost" size="sm" className="gap-2">
                                <History className="h-4 w-4" />
                                Track Meal
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                <Card className="bg-primary/5 border-primary/20">
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
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xl font-black flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-primary" />
                Saved Meals
              </h2>
              <Badge variant="secondary" className="rounded-full">{savedMeals.length}</Badge>
            </div>
            
            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 scrollbar-thin">
              {savedMeals.length > 0 ? (
                savedMeals.map((meal) => (
                  <Card key={meal._id} className="border-none bg-slate-50 dark:bg-slate-900 hover:shadow-md transition-all group">
                    <CardContent className="p-0 overflow-hidden">
                      <div className="h-24 w-full relative">
                        <img 
                          src={meal.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop'} 
                          alt={meal.mealName}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-2 left-3 right-3 flex justify-between items-end">
                          <h4 className="font-bold text-white text-sm line-clamp-1">{meal.mealName}</h4>
                          <span className="text-[10px] font-bold text-white/80 whitespace-nowrap ml-2">{meal.calories} kcal</span>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-[10px] text-muted-foreground line-clamp-1 mb-3">{meal.description}</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-[10px] font-bold gap-1 h-7 rounded-lg"
                          onClick={() => handleAddToDay(meal)}
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
    </CustomerLayout>
  );
}
