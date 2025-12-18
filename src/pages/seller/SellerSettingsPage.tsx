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
  type UserSettings
} from '@/api/settings';
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
  Clock
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000';

export function SellerSettingsPage() {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [storeOpen, setStoreOpen] = useState('06:00');
  const [storeClose, setStoreClose] = useState('18:00');
  const [notifyNewOrders, setNotifyNewOrders] = useState(true);
  const [notifyLowStock, setNotifyLowStock] = useState(true);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  
  // UI states
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
          setStoreOpen(s.storeHours?.open || '06:00');
          setStoreClose(s.storeHours?.close || '18:00');
          setNotifyNewOrders(s.notifyNewOrders ?? true);
          setNotifyLowStock(s.notifyLowStock ?? true);
          if (s.paymentQR) {
            setQrPreview(`${API_BASE_URL}${s.paymentQR}`);
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

  const handleUpdateStoreSettings = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const response = await updateSellerSettings(token, {
        storeHours: { open: storeOpen, close: storeClose }
      });
      if (response.success) {
        showMessage('success', 'Store hours updated');
      } else {
        showMessage('error', response.message || 'Failed to update');
      }
    } catch {
      showMessage('error', 'Error updating store settings');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNotifications = async (type: 'orders' | 'stock', value: boolean) => {
    if (!token) return;
    
    if (type === 'orders') setNotifyNewOrders(value);
    else setNotifyLowStock(value);

    try {
      await updateSellerSettings(token, {
        notifyNewOrders: type === 'orders' ? value : notifyNewOrders,
        notifyLowStock: type === 'stock' ? value : notifyLowStock
      });
    } catch (error) {
      console.error('Error updating notifications:', error);
    }
  };

  const handleQRSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showMessage('error', 'Please select a valid image file');
      return;
    }

    setUploadingQR(true);
    try {
      const response = await uploadPaymentQR(token, file);
      if (response.success && response.paymentQR) {
        setQrPreview(`${API_BASE_URL}${response.paymentQR}`);
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
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="profile"><User className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="security"><Lock className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="store"><Store className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="payment"><QrCode className="h-4 w-4" /></TabsTrigger>
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
                <div className="space-y-2">
                  <Label>Market Location</Label>
                  <Input value={settings?.marketLocation || 'Not set'} disabled />
                  <p className="text-xs text-muted-foreground">Contact admin to change location</p>
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

          {/* Store Tab */}
          <TabsContent value="store">
            <Card>
              <CardHeader>
                <CardTitle>Store Hours</CardTitle>
                <CardDescription>Set your operating hours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="storeOpen">Opening Time</Label>
                    <Input
                      id="storeOpen"
                      type="time"
                      value={storeOpen}
                      onChange={(e) => setStoreOpen(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeClose">Closing Time</Label>
                    <Input
                      id="storeClose"
                      type="time"
                      value={storeClose}
                      onChange={(e) => setStoreClose(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleUpdateStoreSettings} disabled={saving}>
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
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SellerLayout>
  );
}
