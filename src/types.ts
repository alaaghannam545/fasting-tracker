// Shared data model. Dates are local "YYYY-MM-DD" keys; instants are ISO strings (UTC).

export type DayType = 'normal' | 'longOps' | 'postCall';
export type Activity = 'walk' | 'resistance' | 'rest';
export type Adherence = 'full' | 'partial' | 'flexible';
export type MealTag = 'breakFast' | 'main' | 'snack' | 'emergency';
export type ResolvedBy = 'waterSalt' | 'brokeFast';

export interface Settings {
  id: 'me';
  startDate: string; // YYYY-MM-DD
  currentWeight: number; // kg
  targetWeight: number; // kg
  height?: number; // cm
  notifications: boolean;
  /** Instant the currently running fast started (ISO). Undefined when not fasting. */
  activeFastStart?: string;
}

export interface DayLog {
  date: string; // YYYY-MM-DD — the day the fast was broken (or simply the logged day)
  dayType: DayType;
  fastStart?: string; // ISO
  fastEnd?: string; // ISO
  hours?: number; // computed from fastStart/fastEnd
  water: number; // 0-8 cups
  hunger?: number; // 1-5
  energy?: number; // 1-5
  sleepHours?: number;
  activity?: Activity;
  adherence?: Adherence;
  mealIds: string[];
  mealsFree: string[];
  notes: string;
}

export interface EmergencyEvent {
  id?: number;
  datetime: string; // ISO
  resolvedBy: ResolvedBy;
}

export interface Meal {
  id: string;
  name: string;
  description: string;
  tags: MealTag[];
  isSeed: boolean;
}

export type ShoppingCategory =
  | 'protein'
  | 'cannedLegumes'
  | 'vegetables'
  | 'fruit'
  | 'carbs'
  | 'fats'
  | 'pantry'
  | 'drinks';

export interface ShoppingItem {
  id: string;
  category: ShoppingCategory;
  name: string;
  checked: boolean;
}

export interface WeeklyReview {
  weekIndex: number; // 0-based from startDate
  weightStart?: number;
  weightEnd?: number;
  waistStart?: number;
  waistEnd?: number;
  answers: [string, string, string];
}
