import { useEffect, useState, useRef } from 'react';
import { SellerLayout } from '@/components/layout/SellerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import {
  getSettings,
  updateProfile,
  changePassword,
  updateSellerSettings,
  uploadPaymentQR,
  deletePaymentQR,
  updateTheme,
  type UserSettings,
  type OperatingHours,
  type DayHours
} from '@/api/settings';
import { getImageUrl } from '@/config/api';
import {
  User,
  Lock,
  Store,
  Bell,
  QrCode,
  Loader2,
  Check,
  Upload,
  Trash2,
  Clock,
  MapPin,
  Palette,
  Sun,
  Moon,
  Monitor,
  Truck
} from 'lucide-react';

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const;

const DEFAULT_HOURS: DayHours = { open: '06:00', close: '18:00', isClosed: false };

export function SellerSettingsPage() {
  const { token, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [operatingHours, setOperatingHours] = useState<OperatingHours>({
    monday: { ...DEFAULT_HOURS },
    tuesday: { ...DEFAULT_HOURS },
    wednesday: { ...DEFAULT_HOURS },
    thursday: { ...DEFAULT_HOURS },
    friday: { ...DEFAULT_HOURS },
    saturday: { ...DEFAULT_HOURS },
    sunday: { ...DEFAULT_HOURS, isClosed: true },
  });
  const [notifyNewOrders, setNotifyNewOrders] = useState(true);
  const [notifyLowStock, setNotifyLowStock] = useState(true);
  const [acceptsQR, setAcceptsQR] = useState(false);
  const [hasOwnDelivery, setHasOwnDelivery] = useState(false);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploadingQR, setUploadingQR] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!token) return;
      try {
        const response = await getSettings(token);
        if (response.success && response.settings) {
          const s = response.settings;
          setSettings(s);
          setName(s.name);
          setPhone(s.phone || '');
          setSelectedTheme(s.theme || 'system');
          updateUser({ theme: s.theme });
          if (s.operatingHours) {
            setOperatingHours(s.operatingHours);
          }
          setNotifyNewOrders(s.notifyNewOrders ?? true);
          setNotifyLowStock(s.notifyLowStock ?? true);
          setAcceptsQR(s.acceptsQR ?? false);
          setHasOwnDelivery(s.hasOwnDelivery ?? false);
          if (s.paymentQR) {
            setQrPreview(getImageUrl(s.paymentQR));
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [token]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    if (!token) return;
    const previousTheme = selectedTheme;
    setSelectedTheme(theme);
    updateUser({ theme });
    try {
      await updateTheme(token, theme);
    } catch (error) {
      console.error('Error saving theme:', error);
      // Revert on failure
      setSelectedTheme(previousTheme);
      updateUser({ theme: previousTheme });
      showMessage('error', 'Failed to save theme preference');
    }
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

  const handleDayHoursChange = (day: keyof OperatingHours, field: keyof DayHours, value: string | boolean) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleUpdateOperatingHours = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const response = await updateSellerSettings(token, { operatingHours });
      if (response.success) {
        showMessage('success', 'Operating hours updated');
      } else {
        showMessage('error', response.message || 'Failed to update');
      }
    } catch {
      showMessage('error', 'Error updating operating hours');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNotifications = async (type: 'orders' | 'stock' | 'qr' | 'delivery', value: boolean) => {
    if (!token) return;
    
    if (type === 'orders') setNotifyNewOrders(value);
    else if (type === 'stock') setNotifyLowStock(value);
    else if (type === 'qr') setAcceptsQR(value);
    else if (type === 'delivery') setHasOwnDelivery(value);

    try {
      await updateSellerSettings(token, {
        notifyNewOrders: type === 'orders' ? value : notifyNewOrders,
        notifyLowStock: type === 'stock' ? value : notifyLowStock,
        acceptsQR: type === 'qr' ? value : acceptsQR,
        hasOwnDelivery: type === 'delivery' ? value : hasOwnDelivery
      });
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const handleQRSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showMessage('error', 'Please select a valid image file');
      return;
    }

    setUploadingQR(true);
    try {
      const response = await uploadPaymentQR(token, file);
      if (response.success && response.paymentQR) {
        setQrPreview(getImageUrl(response.paymentQR));
        showMessage('success', 'Payment QR uploaded');
      } else {
        showMessage('error', response.message || 'Failed to upload QR');
      }
    } catch {
      showMessage('error', 'Error uploading QR');
    } finally {
      setUploadingQR(false);
    }
  };

  const handleDeleteQR = async () => {
    if (!token) return;
    setUploadingQR(true);
    try {
      const response = await deletePaymentQR(token);
      if (response.success) {
        setQrPreview(null);
        showMessage('success', 'Payment QR deleted');
      } else {
        showMessage('error', response.message || 'Failed to delete QR');
      }
    } catch {
      showMessage('error', 'Error deleting QR');
    } finally {
      setUploadingQR(false);
    }
  };

  if (loading) {
    return (
      <SellerLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your store and account</p>
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

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="profile"><User className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="security"><Lock className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="store"><Store className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="payment"><QrCode className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="appearance"><Palette className="h-4 w-4" /></TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Update your business information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Business Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your business name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Contact Number</Label>
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
                </div>
                <Button onClick={handleUpdateProfile} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Keep your account secure</CardDescription>
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

          {/* Store Tab - Operating Hours & Location */}
          <TabsContent value="store" className="space-y-6">
            {/* Location Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Store Location
                </CardTitle>
                <CardDescription>Your assigned market location</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Market Location</Label>
                    <Input value={settings?.marketLocation || 'Not assigned'} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Stall Name</Label>
                    <Input value={settings?.stallName || 'Not set'} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Stall Number</Label>
                    <Input value={settings?.stallNumber || 'Not set'} disabled />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Contact admin to update location information</p>
              </CardContent>
            </Card>

            {/* Operating Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Delivery Settings
                </CardTitle>
                <CardDescription>Manage your delivery options</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Own Delivery Service</Label>
                    <p className="text-sm text-muted-foreground">Enable if you offer your own delivery service (COD available)</p>
                  </div>
                  <Switch
                    checked={hasOwnDelivery}
                    onCheckedChange={(checked) => handleUpdateNotifications('delivery', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Operating Hours
                </CardTitle>
                <CardDescription>Set your store hours for each day of the week</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {DAYS_OF_WEEK.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-4 py-2 border-b last:border-0">
                    <div className="w-28 font-medium">{label}</div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={!operatingHours[key].isClosed}
                        onCheckedChange={(checked) => handleDayHoursChange(key, 'isClosed', !checked)}
                      />
                      <span className="text-sm text-muted-foreground w-12">
                        {operatingHours[key].isClosed ? 'Closed' : 'Open'}
                      </span>
                    </div>
                    {!operatingHours[key].isClosed && (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          value={operatingHours[key].open}
                          onChange={(e) => handleDayHoursChange(key, 'open', e.target.value)}
                          className="w-32"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={operatingHours[key].close}
                          onChange={(e) => handleDayHoursChange(key, 'close', e.target.value)}
                          className="w-32"
                        />
                      </div>
                    )}
                  </div>
                ))}
                <Button onClick={handleUpdateOperatingHours} disabled={saving} className="mt-4">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Clock className="h-4 w-4 mr-2" />}
                  Save Hours
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage your alert preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>New Order Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified when you receive new orders</p>
                  </div>
                  <Switch
                    checked={notifyNewOrders}
                    onCheckedChange={(checked) => handleUpdateNotifications('orders', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Low Stock Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified when products are running low</p>
                  </div>
                  <Switch
                    checked={notifyLowStock}
                    onCheckedChange={(checked) => handleUpdateNotifications('stock', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle>Payment QR Code</CardTitle>
                <CardDescription>Upload your payment QR for customers to pay</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between border-b pb-6">
                  <div>
                    <Label>Enable QR Payment</Label>
                    <p className="text-sm text-muted-foreground">Allow customers to pay via QR code</p>
                  </div>
                  <Switch
                    checked={acceptsQR}
                    onCheckedChange={(checked) => handleUpdateNotifications('qr', checked)}
                  />
                </div>

                {acceptsQR && (
                  <div className="space-y-4 pt-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleQRSelect}
                      className="hidden"
                    />
                    
                    {qrPreview ? (
                      <div className="space-y-4">
                        <div className="w-48 h-48 mx-auto border rounded-lg overflow-hidden bg-white">
                          <img
                            src={qrPreview}
                            alt="Payment QR"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingQR}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Change
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleDeleteQR}
                            disabled={uploadingQR}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-48 h-48 mx-auto border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                      >
                        {uploadingQR ? (
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        ) : (
                          <>
                            <QrCode className="h-12 w-12 text-muted-foreground mb-2" />
                            <span className="text-sm text-muted-foreground">Click to upload</span>
                          </>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground text-center">
                      Customers will see this QR code for payment
                    </p>
                  </div>
                )}
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
        </Tabs>
      </div>
    </SellerLayout>
  );
}
