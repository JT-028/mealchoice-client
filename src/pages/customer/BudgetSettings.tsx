import { useEffect, useState } from 'react';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { getBudget, updateBudget, getSpending, type Spending } from '@/api/budget';
import { formatCurrency } from '@/lib/utils';
import {
  Wallet,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export function BudgetSettings() {
  const { token } = useAuth();
  const [spending, setSpending] = useState<Spending | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    dailyLimit: 500,
    weeklyLimit: 3000,
    alertThreshold: 300,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      try {
        const [budgetRes, spendingRes] = await Promise.all([
          getBudget(token),
          getSpending(token)
        ]);

        if (budgetRes.success && budgetRes.budget) {
          setFormData({
            dailyLimit: budgetRes.budget.dailyLimit,
            weeklyLimit: budgetRes.budget.weeklyLimit,
            alertThreshold: budgetRes.budget.alertThreshold,
          });
        }

        if (spendingRes.success && spendingRes.spending) {
          setSpending(spendingRes.spending);
        }
      } catch (error) {
        console.error('Error fetching budget data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!token) return;

    if (formData.dailyLimit <= 0) {
      setError('Daily limit must be greater than 0');
      return;
    }

    if (formData.weeklyLimit < formData.dailyLimit) {
      setError('Weekly limit should be at least equal to daily limit');
      return;
    }

    setSaving(true);

    try {
      const response = await updateBudget(token, formData);
      if (response.success && response.budget) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(response.message || 'Failed to update budget');
      }
    } catch (err) {
      setError('Server error. Please try again.');
      console.error('Budget update error:', err);
    } finally {
      setSaving(false);
    }
  };

  const todaySpent = spending?.todaySpent || 0;
  const weeklySpent = spending?.weeklySpent || 0;

  const dailyRemaining = Math.max(0, formData.dailyLimit - todaySpent);
  const weeklyRemaining = Math.max(0, formData.weeklyLimit - weeklySpent);
  // Calculate percentage used for visual bar
  const dailyPercentUsed = formData.dailyLimit > 0 ? (todaySpent / formData.dailyLimit) * 100 : 0;
  const weeklyPercentUsed = formData.weeklyLimit > 0 ? (weeklySpent / formData.weeklyLimit) * 100 : 0;

  // Alert logic: Trigger if remaining balance is less than or equal to threshold
  const isLowDaily = dailyRemaining <= formData.alertThreshold;

  return (
    <CustomerLayout>
      <div className="space-y-6 w-full">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Budget Settings</h1>
          <p className="text-muted-foreground">Manage your daily and weekly spending limits</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Current Status */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Today's Spending</CardTitle>
                    {isLowDaily && (
                      <div className="flex items-center gap-1 text-xs text-destructive font-medium">
                        <AlertTriangle className="h-3 w-3" />
                        Low Balance
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(todaySpent)}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isLowDaily ? 'bg-destructive' : 'bg-primary'}`}
                        style={{ width: `${Math.min(dailyPercentUsed, 100)}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatCurrency(dailyRemaining)} remaining of {formatCurrency(formData.dailyLimit)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Weekly Spending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(weeklySpent)}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${weeklyRemaining <= formData.alertThreshold ? 'bg-destructive' : 'bg-primary'}`}
                        style={{ width: `${Math.min(weeklyPercentUsed, 100)}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatCurrency(Math.max(0, formData.weeklyLimit - weeklySpent))} remaining of {formatCurrency(formData.weeklyLimit)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Settings Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Budget Limits
                </CardTitle>
                <CardDescription>
                  Set your spending limits to help stay on track with your food budget
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                      <AlertTriangle className="h-4 w-4" />
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="flex items-center gap-2 p-3 text-sm text-green-600 bg-green-50 rounded-lg">
                      <CheckCircle className="h-4 w-4" />
                      Budget settings saved successfully!
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="dailyLimit">Daily Limit (₱)</Label>
                      <Input
                        id="dailyLimit"
                        type="number"
                        min="0"
                        value={formData.dailyLimit}
                        onChange={(e) => setFormData({ ...formData, dailyLimit: Number(e.target.value) })}
                        disabled={saving}
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum you want to spend per day on food
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="weeklyLimit">Weekly Limit (₱)</Label>
                      <Input
                        id="weeklyLimit"
                        type="number"
                        min="0"
                        value={formData.weeklyLimit}
                        onChange={(e) => setFormData({ ...formData, weeklyLimit: Number(e.target.value) })}
                        disabled={saving}
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum weekly food budget
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alertThreshold">Spending Alert</Label>
                    <Input
                      id="alertThreshold"
                      type="number"
                      min="0"
                      value={formData.alertThreshold}
                      onChange={(e) => setFormData({ ...formData, alertThreshold: Number(e.target.value) })}
                      disabled={saving}
                      placeholder="e.g. 300"
                    />
                    <p className="text-xs text-muted-foreground">
                      Get notified when your remaining daily budget drops to this amount or below
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Settings
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-sm">💡 Budget Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>• Plan your meals ahead to avoid impulse buying</p>
                <p>• Buy seasonal fruits and vegetables for better prices</p>
                <p>• Check prices from different sellers before purchasing</p>
                <p>• Set realistic limits based on your family size</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </CustomerLayout>
  );
}
