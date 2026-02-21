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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      account_lockouts: {
        Row: {
          created_at: string
          email: string
          failed_attempts: number
          id: string
          locked_until: string
          reason: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          failed_attempts?: number
          id?: string
          locked_until: string
          reason?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          failed_attempts?: number
          id?: string
          locked_until?: string
          reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_session_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_session_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_session_id?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      cards: {
        Row: {
          balance: number
          card_type: string
          created_at: string
          expiry_date: string
          id: string
          last_four: string
          network: string
          spend_limit: number
          status: string
          user_id: string
        }
        Insert: {
          balance?: number
          card_type?: string
          created_at?: string
          expiry_date: string
          id?: string
          last_four: string
          network?: string
          spend_limit?: number
          status?: string
          user_id: string
        }
        Update: {
          balance?: number
          card_type?: string
          created_at?: string
          expiry_date?: string
          id?: string
          last_four?: string
          network?: string
          spend_limit?: number
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      failed_login_attempts: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_address: string | null
          location: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip_address?: string | null
          location?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          location?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      ip_blocklist: {
        Row: {
          blocked_until: string
          created_at: string
          failed_attempts: number
          id: string
          ip_address: string
          location: string | null
          reason: string | null
          updated_at: string
        }
        Insert: {
          blocked_until: string
          created_at?: string
          failed_attempts?: number
          id?: string
          ip_address: string
          location?: string | null
          reason?: string | null
          updated_at?: string
        }
        Update: {
          blocked_until?: string
          created_at?: string
          failed_attempts?: number
          id?: string
          ip_address?: string
          location?: string | null
          reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      kyc_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          file_path: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["kyc_status"] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name: string
          file_path: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["kyc_status"] | null
          user_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          file_path?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["kyc_status"] | null
          user_id?: string
        }
        Relationships: []
      }
      login_activity: {
        Row: {
          browser: string | null
          created_at: string
          device_info: string | null
          id: string
          ip_address: string | null
          is_new_device: boolean | null
          location: string | null
          os: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_info?: string | null
          id?: string
          ip_address?: string | null
          is_new_device?: boolean | null
          location?: string | null
          os?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_info?: string | null
          id?: string
          ip_address?: string | null
          is_new_device?: boolean | null
          location?: string | null
          os?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_alerts: boolean
          id: string
          marketing_emails: boolean
          security_alerts: boolean
          transaction_notifications: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_alerts?: boolean
          id?: string
          marketing_emails?: boolean
          security_alerts?: boolean
          transaction_notifications?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_alerts?: boolean
          id?: string
          marketing_emails?: boolean
          security_alerts?: boolean
          transaction_notifications?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      points_ledger: {
        Row: {
          action: string
          created_at: string
          id: string
          points: number
          type: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          points: number
          type?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          points?: number
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          kyc_status: Database["public"]["Enums"]["kyc_status"] | null
          last_name: string | null
          package_type: Database["public"]["Enums"]["package_type"] | null
          phone: string | null
          referral_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          kyc_status?: Database["public"]["Enums"]["kyc_status"] | null
          last_name?: string | null
          package_type?: Database["public"]["Enums"]["package_type"] | null
          phone?: string | null
          referral_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          kyc_status?: Database["public"]["Enums"]["kyc_status"] | null
          last_name?: string | null
          package_type?: Database["public"]["Enums"]["package_type"] | null
          phone?: string | null
          referral_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      redeemed_rewards: {
        Row: {
          created_at: string
          id: string
          points_cost: number
          reward_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points_cost: number
          reward_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points_cost?: number
          reward_name?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          points_earned: number
          referred_email: string
          referred_name: string | null
          referrer_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          points_earned?: number
          referred_email: string
          referred_name?: string | null
          referrer_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          points_earned?: number
          referred_email?: string
          referred_name?: string | null
          referrer_id?: string
          status?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          fee: number | null
          id: string
          recipient_id: string | null
          recipient_name: string | null
          status: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          description?: string | null
          fee?: number | null
          id?: string
          recipient_id?: string | null
          recipient_name?: string | null
          status?: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          fee?: number | null
          id?: string
          recipient_id?: string | null
          recipient_name?: string | null
          status?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          device_info: string | null
          id: string
          ip_address: string | null
          is_current: boolean
          last_active_at: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: string | null
          id?: string
          ip_address?: string | null
          is_current?: boolean
          last_active_at?: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: string | null
          id?: string
          ip_address?: string | null
          is_current?: boolean
          last_active_at?: string
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          updated_at: string
          user_id: string
          wallet_type: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency: string
          id?: string
          updated_at?: string
          user_id: string
          wallet_type?: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id?: string
          wallet_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_account_lockout: {
        Args: { p_email: string }
        Returns: {
          is_locked: boolean
          locked_until: string
          reason: string
        }[]
      }
      check_ip_block: {
        Args: { p_ip_address: string }
        Returns: {
          blocked_until: string
          is_blocked: boolean
          reason: string
        }[]
      }
      clear_failed_attempts: { Args: { p_email: string }; Returns: undefined }
      clear_ip_block: { Args: { p_ip_address: string }; Returns: undefined }
      get_user_points: { Args: { p_user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      record_failed_login: {
        Args: {
          p_email: string
          p_ip_address?: string
          p_location?: string
          p_user_agent?: string
        }
        Returns: {
          attempt_count: number
          should_lock: boolean
          unique_ips: number
        }[]
      }
      record_ip_failure: {
        Args: { p_email?: string; p_ip_address: string }
        Returns: {
          attempt_count: number
          should_block: boolean
          unique_emails: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      kyc_status: "pending" | "verified" | "rejected"
      package_type: "steward" | "amanah" | "cultura"
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
    Enums: {
      app_role: ["admin", "user"],
      kyc_status: ["pending", "verified", "rejected"],
      package_type: ["steward", "amanah", "cultura"],
    },
  },
} as const
