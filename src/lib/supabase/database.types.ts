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
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      revision_entity_type: "subtopic" | "material" | "practice-set";
      revision_progress_status: "not-started" | "in-progress" | "completed";
    };
    CompositeTypes: Record<string, never>;
  };
}
