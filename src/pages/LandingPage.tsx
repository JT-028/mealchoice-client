import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  UtensilsCrossed,
  Wallet,
  ShoppingCart,
  MessageCircle,
  QrCode,
  Truck,
  Package,
  Bell,
  Users,
  MapPin,
  BarChart3,
  ArrowRight,
  Sparkles,
  Clock,
  TrendingUp,
  Store,
  ChefHat,
  Heart
} from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

        <div className="container relative mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6" variant="secondary">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered Meal Planning
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
              Smart Meals, Smart Budget{' '}
              <span className="text-primary">for Angeles City</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Plan nutritious meals, track your food budget, and order from local markets — 
              all in one app designed for Pampanga and San Nicolas markets.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-lg px-8">
                <Link to="/register">
                  Start Planning Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8">
                <Link to="/login">I'm a Seller</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-lg mx-auto">
              <div>
                <p className="text-3xl font-bold text-primary">2</p>
                <p className="text-sm text-muted-foreground">Local Markets</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">24/7</p>
                <p className="text-sm text-muted-foreground">Meal Planning</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">₱0</p>
                <p className="text-sm text-muted-foreground">To Start</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="outline">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Eat Well
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From personalized meal recommendations to budget tracking, we've got you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Customer Features */}
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <ChefHat className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Personalized Meals</CardTitle>
                <CardDescription>
                  AI-powered recommendations based on your budget and dietary needs.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Budget Tracking</CardTitle>
                <CardDescription>
                  Set spending limits and get alerts to stay within your food budget.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Grocery Lists</CardTitle>
                <CardDescription>
                  Auto-generated shopping lists from your planned meals.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Chat with Sellers</CardTitle>
                <CardDescription>
                  Direct communication with market vendors for custom orders.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <QrCode className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>QR Code Payment</CardTitle>
                <CardDescription>
                  Quick and secure payments at supported vendor stalls.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Delivery Options</CardTitle>
                <CardDescription>
                  Pickup or delivery based on seller availability.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="outline">How It Works</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Start in 3 Easy Steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Set Your Budget</h3>
              <p className="text-muted-foreground">
                Tell us your daily or weekly food budget and dietary preferences.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Meal Plans</h3>
              <p className="text-muted-foreground">
                Receive AI-powered meal suggestions that fit your budget and health goals.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Order & Enjoy</h3>
              <p className="text-muted-foreground">
                Order ingredients from local markets with pickup or delivery options.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section id="users" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="outline">For Everyone</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Built for the Community
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Customers */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full" />
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4">
                  <Heart className="h-7 w-7 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl">For Customers</CardTitle>
                <CardDescription>Families & individuals managing food budgets</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm">
                    <UtensilsCrossed className="h-4 w-4 text-primary" />
                    <span>Personalized meal recommendations</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span>Budget tracking & alerts</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>Save time on meal planning</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Sellers */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-bl-full" />
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center mb-4">
                  <Store className="h-7 w-7 text-accent-foreground" />
                </div>
                <CardTitle className="text-2xl">For Sellers</CardTitle>
                <CardDescription>Local market vendors in Angeles City</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-primary" />
                    <span>Manage orders efficiently</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Bell className="h-4 w-4 text-primary" />
                    <span>Low-stock alerts</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span>Grow your customer base</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Admins */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/20 rounded-bl-full" />
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary-foreground to-secondary-foreground/60 flex items-center justify-center mb-4">
                  <BarChart3 className="h-7 w-7 text-secondary" />
                </div>
                <CardTitle className="text-2xl">For Admins</CardTitle>
                <CardDescription>Platform administrators</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-primary" />
                    <span>Manage seller accounts</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>Assign market locations</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <span>Monitor platform activity</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10" />
        <div className="container relative mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Eat Smarter?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Join Meal Choice today and start planning nutritious meals within your budget.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8">
              <Link to="/register">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
