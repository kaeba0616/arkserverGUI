export interface BackupInfo {
  filename: string;
  size: number; // bytes
  createdAt: string; // ISO date
}

export interface BackupSchedule {
  enabled: boolean;
  cronExpression: string;
  retentionDays: number;
  maxCount: number;
}
