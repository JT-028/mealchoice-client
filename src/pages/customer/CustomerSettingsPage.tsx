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
  type UserSettings
} from '@/api/settings';
import {
  getSavedAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  type Address
} from '@/api/addresses';
import {
  getPreferences,
  updatePreferences
} from '@/api/preferences';
import {
  User,
  Lock,
  Palette,
  Trash2,
  Loader2,
  Check,
  Sun,
  Moon,
  Monitor,
  Utensils,
  Eye,
  EyeOff,
  MapPin,
  Pencil,
  PlusCircle
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
  const { token, logout, updateUser } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
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

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);

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

  // Address states
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [isEditingAddr, setIsEditingAddr] = useState(false);
  const [editingAddrId, setEditingAddrId] = useState<string | null>(null);
  const [addrForm, setAddrForm] = useState<Omit<Address, '_id'>>({
    label: 'Home',
    fullAddress: '',
    barangay: '',
    city: '',
    province: '',
    postalCode: '',
    contactPhone: '',
    isDefault: false
  });

  useEffect(() => {
    const fetchSettings = async () => {
      if (!token) return;
      try {
        const response = await getSettings(token);
        if (response.success && response.settings) {
          setSettings(response.settings);
          setName(response.settings.name);
          setPhone(response.settings.phone || '');
          setSelectedTheme(response.settings.theme);
          updateUser({ theme: response.settings.theme });
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

  const fetchAddresses = async () => {
    if (!token) return;
    setAddrLoading(true);
    try {
      const response = await getSavedAddresses(token);
      if (response.success && response.addresses) {
        setAddresses(response.addresses);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setAddrLoading(false);
    }
  };

  const handleAddOrUpdateAddress = async () => {
    if (!token || !addrForm.fullAddress || !addrForm.contactPhone) {
      showMessage('error', 'Please fill in required fields');
      return;
    }
    setSaving(true);
    try {
      let response;
      if (isEditingAddr && editingAddrId) {
        response = await updateAddress(token, editingAddrId, addrForm);
      } else {
        response = await addAddress(token, addrForm);
      }

      if (response.success && response.addresses) {
        setAddresses(response.addresses);
        showMessage('success', isEditingAddr ? 'Address updated' : 'Address added');
        resetAddrForm();
      } else {
        showMessage('error', response.message || 'Failed to save address');
      }
    } catch {
      showMessage('error', 'Error saving address');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!token) return;
    try {
      const response = await deleteAddress(token, id);
      if (response.success && response.addresses) {
        setAddresses(response.addresses);
        showMessage('success', 'Address deleted');
      }
    } catch {
      showMessage('error', 'Error deleting address');
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    if (!token) return;
    try {
      const response = await setDefaultAddress(token, id);
      if (response.success && response.addresses) {
        setAddresses(response.addresses);
        showMessage('success', 'Default address updated');
      }
    } catch {
      showMessage('error', 'Error setting default');
    }
  };

  const resetAddrForm = () => {
    setAddrForm({
      label: 'Home',
      fullAddress: '',
      barangay: '',
      city: '',
      province: '',
      postalCode: '',
      contactPhone: '',
      isDefault: false
    });
    setIsEditingAddr(false);
    setEditingAddrId(null);
  };

  const startEditAddress = (addr: Address) => {
    setAddrForm({
      label: addr.label,
      fullAddress: addr.fullAddress,
      barangay: addr.barangay || '',
      city: addr.city || '',
      province: addr.province || '',
      postalCode: addr.postalCode || '',
      contactPhone: addr.contactPhone || '',
      isDefault: addr.isDefault
    });
    setIsEditingAddr(true);
    setEditingAddrId(addr._id || null);
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

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleUpdateProfile = async () => {
    if (!token || !name.trim()) return;
    setSaving(true);
    try {
      const response = await updateProfile(token, { name: name.trim(), phone: phone.trim() || undefined });
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
    // updateTheme is the backend call
    // updateUser is the local state/localStorage call in AuthContext
    updateUser({ theme });
    try {
      await updateTheme(token, theme);
    } catch (error) {
      console.error('Error saving theme:', error);
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
          <div className={`p-3 rounded-lg text-sm ${message.type === 'success'
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-destructive/10 text-destructive'
            }`}>
            {message.text}
          </div>
        )}

        <Tabs defaultValue="profile" className="space-y-6" onValueChange={(val) => {
          if (val === 'preferences') fetchPreferences();
          if (val === 'addresses') fetchAddresses();
        }}>
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="profile"><User className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="preferences"><Utensils className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="addresses"><MapPin className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="security"><Lock className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="appearance"><Palette className="h-4 w-4" /></TabsTrigger>
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
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09XX XXX XXXX"
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

          {/* Addresses Tab */}
          <TabsContent value="addresses">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Addresses</CardTitle>
                <CardDescription>Manage your saved addresses for home delivery</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Address Form */}
                <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    {isEditingAddr ? <Pencil className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
                    {isEditingAddr ? 'Edit Address' : 'Add New Address'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="addrLabel">Label (e.g., Home, Work)</Label>
                      <Input
                        id="addrLabel"
                        value={addrForm.label}
                        onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })}
                        placeholder="Home"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addrPhone">Contact Phone *</Label>
                      <Input
                        id="addrPhone"
                        value={addrForm.contactPhone}
                        onChange={(e) => setAddrForm({ ...addrForm, contactPhone: e.target.value })}
                        placeholder="09XX XXX XXXX"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addrFull">Complete Address *</Label>
                    <Input
                      id="addrFull"
                      value={addrForm.fullAddress}
                      onChange={(e) => setAddrForm({ ...addrForm, fullAddress: e.target.value })}
                      placeholder="House #, Street, Building"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="addrBarangay">Barangay</Label>
                      <Input
                        id="addrBarangay"
                        value={addrForm.barangay}
                        onChange={(e) => setAddrForm({ ...addrForm, barangay: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addrCity">City</Label>
                      <Input
                        id="addrCity"
                        value={addrForm.city}
                        onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={addrForm.isDefault}
                          onChange={(e) => setAddrForm({ ...addrForm, isDefault: e.target.checked })}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        Set as default address
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleAddOrUpdateAddress} disabled={saving} size="sm">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                      {isEditingAddr ? 'Update' : 'Add'} Address
                    </Button>
                    {isEditingAddr && (
                      <Button variant="outline" onClick={resetAddrForm} size="sm">
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>

                {/* Address List */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Saved Addresses</h3>
                  {addrLoading ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : addresses.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded-lg">
                      No saved addresses yet.
                    </p>
                  ) : (
                    <div className="grid gap-4">
                      {addresses.map((addr) => (
                        <div key={addr._id} className="flex items-start justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors">
                          <div className="flex gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <MapPin className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{addr.label}</span>
                                {addr.isDefault && (
                                  <Badge variant="secondary" className="text-[10px] h-4">DEFAULT</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{addr.fullAddress}</p>
                              {(addr.barangay || addr.city) && (
                                <p className="text-xs text-muted-foreground">
                                  {addr.barangay}{addr.barangay && addr.city ? ', ' : ''}{addr.city}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground font-medium mt-1">📞 {addr.contactPhone}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {!addr.isDefault && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground"
                                onClick={() => handleSetDefaultAddress(addr._id!)}
                                title="Set as default"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground"
                              onClick={() => startEditAddress(addr)}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteAddress(addr._id!)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
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
              <div className="relative mt-1">
                <Input
                  id="deletePassword"
                  type={showDeletePassword ? "text" : "password"}
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowDeletePassword(!showDeletePassword)}
                >
                  {showDeletePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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
