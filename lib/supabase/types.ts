export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          created_at: string | null
          data_quality_score: number | null
          domain: string | null
          employee_count: number | null
          icp_fit_score: number | null
          id: string
          industry: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          data_quality_score?: number | null
          domain?: string | null
          employee_count?: number | null
          icp_fit_score?: number | null
          id?: string
          industry?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          data_quality_score?: number | null
          domain?: string | null
          employee_count?: number | null
          icp_fit_score?: number | null
          id?: string
          industry?: string | null
          name?: string
        }
        Relationships: []
      }
      audit_trail: {
        Row: {
          account_name: string | null
          action: string | null
          composite_score: number | null
          created_at: string | null
          data_quality_score_at_time: number | null
          id: string
          reasoning: string | null
          signal_id: string | null
        }
        Insert: {
          account_name?: string | null
          action?: string | null
          composite_score?: number | null
          created_at?: string | null
          data_quality_score_at_time?: number | null
          id?: string
          reasoning?: string | null
          signal_id?: string | null
        }
        Update: {
          account_name?: string | null
          action?: string | null
          composite_score?: number | null
          created_at?: string | null
          data_quality_score_at_time?: number | null
          id?: string
          reasoning?: string | null
          signal_id?: string | null
        }
        Relationships: []
      }
      channel_actions: {
        Row: {
          account_name: string
          action_type: string
          channel_id: string
          channel_name: string
          completed_at: string | null
          created_at: string | null
          id: string
          message_hint: string | null
          metadata: Json | null
          owner: string | null
          signal_id: string
          status: string
          step_day: number | null
          step_order: number | null
        }
        Insert: {
          account_name: string
          action_type: string
          channel_id: string
          channel_name: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          message_hint?: string | null
          metadata?: Json | null
          owner?: string | null
          signal_id: string
          status?: string
          step_day?: number | null
          step_order?: number | null
        }
        Update: {
          account_name?: string
          action_type?: string
          channel_id?: string
          channel_name?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          message_hint?: string | null
          metadata?: Json | null
          owner?: string | null
          signal_id?: string
          status?: string
          step_day?: number | null
          step_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_actions_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_actions_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      data_issues: {
        Row: {
          account_id: string | null
          created_at: string | null
          field_name: string | null
          id: string
          issue_type: string | null
          resolved_at: string | null
          score_impact: number
          severity: string | null
          status: string
          suggested_fix: string | null
        }
        Insert: {
          account_id?: string | null
          created_at?: string | null
          field_name?: string | null
          id?: string
          issue_type?: string | null
          resolved_at?: string | null
          score_impact?: number
          severity?: string | null
          status?: string
          suggested_fix?: string | null
        }
        Update: {
          account_id?: string | null
          created_at?: string | null
          field_name?: string | null
          id?: string
          issue_type?: string | null
          resolved_at?: string | null
          score_impact?: number
          severity?: string | null
          status?: string
          suggested_fix?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_issues_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      signals: {
        Row: {
          account_id: string | null
          account_name: string | null
          assigned_to: string | null
          composite_score: number | null
          created_at: string | null
          employee_count: number | null
          fit_score: number | null
          id: string
          industry: string | null
          intent_score: number | null
          playbook: Json | null
          source: string | null
          status: string | null
          timing_score: number | null
          updated_at: string | null
          velocity_score: number | null
          why_now: string | null
        }
        Insert: {
          account_id?: string | null
          account_name?: string | null
          assigned_to?: string | null
          composite_score?: number | null
          created_at?: string | null
          employee_count?: number | null
          fit_score?: number | null
          id?: string
          industry?: string | null
          intent_score?: number | null
          playbook?: Json | null
          source?: string | null
          status?: string | null
          timing_score?: number | null
          updated_at?: string | null
          velocity_score?: number | null
          why_now?: string | null
        }
        Update: {
          account_id?: string | null
          account_name?: string | null
          assigned_to?: string | null
          composite_score?: number | null
          created_at?: string | null
          employee_count?: number | null
          fit_score?: number | null
          id?: string
          industry?: string | null
          intent_score?: number | null
          playbook?: Json | null
          source?: string | null
          status?: string | null
          timing_score?: number | null
          updated_at?: string | null
          velocity_score?: number | null
          why_now?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_data_issue: {
        Args: {
          account_id: string
          field_name: string
          issue_type: string
          severity: string
          suggested_fix: string
        }
        Returns: {
          issue_id: string
          data_quality_score: number
        }[]
      }
      dismiss_data_issue: {
        Args: {
          issue_id: string
        }
        Returns: {
          account_id: string
          data_quality_score: number
        }[]
      }
      resolve_all_open_issues: {
        Args: {
          account_id: string
        }
        Returns: {
          data_quality_score: number
          resolved_issue_count: number
        }[]
      }
      resolve_data_issue: {
        Args: {
          issue_id: string
        }
        Returns: {
          account_id: string
          data_quality_score: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
