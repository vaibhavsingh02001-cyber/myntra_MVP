// ── User Types ───────────────────────────────────────────────────────────────

export type SalaryProfile = 'EARLY' | 'LATE' | 'IRREGULAR';

export type BodyShape =
  | 'pear'
  | 'apple'
  | 'hourglass'
  | 'rectangle'
  | 'inverted_triangle';

export type FitPreference = 'slim' | 'regular' | 'relaxed';

export type ComfortPriority = 'stretch' | 'structure' | 'drape' | 'any';

export interface UserBodyProfile {
  heightRange: string;
  bodyShape: BodyShape;
  fitPreference: FitPreference;
  comfortPriority: ComfortPriority;
  updatedAt: Date;
}

export interface NotificationPreferences {
  priceDrop: boolean;
  salaryNudge: boolean;
  expiry: boolean;
  stockAlert: boolean;
}

export interface User {
  userId: string;
  email: string;
  deviceToken?: string;
  bodyProfile?: UserBodyProfile;
  salaryProfile: SalaryProfile;
  avgOrderDay?: number;
  ordersPerMonth: number;
  notifPrefs: NotificationPreferences;
  createdAt: Date;
  updatedAt: Date;
}

// ── Request / Response DTOs ──────────────────────────────────────────────────

export interface CreateBodyProfileDTO {
  userId: string;
  heightRange: string;
  bodyShape: BodyShape;
  fitPreference: FitPreference;
  comfortPriority: ComfortPriority;
}

export interface UpdateNotifPrefsDTO {
  priceDrop?: boolean;
  salaryNudge?: boolean;
  expiry?: boolean;
  stockAlert?: boolean;
}
