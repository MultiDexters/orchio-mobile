/**
 * Domain & database types for Orchio.
 * Mirrors the SHARED Supabase schema used by the Orchio web app
 * (supabase/migrations/001_initial_schema.sql in MultiDexters/orchio).
 * The mobile app reuses that backend, so these match the live tables/enums.
 */

// DB-enforced enums (must match the Postgres enum values exactly).
export type EnergyCost = 'deep_focus' | 'moderate' | 'light' | 'admin';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskSource = 'manual' | 'brain_dump' | 'goal' | 'habit' | 'calendar';

export type ChatRole = 'user' | 'assistant';
export type EnergyLevel = 1 | 2 | 3 | 4 | 5;

/** Coarse buckets the AI emits; mapped to EnergyCost before persisting. */
export type AiEnergyCost = 'low' | 'moderate' | 'high';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  timezone: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Preferences {
  id: string;
  user_id: string;
  wake_time: string; // "07:00"
  sleep_time: string; // "23:00"
  peak_hours: number[];
  nudge_hydration: boolean;
  nudge_movement: boolean;
  nudge_breaks: boolean;
  nudge_meals: boolean;
  nudge_wind_down: boolean;
  notification_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  energy_cost: EnergyCost;
  importance: number; // 1..5
  deadline: string | null;
  status: TaskStatus;
  dependency_id: string | null;
  source: TaskSource;
  estimated_minutes: number | null;
  priority_score: number | null;
  priority_reason: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EnergyLog {
  id: string;
  user_id: string;
  energy_level: EnergyLevel;
  mood: string | null;
  note: string | null;
  logged_at: string;
  created_at: string;
}

export interface PlanBlock {
  start: string; // "09:00"
  end: string; // "10:30"
  title: string;
  task_id?: string | null;
  energy_cost?: EnergyCost;
  kind?: 'focus' | 'break' | 'admin' | 'buffer';
}

export interface Plan {
  id: string;
  user_id: string;
  plan_date: string; // YYYY-MM-DD
  blocks: PlanBlock[];
  morning_brief: string;
  evening_reflection: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageMeta {
  parsed_items?: ParsedItems;
  [key: string]: unknown;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: ChatRole;
  content: string;
  metadata: ChatMessageMeta | null;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  content: string;
  tags: string[];
  source_message_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  progress: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Shape returned by the `chat` edge function's extraction block. */
export interface ParsedItems {
  tasks: {
    title: string;
    energy_cost: AiEnergyCost;
    importance: number;
    deadline: string | null;
    estimated_minutes: number;
  }[];
  notes: { content: string; tags: string[] }[];
  goals: { title: string; description: string }[];
  feelings: { mood: string; note: string }[];
}

/** Response envelope from the `chat` edge function. */
export interface ChatResponse {
  reply: string; // clean text, JSON block already stripped server-side
  parsed_items?: ParsedItems;
  saved?: {
    tasks: number;
    notes: number;
    goals: number;
    feelings: number;
  };
  user_message?: ChatMessage;
  assistant_message?: ChatMessage;
}
