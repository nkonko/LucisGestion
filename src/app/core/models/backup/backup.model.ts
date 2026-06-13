export type BackupJsonValue = unknown;
export type BackupJsonObject = Record<string, BackupJsonValue>;

export interface BackupDocument {
  id: string;
  data: BackupJsonObject;
}

export interface AppBackupFile {
  schema: 'lucis-gestion-backup';
  version: 1;
  generatedAt: string;
  collections: Record<string, BackupDocument[]>;
}

export type BackupProgressCallback = (progress: number) => void;
