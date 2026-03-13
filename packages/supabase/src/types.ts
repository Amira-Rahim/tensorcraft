/**
 * Tensorcraft Database Types
 *
 * These types mirror the Supabase schema defined in migrations 001–006.
 * In production, these should be auto-generated via `supabase gen types typescript`.
 * For now, they're manually maintained to match the migrations.
 */

export type UserRole = "user" | "admin";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          github_username: string | null;
          github_connected: boolean;
          onboarding_completed: boolean;
          preferred_theme_id: string | null;
          last_active_at: string | null;
          total_lessons_completed: number;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          github_username?: string | null;
          github_connected?: boolean;
          onboarding_completed?: boolean;
          preferred_theme_id?: string | null;
          last_active_at?: string | null;
          total_lessons_completed?: number;
          role?: UserRole;
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          github_username?: string | null;
          github_connected?: boolean;
          onboarding_completed?: boolean;
          preferred_theme_id?: string | null;
          last_active_at?: string | null;
          total_lessons_completed?: number;
          role?: UserRole;
          updated_at?: string;
        };
        Relationships: [];
      };
      theme_progress: {
        Row: {
          id: string;
          user_id: string;
          theme_id: string;
          module_id: string;
          lesson_id: string;
          status: "not_started" | "in_progress" | "completed";
          score: number | null;
          hints_used: number;
          attempts: number;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          theme_id: string;
          module_id: string;
          lesson_id: string;
          status?: "not_started" | "in_progress" | "completed";
          score?: number | null;
          hints_used?: number;
          attempts?: number;
          started_at?: string | null;
        };
        Update: {
          status?: "not_started" | "in_progress" | "completed";
          score?: number | null;
          hints_used?: number;
          attempts?: number;
          started_at?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "theme_progress_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      purchases: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          theme_ids: string[];
          amount: number;
          currency: string;
          stripe_session_id: string | null;
          status: "pending" | "completed" | "failed" | "refunded";
          created_at: string;
        };
        Insert: {
          user_id: string;
          plan_id: string;
          theme_ids: string[];
          amount: number;
          currency?: string;
          stripe_session_id?: string | null;
          status?: "pending" | "completed" | "failed" | "refunded";
        };
        Update: {
          stripe_session_id?: string | null;
          status?: "pending" | "completed" | "failed" | "refunded";
        };
        Relationships: [
          {
            foreignKeyName: "purchases_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      waitlist: {
        Row: {
          id: string;
          email: string;
          theme_id: string | null;
          source: string | null;
          created_at: string;
        };
        Insert: {
          email: string;
          theme_id?: string | null;
          source?: string | null;
        };
        Update: {
          email?: string;
          theme_id?: string | null;
          source?: string | null;
        };
        Relationships: [];
      };
      streaks: {
        Row: {
          id: string;
          user_id: string;
          theme_id: string;
          current_streak: number;
          longest_streak: number;
          last_activity_date: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          theme_id: string;
          current_streak?: number;
          longest_streak?: number;
          last_activity_date?: string | null;
        };
        Update: {
          current_streak?: number;
          longest_streak?: number;
          last_activity_date?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "streaks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_type: string;
          theme_id: string | null;
          unlocked_at: string;
        };
        Insert: {
          user_id: string;
          achievement_type: string;
          theme_id?: string | null;
          unlocked_at?: string;
        };
        Update: {
          achievement_type?: string;
          theme_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "achievements_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      exercise_attempts: {
        Row: {
          id: string;
          user_id: string;
          exercise_slug: string;
          lesson_id: string;
          theme_id: string;
          passed: boolean;
          score: number;
          hints_used: number;
          solution_viewed: boolean;
          submitted_code: string | null;
          duration_ms: number | null;
          attempted_at: string;
        };
        Insert: {
          user_id: string;
          exercise_slug: string;
          lesson_id: string;
          theme_id: string;
          passed?: boolean;
          score?: number;
          hints_used?: number;
          solution_viewed?: boolean;
          submitted_code?: string | null;
          duration_ms?: number | null;
        };
        Update: {
          passed?: boolean;
          score?: number;
          hints_used?: number;
          solution_viewed?: boolean;
          submitted_code?: string | null;
          duration_ms?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "exercise_attempts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      theme_progress_summary: {
        Row: {
          user_id: string;
          theme_id: string;
          total_lessons: number;
          completed_lessons: number;
          in_progress_lessons: number;
          first_started_at: string | null;
          last_completed_at: string | null;
          completion_percent: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
  };
}
