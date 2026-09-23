export interface SystemSettings {
  sessionTimeoutMinutes: number;
  requirePopiaOnSubmit: boolean;
  emailNotificationsEnabled: boolean;
  documentAccessLogging: boolean;
  temporaryAccessDefaultDays: number;
  auditRetentionDays: number;
  allowContractorSelfService: boolean;
  maintenanceMode: boolean;
}
