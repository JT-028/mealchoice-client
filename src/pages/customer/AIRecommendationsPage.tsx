import { useEffect, useState } from 'react';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAIRecommendations, type RecommendationResponse } from '@/api/recommendations';
import { 
  Sparkles, 
  Flame, 
  Beef, 
  Apple, 
  CircleDollarSign, 
  Info, 
  Loader2, 
  UtensilsCrossed,
  CheckCircle2,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function AIRecommendationsPage() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RecommendationResponse['data'] | null>(null);

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
            <h2 className="text-2xl font-bold">AI is crafting your meals...</h2>
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
              <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-6">
                Personalized for <span className="text-primary">{user?.name}</span>
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed mb-8">
                {data?.summary}
              </p>
              
              <div className="flex flex-wrap gap-4 mb-8">
                <Button 
                  onClick={fetchRecommendations} 
                  variant="outline" 
                  className="gap-2 bg-background/50 backdrop-blur-md"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Recommendations
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 bg-background/50 backdrop-blur-md px-4 py-2 rounded-xl border border-border">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Health Optimized</span>
                </div>
                <div className="flex items-center gap-2 bg-background/50 backdrop-blur-md px-4 py-2 rounded-xl border border-border">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Budget Friendly</span>
                </div>
                <div className="flex items-center gap-2 bg-background/50 backdrop-blur-md px-4 py-2 rounded-xl border border-border">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Market Available</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="relative z-10 -mt-20 px-6 lg:px-12 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {data?.recommendations.map((meal, index) => (
              <Card key={index} className="flex flex-col border-none shadow-xl hover:shadow-2xl transition-all duration-300 group">
                <div className="h-2 w-full bg-primary/20 group-hover:bg-primary transition-colors" />
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10">
                      Recommendation #{index + 1}
                    </Badge>
                    <div className="flex items-center gap-1 font-bold text-lg">
                      <CircleDollarSign className="h-4 w-4 text-green-500" />
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
                <div className="p-6 pt-0 mt-auto">
                  <Button className="w-full gap-2 group/btn">
                    View Details
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
    </CustomerLayout>
  );
}
