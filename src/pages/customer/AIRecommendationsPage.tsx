import { useEffect, useState } from 'react';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAIRecommendations, saveMeal, type RecommendationResponse, type Recommendation } from '@/api/recommendations';
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
  Cookie
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export default function AIRecommendationsPage() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RecommendationResponse['data'] | null>(null);
  const [savingMeal, setSavingMeal] = useState<number | null>(null);
  const [savedIndices, setSavedIndices] = useState<Set<number>>(new Set());
  const [selectedMeal, setSelectedMeal] = useState<Recommendation | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSaveMeal = async (meal: any, index: number) => {
    if (!token) return;
    try {
      setSavingMeal(index);
      await saveMeal(token, meal);
      setSavedIndices(prev => new Set(prev).add(index));
    } catch (err: any) {
      console.error(err);
    } finally {
      setSavingMeal(null);
    }
  };

  useEffect(() => {
    if (token) {
      const cachedData = localStorage.getItem('ai_recommendations');
      if (cachedData) {
        try {
          setData(JSON.parse(cachedData));
          setLoading(false);
        } catch (e) {
          fetchRecommendations();
        }
      } else {
        fetchRecommendations();
      }
    }
  }, [token]);

  const fetchRecommendations = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const response = await getAIRecommendations(token);
      setData(response.data);
      localStorage.setItem('ai_recommendations', JSON.stringify(response.data));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">AI is crafting your meals...</h2>
            <p className="text-muted-foreground">Analyzing your preferences and local market stock</p>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (error) {
    return (
      <CustomerLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <Info className="h-8 w-8 text-destructive" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold">Something went wrong</h2>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <Button onClick={fetchRecommendations}>Try Again</Button>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout noPadding>
      <div className="relative">
        {/* Hero Section */}
        <div className="relative overflow-hidden pt-16 pb-32 lg:pt-24 lg:pb-40 bg-slate-50 dark:bg-slate-950/50 border-b">
          <div className="relative z-10 px-6 lg:px-12">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">AI Powered Predictions</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-6 text-foreground">
                Personalized for <span className="text-primary">{user?.name}</span>
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed mb-8">
                {data?.summary}
              </p>
              
              <div className="flex flex-wrap gap-4 mb-8">
                <Button 
                  onClick={fetchRecommendations} 
                  variant="outline" 
                  className="gap-2 bg-background/50 backdrop-blur-md text-foreground"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Recommendations
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 bg-background/50 backdrop-blur-md px-4 py-2 rounded-xl border border-border">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-foreground">Health Optimized</span>
                </div>
                <div className="flex items-center gap-2 bg-background/50 backdrop-blur-md px-4 py-2 rounded-xl border border-border">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-foreground">Budget Friendly</span>
                </div>
                <div className="flex items-center gap-2 bg-background/50 backdrop-blur-md px-4 py-2 rounded-xl border border-border">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-foreground">Market Available</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="relative z-10 -mt-20 px-6 lg:px-12 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {data?.recommendations.map((meal, index) => (
              <Card key={index} className="flex flex-col border-none shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden">
                <div className="h-48 w-full overflow-hidden relative">
                  <img 
                    src={meal.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop'} 
                    alt={meal.mealName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <Badge variant="secondary" className="bg-white/20 backdrop-blur-md text-white border-white/20">
                      Recommendation #{index + 1}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1 font-bold text-lg text-primary">
                      <Coins className="h-4 w-4 text-green-500" />
                      <span>{meal.estimatedCost.toFixed(2)}</span>
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
                      {meal.ingredients.map((ing, i) => (
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
                    onClick={() => handleSaveMeal(meal, index)}
                    disabled={savingMeal === index || savedIndices.has(index)}
                    variant={savedIndices.has(index) ? "outline" : "default"}
                  >
                    {savingMeal === index ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : savedIndices.has(index) ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
                    )}
                    {savedIndices.has(index) ? 'Saved' : 'Save Meal'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2 group/btn"
                    onClick={() => {
                      setSelectedMeal(meal);
                      setDialogOpen(true);
                    }}
                  >
                    Details
                    <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-12">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Info className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Nutritional Advice</CardTitle>
                    <CardDescription>Expert insights based on your health profile</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed italic border-l-4 border-primary pl-4 py-1">
                  "{data?.nutritionalAdvice}"
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Meal Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedMeal && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Recommendation
                  </Badge>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <Coins className="h-3 w-3 mr-1" />
                    ₱{selectedMeal.estimatedCost.toFixed(2)}
                  </Badge>
                </div>
                <DialogTitle className="text-2xl">{selectedMeal.mealName}</DialogTitle>
                <DialogDescription className="text-base">
                  {selectedMeal.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Health Benefits */}
                {selectedMeal.healthBenefits && selectedMeal.healthBenefits.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                      <Heart className="h-5 w-5 text-red-500" />
                      Health Benefits
                    </h3>
                    <div className="grid gap-2">
                      {selectedMeal.healthBenefits.map((benefit, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          <span className="text-sm text-foreground">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Full Ingredients List */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                    <Salad className="h-5 w-5 text-green-500" />
                    Ingredients
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedMeal.ingredients.map((ingredient, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-sm text-foreground">{ingredient}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cooking Instructions */}
                {selectedMeal.instructions && selectedMeal.instructions.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                      <ChefHat className="h-5 w-5 text-amber-500" />
                      Cooking Instructions
                    </h3>
                    <div className="space-y-2">
                      {selectedMeal.instructions.map((step, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                            {i + 1}
                          </span>
                          <span className="text-sm text-foreground">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nutrition Information */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                    <UtensilsCrossed className="h-5 w-5 text-primary" />
                    Nutrition Information
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    <div className="flex flex-col items-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <Flame className="h-5 w-5 text-orange-500 mb-1" />
                      <span className="text-lg font-bold text-foreground">{selectedMeal.calories}</span>
                      <span className="text-xs text-muted-foreground">Calories</span>
                    </div>
                    <div className="flex flex-col items-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <Beef className="h-5 w-5 text-red-500 mb-1" />
                      <span className="text-lg font-bold text-foreground">{selectedMeal.macros.protein}</span>
                      <span className="text-xs text-muted-foreground">Protein</span>
                    </div>
                    <div className="flex flex-col items-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <Apple className="h-5 w-5 text-amber-500 mb-1" />
                      <span className="text-lg font-bold text-foreground">{selectedMeal.macros.carbs}</span>
                      <span className="text-xs text-muted-foreground">Carbs</span>
                    </div>
                    <div className="flex flex-col items-center p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <Droplets className="h-5 w-5 text-yellow-500 mb-1" />
                      <span className="text-lg font-bold text-foreground">{selectedMeal.macros.fats}</span>
                      <span className="text-xs text-muted-foreground">Fats</span>
                    </div>
                    {selectedMeal.nutrition && (
                      <>
                        <div className="flex flex-col items-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                          <Salad className="h-5 w-5 text-green-500 mb-1" />
                          <span className="text-lg font-bold text-foreground">{selectedMeal.nutrition.fiber}</span>
                          <span className="text-xs text-muted-foreground">Fiber</span>
                        </div>
                        <div className="flex flex-col items-center p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
                          <Cookie className="h-5 w-5 text-pink-500 mb-1" />
                          <span className="text-lg font-bold text-foreground">{selectedMeal.nutrition.sugar}</span>
                          <span className="text-xs text-muted-foreground">Sugar</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </CustomerLayout>
  );
}
