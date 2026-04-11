export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      curriculum_topics: {
        Row: {
          id: string;
          label: string;
          icon: string;
          short_label: string | null;
          sort_order: number;
        };
        Insert: {
          id: string;
          label: string;
          icon: string;
          short_label?: string | null;
          sort_order?: number;
        };
        Update: {
          id?: string;
          label?: string;
          icon?: string;
          short_label?: string | null;
          sort_order?: number;
        };
        Relationships: [];
      };
      activity_history: {
        Row: {
          id: string;
          user_id: string;
          activity_type: string;
          title: string;
          topic_id: string | null;
          metadata: Json;
          minutes_spent: number;
          occurred_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_type: string;
          title: string;
          topic_id?: string | null;
          metadata?: Json;
          minutes_spent?: number;
          occurred_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_type?: string;
          title?: string;
          topic_id?: string | null;
          metadata?: Json;
          minutes_spent?: number;
          occurred_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_history_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      diagnostic_attempts: {
        Row: {
          id: string;
          user_id: string;
          overall_score: number;
          question_count: number;
          version: number;
          diagnostic_snapshot: Json;
          completed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          overall_score: number;
          question_count?: number;
          version?: number;
          diagnostic_snapshot?: Json;
          completed_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          overall_score?: number;
          question_count?: number;
          version?: number;
          diagnostic_snapshot?: Json;
          completed_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "diagnostic_attempts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      diagnostic_topic_scores: {
        Row: {
          id: string;
          attempt_id: string;
          user_id: string;
          topic_id: string;
          topic_label: string;
          score: number;
          max_score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          user_id: string;
          topic_id: string;
          topic_label: string;
          score: number;
          max_score: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          attempt_id?: string;
          user_id?: string;
          topic_id?: string;
          topic_label?: string;
          score?: number;
          max_score?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "diagnostic_topic_scores_attempt_user_fkey";
            columns: ["attempt_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "diagnostic_attempts";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "diagnostic_topic_scores_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      focus_breakdown_entries: {
        Row: {
          id: string;
          user_id: string;
          topic_id: string;
          selected_subtopics: string[];
          free_text_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          topic_id: string;
          selected_subtopics?: string[];
          free_text_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          topic_id?: string;
          selected_subtopics?: string[];
          free_text_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "focus_breakdown_entries_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      topic_coaching_memory: {
        Row: {
          user_id: string;
          topic_id: string;
          memory_snapshot: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          topic_id: string;
          memory_snapshot?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          topic_id?: string;
          memory_snapshot?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "topic_coaching_memory_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      revision_historical_rollup: {
        Row: {
          id: string;
          user_id: string;
          period_start: string;
          period_end: string;
          topic_id: string;
          stats: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          period_start: string;
          period_end: string;
          topic_id: string;
          stats?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          period_start?: string;
          period_end?: string;
          topic_id?: string;
          stats?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "revision_historical_rollup_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      revision_practice_events: {
        Row: {
          id: string;
          user_id: string;
          occurred_at: string;
          topic_id: string;
          question_id: string;
          question_kind: string;
          session_id: string;
          source: string;
          correct: boolean;
          duration_ms: number | null;
          verdict: string | null;
          tag_codes: string[];
          is_revision_attempt: boolean;
          weekly_plan_id: string | null;
          srs_snapshot: Json;
          context: Json;
        };
        Insert: {
          id?: string;
          user_id: string;
          occurred_at?: string;
          topic_id: string;
          question_id: string;
          question_kind: string;
          session_id: string;
          source?: string;
          correct: boolean;
          duration_ms?: number | null;
          verdict?: string | null;
          tag_codes?: string[];
          is_revision_attempt?: boolean;
          weekly_plan_id?: string | null;
          srs_snapshot?: Json;
          context?: Json;
        };
        Update: {
          id?: string;
          user_id?: string;
          occurred_at?: string;
          topic_id?: string;
          question_id?: string;
          question_kind?: string;
          session_id?: string;
          source?: string;
          correct?: boolean;
          duration_ms?: number | null;
          verdict?: string | null;
          tag_codes?: string[];
          is_revision_attempt?: boolean;
          weekly_plan_id?: string | null;
          srs_snapshot?: Json;
          context?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "revision_practice_events_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      revision_practice_tags: {
        Row: {
          id: string;
          topic_id: string | null;
          code: string;
          label: string;
          description: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          topic_id?: string | null;
          code: string;
          label: string;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          topic_id?: string | null;
          code?: string;
          label?: string;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      revision_srs_items: {
        Row: {
          user_id: string;
          deck: string;
          item_key: string;
          ease: number;
          interval_days: number;
          repetitions: number;
          due_on: string;
          last_grade: number | null;
          last_reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          deck: string;
          item_key: string;
          ease?: number;
          interval_days?: number;
          repetitions?: number;
          due_on?: string;
          last_grade?: number | null;
          last_reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          deck?: string;
          item_key?: string;
          ease?: number;
          interval_days?: number;
          repetitions?: number;
          due_on?: string;
          last_grade?: number | null;
          last_reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "revision_srs_items_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          nickname: string;
          email: string | null;
          onboarding_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nickname: string;
          email?: string | null;
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nickname?: string;
          email?: string | null;
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      revision_progress: {
        Row: {
          id: string;
          user_id: string;
          topic_id: string;
          entity_id: string;
          entity_type: Database["public"]["Enums"]["revision_entity_type"];
          status: Database["public"]["Enums"]["revision_progress_status"];
          progress_percent: number;
          last_interacted_at: string;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          topic_id: string;
          entity_id: string;
          entity_type: Database["public"]["Enums"]["revision_entity_type"];
          status?: Database["public"]["Enums"]["revision_progress_status"];
          progress_percent?: number;
          last_interacted_at?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          topic_id?: string;
          entity_id?: string;
          entity_type?: Database["public"]["Enums"]["revision_entity_type"];
          status?: Database["public"]["Enums"]["revision_progress_status"];
          progress_percent?: number;
          last_interacted_at?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "revision_progress_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_onboarding: {
        Row: {
          user_id: string;
          weak_areas: string[];
          global_focus_note: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          weak_areas?: string[];
          global_focus_note?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          weak_areas?: string[];
          global_focus_note?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_onboarding_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      revision_user_week_stats: {
        Row: {
          user_id: string;
          week_start: string;
          topic_id: string;
          event_count: number;
          correct_count: number;
          wrong_count: number;
          revision_attempt_count: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      get_revision_user_week_stats: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Views"]["revision_user_week_stats"]["Row"][];
      };
    };
    Enums: {
      revision_entity_type: "subtopic" | "material" | "practice-set";
      revision_progress_status: "not-started" | "in-progress" | "completed";
    };
    CompositeTypes: Record<string, never>;
  };
}
