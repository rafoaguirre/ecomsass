/**
 * Log level
 */
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/**
 * Log entity - audit trail
 */
export interface Log {
  id: string;
  level: LogLevel;
  action: string;
  entityType: string;
  entityId: string;
  userId?: string;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}
