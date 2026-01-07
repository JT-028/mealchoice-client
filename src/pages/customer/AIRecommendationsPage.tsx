import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getAIRecommendationsByCategory,
  saveMeal,
  type Recommendation,
  type MealCategory
} from '@/api/recommendations';
import {
  Sparkles,
  Flame,
  Beef,
  Apple,
  Coins,
  Info,
  Loader2,
  UtensilsCrossed,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Bookmark,
  Heart,
  ChefHat,
  Salad,
  Droplets,
  Cookie,
  Settings,
  Sun,
  Coffee,
  Moon,
  Candy,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

const mealCategories: { id: MealCategory; label: string; icon: typeof Sun; description: string }[] = [
  { id: 'breakfast', label: 'Breakfast', icon: Coffee, description: 'Start your day right' },
  { id: 'lunch', label: 'Lunch', icon: Sun, description: 'Midday energy boost' },
  { id: 'dinner', label: 'Dinner', icon: Moon, description: 'Evening satisfaction' },
  { id: 'snacks', label: 'Snacks', icon: Candy, description: 'Healthy bites' },
];

const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface CategoryData {
  recommendations: Recommendation[];
  nutritionalAdvice: string;
  summary: string;
}

export default function AIRecommendationsPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<MealCategory>('breakfast');
  const [categoryData, setCategoryData] = useState<Record<MealCategory, CategoryData | null>>({
    breakfast: null,
    lunch: null,
    dinner: null,
    snacks: null,
  });
  const [loadingCategories, setLoadingCategories] = useState<Record<MealCategory, boolean>>({
    breakfast: false,
    lunch: false,
    dinner: false,
    snacks: false,
  });
  const [selectedCategories, setSelectedCategories] = useState<MealCategory[]>(['breakfast', 'lunch', 'dinner', 'snacks']);
  const [, setError] = useState<string | null>(null);

  // Save meal dialog state
  const [savingMeal, setSavingMeal] = useState<string | null>(null);
  const [savedMeals, setSavedMeals] = useState<Set<string>>(new Set());
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [selectedMealToSave, setSelectedMealToSave] = useState<Recommendation | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Details dialog state
  const [selectedMeal, setSelectedMeal] = useState<Recommendation | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Load cached data on mount
  useEffect(() => {
    if (token) {
      mealCategories.forEach(category => {
        const cachedData = localStorage.getItem(`generate_meals_${category.id}`);
        if (cachedData) {
          try {
            setCategoryData(prev => ({
              ...prev,
              [category.id]: JSON.parse(cachedData)
            }));
          } catch (e) {
            console.error(`Failed to parse cached data for ${category.id}`, e);
          }
        }
      });
    }
  }, [token]);

  const fetchCategoryRecommendations = async (category: MealCategory) => {
    if (!token) return;
    try {
      setLoadingCategories(prev => ({ ...prev, [category]: true }));
      setError(null);
      const response = await getAIRecommendationsByCategory(token, category);
      setCategoryData(prev => ({
        ...prev,
        [category]: response.data
      }));
      localStorage.setItem(`generate_meals_${category}`, JSON.stringify(response.data));
    } catch (err: any) {
      setError(err.message || `Failed to fetch ${category} recommendations`);
      toast.error(`Failed to generate ${category}: ${err.message}`);
    } finally {
      setLoadingCategories(prev => ({ ...prev, [category]: false }));
    }
  };

  const handleGenerateAll = async () => {
    if (selectedCategories.length === 0) {
      toast.error("Please select at least one category to generate.");
      return;
    }

    // Process sequentially to avoid overwhelming the server/rate limits
    for (const category of selectedCategories) {
      await fetchCategoryRecommendations(category);
    }
    toast.success("All selected categories generated!");
  };

  const toggleCategorySelection = (category: MealCategory) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const openSaveDialog = (meal: Recommendation) => {
    setSelectedMealToSave(meal);
    setSelectedDay(null);
    setSaveDialogOpen(true);
  };

  const handleSaveMeal = async () => {
    if (!token || !selectedMealToSave || !selectedDay) return;

    const mealKey = `${activeTab}-${selectedMealToSave.mealName}`;

    try {
      setSavingMeal(mealKey);

      // Use the specific date selected by the user
      const scheduledDate = new Date(selectedDay);
      scheduledDate.setHours(0, 0, 0, 0);

      await saveMeal(token, selectedMealToSave, scheduledDate, activeTab);
      setSavedMeals(prev => new Set(prev).add(mealKey));
      setSaveDialogOpen(false);
      setSelectedMealToSave(null);
      setSelectedDay(null);
      toast.success(`${selectedMealToSave.mealName} saved for ${selectedDay}!`);
    } catch (err: any) {
      console.error('Save meal error:', err);
      toast.error(err.message || 'Failed to save meal');
    } finally {
      setSavingMeal(null);
    }
  };



  return (
    <CustomerLayout noPadding>
      <div className="relative">
        {/* Hero Section */}
        <div className="relative overflow-hidden pt-16 pb-32 lg:pt-24 lg:pb-40 bg-slate-50 dark:bg-slate-950/50 border-b">
          <div className="relative z-10 px-6 lg:px-12">
            <div className="flex justify-between items-start">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6 backdrop-blur-sm">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">AI Powered</span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-6 text-foreground">
                  Generate Meals
                </h1>
                <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed mb-8">
                  Create personalized meal recommendations for each part of your day.
                  Generate meals by category and save them to your weekly plan.
                </p>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 bg-background/50 backdrop-blur-md px-4 py-2 rounded-xl border border-border">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-foreground">Category Based</span>
                  </div>
                  <div className="flex items-center gap-2 bg-background/50 backdrop-blur-md px-4 py-2 rounded-xl border border-border">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-foreground">Save to Schedule</span>
                  </div>
                  <div className="flex items-center gap-2 bg-background/50 backdrop-blur-md px-4 py-2 rounded-xl border border-border">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-foreground">Personalized</span>
                  </div>
                </div>
              </div>

              {/* Edit Preferences Button */}
              <Button
                variant="outline"
                className="gap-2 bg-background/50 backdrop-blur-md"
                onClick={() => navigate('/customer/settings')}
              >
                <Settings className="h-4 w-4" />
                Edit Preferences
              </Button>
            </div>
          </div>
        </div>

        {/* Category Tabs Section */}
        <div className="relative z-10 -mt-20 px-6 lg:px-12 pb-24">

          {/* Checklist & Generate All */}
          <Card className="mb-8 border-none shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-wrap items-center gap-6 justify-center md:justify-start">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground mr-2">Generate for:</span>
                  </div>
                  {mealCategories.map((cat) => (
                    <div key={cat.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`check-${cat.id}`}
                        checked={selectedCategories.includes(cat.id)}
                        onCheckedChange={() => toggleCategorySelection(cat.id)}
                      />
                      <label
                        htmlFor={`check-${cat.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none"
                      >
                        {cat.label}
                      </label>
                    </div>
                  ))}
                </div>

                <Button
                  size="lg"
                  onClick={handleGenerateAll}
                  disabled={Object.values(loadingCategories).some(Boolean) || selectedCategories.length === 0}
                  className="w-full md:w-auto shadow-md hover:shadow-xl transition-all"
                >
                  {Object.values(loadingCategories).some(Boolean) ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-5 w-5" />
                  )}
                  Generate Selected
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MealCategory)} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8 h-auto p-1 bg-background/80 backdrop-blur-md border shadow-lg">
              {mealCategories.map(category => {
                const Icon = category.icon;
                const hasData = categoryData[category.id] !== null;
                return (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="flex flex-col gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="font-semibold">{category.label}</span>
                      {hasData && (
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                      )}
                    </div>
                    <span className="text-xs opacity-70 hidden sm:block">{category.description}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {mealCategories.map(category => (
              <TabsContent key={category.id} value={category.id} className="mt-0">
                {/* Generate Button */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground capitalize">{category.label} Ideas</h2>
                    <p className="text-muted-foreground text-sm">{category.description}</p>
                  </div>
                  <Button
                    onClick={() => fetchCategoryRecommendations(category.id)}
                    disabled={loadingCategories[category.id]}
                    className="gap-2"
                  >
                    {loadingCategories[category.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    {categoryData[category.id] ? 'Regenerate' : 'Generate'} {category.label}
                  </Button>
                </div>

                {/* Loading State */}
                {loadingCategories[category.id] && (
                  <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-foreground">Generating {category.label}...</h3>
                      <p className="text-muted-foreground">AI is crafting personalized meals</p>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {!loadingCategories[category.id] && !categoryData[category.id] && (
                  <Card className="border-dashed border-2 bg-muted/20">
                    <CardContent className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <category.icon className="h-8 w-8 text-primary" />
                      </div>
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-foreground">No {category.label} Generated Yet</h3>
                        <p className="text-muted-foreground mt-2">
                          Click the button above to generate personalized {category.label.toLowerCase()} recommendations
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Meal Cards */}
                {!loadingCategories[category.id] && categoryData[category.id] && (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {categoryData[category.id]?.recommendations.map((meal, index) => {
                        const mealKey = `${category.id}-${meal.mealName}`;
                        const isSaved = savedMeals.has(mealKey);
                        const isSaving = savingMeal === mealKey;

                        return (
                          <Card key={index} className="flex flex-col border-none shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden">
                            <div className="h-48 w-full overflow-hidden relative">
                              <img
                                src={meal.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop'}
                                alt={meal.mealName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                              <div className="absolute bottom-4 left-4 right-4">
                                <Badge variant="secondary" className="bg-white/20 backdrop-blur-md text-white border-white/20 capitalize">
                                  {category.label}
                                </Badge>
                              </div>
                            </div>
                            <CardHeader className="pb-4">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-1 font-bold text-lg text-primary">
                                  <Coins className="h-4 w-4 text-green-500" />
                                  <span>{formatCurrency(meal.estimatedCost)}</span>
                                </div>
                              </div>
                              <CardTitle className="text-2xl group-hover:text-primary transition-colors">{meal.mealName}</CardTitle>
                              <CardDescription className="text-sm line-clamp-3 min-h-[4.5rem]">
                                {meal.description}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                              <div className="grid grid-cols-3 gap-2 mb-6">
                                <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                                  <Flame className="h-4 w-4 text-orange-500 mb-1" />
                                  <span className="text-xs font-bold">{meal.calories}</span>
                                  <span className="text-[10px] text-muted-foreground uppercase">Kcal</span>
                                </div>
                                <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                                  <Beef className="h-4 w-4 text-red-500 mb-1" />
                                  <span className="text-xs font-bold">{meal.macros.protein}</span>
                                  <span className="text-[10px] text-muted-foreground uppercase">Protein</span>
                                </div>
                                <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                                  <Apple className="h-4 w-4 text-green-500 mb-1" />
                                  <span className="text-xs font-bold">{meal.macros.carbs}</span>
                                  <span className="text-[10px] text-muted-foreground uppercase">Carbs</span>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <h4 className="text-sm font-bold flex items-center gap-2">
                                  <UtensilsCrossed className="h-4 w-4 text-primary" />
                                  Key Ingredients
                                </h4>
                                <ul className="grid grid-cols-2 gap-2">
                                  {meal.ingredients.slice(0, 6).map((ing, i) => (
                                    <li key={i} className="text-xs flex items-center gap-1 text-muted-foreground">
                                      <div className="h-1 w-1 rounded-full bg-primary" />
                                      {ing}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </CardContent>
                            <div className="p-6 pt-0 mt-auto flex gap-3">
                              <Button
                                className="flex-1 gap-2 group/btn"
                                onClick={() => openSaveDialog(meal)}
                                disabled={isSaving || isSaved}
                                variant={isSaved ? "outline" : "default"}
                              >
                                {isSaving ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : isSaved ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Calendar className="h-4 w-4" />
                                )}
                                {isSaved ? 'Saved' : 'Save to Day'}
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 gap-2 group/btn"
                                onClick={() => {
                                  setSelectedMeal(meal);
                                  setDetailsDialogOpen(true);
                                }}
                              >
                                Details
                                <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                              </Button>
                            </div>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Nutritional Advice */}
                    {categoryData[category.id]?.nutritionalAdvice && (
                      <div className="mt-12">
                        <Card className="bg-primary/5 border-primary/20">
                          <CardHeader>
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Info className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <CardTitle>Nutritional Advice</CardTitle>
                                <CardDescription>Expert insights for your {category.label.toLowerCase()}</CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground leading-relaxed italic border-l-4 border-primary pl-4 py-1">
                              "{categoryData[category.id]?.nutritionalAdvice}"
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      {/* Save to Day Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Save to Schedule
            </DialogTitle>
            <DialogDescription>
              Choose a specific date to schedule "{selectedMealToSave?.mealName}" for {activeTab}.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Select Date
            </label>
            <input
              type="date"
              className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              value={selectedDay ? new Date(selectedDay).toISOString().split('T')[0] : ''}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                const date = new Date(e.target.value);
                setSelectedDay(weekDays[date.getDay()]); // Keep compatibility with day-based UI if needed, but we'll use the actual date below
                // We'll actually store the full date string as selectedDay or add a new state
                setSelectedDay(e.target.value);
              }}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveMeal}
              disabled={!selectedDay || savingMeal !== null}
            >
              {savingMeal ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Bookmark className="h-4 w-4 mr-2" />
              )}
              Save Meal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Meal Details Dialog with Tabs */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedMeal && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Generated
                  </Badge>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <Coins className="h-3 w-3 mr-1" />
                    {formatCurrency(selectedMeal.estimatedCost)}
                  </Badge>
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    <Flame className="h-3 w-3 mr-1" />
                    {selectedMeal.calories} kcal
                  </Badge>
                </div>
                <DialogTitle className="text-2xl">{selectedMeal.mealName}</DialogTitle>
                <DialogDescription className="text-base">
                  {selectedMeal.description}
                </DialogDescription>
              </DialogHeader>

              {/* Health Benefits (always visible at top) */}
              {selectedMeal.healthBenefits && selectedMeal.healthBenefits.length > 0 && (
                <div className="mt-4 p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground mb-3">
                    <Heart className="h-4 w-4 text-red-500" />
                    Health Benefits
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedMeal.healthBenefits.map((benefit, i) => (
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
                  <div className="text-sm text-muted-foreground mb-4">
                    {selectedMeal.ingredients.length} ingredients needed
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedMeal.ingredients.map((ingredient, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors">
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        <span className="text-sm text-foreground">{ingredient}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* Instructions Tab */}
                <TabsContent value="instructions" className="mt-4 space-y-4">
                  {selectedMeal.instructions && selectedMeal.instructions.length > 0 ? (
                    <>
                      <div className="text-sm text-muted-foreground mb-4">
                        {selectedMeal.instructions.length} steps to prepare
                      </div>
                      <div className="space-y-3">
                        {selectedMeal.instructions.map((step, i) => (
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
                      <p className="text-sm text-muted-foreground/70 mt-1">Try regenerating the meal for detailed steps</p>
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
                        <span className="text-2xl font-bold text-foreground">{selectedMeal.calories}</span>
                        <span className="text-xs text-muted-foreground">Calories</span>
                      </div>
                      <div className="flex flex-col items-center p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                        <Beef className="h-6 w-6 text-red-500 mb-2" />
                        <span className="text-2xl font-bold text-foreground">{selectedMeal.macros.protein}</span>
                        <span className="text-xs text-muted-foreground">Protein</span>
                      </div>
                      <div className="flex flex-col items-center p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <Apple className="h-6 w-6 text-amber-500 mb-2" />
                        <span className="text-2xl font-bold text-foreground">{selectedMeal.macros.carbs}</span>
                        <span className="text-xs text-muted-foreground">Carbs</span>
                      </div>
                      <div className="flex flex-col items-center p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                        <Droplets className="h-6 w-6 text-yellow-500 mb-2" />
                        <span className="text-2xl font-bold text-foreground">{selectedMeal.macros.fats}</span>
                        <span className="text-xs text-muted-foreground">Fats</span>
                      </div>
                    </div>
                  </div>

                  {/* Additional Nutrition */}
                  {selectedMeal.nutrition && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-3">Additional Nutrition</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col items-center p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                          <Salad className="h-5 w-5 text-green-500 mb-2" />
                          <span className="text-xl font-bold text-foreground">{selectedMeal.nutrition.fiber}</span>
                          <span className="text-xs text-muted-foreground">Fiber</span>
                        </div>
                        <div className="flex flex-col items-center p-4 rounded-xl bg-pink-500/10 border border-pink-500/20">
                          <Cookie className="h-5 w-5 text-pink-500 mb-2" />
                          <span className="text-xl font-bold text-foreground">{selectedMeal.nutrition.sugar}</span>
                          <span className="text-xs text-muted-foreground">Sugar</span>
                        </div>
                        <div className="flex flex-col items-center p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                          <Info className="h-5 w-5 text-blue-500 mb-2" />
                          <span className="text-xl font-bold text-foreground">{selectedMeal.nutrition.sodium}</span>
                          <span className="text-xs text-muted-foreground">Sodium</span>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </CustomerLayout>
  );
}
