import { API_BASE_URL } from '@/config/api';

// Export backup as JSON
export const exportBackupJSON = async (token: string): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/settings/backup/json`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to export backup');
  }
  
  return response.blob();
};

// Export backup as CSV
export const exportBackupCSV = async (token: string): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/settings/backup/csv`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to export backup');
  }
  
  return response.blob();
};

// Import backup from JSON file
export const importBackup = async (token: string, backupData: object): Promise<{
  message: string;
  restored: string[];
  errors: string[];
}> => {
  const response = await fetch(`${API_BASE_URL}/settings/restore`, {
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

