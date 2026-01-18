import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
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
  exportBackupJSON,
  exportBackupCSV,
  importBackup,
  getBackupSettings,
  updateBackupSettings,
  runSelectiveBackup,
} from '@/api/backup';
import type { BackupSettings } from '@/api/backup';
import { getSettings, updateTheme, updateProfile, changePassword } from '@/api/settings';
import {
  Loader2,
  FileJson,
  FileSpreadsheet,
  Upload,
  Database,
  Sun,
  Moon,
  Monitor,
  Palette,
  User,
  Save,
  Lock,
  Eye,
  EyeOff,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  HelpCircle,
  Play
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function AdminSettingsPage() {
  const { token, updateUser } = useAuth();
  const [message, setMessage] = useState({ type: '', text: '' });
  const [exportingJSON, setExportingJSON] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [loadingSettings, setLoadingSettings] = useState(true);

  // My Information state
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password update state - 3 fields like customer/seller
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Backup settings state
  const [backupSettings, setBackupSettings] = useState<BackupSettings | null>(null);
  const [savingBackupSettings, setSavingBackupSettings] = useState(false);
  const [runningBackup, setRunningBackup] = useState(false);

  const COLLECTIONS = [
    { id: 'users', label: 'Users', description: 'All user accounts and profiles' },
    { id: 'products', label: 'Products', description: 'All product listings' },
    { id: 'orders', label: 'Orders', description: 'Order history and transactions' },
    { id: 'budgets', label: 'Budgets', description: 'Customer budget settings' },
    { id: 'meals', label: 'Meals', description: 'Saved meal plans' },
  ];

  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    const fetchSettings = async () => {
      if (!token) return;
      try {
        const response = await getSettings(token);
        if (response.success && response.settings) {
          setSelectedTheme(response.settings.theme);
          // Parse name into first and last name
          const nameParts = (response.settings.name || '').split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          setProfileForm({
            firstName,
            lastName,
            email: response.settings.email || ''
          });
        }

        // Fetch backup settings
        const backupResponse = await getBackupSettings(token);
        if (backupResponse.success) {
          setBackupSettings(backupResponse.settings);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoadingSettings(false);
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
    setSelectedTheme(theme);
    updateUser({ theme });
    try {
      await updateTheme(token, theme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSavingProfile(true);
    try {
      const fullName = `${profileForm.firstName} ${profileForm.lastName}`.trim();
      const response = await updateProfile(token, { name: fullName });
      if (response.success) {
        updateUser({ name: fullName });
        showMessage('success', 'Profile information updated successfully');
      } else {
        showMessage('error', response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showMessage('error', 'Error updating profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!token) return;

    if (!currentPassword.trim()) {
      showMessage('error', 'Please enter your current password');
      return;
    }

    if (!newPassword.trim()) {
      showMessage('error', 'Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      showMessage('error', 'Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      const response = await changePassword(token, { currentPassword, newPassword });
      if (response.success) {
        showMessage('success', 'Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showMessage('error', response.message || 'Failed to update password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      showMessage('error', 'Error updating password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleExportJSON = async () => {
    if (!token) return;
    setExportingJSON(true);
    try {
      const blob = await exportBackupJSON(token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mealwise-admin-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showMessage('success', 'Backup exported as JSON');
    } catch {
      showMessage('error', 'Error exporting backup');
    } finally {
      setExportingJSON(false);
    }
  };

  const handleExportCSV = async () => {
    if (!token) return;
    setExportingCSV(true);
    try {
      const blob = await exportBackupCSV(token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mealwise-admin-backup-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showMessage('success', 'Backup exported as CSV');
    } catch {
      showMessage('error', 'Error exporting backup');
    } finally {
      setExportingCSV(false);
    }
  };

  const handleRestoreFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/json') {
      setRestoreFile(file);
      setRestoreDialogOpen(true);
    } else {
      showMessage('error', 'Please select a valid JSON backup file');
    }
    e.target.value = '';
  };

  const handleRestore = async () => {
    if (!token || !restoreFile) return;
    setRestoring(true);
    try {
      const text = await restoreFile.text();
      const backupData = JSON.parse(text);
      const result = await importBackup(token, backupData);
      showMessage('success', `Restored: ${result.restored.join(', ')}`);
      setRestoreDialogOpen(false);
      setRestoreFile(null);
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Error restoring backup');
    } finally {
      setRestoring(false);
    }
  };

  if (loadingSettings) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account and system preferences</p>
        </div>

        {message.text && (
          <div className={`p-3 rounded-lg text-sm ${message.type === 'success'
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-destructive/10 text-destructive'
            }`}>
            {message.text}
          </div>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Backup</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  My Information
                </CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                        placeholder="First Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                        placeholder="Last Name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed directly</p>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={savingProfile}>
                      {savingProfile ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleUpdatePassword}
                    disabled={savingPassword || !currentPassword.trim() || !newPassword.trim()}
                  >
                    {savingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Update Password
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Appearance
                </CardTitle>
                <CardDescription>Customize how the admin panel looks</CardDescription>
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

          {/* Backup Tab */}
          <TabsContent value="backup" className="space-y-6">
            {/* Help Dialog */}
            <div className="flex justify-end">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    How to use Backup
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <HelpCircle className="h-5 w-5" />
                      Backup System Guide
                    </DialogTitle>
                    <DialogDescription asChild>
                      <div className="space-y-4 text-sm">
                        <div>
                          <h4 className="font-medium text-foreground mb-1">📦 Manual Backup</h4>
                          <p>Click "Export JSON" or "Export CSV" to download a backup file immediately. JSON files can be restored later, CSV is for viewing in spreadsheets.</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground mb-1">⏰ Scheduled Backup</h4>
                          <p>Enable automatic backups to run at a specific time. Choose daily, weekly, or monthly frequency. Backups are saved on the server.</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground mb-1">📋 Collection Selection</h4>
                          <p>Choose which data to include in backups. Uncheck collections you don't need to reduce backup size.</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground mb-1">🔄 Restore</h4>
                          <p>Upload a JSON backup file to restore data. This replaces existing data with the backup contents.</p>
                        </div>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>

            {/* Backup Status Card */}
            {backupSettings?.lastBackupAt && (
              <Card>
                <CardContent>
                  <div className="flex items-center gap-4">
                    {backupSettings.lastBackupStatus === 'success' ? (
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    ) : backupSettings.lastBackupStatus === 'failed' ? (
                      <XCircle className="h-8 w-8 text-red-500" />
                    ) : (
                      <Clock className="h-8 w-8 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">Last Backup</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(backupSettings.lastBackupAt).toLocaleString()}
                        {backupSettings.lastBackupMessage && ` - ${backupSettings.lastBackupMessage}`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Scheduled Backup Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Scheduled Backup
                </CardTitle>
                <CardDescription>Configure automatic backups to run at a specific time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enable Automatic Backup</p>
                    <p className="text-sm text-muted-foreground">Backups will run automatically based on your schedule</p>
                  </div>
                  <Switch
                    checked={backupSettings?.autoBackupEnabled || false}
                    onCheckedChange={async (checked) => {
                      if (!token) return;
                      setSavingBackupSettings(true);
                      try {
                        const response = await updateBackupSettings(token, { autoBackupEnabled: checked });
                        if (response.success) {
                          setBackupSettings(prev => prev ? { ...prev, autoBackupEnabled: checked } : null);
                          showMessage('success', checked ? 'Scheduled backup enabled' : 'Scheduled backup disabled');
                        }
                      } catch {
                        showMessage('error', 'Failed to update settings');
                      } finally {
                        setSavingBackupSettings(false);
                      }
                    }}
                    disabled={savingBackupSettings}
                  />
                </div>

                {backupSettings?.autoBackupEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select
                        value={backupSettings.schedule.frequency}
                        onValueChange={async (value: 'daily' | 'weekly' | 'monthly') => {
                          if (!token) return;
                          setSavingBackupSettings(true);
                          try {
                            const response = await updateBackupSettings(token, { schedule: { frequency: value } });
                            if (response.success) {
                              setBackupSettings(prev => prev ? { ...prev, schedule: { ...prev.schedule, frequency: value } } : null);
                            }
                          } catch {
                            showMessage('error', 'Failed to update schedule');
                          } finally {
                            setSavingBackupSettings(false);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Input
                        type="time"
                        value={backupSettings.schedule.time}
                        onChange={async (e) => {
                          if (!token) return;
                          const newTime = e.target.value;
                          setSavingBackupSettings(true);
                          try {
                            const response = await updateBackupSettings(token, { schedule: { time: newTime } });
                            if (response.success) {
                              setBackupSettings(prev => prev ? { ...prev, schedule: { ...prev.schedule, time: newTime } } : null);
                            }
                          } catch {
                            showMessage('error', 'Failed to update time');
                          } finally {
                            setSavingBackupSettings(false);
                          }
                        }}
                      />
                    </div>

                    {backupSettings.schedule.frequency === 'weekly' && (
                      <div className="space-y-2">
                        <Label>Day of Week</Label>
                        <Select
                          value={String(backupSettings.schedule.dayOfWeek || 0)}
                          onValueChange={async (value) => {
                            if (!token) return;
                            setSavingBackupSettings(true);
                            try {
                              const response = await updateBackupSettings(token, { schedule: { dayOfWeek: parseInt(value) } });
                              if (response.success) {
                                setBackupSettings(prev => prev ? { ...prev, schedule: { ...prev.schedule, dayOfWeek: parseInt(value) } } : null);
                              }
                            } catch {
                              showMessage('error', 'Failed to update day');
                            } finally {
                              setSavingBackupSettings(false);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DAY_NAMES.map((day, i) => (
                              <SelectItem key={i} value={String(i)}>{day}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {backupSettings.schedule.frequency === 'monthly' && (
                      <div className="space-y-2">
                        <Label>Day of Month</Label>
                        <Select
                          value={String(backupSettings.schedule.dayOfMonth || 1)}
                          onValueChange={async (value) => {
                            if (!token) return;
                            setSavingBackupSettings(true);
                            try {
                              const response = await updateBackupSettings(token, { schedule: { dayOfMonth: parseInt(value) } });
                              if (response.success) {
                                setBackupSettings(prev => prev ? { ...prev, schedule: { ...prev.schedule, dayOfMonth: parseInt(value) } } : null);
                              }
                            } catch {
                              showMessage('error', 'Failed to update day');
                            } finally {
                              setSavingBackupSettings(false);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                              <SelectItem key={day} value={String(day)}>{day}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Collection Selection Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Collections to Backup
                </CardTitle>
                <CardDescription>Select which data to include in backups</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {COLLECTIONS.map((collection) => (
                    <div key={collection.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <Checkbox
                        id={`collection-${collection.id}`}
                        checked={backupSettings?.selectedCollections.includes(collection.id) || false}
                        onCheckedChange={async (checked) => {
                          if (!token || !backupSettings) return;
                          const newCollections = checked
                            ? [...backupSettings.selectedCollections, collection.id]
                            : backupSettings.selectedCollections.filter(c => c !== collection.id);

                          if (newCollections.length === 0) {
                            showMessage('error', 'At least one collection must be selected');
                            return;
                          }

                          setSavingBackupSettings(true);
                          try {
                            const response = await updateBackupSettings(token, { selectedCollections: newCollections });
                            if (response.success) {
                              setBackupSettings(prev => prev ? { ...prev, selectedCollections: newCollections } : null);
                            }
                          } catch {
                            showMessage('error', 'Failed to update collections');
                          } finally {
                            setSavingBackupSettings(false);
                          }
                        }}
                      />
                      <div>
                        <label htmlFor={`collection-${collection.id}`} className="font-medium text-sm cursor-pointer">
                          {collection.label}
                        </label>
                        <p className="text-xs text-muted-foreground">{collection.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Manual Backup Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileJson className="h-5 w-5" />
                  Manual Backup
                </CardTitle>
                <CardDescription>Export or restore database backups manually</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-3">Export Backup</h4>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={async () => {
                        if (!token) return;
                        setRunningBackup(true);
                        try {
                          const blob = await runSelectiveBackup(token, backupSettings?.selectedCollections);
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `mealwise-backup-${new Date().toISOString().split('T')[0]}.json`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                          showMessage('success', 'Backup exported successfully');
                          // Refresh backup settings to get new lastBackupAt
                          const backupResponse = await getBackupSettings(token);
                          if (backupResponse.success) {
                            setBackupSettings(backupResponse.settings);
                          }
                        } catch {
                          showMessage('error', 'Error exporting backup');
                        } finally {
                          setRunningBackup(false);
                        }
                      }}
                      disabled={runningBackup}
                      size="lg"
                    >
                      {runningBackup ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                      Backup Now ({backupSettings?.selectedCollections.length || 0} collections)
                    </Button>
                    <Button onClick={handleExportJSON} disabled={exportingJSON} variant="outline" size="lg">
                      {exportingJSON ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileJson className="h-4 w-4 mr-2" />}
                      Export All (JSON)
                    </Button>
                    <Button onClick={handleExportCSV} disabled={exportingCSV} variant="outline" size="lg">
                      {exportingCSV ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
                      Export All (CSV)
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="text-sm font-medium mb-3">Restore from Backup</h4>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleRestoreFileSelect}
                      className="hidden"
                      id="admin-restore-file"
                    />
                    <Button variant="outline" size="lg" asChild>
                      <label htmlFor="admin-restore-file" className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Import JSON Backup
                      </label>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Restore admin settings and data from a previously exported JSON file
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Restore Backup Dialog */}
        <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Restore from Backup</AlertDialogTitle>
              <AlertDialogDescription>
                This will restore data from: <strong>{restoreFile?.name}</strong>. This operation will synchronize the database with the backup file, restoring any deleted data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={restoring} onClick={() => setRestoreFile(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRestore} disabled={restoring}>
                {restoring ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                Restore
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
