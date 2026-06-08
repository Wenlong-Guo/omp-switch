export interface SyncConfig {
  enabled: boolean;
  serverUrl: string;
  username: string;
  password: string;
  remotePath: string;
  lastSyncAt?: string;
  lastSyncStatus?: "success" | "conflict" | "error";
  lastError?: string;
}

export interface SyncResult {
  success: boolean;
  message: string;
}
