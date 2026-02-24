import type { DayOfWeek } from '../enums';

/**
 * Time slot for schedules
 */
export interface TimeSlot {
  hour: number; // 0-23
  minutes: number; // 0-59
}

/**
 * Schedule entry for recurring activities
 */
export interface Schedule {
  days: DayOfWeek[];
  hours: {
    from: TimeSlot;
    to: TimeSlot;
  }[];
  active: boolean;
  notes?: string;
  limit?: {
    type: 'half-an-hour' | 'hour' | 'day';
    amount: number;
    active: boolean;
  };
}

/**
 * Operating hours for stores
 */
export interface OperatingHours {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  openTime: string; // HH:MM format
  closeTime: string; // HH:MM format
  isClosed: boolean;
}
