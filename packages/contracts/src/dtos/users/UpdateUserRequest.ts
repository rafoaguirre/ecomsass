export interface UpdateUserRequest {
  fullName?: string;
  defaultLocale?: string;
  preferences?: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    marketingEmails?: boolean;
  };
  metadata?: Record<string, unknown>;
}
