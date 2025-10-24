import { createClient } from '@supabase/supabase-js';

// These values should be replaced with actual Supabase project details
// and stored in environment variables in a production environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database tables
export type User = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  department?: string;
  manager_id?: string;
  created_at: string;
  last_login?: string;
};

export type Category = {
  id: string;
  name: string;
  details: string;
  image_url?: string;
  is_ai_generated_image: boolean;
  created_by: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type Topic = {
  id: string;
  category_id: string;
  name: string;
  details: string;
  user_role: string;
  created_by: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type Scenario = {
  id: string;
  topic_id: string;
  title: string;
  details: string;
  persona_id: string;
  persona_tone?: string;
  persona_additional_details?: string;
  created_by: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type Persona = {
  id: string;
  name: string;
  age: number;
  pronoun: string;
  occupation: string;
  voice?: string;
  interests: string[];
  goals: string[];
  image_url?: string;
  is_ai_generated_image: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Rubric = {
  id: string;
  scenario_id: string;
  metric_name: string;
  description: string;
  min_score: number;
  max_score: number;
  weight: number;
  created_at: string;
  updated_at: string;
};

export type TrainingSession = {
  id: string;
  user_id: string;
  scenario_id: string;
  assignment_id?: string;
  start_time: string;
  end_time?: string;
  overall_score?: number;
  feedback?: string;
  reviewed_by?: string;
  review_notes?: string;
};

export type ContentAssignment = {
  id: string;
  content_type: 'category' | 'topic' | 'scenario';
  content_id: string;
  assigned_to_type: 'user' | 'team';
  assigned_to_id: string;
  assigned_by: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  assigned_at: string;
  completed_at?: string;
};
