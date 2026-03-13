/**
 * Tensorcraft Database Types
 *
 * These types mirror the Supabase schema defined in migrations/001_initial_schema.sql.
 * In production, these should be auto-generated via `supabase gen types typescript`.
 * For now, they're manually maintained to match the migration.
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
          role?: UserRole;
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          github_username?: string | null;
          github_connected?: boolean;
          onboarding_completed?: boolean;
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
          created_at: string;
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
          metadata: Record<string, unknown> | null;
          earned_at: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          achievement_type: string;
          theme_id?: string | null;
          metadata?: Record<string, unknown> | null;
          earned_at?: string;
        };
        Update: {
          metadata?: Record<string, unknown> | null;
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
          score: number;
          hints_used: number;
          duration_ms: number | null;
          submitted_code: string;
          attempted_at: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          exercise_slug: string;
          lesson_id: string;
          theme_id: string;
          score: number;
          hints_used?: number;
          duration_ms?: number | null;
          submitted_code: string;
        };
        Update: {
          score?: number;
          hints_used?: number;
          duration_ms?: number | null;
          submitted_code?: string;
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
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
