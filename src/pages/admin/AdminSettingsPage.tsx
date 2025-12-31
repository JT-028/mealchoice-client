import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { getSettings, updateTheme } from '@/api/settings';
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
  Palette
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

  useEffect(() => {
    const fetchSettings = async () => {
      if (!token) return;
      try {
        const response = await getSettings(token);
        if (response.success && response.settings) {
          setSelectedTheme(response.settings.theme);
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
                This will restore data from: <strong>{restoreFile?.name}</strong>. Existing data will be merged.
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
