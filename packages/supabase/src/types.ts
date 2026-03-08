/**
 * Tensorcraft Database Types
 *
 * These types mirror the Supabase schema defined in migrations/001_initial_schema.sql.
 * In production, these should be auto-generated via `supabase gen types typescript`.
 * For now, they're manually maintained to match the migration.
 */

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
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          github_username?: string | null;
          github_connected?: boolean;
          updated_at?: string;
        };
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
        };
        Update: {
          status?: "not_started" | "in_progress" | "completed";
          score?: number | null;
          hints_used?: number;
          attempts?: number;
          completed_at?: string | null;
          updated_at?: string;
        };
      };
      purchases: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          theme_ids: string[];
          amount: number;
          currency: string;
          lemon_squeezy_id: string | null;
          status: "pending" | "completed" | "failed" | "refunded";
          created_at: string;
        };
        Insert: {
          user_id: string;
          plan_id: string;
          theme_ids: string[];
          amount: number;
          currency?: string;
          lemon_squeezy_id?: string | null;
          status?: "pending" | "completed" | "failed" | "refunded";
        };
        Update: {
          lemon_squeezy_id?: string | null;
          status?: "pending" | "completed" | "failed" | "refunded";
        };
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
        Update: never;
      };
    };
  };
}
