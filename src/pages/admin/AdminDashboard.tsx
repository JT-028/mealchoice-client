import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { getAdminStats, type AdminStats } from '@/api/admin';
import {
  Users,
  UserCheck,
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
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2">
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
            </div>

            {/* Market Distribution */}
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
                    <span>Pampang Public Market</span>
                  </div>
                  <Badge variant="secondary">{stats.sellersByMarket.pampanga}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Account Status Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Seller Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Seller Account Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-sm">Active Sellers</span>
                      </div>
                      <span className="font-semibold text-green-600">{stats.activeSellers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <span className="text-sm">Inactive Sellers</span>
                      </div>
                      <span className="font-semibold text-red-600">{stats.inactiveSellers}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Customer Account Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-sm">Active Customers</span>
                      </div>
                      <span className="font-semibold text-green-600">{stats.activeCustomers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <span className="text-sm">Inactive Customers</span>
                      </div>
                      <span className="font-semibold text-red-600">{stats.inactiveCustomers}</span>
                    </div>
                  </div>
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
