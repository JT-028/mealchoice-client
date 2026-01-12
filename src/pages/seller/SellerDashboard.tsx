import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SellerLayout } from '@/components/layout/SellerLayout';
import { PendingVerification } from '@/components/seller/PendingVerification';
import { TutorialDialog } from '@/components/TutorialDialog';
import { useAuth } from '@/contexts/AuthContext';
import { getSellerProducts, type Product } from '@/api/products';
import { getSellerAnalytics, type SellerAnalytics } from '@/api/orders';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  LabelList
} from 'recharts';
import {
  Package,
  AlertTriangle,
  ArrowRight,
  ShoppingCart,
  Loader2,
  TrendingUp,
  TrendingDown,
  Printer,
  Calendar,
  XCircle,
  Store,
  Coins,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' }
];

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

export function SellerDashboard() {
  const { token, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    lowStock: 0,
    outOfStock: 0
  });
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [useCustomDate, setUseCustomDate] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!token || !user?.isVerified) {
        setLoading(false);
        return;
      }

      try {
        const response = await getSellerProducts(token);
        if (response.success && response.products) {
          setProducts(response.products);
          setStats({
            total: response.count || 0,
            lowStock: response.lowStockCount || 0,
            outOfStock: response.outOfStockCount || 0
          });
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [token, user?.isVerified]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!token || !user?.isVerified) return;

      setAnalyticsLoading(true);
      try {
        const params: { period?: string; startDate?: string; endDate?: string } = {};

        if (useCustomDate && startDate && endDate) {
          params.startDate = startDate;
          params.endDate = endDate;
        } else {
          params.period = period;
        }

        const response = await getSellerAnalytics(token, params);
        if (response.success && response.analytics) {
          setAnalytics(response.analytics);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchAnalytics();
  }, [token, user?.isVerified, period, startDate, endDate, useCustomDate]);

  const handlePrint = () => {
    const printContent = reportRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sales Analytics Report - ${user?.name || 'Seller'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { font-size: 24px; margin-bottom: 5px; }
          .header p { color: #666; }
          .period-badge { background: #f3f4f6; padding: 4px 12px; border-radius: 20px; display: inline-block; margin-top: 10px; }
          .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
          .stat-card { background: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; }
          .stat-value { font-size: 28px; font-weight: bold; color: #111; }
          .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
          .section { margin-bottom: 30px; }
          .section h2 { font-size: 18px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
          th { background: #f9fafb; font-weight: 600; }
          .text-right { text-align: right; }
          .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Sales Analytics Report</h1>
          <p>${user?.name || 'Seller'} - ${user?.marketLocation || 'Market'}</p>
          <span class="period-badge">${PERIOD_OPTIONS.find(p => p.value === period)?.label || period}</span>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">₱${analytics?.summary.totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 }) || '0.00'}</div>
            <div class="stat-label">Total Revenue</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${analytics?.summary.totalOrders || 0}</div>
            <div class="stat-label">Total Orders</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${analytics?.summary.completedOrders || 0}</div>
            <div class="stat-label">Completed Orders</div>
          </div>
        </div>

        <div class="section">
          <h2>Order Status Breakdown</h2>
          <table>
            <tr><th>Status</th><th class="text-right">Count</th></tr>
            <tr><td>Pending</td><td class="text-right">${analytics?.statusBreakdown.pending || 0}</td></tr>
            <tr><td>Confirmed</td><td class="text-right">${analytics?.statusBreakdown.confirmed || 0}</td></tr>
            <tr><td>Preparing</td><td class="text-right">${analytics?.statusBreakdown.preparing || 0}</td></tr>
            <tr><td>Ready</td><td class="text-right">${analytics?.statusBreakdown.ready || 0}</td></tr>
            <tr><td>Completed</td><td class="text-right">${analytics?.statusBreakdown.completed || 0}</td></tr>
            <tr><td>Cancelled</td><td class="text-right">${analytics?.statusBreakdown.cancelled || 0}</td></tr>
          </table>
        </div>

        <div class="section">
          <h2>Payment Methods</h2>
          <table>
            <tr><th>Method</th><th class="text-right">Count</th></tr>
            <tr><td>QR Payment</td><td class="text-right">${analytics?.paymentBreakdown.qr || 0}</td></tr>
            <tr><td>Cash on Delivery</td><td class="text-right">${analytics?.paymentBreakdown.cod || 0}</td></tr>
          </table>
        </div>

        <div class="section">
          <h2>Top Selling Products</h2>
          <table>
            <tr><th>Product</th><th class="text-right">Qty Sold</th><th class="text-right">Revenue</th></tr>
            ${analytics?.topProducts.map(p => `
              <tr>
                <td>${p.name}</td>
                <td class="text-right">${p.quantity}</td>
                <td class="text-right">₱${p.revenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('') || '<tr><td colspan="3" style="text-align:center;color:#999;">No data</td></tr>'}
          </table>
        </div>

        <div class="footer">
          <p>Generated on ${new Date().toLocaleString('en-PH')}</p>
          <p>MealChoice Analytics Report</p>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const lowStockProducts = products.filter(p => p.quantity > 0 && p.quantity <= p.lowStockThreshold);
  const outOfStockProducts = products.filter(p => p.quantity === 0);

  // Show pending verification message for unverified sellers
  if (!user?.isVerified) {
    return (
      <SellerLayout>
        <PendingVerification />
      </SellerLayout>
    );
  }

  // Prepare chart data
  const salesChartData = analytics?.salesOverTime.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
    revenue: d.revenue,
    orders: d.orders
  })) || [];

  return (
    <SellerLayout>
      {/* Tutorial Dialog - shows on first login */}
      <TutorialDialog userType="seller" />

      <div className="space-y-8" ref={reportRef}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Seller Dashboard</h1>
            <p className="text-muted-foreground">Manage your products and track sales</p>
          </div>
          <div>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print Report
            </Button>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex flex-wrap items-end gap-3">
          {!useCustomDate && (
            <>
              {PERIOD_OPTIONS.map(opt => (
                <Button
                  key={opt.value}
                  variant={period === opt.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setPeriod(opt.value);
                    setUseCustomDate(false);
                  }}
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  {opt.label}
                </Button>
              ))}
            </>
          )}

          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value && endDate) {
                    setUseCustomDate(true);
                    setPeriod('custom');
                  }
                }}
                className="h-8 w-36"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (startDate && e.target.value) {
                    setUseCustomDate(true);
                    setPeriod('custom');
                  }
                }}
                className="h-8 w-36"
              />
            </div>
            {useCustomDate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setUseCustomDate(false);
                  setStartDate('');
                  setEndDate('');
                  setPeriod('month');
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        {loading || analyticsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Revenue & Order Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <Coins className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ₱{analytics?.summary.totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 }) || '0.00'}
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    {analytics?.summary.revenueChange !== undefined && analytics.summary.revenueChange !== 0 && (
                      <>
                        {analytics.summary.revenueChange > 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        )}
                        <span className={analytics.summary.revenueChange > 0 ? 'text-green-600' : 'text-red-600'}>
                          {Math.abs(analytics.summary.revenueChange)}% vs last period
                        </span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.summary.totalOrders || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics?.summary.completedOrders || 0} completed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.lowStock > 0 && <span className="text-yellow-600">{stats.lowStock} low stock</span>}
                    {stats.lowStock > 0 && stats.outOfStock > 0 && ' · '}
                    {stats.outOfStock > 0 && <span className="text-red-600">{stats.outOfStock} out</span>}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Sales Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Sales Trend
                  </CardTitle>
                  <CardDescription>Revenue over the last 14 days</CardDescription>
                </CardHeader>
                <CardContent>
                  {salesChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={salesChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${v}`} />
                        <Tooltip
                          formatter={(value) => [`₱${(value as number).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, 'Revenue']}
                        />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#22c55e"
                          strokeWidth={2}
                          dot={{ fill: '#22c55e', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                      No sales data for this period
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Market Performance Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-primary" />
                    Market Performance
                  </CardTitle>
                  <CardDescription>
                    Revenue by seller - You: <span className="font-semibold text-primary">{user?.name}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics?.marketComparison && analytics.marketComparison.some(m => m.revenue > 0) ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        data={analytics.marketComparison.map(m => ({
                          ...m,
                          isCurrentSeller: m.name === user?.name
                        }))}
                        layout="vertical"
                        margin={{ left: 80, right: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                        <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(val) => `₱${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 11 }}
                          width={75}
                        />
                        <Tooltip
                          formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Revenue']}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        />
                        <Bar
                          dataKey="revenue"
                          name="Revenue"
                          radius={[0, 4, 4, 0]}
                          barSize={24}
                        >
                          {analytics.marketComparison.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.name === user?.name ? '#22c55e' : COLORS[index % COLORS.length]}
                              stroke={entry.name === user?.name ? '#16a34a' : 'none'}
                              strokeWidth={entry.name === user?.name ? 2 : 0}
                            />
                          ))}
                          <LabelList
                            dataKey="revenue"
                            position="right"
                            formatter={(val) => {
                              const num = Number(val) || 0;
                              return `₱${num >= 1000 ? (num / 1000).toFixed(1) + 'k' : num}`;
                            }}
                            style={{ fontSize: 10, fill: '#666' }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                      No market comparison data available for this period
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top Products & Low Stock */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Top Products */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Top Selling Products
                  </CardTitle>
                  <CardDescription>Best performers by revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics?.topProducts && analytics.topProducts.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.topProducts.map((product, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                              {idx + 1}
                            </Badge>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">{product.quantity} sold</p>
                            </div>
                          </div>
                          <span className="font-medium text-green-600">
                            ₱{product.revenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No sales data for this period
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Low Stock Alert */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Low Stock Alert
                  </CardTitle>
                  <CardDescription>Products running low on inventory</CardDescription>
                </CardHeader>
                <CardContent>
                  {lowStockProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      ✅ All products are well stocked!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {lowStockProducts.slice(0, 5).map((product) => (
                        <div key={product._id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {product.quantity} {product.unit} remaining
                            </p>
                          </div>
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            Low Stock
                          </Badge>
                        </div>
                      ))}
                      {lowStockProducts.length > 5 && (
                        <Button variant="ghost" asChild className="w-full">
                          <Link to="/seller/products">
                            View all {lowStockProducts.length} items
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Out of Stock Alert */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    Out of Stock
                  </CardTitle>
                  <CardDescription>Products that need restocking</CardDescription>
                </CardHeader>
                <CardContent>
                  {outOfStockProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      ✅ No products are out of stock!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {outOfStockProducts.slice(0, 5).map((product) => (
                        <div key={product._id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {product.category}
                            </p>
                          </div>
                          <Badge variant="destructive">
                            Out of Stock
                          </Badge>
                        </div>
                      ))}
                      {outOfStockProducts.length > 5 && (
                        <Button variant="ghost" asChild className="w-full">
                          <Link to="/seller/inventory">
                            View all {outOfStockProducts.length} items
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </SellerLayout>
  );
}
