/**
 * Tensorcraft Database Types
 *
 * These types mirror the Supabase schema defined in migrations 001-011.
 * In production, these should be auto-generated via `supabase gen types typescript`.
 * For now, they're manually maintained to match the migrations.
 */

export type UserRole = "user" | "admin";

export interface Database {
  public: {
    Tables: {
      journey_enrollment: {
        Row: {
          user_id: string;
          enrolled_at: string;
          completed_at: string | null;
        };
        Insert: {
          user_id: string;
          enrolled_at?: string;
          completed_at?: string | null;
        };
        Update: {
          enrolled_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          github_username: string | null;
          github_connected: boolean;
          github_token: string | null;
          stripe_customer_id: string | null;
          onboarding_completed: boolean;
          email_alerts: boolean;
          weekly_digest: boolean;
          preferred_theme_id: string | null;
          role: UserRole;
          fe_background: string | null;
          learning_goal: string | null;
          fe_framework: "react" | null;
          fe_experience_years: number | null;
          experience_level:
            | "beginner"
            | "intermediate"
            | "advanced"
            | "expert"
            | null;
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
          github_token?: string | null;
          stripe_customer_id?: string | null;
          onboarding_completed?: boolean;
          email_alerts?: boolean;
          weekly_digest?: boolean;
          preferred_theme_id?: string | null;
          role?: UserRole;
          fe_background?: string | null;
          learning_goal?: string | null;
          fe_framework?: "react" | null;
          fe_experience_years?: number | null;
          experience_level?:
            | "beginner"
            | "intermediate"
            | "advanced"
            | "expert"
            | null;
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          github_username?: string | null;
          github_connected?: boolean;
          github_token?: string | null;
          stripe_customer_id?: string | null;
          onboarding_completed?: boolean;
          email_alerts?: boolean;
          weekly_digest?: boolean;
          preferred_theme_id?: string | null;
          role?: UserRole;
          fe_background?: string | null;
          learning_goal?: string | null;
          fe_framework?: "react" | null;
          fe_experience_years?: number | null;
          experience_level?:
            | "beginner"
            | "intermediate"
            | "advanced"
            | "expert"
            | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      certificates: {
        Row: {
          id: string;
          user_id: string;
          theme_id: string;
          issued_at: string;
          cert_hash: string;
          pdf_url: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          theme_id: string;
          issued_at?: string;
          cert_hash: string;
          pdf_url?: string | null;
        };
        Update: {
          cert_hash?: string;
          pdf_url?: string | null;
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
          stripe_payment_intent: string | null;
          status:
            | "pending"
            | "completed"
            | "failed"
            | "refunded"
            | "partially_refunded"
            | "disputed";
          created_at: string;
        };
        Insert: {
          user_id: string;
          plan_id: string;
          theme_ids: string[];
          amount: number;
          currency?: string;
          stripe_session_id?: string | null;
          stripe_payment_intent?: string | null;
          status?:
            | "pending"
            | "completed"
            | "failed"
            | "refunded"
            | "partially_refunded"
            | "disputed";
        };
        Update: {
          stripe_session_id?: string | null;
          stripe_payment_intent?: string | null;
          status?:
            | "pending"
            | "completed"
            | "failed"
            | "refunded"
            | "partially_refunded"
            | "disputed";
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
          subscribed: boolean;
          unsubscribe_token: string;
        };
        Insert: {
          email: string;
          theme_id?: string | null;
          source?: string | null;
          subscribed?: boolean;
          unsubscribe_token?: string;
        };
        Update: {
          email?: string;
          theme_id?: string | null;
          source?: string | null;
          subscribed?: boolean;
          unsubscribe_token?: string;
        };
        Relationships: [];
      };
      counterfactual_choices: {
        Row: {
          user_id: string;
          theme_id: string;
          lesson_id: string;
          decision_node: string;
          original_choice_index: number;
          alternate_choice_index: number;
          rewound_at: string;
        };
        Insert: {
          user_id: string;
          theme_id: string;
          lesson_id: string;
          decision_node: string;
          original_choice_index: number;
          alternate_choice_index: number;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "counterfactual_choices_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      boss_beat_choices: {
        Row: {
          id: string;
          user_id: string;
          theme_id: string;
          lesson_id: string;
          beat_id: string;
          choice_index: number;
          choice_label: "cooperate" | "defect" | "random" | "dominant";
          reaction_ms: number | null;
          chosen_at: string;
        };
        Insert: {
          user_id: string;
          theme_id: string;
          lesson_id: string;
          beat_id: string;
          choice_index: number;
          choice_label: "cooperate" | "defect" | "random" | "dominant";
          reaction_ms?: number | null;
        };
        Update: {
          reaction_ms?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "boss_beat_choices_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      dispatch_messages: {
        Row: {
          id: string;
          user_id: string;
          kind: "weekly_intel" | "milestone" | "cliffhanger";
          subject: string;
          body_mdx: string;
          cta_label: string | null;
          cta_href: string | null;
          sent_at: string;
          read_at: string | null;
        };
        Insert: {
          user_id: string;
          kind: "weekly_intel" | "milestone" | "cliffhanger";
          subject: string;
          body_mdx: string;
          cta_label?: string | null;
          cta_href?: string | null;
        };
        Update: {
          read_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "dispatch_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
      skill_genome: {
        Row: {
          id: string;
          user_id: string;
          theme_id: string;
          skill_axis:
            | "data_prep"
            | "model_arch"
            | "training"
            | "evaluation"
            | "deployment"
            | "fe_integration";
          proficiency: number;
          confidence: number;
          velocity: number;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          theme_id: string;
          skill_axis:
            | "data_prep"
            | "model_arch"
            | "training"
            | "evaluation"
            | "deployment"
            | "fe_integration";
          proficiency?: number;
          confidence?: number;
          velocity?: number;
        };
        Update: {
          proficiency?: number;
          confidence?: number;
          velocity?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "skill_genome_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      issues: {
        Row: {
          id: string;
          user_id: string | null;
          category: string;
          description: string;
          severity: string;
          email: string | null;
          screenshot_url: string | null;
          page_url: string;
          user_agent: string;
          viewport: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          user_id?: string | null;
          category: string;
          description: string;
          severity: string;
          email?: string | null;
          screenshot_url?: string | null;
          page_url: string;
          user_agent?: string;
          viewport?: Record<string, unknown> | null;
        };
        Update: {
          category?: string;
          severity?: string;
          screenshot_url?: string | null;
        };
        Relationships: [];
      };
      news_items: {
        Row: {
          id: string;
          source: string;
          url: string;
          title: string;
          summary: string;
          published_at: string | null;
          raw_json: Record<string, unknown>;
          matched_concepts: string[];
          matched_lessons: Array<{
            themeId: string;
            moduleId: string;
            slug: string;
            title: string;
            score: number;
            rationale?: string;
          }>;
          status: "pending" | "shortlisted" | "published" | "rejected";
          week_iso: string | null;
          scraped_at: string;
          curated_at: string | null;
          published_blog_slug: string | null;
          is_content_gap: boolean;
          gap_concept: string | null;
          gap_rationale: string | null;
        };
        Insert: {
          source: string;
          url: string;
          title: string;
          summary?: string;
          published_at?: string | null;
          raw_json?: Record<string, unknown>;
          matched_concepts?: string[];
          matched_lessons?: Array<{
            themeId: string;
            moduleId: string;
            slug: string;
            title: string;
            score: number;
            rationale?: string;
          }>;
          status?: "pending" | "shortlisted" | "published" | "rejected";
          week_iso?: string | null;
          curated_at?: string | null;
          published_blog_slug?: string | null;
          is_content_gap?: boolean;
          gap_concept?: string | null;
          gap_rationale?: string | null;
        };
        Update: {
          matched_concepts?: string[];
          matched_lessons?: Array<{
            themeId: string;
            moduleId: string;
            slug: string;
            title: string;
            score: number;
            rationale?: string;
          }>;
          status?: "pending" | "shortlisted" | "published" | "rejected";
          week_iso?: string | null;
          curated_at?: string | null;
          published_blog_slug?: string | null;
          is_content_gap?: boolean;
          gap_concept?: string | null;
          gap_rationale?: string | null;
        };
        Relationships: [];
      };
      skill_events: {
        Row: {
          id: string;
          user_id: string;
          theme_id: string;
          event_type:
            | "exercise_pass"
            | "exercise_fail"
            | "hint_reveal"
            | "solution_view"
            | "lesson_complete"
            | "bridge_interaction"
            | "review_recall";
          skill_axis:
            | "data_prep"
            | "model_arch"
            | "training"
            | "evaluation"
            | "deployment"
            | "fe_integration";
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          user_id: string;
          theme_id: string;
          event_type:
            | "exercise_pass"
            | "exercise_fail"
            | "hint_reveal"
            | "solution_view"
            | "lesson_complete"
            | "bridge_interaction"
            | "review_recall";
          skill_axis:
            | "data_prep"
            | "model_arch"
            | "training"
            | "evaluation"
            | "deployment"
            | "fe_integration";
          metadata?: Record<string, unknown>;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "skill_events_user_id_fkey";
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
      dashboard_stats: {
        Row: {
          user_id: string;
          theme_id: string;
          total_lessons: number;
          completed_lessons: number;
          in_progress_lessons: number;
          completion_pct: number | null;
          last_activity: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      record_streak_activity: {
        Args: { p_theme_id: string };
        Returns: void;
      };
      refresh_dashboard_stats: {
        Args: Record<string, never>;
        Returns: void;
      };
      compute_user_skill_genome: {
        Args: { p_user_id: string; p_theme_id: string };
        Returns: void;
      };
      get_shared_certificate: {
        Args: { p_id: string };
        Returns: Array<{
          id: string;
          theme_id: string;
          issued_at: string;
          cert_hash: string;
          user_display_name: string | null;
          user_avatar_url: string | null;
        }>;
      };
      mark_dispatch_read: {
        Args: { p_message_id: string };
        Returns: void;
      };
      dispatch_milestone: {
        Args: {
          p_user_id: string;
          p_subject: string;
          p_body_mdx: string;
          p_cta_label?: string | null;
          p_cta_href?: string | null;
        };
        Returns: string;
      };
      count_unread_dispatch: {
        Args: Record<string, never>;
        Returns: number;
      };
      record_boss_beat_choice: {
        Args: {
          p_theme_id: string;
          p_lesson_id: string;
          p_beat_id: string;
          p_choice_index: number;
          p_choice_label: "cooperate" | "defect" | "random" | "dominant";
          p_reaction_ms?: number | null;
        };
        Returns: boolean;
      };
      get_boss_beat_choice: {
        Args: { p_beat_id: string };
        Returns: Array<{
          beat_id: string;
          choice_index: number;
          choice_label: "cooperate" | "defect" | "random" | "dominant";
          reaction_ms: number | null;
          chosen_at: string;
        }>;
      };
      record_counterfactual: {
        Args: {
          p_theme_id: string;
          p_lesson_id: string;
          p_decision_node: string;
          p_original_choice_index: number;
          p_alternate_choice_index: number;
        };
        Returns: boolean;
      };
      get_counterfactual: {
        Args: { p_theme_id: string };
        Returns: Array<{
          theme_id: string;
          lesson_id: string;
          decision_node: string;
          original_choice_index: number;
          alternate_choice_index: number;
          rewound_at: string;
        }>;
      };
    };
  };
}
