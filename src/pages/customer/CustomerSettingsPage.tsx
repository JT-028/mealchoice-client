import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import {
  getSettings,
  updateProfile,
  changePassword,
  updateTheme,
  deleteAccount,
  exportOrders,
  type UserSettings
} from '@/api/settings';
import {
  getPreferences,
  updatePreferences
} from '@/api/preferences';
import {
  User,
  Lock,
  Palette,
  Download,
  Trash2,
  Loader2,
  Check,
  Sun,
  Moon,
  Monitor,
  Utensils
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  TooltipProvider,
} from '@/components/ui/tooltip';

const dietaryOptions = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free',
  'Nut-Free', 'Halal', 'Kosher', 'Low-Sodium', 'Diabetic-Friendly'
];

const mealTypeOptions = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
const cuisineOptions = ['Filipino', 'Asian', 'Western', 'Mediterranean', 'Indian', 'Mexican'];

export function CustomerSettingsPage() {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>('system');
  
  // UI states
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Preference states
  const [prefLoading, setPrefLoading] = useState(false);
  const [health, setHealth] = useState({
    height: '',
    weight: '',
    age: '',
    sex: '',
    activityLevel: '',
    dietaryRestrictions: [] as string[],
  });
  const [meal, setMeal] = useState({
    preferredMealTypes: [] as string[],
    preferredCuisines: [] as string[],
    preferredIngredients: '',
    avoidedIngredients: '',
    calorieMin: 1200,
    calorieMax: 2500,
    maxSodium: 2300,
    maxSugar: 50,
    maxFats: 65,
  });
  const [budget, setBudget] = useState({
    weeklyBudget: '',
    budgetPerMeal: '',
    prefersPriceRange: '',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      if (!token) return;
      try {
        const response = await getSettings(token);
        if (response.success && response.settings) {
          setSettings(response.settings);
          setName(response.settings.name);
          setSelectedTheme(response.settings.theme);
          applyTheme(response.settings.theme);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [token]);

  const fetchPreferences = async () => {
    if (!token) return;
    setPrefLoading(true);
    try {
      const response = await getPreferences(token);
      if (response.success && response.preferences) {
        const p = response.preferences;
        setHealth({
          height: (p.height || '').toString(),
          weight: (p.weight || '').toString(),
          age: (p.age || '').toString(),
          sex: p.sex || '',
          activityLevel: p.activityLevel || '',
          dietaryRestrictions: p.dietaryRestrictions || [],
        });
        setMeal({
          preferredMealTypes: p.preferredMealTypes || [],
          preferredCuisines: p.preferredCuisines || [],
          preferredIngredients: (p.preferredIngredients || []).join(', '),
          avoidedIngredients: (p.avoidedIngredients || []).join(', '),
          calorieMin: p.calorieMin || 1200,
          calorieMax: p.calorieMax || 2500,
          maxSodium: p.maxSodium || 2300,
          maxSugar: p.maxSugar || 50,
          maxFats: p.maxFats || 65,
        });
        setBudget({
          weeklyBudget: (p.weeklyBudget || '').toString(),
          budgetPerMeal: (p.budgetPerMeal || '').toString(),
          prefersPriceRange: p.prefersPriceRange || '',
        });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setPrefLoading(false);
    }
  };

  const toggleDietaryRestriction = (restriction: string) => {
    setHealth(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restriction)
        ? prev.dietaryRestrictions.filter(r => r !== restriction)
        : [...prev.dietaryRestrictions, restriction]
    }));
  };

  const toggleMealType = (type: string) => {
    setMeal(prev => ({
      ...prev,
      preferredMealTypes: prev.preferredMealTypes.includes(type)
        ? prev.preferredMealTypes.filter(t => t !== type)
        : [...prev.preferredMealTypes, type]
    }));
  };

  const toggleCuisine = (cuisine: string) => {
    setMeal(prev => ({
      ...prev,
      preferredCuisines: prev.preferredCuisines.includes(cuisine)
        ? prev.preferredCuisines.filter(c => c !== cuisine)
        : [...prev.preferredCuisines, cuisine]
    }));
  };

  const handleUpdatePreferences = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const response = await updatePreferences(token, {
        height: health.height ? Number(health.height) : null,
        weight: health.weight ? Number(health.weight) : null,
        age: health.age ? Number(health.age) : null,
        sex: (health.sex as any) || null,
        activityLevel: (health.activityLevel as any) || null,
        dietaryRestrictions: health.dietaryRestrictions,
        preferredMealTypes: meal.preferredMealTypes,
        preferredCuisines: meal.preferredCuisines,
        preferredIngredients: meal.preferredIngredients.split(',').map(i => i.trim()).filter(Boolean),
        avoidedIngredients: meal.avoidedIngredients.split(',').map(i => i.trim()).filter(Boolean),
        calorieMin: meal.calorieMin,
        calorieMax: meal.calorieMax,
        maxSodium: meal.maxSodium,
        maxSugar: meal.maxSugar,
        maxFats: meal.maxFats,
        weeklyBudget: budget.weeklyBudget ? Number(budget.weeklyBudget) : null,
        budgetPerMeal: budget.budgetPerMeal ? Number(budget.budgetPerMeal) : null,
        prefersPriceRange: (budget.prefersPriceRange as any) || null,
      });
      if (response.success) {
        showMessage('success', 'Preferences updated successfully');
      } else {
        showMessage('error', response.message || 'Failed to update preferences');
      }
    } catch {
      showMessage('error', 'Error updating preferences');
    } finally {
      setSaving(false);
    }
  };

  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    if (theme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', systemDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleUpdateProfile = async () => {
    if (!token || !name.trim()) return;
    setSaving(true);
    try {
      const response = await updateProfile(token, { name: name.trim() });
      if (response.success) {
        showMessage('success', 'Profile updated successfully');
      } else {
        showMessage('error', response.message || 'Failed to update profile');
      }
    } catch {
      showMessage('error', 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!token) return;
    if (newPassword !== confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      showMessage('error', 'Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      const response = await changePassword(token, { currentPassword, newPassword });
      if (response.success) {
        showMessage('success', 'Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showMessage('error', response.message || 'Failed to change password');
      }
    } catch {
      showMessage('error', 'Error changing password');
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    if (!token) return;
    setSelectedTheme(theme);
    applyTheme(theme);
    try {
      await updateTheme(token, theme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const handleExportOrders = async () => {
    if (!token) return;
    setExporting(true);
    try {
      const blob = await exportOrders(token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'order-history.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showMessage('success', 'Order history exported');
    } catch {
      showMessage('error', 'Error exporting orders');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!token || !deletePassword) return;
    setDeleting(true);
    try {
      const response = await deleteAccount(token, deletePassword);
      if (response.success) {
        logout();
        navigate('/login');
      } else {
        showMessage('error', response.message || 'Failed to delete account');
        setDeleteDialogOpen(false);
      }
    } catch {
      showMessage('error', 'Error deleting account');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences</p>
        </div>

        {message.text && (
          <div className={`p-3 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-destructive/10 text-destructive'
          }`}>
            {message.text}
          </div>
        )}

        <Tabs defaultValue="profile" className="space-y-6" onValueChange={(val) => val === 'preferences' && fetchPreferences()}>
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="profile"><User className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="preferences"><Utensils className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="security"><Lock className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="appearance"><Palette className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="data"><Download className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="account"><Trash2 className="h-4 w-4" /></TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={settings?.email || ''} disabled />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                <Button onClick={handleUpdateProfile} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Food Preferences</CardTitle>
                <CardDescription>Tailor your meal recommendations and health goals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {prefLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {/* Health Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">Health & Physical</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="height">Height (cm)</Label>
                          <Input
                            id="height"
                            type="number"
                            value={health.height}
                            onChange={(e) => setHealth({ ...health, height: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="weight">Weight (kg)</Label>
                          <Input
                            id="weight"
                            type="number"
                            value={health.weight}
                            onChange={(e) => setHealth({ ...health, weight: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="age">Age</Label>
                          <Input
                            id="age"
                            type="number"
                            value={health.age}
                            onChange={(e) => setHealth({ ...health, age: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Dietary Restrictions</Label>
                        <div className="flex flex-wrap gap-2">
                          {dietaryOptions.map(option => (
                            <Badge
                              key={option}
                              variant={health.dietaryRestrictions.includes(option) ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => toggleDietaryRestriction(option)}
                            >
                              {option}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Meal Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">Meal Preferences</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Preferred Meal Types</Label>
                          <div className="flex flex-wrap gap-2">
                            {mealTypeOptions.map(type => (
                              <Badge
                                key={type}
                                variant={meal.preferredMealTypes.includes(type) ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => toggleMealType(type)}
                              >
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Preferred Cuisines</Label>
                          <div className="flex flex-wrap gap-2">
                            {cuisineOptions.map(cuisine => (
                              <Badge
                                key={cuisine}
                                variant={meal.preferredCuisines.includes(cuisine) ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => toggleCuisine(cuisine)}
                              >
                                {cuisine}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="preferredIngredients">Preferred Ingredients</Label>
                          <Input
                            id="preferredIngredients"
                            placeholder="e.g., chicken, rice"
                            value={meal.preferredIngredients}
                            onChange={(e) => setMeal({ ...meal, preferredIngredients: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="avoidedIngredients">Avoided Ingredients</Label>
                          <Input
                            id="avoidedIngredients"
                            placeholder="e.g., peanuts, shellfish"
                            value={meal.avoidedIngredients}
                            onChange={(e) => setMeal({ ...meal, avoidedIngredients: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Nutrients Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">Daily Nutritional Targets</h3>
                      <TooltipProvider>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label>Calorie Min</Label>
                            <Input
                              type="number"
                              value={meal.calorieMin}
                              onChange={(e) => setMeal({ ...meal, calorieMin: Number(e.target.value) })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Calorie Max</Label>
                            <Input
                              type="number"
                              value={meal.calorieMax}
                              onChange={(e) => setMeal({ ...meal, calorieMax: Number(e.target.value) })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Max Sodium (mg)</Label>
                            <Input
                              type="number"
                              value={meal.maxSodium}
                              onChange={(e) => setMeal({ ...meal, maxSodium: Number(e.target.value) })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Max Sugar (g)</Label>
                            <Input
                              type="number"
                              value={meal.maxSugar}
                              onChange={(e) => setMeal({ ...meal, maxSugar: Number(e.target.value) })}
                            />
                          </div>
                        </div>
                      </TooltipProvider>
                    </div>

                    <Button onClick={handleUpdatePreferences} disabled={saving} className="w-full sm:w-auto">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                      Update Preferences
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password to keep your account secure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button onClick={handleChangePassword} disabled={saving || !currentPassword || !newPassword}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                  Change Password
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how the app looks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <Button
                    variant={selectedTheme === 'light' ? 'default' : 'outline'}
                    className="flex flex-col h-auto py-4 gap-2"
                    onClick={() => handleThemeChange('light')}
                  >
                    <Sun className="h-6 w-6" />
                    <span>Light</span>
                  </Button>
                  <Button
                    variant={selectedTheme === 'dark' ? 'default' : 'outline'}
                    className="flex flex-col h-auto py-4 gap-2"
                    onClick={() => handleThemeChange('dark')}
                  >
                    <Moon className="h-6 w-6" />
                    <span>Dark</span>
                  </Button>
                  <Button
                    variant={selectedTheme === 'system' ? 'default' : 'outline'}
                    className="flex flex-col h-auto py-4 gap-2"
                    onClick={() => handleThemeChange('system')}
                  >
                    <Monitor className="h-6 w-6" />
                    <span>System</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data">
            <Card>
              <CardHeader>
                <CardTitle>Export Data</CardTitle>
                <CardDescription>Download your order history</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleExportOrders} disabled={exporting}>
                  {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                  Export Order History (CSV)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account">
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Delete Account</CardTitle>
                <CardDescription>Permanently delete your account and all data</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  This action cannot be undone. All your data will be permanently deleted.
                </p>
                <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Account Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete your account and all associated data. Enter your password to confirm.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="deletePassword">Password</Label>
              <Input
                id="deletePassword"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={deleting || !deletePassword}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </CustomerLayout>
  );
}
