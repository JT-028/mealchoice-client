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

