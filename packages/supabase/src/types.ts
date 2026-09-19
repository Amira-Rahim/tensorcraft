/**
 * Tensorcraft Database Types (GENERATED FILE, do not edit by hand)
 *
 * Regenerate after applying migrations:
 *   DATABASE_URL=... pnpm gen:types
 * See scripts/gen-supabase-types.mjs for details.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      achievements: {
        Row: {
          achievement_type: string;
          id: string;
          unlocked_at: string;
          user_id: string;
          world_id: string | null;
        };
        Insert: {
          achievement_type: string;
          id?: string;
          unlocked_at?: string;
          user_id: string;
          world_id?: string | null;
        };
        Update: {
          achievement_type?: string;
          id?: string;
          unlocked_at?: string;
          user_id?: string;
          world_id?: string | null;
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
      arena_submissions: {
        Row: {
          challenge_id: string;
          created_at: string;
          id: string;
          score: number;
          submitted_code: string | null;
          user_id: string;
          verified_at: string;
        };
        Insert: {
          challenge_id: string;
          created_at?: string;
          id?: string;
          score: number;
          submitted_code?: string | null;
          user_id: string;
          verified_at?: string;
        };
        Update: {
          challenge_id?: string;
          created_at?: string;
          id?: string;
          score?: number;
          submitted_code?: string | null;
          user_id?: string;
          verified_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "arena_submissions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      boss_beat_choices: {
        Row: {
          beat_id: string;
          choice_index: number;
          choice_label: string;
          chosen_at: string;
          content_version: number;
          id: string;
          lesson_id: string;
          reaction_ms: number | null;
          user_id: string;
          world_id: string;
        };
        Insert: {
          beat_id: string;
          choice_index: number;
          choice_label: string;
          chosen_at?: string;
          content_version?: number;
          id?: string;
          lesson_id: string;
          reaction_ms?: number | null;
          user_id: string;
          world_id: string;
        };
        Update: {
          beat_id?: string;
          choice_index?: number;
          choice_label?: string;
          chosen_at?: string;
          content_version?: number;
          id?: string;
          lesson_id?: string;
          reaction_ms?: number | null;
          user_id?: string;
          world_id?: string;
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
      certificates: {
        Row: {
          cert_hash: string;
          entitlement_id: string | null;
          granted_by_org_id: string | null;
          id: string;
          issued_at: string;
          pdf_url: string | null;
          user_id: string;
          world_id: string;
        };
        Insert: {
          cert_hash: string;
          entitlement_id?: string | null;
          granted_by_org_id?: string | null;
          id?: string;
          issued_at?: string;
          pdf_url?: string | null;
          user_id: string;
          world_id: string;
        };
        Update: {
          cert_hash?: string;
          entitlement_id?: string | null;
          granted_by_org_id?: string | null;
          id?: string;
          issued_at?: string;
          pdf_url?: string | null;
          user_id?: string;
          world_id?: string;
        };
        Relationships: [];
      };
      counterfactual_choices: {
        Row: {
          alternate_choice_index: number;
          decision_node: string;
          lesson_id: string;
          original_choice_index: number;
          rewound_at: string;
          user_id: string;
          world_id: string;
        };
        Insert: {
          alternate_choice_index: number;
          decision_node: string;
          lesson_id: string;
          original_choice_index: number;
          rewound_at?: string;
          user_id: string;
          world_id: string;
        };
        Update: {
          alternate_choice_index?: number;
          decision_node?: string;
          lesson_id?: string;
          original_choice_index?: number;
          rewound_at?: string;
          user_id?: string;
          world_id?: string;
        };
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
      dispatch_messages: {
        Row: {
          body_mdx: string;
          cta_href: string | null;
          cta_label: string | null;
          id: string;
          kind: string;
          read_at: string | null;
          sent_at: string;
          subject: string;
          user_id: string;
        };
        Insert: {
          body_mdx: string;
          cta_href?: string | null;
          cta_label?: string | null;
          id?: string;
          kind: string;
          read_at?: string | null;
          sent_at?: string;
          subject: string;
          user_id: string;
        };
        Update: {
          body_mdx?: string;
          cta_href?: string | null;
          cta_label?: string | null;
          id?: string;
          kind?: string;
          read_at?: string | null;
          sent_at?: string;
          subject?: string;
          user_id?: string;
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
      exercise_attempts: {
        Row: {
          attempted_at: string;
          duration_ms: number | null;
          exercise_slug: string;
          hints_used: number;
          id: string;
          lesson_id: string;
          passed: boolean;
          score: number;
          solution_viewed: boolean;
          submitted_code: string | null;
          user_id: string;
          world_id: string;
        };
        Insert: {
          attempted_at?: string;
          duration_ms?: number | null;
          exercise_slug: string;
          hints_used?: number;
          id?: string;
          lesson_id: string;
          passed?: boolean;
          score?: number;
          solution_viewed?: boolean;
          submitted_code?: string | null;
          user_id: string;
          world_id: string;
        };
        Update: {
          attempted_at?: string;
          duration_ms?: number | null;
          exercise_slug?: string;
          hints_used?: number;
          id?: string;
          lesson_id?: string;
          passed?: boolean;
          score?: number;
          solution_viewed?: boolean;
          submitted_code?: string | null;
          user_id?: string;
          world_id?: string;
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
      issues: {
        Row: {
          category: string;
          created_at: string;
          description: string;
          email: string | null;
          id: string;
          page_url: string;
          screenshot_url: string | null;
          severity: string;
          status: string;
          user_agent: string;
          user_id: string | null;
          viewport: Json | null;
        };
        Insert: {
          category: string;
          created_at?: string;
          description: string;
          email?: string | null;
          id?: string;
          page_url?: string;
          screenshot_url?: string | null;
          severity: string;
          status?: string;
          user_agent?: string;
          user_id?: string | null;
          viewport?: Json | null;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string;
          email?: string | null;
          id?: string;
          page_url?: string;
          screenshot_url?: string | null;
          severity?: string;
          status?: string;
          user_agent?: string;
          user_id?: string | null;
          viewport?: Json | null;
        };
        Relationships: [];
      };
      journey_enrollment: {
        Row: {
          completed_at: string | null;
          enrolled_at: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          enrolled_at?: string;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          enrolled_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "journey_enrollment_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      learning_activity_progress: {
        Row: {
          activity_id: string;
          assistance_observed: boolean;
          attempt_count: number;
          completed_at: string | null;
          content_version: number;
          first_assisted: boolean | null;
          first_correct: boolean | null;
          latest_assisted: boolean | null;
          latest_correct: boolean | null;
          phase: string;
          source: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          activity_id: string;
          assistance_observed?: boolean;
          attempt_count?: number;
          completed_at?: string | null;
          content_version: number;
          first_assisted?: boolean | null;
          first_correct?: boolean | null;
          latest_assisted?: boolean | null;
          latest_correct?: boolean | null;
          phase: string;
          source: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          activity_id?: string;
          assistance_observed?: boolean;
          attempt_count?: number;
          completed_at?: string | null;
          content_version?: number;
          first_assisted?: boolean | null;
          first_correct?: boolean | null;
          latest_assisted?: boolean | null;
          latest_correct?: boolean | null;
          phase?: string;
          source?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      learning_activity_streams: {
        Row: {
          activity_id: string;
          assistance_observed: boolean;
          attempt_count: number;
          completed_at: string | null;
          content_version: number;
          created_at: string;
          first_assisted: boolean | null;
          first_correct: boolean | null;
          latest_assisted: boolean | null;
          latest_correct: boolean | null;
          phase: string;
          stream_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          activity_id: string;
          assistance_observed?: boolean;
          attempt_count: number;
          completed_at?: string | null;
          content_version: number;
          created_at?: string;
          first_assisted?: boolean | null;
          first_correct?: boolean | null;
          latest_assisted?: boolean | null;
          latest_correct?: boolean | null;
          phase: string;
          stream_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          activity_id?: string;
          assistance_observed?: boolean;
          attempt_count?: number;
          completed_at?: string | null;
          content_version?: number;
          created_at?: string;
          first_assisted?: boolean | null;
          first_correct?: boolean | null;
          latest_assisted?: boolean | null;
          latest_correct?: boolean | null;
          phase?: string;
          stream_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      news_items: {
        Row: {
          curated_at: string | null;
          gap_concept: string | null;
          gap_rationale: string | null;
          id: string;
          is_content_gap: boolean;
          matched_concepts: string[];
          matched_lessons: NonNullable<Json>;
          published_at: string | null;
          published_blog_slug: string | null;
          raw_json: NonNullable<Json>;
          scraped_at: string;
          source: string;
          status: string;
          summary: string;
          title: string;
          url: string;
          week_iso: string | null;
        };
        Insert: {
          curated_at?: string | null;
          gap_concept?: string | null;
          gap_rationale?: string | null;
          id?: string;
          is_content_gap?: boolean;
          matched_concepts?: string[];
          matched_lessons?: NonNullable<Json>;
          published_at?: string | null;
          published_blog_slug?: string | null;
          raw_json?: NonNullable<Json>;
          scraped_at?: string;
          source: string;
          status?: string;
          summary?: string;
          title: string;
          url: string;
          week_iso?: string | null;
        };
        Update: {
          curated_at?: string | null;
          gap_concept?: string | null;
          gap_rationale?: string | null;
          id?: string;
          is_content_gap?: boolean;
          matched_concepts?: string[];
          matched_lessons?: NonNullable<Json>;
          published_at?: string | null;
          published_blog_slug?: string | null;
          raw_json?: NonNullable<Json>;
          scraped_at?: string;
          source?: string;
          status?: string;
          summary?: string;
          title?: string;
          url?: string;
          week_iso?: string | null;
        };
        Relationships: [];
      };
      payment_events: {
        Row: {
          event_type: string;
          received_at: string;
          stripe_event_id: string;
        };
        Insert: {
          event_type: string;
          received_at?: string;
          stripe_event_id: string;
        };
        Update: {
          event_type?: string;
          received_at?: string;
          stripe_event_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          email: string;
          email_alerts: boolean;
          experience_level: string | null;
          github_connected: boolean;
          github_token: string | null;
          github_username: string | null;
          id: string;
          js_background: string | null;
          js_experience_years: number | null;
          learning_goal: string | null;
          ml_learning_route: string | null;
          onboarding_completed: boolean;
          preferred_world_id: string | null;
          role: Database["public"]["Enums"]["user_role"];
          stripe_customer_id: string | null;
          updated_at: string;
          weekly_digest: boolean;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          email: string;
          email_alerts?: boolean;
          experience_level?: string | null;
          github_connected?: boolean;
          github_token?: string | null;
          github_username?: string | null;
          id: string;
          js_background?: string | null;
          js_experience_years?: number | null;
          learning_goal?: string | null;
          ml_learning_route?: string | null;
          onboarding_completed?: boolean;
          preferred_world_id?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          stripe_customer_id?: string | null;
          updated_at?: string;
          weekly_digest?: boolean;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          email?: string;
          email_alerts?: boolean;
          experience_level?: string | null;
          github_connected?: boolean;
          github_token?: string | null;
          github_username?: string | null;
          id?: string;
          js_background?: string | null;
          js_experience_years?: number | null;
          learning_goal?: string | null;
          ml_learning_route?: string | null;
          onboarding_completed?: boolean;
          preferred_world_id?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          stripe_customer_id?: string | null;
          updated_at?: string;
          weekly_digest?: boolean;
        };
        Relationships: [];
      };
      purchases: {
        Row: {
          amount: number;
          created_at: string;
          currency: string;
          customer_tax_id: string | null;
          entitlement_id: string | null;
          granted_by_org_id: string | null;
          id: string;
          plan_id: string;
          status: Database["public"]["Enums"]["purchase_status"];
          stripe_payment_intent: string | null;
          stripe_session_id: string | null;
          tax_amount: number | null;
          tax_country: string | null;
          updated_at: string;
          user_id: string | null;
          valid_until: string | null;
          world_ids: string[];
        };
        Insert: {
          amount: number;
          created_at?: string;
          currency?: string;
          customer_tax_id?: string | null;
          entitlement_id?: string | null;
          granted_by_org_id?: string | null;
          id?: string;
          plan_id: string;
          status?: Database["public"]["Enums"]["purchase_status"];
          stripe_payment_intent?: string | null;
          stripe_session_id?: string | null;
          tax_amount?: number | null;
          tax_country?: string | null;
          updated_at?: string;
          user_id?: string | null;
          valid_until?: string | null;
          world_ids?: string[];
        };
        Update: {
          amount?: number;
          created_at?: string;
          currency?: string;
          customer_tax_id?: string | null;
          entitlement_id?: string | null;
          granted_by_org_id?: string | null;
          id?: string;
          plan_id?: string;
          status?: Database["public"]["Enums"]["purchase_status"];
          stripe_payment_intent?: string | null;
          stripe_session_id?: string | null;
          tax_amount?: number | null;
          tax_country?: string | null;
          updated_at?: string;
          user_id?: string | null;
          valid_until?: string | null;
          world_ids?: string[];
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
      review_queue: {
        Row: {
          created_at: string;
          last_reviewed_at: string | null;
          lesson_id: string;
          module_id: string;
          next_review_at: string;
          prompt_index: number;
          pulls: number;
          successes: number;
          user_id: string;
          world_id: string;
        };
        Insert: {
          created_at?: string;
          last_reviewed_at?: string | null;
          lesson_id: string;
          module_id: string;
          next_review_at: string;
          prompt_index?: number;
          pulls?: number;
          successes?: number;
          user_id: string;
          world_id: string;
        };
        Update: {
          created_at?: string;
          last_reviewed_at?: string | null;
          lesson_id?: string;
          module_id?: string;
          next_review_at?: string;
          prompt_index?: number;
          pulls?: number;
          successes?: number;
          user_id?: string;
          world_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_queue_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      schema_migrations: {
        Row: {
          applied_at: string;
          name: string;
          version: number;
        };
        Insert: {
          applied_at?: string;
          name: string;
          version: number;
        };
        Update: {
          applied_at?: string;
          name?: string;
          version?: number;
        };
        Relationships: [];
      };
      skill_events: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          metadata: NonNullable<Json>;
          skill_axis: string;
          user_id: string;
          world_id: string;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          metadata?: NonNullable<Json>;
          skill_axis: string;
          user_id: string;
          world_id: string;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          metadata?: NonNullable<Json>;
          skill_axis?: string;
          user_id?: string;
          world_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "skill_events_new_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      skill_events_2026_03: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          metadata: NonNullable<Json>;
          skill_axis: string;
          user_id: string;
          world_id: string;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          metadata?: NonNullable<Json>;
          skill_axis: string;
          user_id: string;
          world_id: string;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          metadata?: NonNullable<Json>;
          skill_axis?: string;
          user_id?: string;
          world_id?: string;
        };
        Relationships: [];
      };
      skill_events_2026_04: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          metadata: NonNullable<Json>;
          skill_axis: string;
          user_id: string;
          world_id: string;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          metadata?: NonNullable<Json>;
          skill_axis: string;
          user_id: string;
          world_id: string;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          metadata?: NonNullable<Json>;
          skill_axis?: string;
          user_id?: string;
          world_id?: string;
        };
        Relationships: [];
      };
      skill_events_2026_05: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          metadata: NonNullable<Json>;
          skill_axis: string;
          user_id: string;
          world_id: string;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          metadata?: NonNullable<Json>;
          skill_axis: string;
          user_id: string;
          world_id: string;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          metadata?: NonNullable<Json>;
          skill_axis?: string;
          user_id?: string;
          world_id?: string;
        };
        Relationships: [];
      };
      skill_events_2026_06: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          metadata: NonNullable<Json>;
          skill_axis: string;
          user_id: string;
          world_id: string;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          metadata?: NonNullable<Json>;
          skill_axis: string;
          user_id: string;
          world_id: string;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          metadata?: NonNullable<Json>;
          skill_axis?: string;
          user_id?: string;
          world_id?: string;
        };
        Relationships: [];
      };
      skill_events_2026_07: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          metadata: NonNullable<Json>;
          skill_axis: string;
          user_id: string;
          world_id: string;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          metadata?: NonNullable<Json>;
          skill_axis: string;
          user_id: string;
          world_id: string;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          metadata?: NonNullable<Json>;
          skill_axis?: string;
          user_id?: string;
          world_id?: string;
        };
        Relationships: [];
      };
      skill_events_2026_08: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          metadata: NonNullable<Json>;
          skill_axis: string;
          user_id: string;
          world_id: string;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          metadata?: NonNullable<Json>;
          skill_axis: string;
          user_id: string;
          world_id: string;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          metadata?: NonNullable<Json>;
          skill_axis?: string;
          user_id?: string;
          world_id?: string;
        };
        Relationships: [];
      };
      skill_events_2026_09: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          metadata: NonNullable<Json>;
          skill_axis: string;
          user_id: string;
          world_id: string;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          metadata?: NonNullable<Json>;
          skill_axis: string;
          user_id: string;
          world_id: string;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          metadata?: NonNullable<Json>;
          skill_axis?: string;
          user_id?: string;
          world_id?: string;
        };
        Relationships: [];
      };
      skill_events_2026_10: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          metadata: NonNullable<Json>;
          skill_axis: string;
          user_id: string;
          world_id: string;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          metadata?: NonNullable<Json>;
          skill_axis: string;
          user_id: string;
          world_id: string;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          metadata?: NonNullable<Json>;
          skill_axis?: string;
          user_id?: string;
          world_id?: string;
        };
        Relationships: [];
      };
      skill_events_2026_11: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          metadata: NonNullable<Json>;
          skill_axis: string;
          user_id: string;
          world_id: string;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          metadata?: NonNullable<Json>;
          skill_axis: string;
          user_id: string;
          world_id: string;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          metadata?: NonNullable<Json>;
          skill_axis?: string;
          user_id?: string;
          world_id?: string;
        };
        Relationships: [];
      };
      skill_events_2026_12: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          metadata: NonNullable<Json>;
          skill_axis: string;
          user_id: string;
          world_id: string;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          metadata?: NonNullable<Json>;
          skill_axis: string;
          user_id: string;
          world_id: string;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          metadata?: NonNullable<Json>;
          skill_axis?: string;
          user_id?: string;
          world_id?: string;
        };
        Relationships: [];
      };
      skill_events_2027_01: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          metadata: NonNullable<Json>;
          skill_axis: string;
          user_id: string;
          world_id: string;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          metadata?: NonNullable<Json>;
          skill_axis: string;
          user_id: string;
          world_id: string;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          metadata?: NonNullable<Json>;
          skill_axis?: string;
          user_id?: string;
          world_id?: string;
        };
        Relationships: [];
      };
      skill_events_2027_02: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          metadata: NonNullable<Json>;
          skill_axis: string;
          user_id: string;
          world_id: string;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          metadata?: NonNullable<Json>;
          skill_axis: string;
          user_id: string;
          world_id: string;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          metadata?: NonNullable<Json>;
          skill_axis?: string;
          user_id?: string;
          world_id?: string;
        };
        Relationships: [];
      };
      skill_events_2027_03: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          metadata: NonNullable<Json>;
          skill_axis: string;
          user_id: string;
          world_id: string;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          metadata?: NonNullable<Json>;
          skill_axis: string;
          user_id: string;
          world_id: string;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          metadata?: NonNullable<Json>;
          skill_axis?: string;
          user_id?: string;
          world_id?: string;
        };
        Relationships: [];
      };
      skill_events_before_2026_03: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          metadata: NonNullable<Json>;
          skill_axis: string;
          user_id: string;
          world_id: string;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          metadata?: NonNullable<Json>;
          skill_axis: string;
          user_id: string;
          world_id: string;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          metadata?: NonNullable<Json>;
          skill_axis?: string;
          user_id?: string;
          world_id?: string;
        };
        Relationships: [];
      };
      skill_genome: {
        Row: {
          confidence: number;
          created_at: string;
          id: string;
          proficiency: number;
          skill_axis: string;
          updated_at: string;
          user_id: string;
          velocity: number;
          world_id: string;
        };
        Insert: {
          confidence?: number;
          created_at?: string;
          id?: string;
          proficiency?: number;
          skill_axis: string;
          updated_at?: string;
          user_id: string;
          velocity?: number;
          world_id: string;
        };
        Update: {
          confidence?: number;
          created_at?: string;
          id?: string;
          proficiency?: number;
          skill_axis?: string;
          updated_at?: string;
          user_id?: string;
          velocity?: number;
          world_id?: string;
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
      streaks: {
        Row: {
          current_streak: number;
          id: string;
          last_activity_date: string | null;
          longest_streak: number;
          updated_at: string;
          user_id: string;
          world_id: string;
        };
        Insert: {
          current_streak?: number;
          id?: string;
          last_activity_date?: string | null;
          longest_streak?: number;
          updated_at?: string;
          user_id: string;
          world_id: string;
        };
        Update: {
          current_streak?: number;
          id?: string;
          last_activity_date?: string | null;
          longest_streak?: number;
          updated_at?: string;
          user_id?: string;
          world_id?: string;
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
      waitlist: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          source: string | null;
          subscribed: boolean;
          unsubscribe_token: string;
          world_id: string | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          source?: string | null;
          subscribed?: boolean;
          unsubscribe_token?: string;
          world_id?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          source?: string | null;
          subscribed?: boolean;
          unsubscribe_token?: string;
          world_id?: string | null;
        };
        Relationships: [];
      };
      world_progress: {
        Row: {
          attempts: number;
          completed_at: string | null;
          created_at: string;
          hints_used: number;
          id: string;
          lesson_id: string;
          module_id: string;
          score: number | null;
          started_at: string | null;
          status: Database["public"]["Enums"]["progress_status"];
          updated_at: string;
          user_id: string;
          world_id: string;
        };
        Insert: {
          attempts?: number;
          completed_at?: string | null;
          created_at?: string;
          hints_used?: number;
          id?: string;
          lesson_id: string;
          module_id: string;
          score?: number | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["progress_status"];
          updated_at?: string;
          user_id: string;
          world_id: string;
        };
        Update: {
          attempts?: number;
          completed_at?: string | null;
          created_at?: string;
          hints_used?: number;
          id?: string;
          lesson_id?: string;
          module_id?: string;
          score?: number | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["progress_status"];
          updated_at?: string;
          user_id?: string;
          world_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "world_progress_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      dashboard_stats: {
        Row: {
          completed_lessons: number | null;
          completion_pct: number | null;
          in_progress_lessons: number | null;
          last_activity: string | null;
          total_lessons: number | null;
          user_id: string | null;
          world_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "world_progress_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      world_progress_summary: {
        Row: {
          completed_lessons: number | null;
          completion_percent: number | null;
          first_started_at: string | null;
          in_progress_lessons: number | null;
          last_completed_at: string | null;
          total_lessons: number | null;
          user_id: string | null;
          world_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "world_progress_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      compute_user_skill_genome: {
        Args: { p_user_id: string; p_world_id: string };
        Returns: undefined;
      };
      count_unread_dispatch: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      custom_access_token_hook: { Args: { event: Json }; Returns: Json };
      dispatch_milestone: {
        Args: {
          p_body_mdx: string;
          p_cta_href?: string;
          p_cta_label?: string;
          p_subject: string;
          p_user_id: string;
        };
        Returns: string;
      };
      ensure_skill_events_partitions: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      get_boss_beat_choice: {
        Args: { p_beat_id: string };
        Returns: {
          beat_id: string;
          choice_index: number;
          choice_label: string;
          chosen_at: string;
          reaction_ms: number;
        }[];
      };
      get_boss_beat_choice_versioned: {
        Args: { p_beat_id: string };
        Returns: {
          beat_id: string;
          choice_index: number;
          choice_label: string;
          chosen_at: string;
          content_version: number;
          reaction_ms: number;
        }[];
      };
      get_counterfactual: {
        Args: { p_world_id: string };
        Returns: {
          alternate_choice_index: number;
          decision_node: string;
          lesson_id: string;
          original_choice_index: number;
          rewound_at: string;
          world_id: string;
        }[];
      };
      get_shared_certificate: {
        Args: { p_id: string };
        Returns: {
          cert_hash: string;
          id: string;
          issued_at: string;
          user_avatar_url: string;
          user_display_name: string;
          world_id: string;
        }[];
      };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      mark_dispatch_read: {
        Args: { p_message_id: string };
        Returns: undefined;
      };
      record_boss_beat_choice: {
        Args: {
          p_beat_id: string;
          p_choice_index: number;
          p_choice_label: string;
          p_lesson_id: string;
          p_reaction_ms?: number;
          p_world_id: string;
        };
        Returns: boolean;
      };
      record_boss_beat_choice_versioned: {
        Args: {
          p_beat_id: string;
          p_choice_index: number;
          p_choice_label: string;
          p_content_version: number;
          p_lesson_id: string;
          p_reaction_ms?: number;
          p_world_id: string;
        };
        Returns: boolean;
      };
      record_counterfactual: {
        Args: {
          p_alternate_choice_index: number;
          p_decision_node: string;
          p_lesson_id: string;
          p_original_choice_index: number;
          p_world_id: string;
        };
        Returns: boolean;
      };
      record_learning_activity: {
        Args: {
          p_activity_id: string;
          p_assistance_observed?: boolean;
          p_attempt_count: number;
          p_completed_at?: string;
          p_content_version: number;
          p_expected_user_id: string;
          p_first_assisted?: boolean;
          p_first_correct?: boolean;
          p_latest_assisted?: boolean;
          p_latest_correct?: boolean;
          p_phase: string;
          p_stream_id: string;
        };
        Returns: undefined;
      };
      record_streak_activity: {
        Args: { p_world_id: string };
        Returns: undefined;
      };
      refresh_dashboard_stats: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      restore_purchase_after_dispute: {
        Args: { p_payment_intent: string };
        Returns: number;
      };
    };
    Enums: {
      progress_status: "not_started" | "in_progress" | "completed";
      purchase_status:
        | "pending"
        | "completed"
        | "failed"
        | "refunded"
        | "partially_refunded"
        | "disputed";
      user_role: "user" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      progress_status: ["not_started", "in_progress", "completed"],
      purchase_status: [
        "pending",
        "completed",
        "failed",
        "refunded",
        "partially_refunded",
        "disputed",
      ],
      user_role: ["user", "admin"],
    },
  },
} as const;

export type UserRole = Database["public"]["Enums"]["user_role"];
