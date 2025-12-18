import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { getAdminStats, type AdminStats } from '@/api/admin';
import {
  Users,
  UserCheck,
  ShoppingBag,
  Package,
  ArrowRight,
  Loader2,
  MapPin
} from 'lucide-react';

export function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;
      
      try {
        const response = await getAdminStats(token);
        if (response.success && response.stats) {
          setStats(response.stats);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and management</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : stats ? (
          <>
            {/* Pending Alert */}
            {stats.pendingSellers > 0 && (
              <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <UserCheck className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                          {stats.pendingSellers} seller(s) awaiting verification
                        </p>
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                          Review and approve new seller registrations
                        </p>
                      </div>
                    </div>
                    <Link 
                      to="/admin/pending"
                      className="text-yellow-700 hover:text-yellow-900 font-medium flex items-center gap-1"
                    >
                      Review <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalCustomers} customers, {stats.totalSellers} sellers
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium">Verified Sellers</CardTitle>
                  <UserCheck className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.verifiedSellers}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.pendingSellers} pending verification
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalOrders}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all sellers
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Market Distribution */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Sellers by Market
                  </CardTitle>
                  <CardDescription>Distribution of verified sellers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                      <span>San Nicolas Market</span>
                    </div>
                    <Badge variant="secondary">{stats.sellersByMarket.sanNicolas}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      <span>Pampanga Market</span>
                    </div>
                    <Badge variant="secondary">{stats.sellersByMarket.pampanga}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Products
                  </CardTitle>
                  <CardDescription>Total listed products</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{stats.totalProducts}</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Products available from all sellers
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">Unable to load stats</p>
        )}
      </div>
    </AdminLayout>
  );
}
