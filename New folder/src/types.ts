export enum Role {
  USER = 'user',
  DELIVERY = 'delivery',
  ADMIN = 'admin'
}

export interface Address {
  id: string;
  label: string; // e.g., "Home", "Office", "Other"
  addressLine: string;
  phone: string;
}

export type MealType = 'lunch' | 'dinner' | 'both';

export interface UserSubscription {
  active: boolean;
  mealType: MealType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD (1 month later)
  totalCreditsAdded: number;
}

export type OrderStatus = 'ordered' | 'scheduled' | 'delivered' | 'not_delivered' | 'paused' | 'cancelled';

export interface DailyMealStatus {
  date: string; // YYYY-MM-DD
  lunchStatus: OrderStatus;
  dinnerStatus: OrderStatus;
  lunchDeliveredAt?: string;
  dinnerDeliveredAt?: string;
  lunchQty?: number;  // optional custom daily quantity
  dinnerQty?: number; // optional custom daily quantity
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: Role;
  organizationId?: string | null; // Selected organization or null
  credits: number;
  addresses: Address[];
  lunchAddressId?: string; // Links to address id
  dinnerAddressId?: string; // Links to address id
  subscription?: UserSubscription;
  dailyMeals: Record<string, DailyMealStatus>; // keyed by YYYY-MM-DD
}

export interface Organization {
  id: string;
  name: string;
  address: string;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  date: string; // datetime string
  type: 'credit' | 'debit';
  amount: number;
  description: string;
}

export interface Notification {
  id: string;
  userId?: string | null; // "null" for global alerts, or specific userId
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface UnserviceableDay {
  date: string; // YYYY-MM-DD
  reason: string;
}
