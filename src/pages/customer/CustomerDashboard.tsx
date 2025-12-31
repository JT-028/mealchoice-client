import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getBudget, getSpending, type Budget, type Spending } from '@/api/budget';
import { getSavedMeals } from '@/api/recommendations';
import {
  Wallet,
  ShoppingBag,
  Calendar,
  TrendingUp,
  ArrowRight,
  Loader2,
  UtensilsCrossed,
  Sparkles
} from 'lucide-react';

export function CustomerDashboard() {
  const { token, user } = useAuth();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [spending, setSpending] = useState<Spending | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedMealsCount, setSavedMealsCount] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) return;
      
      try {
        const [budgetRes, spendingRes, mealsRes] = await Promise.all([
          getBudget(token),
          getSpending(token),
          getSavedMeals(token)
        ]);

        if (budgetRes.success && budgetRes.budget) {
          setBudget(budgetRes.budget);
        }
        if (spendingRes.success && spendingRes.spending) {
          setSpending(spendingRes.spending);
        }
        if (mealsRes.success && mealsRes.data) {
          setSavedMealsCount(mealsRes.data.length);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  const dailyRemaining = spending ? spending.dailyRemaining : (budget ? budget.dailyLimit : 0);
  const weeklyRemaining = spending ? spending.weeklyRemaining : (budget ? budget.weeklyLimit : 0);
  const dailyPercentUsed = budget && spending ? (spending.todaySpent / budget.dailyLimit) * 100 : 0;
  const weeklyPercentUsed = budget && spending ? (spending.weeklySpent / budget.weeklyLimit) * 100 : 0;
  
  const todaySpent = spending?.todaySpent || 0;
  const weeklySpent = spending?.weeklySpent || 0;

  return (
    <CustomerLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground">Here's your meal planning overview for today.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Budget Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Budget</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₱{dailyRemaining.toFixed(0)}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${dailyPercentUsed > 80 ? 'bg-destructive' : 'bg-primary'}`}
                        style={{ width: `${Math.min(dailyPercentUsed, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{dailyPercentUsed.toFixed(0)}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ₱{todaySpent} of ₱{budget?.dailyLimit} spent
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Weekly Budget</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₱{weeklyRemaining.toFixed(0)}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${weeklyPercentUsed > 80 ? 'bg-destructive' : 'bg-primary'}`}
                        style={{ width: `${Math.min(weeklyPercentUsed, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{weeklyPercentUsed.toFixed(0)}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ₱{weeklySpent} of ₱{budget?.weeklyLimit} spent
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Meals Planned</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{savedMealsCount}</div>
                  <p className="text-xs text-muted-foreground">
                    {savedMealsCount > 0 ? `${savedMealsCount} favorite meals saved` : 'No meals planned yet'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Markets Available</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2</div>
                  <p className="text-xs text-muted-foreground">San Nicolas & Pampanga</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    Browse Products
                  </CardTitle>
                  <CardDescription>Explore fresh products from local markets</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" asChild className="p-0 h-auto">
                    <Link to="/customer/browse">
                      Start Shopping <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Plan Meals
                  </CardTitle>
                  <CardDescription>Create your weekly meal plan</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" asChild className="p-0 h-auto">
                    <Link to="/customer/ai-meal-planner">
                      Plan Now <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI Recommendations
                  </CardTitle>
                  <CardDescription>Personalized meal suggestions just for you</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="default" asChild className="p-0 h-auto bg-transparent hover:bg-transparent text-primary hover:underline">
                    <Link to="/customer/ai-recommendations" className="inline-flex items-center">
                      Get Recommendations <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Featured Markets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UtensilsCrossed className="h-5 w-5 text-primary" />
                  Local Markets
                </CardTitle>
                <CardDescription>Fresh products from Angeles City markets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">San Nicolas Market</h4>
                      <p className="text-sm text-muted-foreground">Fresh produce daily</p>
                    </div>
                    <Badge variant="secondary" className="ml-auto">Open</Badge>
                  </div>
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Pampang Public Market</h4>
                      <p className="text-sm text-muted-foreground">Local specialties</p>
                    </div>
                    <Badge variant="secondary" className="ml-auto">Open</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </CustomerLayout>
  );
}
