import { API_BASE_URL } from '@/config/api';

// Export full database backup as JSON (Admin only)
export const exportBackupJSON = async (token: string): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/admin/backup/json`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to export backup');
  }

  return response.blob();
};

// Export full database backup as CSV (Admin only)
export const exportBackupCSV = async (token: string): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/admin/backup/csv`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to export backup');
  }

  return response.blob();
};

// Import and restore database from JSON backup (Admin only)
export const importBackup = async (token: string, backupData: object): Promise<{
  message: string;
  restored: string[];
  errors: string[];
  skipped?: string[];
}> => {
  const response = await fetch(`${API_BASE_URL}/admin/restore`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(backupData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to restore backup');
  }

  return response.json();
};

// Backup Settings Types
export interface BackupSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM
  dayOfWeek?: number; // 0-6 (Sunday-Saturday)
  dayOfMonth?: number; // 1-28
}

export interface BackupSettings {
  autoBackupEnabled: boolean;
  schedule: BackupSchedule;
  selectedCollections: string[];
  lastBackupAt: string | null;
  lastBackupStatus: 'success' | 'failed' | null;
  lastBackupMessage: string | null;
  retentionDays: number;
}

// Get backup settings
export const getBackupSettings = async (token: string): Promise<{ success: boolean; settings: BackupSettings }> => {
  const response = await fetch(`${API_BASE_URL}/admin/backup/settings`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get backup settings');
  }

  return response.json();
};

// Update backup settings
export const updateBackupSettings = async (
  token: string,
  settings: Partial<{
    autoBackupEnabled: boolean;
    schedule: Partial<BackupSchedule>;
    selectedCollections: string[];
    retentionDays: number;
  }>
): Promise<{ success: boolean; message: string; settings: BackupSettings }> => {
  const response = await fetch(`${API_BASE_URL}/admin/backup/settings`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    throw new Error('Failed to update backup settings');
  }

  return response.json();
};

// Run selective backup
export const runSelectiveBackup = async (token: string, collections?: string[]): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/admin/backup/run`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ collections }),
  });

  if (!response.ok) {
    throw new Error('Failed to run backup');
  }

  return response.blob();
};

