import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  importBackup
} from '@/api/backup';
import { getSettings, updateTheme, updateProfile, changePassword } from '@/api/settings';
import {
  Loader2,
  FileJson,
  FileSpreadsheet,
  Upload,
  Database,
  Settings,
  Sun,
  Moon,
  Monitor,
  Palette,
  User,
  Save,
  Lock,
  KeyRound
} from 'lucide-react';

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

  // Password update state
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

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
    
    // Leave blank to keep existing - only update if password is provided
    if (!newPassword.trim()) {
      showMessage('error', 'Please enter a new password');
      return;
    }
    
    if (newPassword.length < 6) {
      showMessage('error', 'Password must be at least 6 characters');
      return;
    }
    
    setSavingPassword(true);
    try {
      // For admin password update, we use a special endpoint that doesn't require current password
      // This is handled by passing empty currentPassword - the server should allow this for admins
      const response = await changePassword(token, { currentPassword: '', newPassword });
      if (response.success) {
        showMessage('success', 'Password updated successfully');
        setNewPassword('');
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
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Admin Settings
          </h1>
          <p className="text-muted-foreground">System preferences and backup management</p>
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

        {/* My Information Card */}
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
                      SAVE INFORMATION
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Password Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Password
            </CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep existing password"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to keep your current password. Minimum 6 characters.
              </p>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleUpdatePassword} disabled={savingPassword || !newPassword.trim()}>
                {savingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4 mr-2" />
                    Update Password
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appearance Card */}
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

        {/* Backup Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Full Database Backup
            </CardTitle>
            <CardDescription>Export or restore the entire database (all users, products, orders, budgets, meals)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-medium mb-3">Export Full Backup</h4>
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleExportJSON} disabled={exportingJSON} variant="outline" size="lg">
                  {exportingJSON ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileJson className="h-4 w-4 mr-2" />}
                  Export JSON
                </Button>
                <Button onClick={handleExportCSV} disabled={exportingCSV} variant="outline" size="lg">
                  {exportingCSV ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
                  Export CSV
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                JSON includes all data (restorable). CSV is for viewing in spreadsheets.
              </p>
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
