export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_orders: {
        Row: {
          id: number
          created_at: string
          user_id: string
          link: string
          content: string
          status: string
          external_order_id: string | null
          last_status_check: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          user_id: string
          link: string
          content: string
          status?: string
          external_order_id?: string | null
          last_status_check?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          user_id?: string
          link?: string
          content?: string
          status?: string
          external_order_id?: string | null
          last_status_check?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount_total: number | null
          created_at: string
          currency: string | null
          id: string
          nowpayments_payment_id: string | null
          airwallex_payment_intent_id: string | null
          payment_method: string | null
          status: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_total?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          nowpayments_payment_id?: string | null
          airwallex_payment_intent_id?: string | null
          payment_method?: string | null
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_total?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          nowpayments_payment_id?: string | null
          airwallex_payment_intent_id?: string | null
          payment_method?: string | null
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          badge: string | null
          category: string
          colors: string[]
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          image_url: string
          name: string
          original_price: number | null
          price: number
          updated_at: string | null
        }
        Insert: {
          badge?: string | null
          category: string
          colors?: string[]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url: string
          name: string
          original_price?: number | null
          price: number
          updated_at?: string | null
        }
        Update: {
          badge?: string | null
          category?: string
          colors?: string[]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string
          name?: string
          original_price?: number | null
          price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          balance: number
          created_at: string | null
          email: string
          id: string
          is_admin: boolean | null
        }
        Insert: {
          balance?: number
          created_at?: string | null
          email: string
          id: string
          is_admin?: boolean | null
        }
        Update: {
          balance?: number
          created_at?: string | null
          email?: string
          id?: string
          is_admin?: boolean | null
        }
        Relationships: []
      }
      reddit_accounts: {
        Row: {
          account_age_years: number | null
          buy_price: number
          comment_karma: number
          created_at: string
          created_by_admin_id: string | null
          email: string
          email_password: string
          id: string
          password: string
          post_karma: number
          profile_url: string | null
          sell_price: number
          sold_at: string | null
          sold_to_user_id: string | null
          status: string
          total_karma: number | null
          username: string
        }
        Insert: {
          account_age_years?: number | null
          buy_price?: number
          comment_karma?: number
          created_at?: string
          created_by_admin_id?: string | null
          email: string
          email_password: string
          id?: string
          password: string
          post_karma?: number
          profile_url?: string | null
          sell_price?: number
          sold_at?: string | null
          sold_to_user_id?: string | null
          status?: string
          total_karma?: number | null
          username: string
        }
        Update: {
          account_age_years?: number | null
          buy_price?: number
          comment_karma?: number
          created_at?: string
          created_by_admin_id?: string | null
          email?: string
          email_password?: string
          id?: string
          password?: string
          post_karma?: number
          profile_url?: string | null
          sell_price?: number
          sold_at?: string | null
          sold_to_user_id?: string | null
          status?: string
          total_karma?: number | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "reddit_accounts_created_by_admin_id_fkey"
            columns: ["created_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reddit_accounts_sold_to_user_id_fkey"
            columns: ["sold_to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          status: string
          type: string
          upvote_order_id: number | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          type: string
          upvote_order_id?: number | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          type?: string
          upvote_order_id?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_upvote_order"
            columns: ["upvote_order_id"]
            isOneToOne: false
            referencedRelation: "upvote_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      upvote_orders: {
        Row: {
          created_at: string
          external_order_id: string | null
          id: number
          link: string
          quantity: number
          service: number
          speed: number
          status: string
          user_id: string
          votes_delivered: number | null
          last_status_check: string | null
          error_message: string | null
        }
        Insert: {
          created_at?: string
          external_order_id?: string | null
          id?: number
          link: string
          quantity: number
          service: number
          speed: number
          status?: string
          user_id: string
          votes_delivered?: number | null
          last_status_check?: string | null
          error_message?: string | null
        }
        Update: {
          created_at?: string
          external_order_id?: string | null
          id?: number
          link?: string
          quantity?: number
          service?: number
          speed?: number
          status?: string
          user_id?: string
          votes_delivered?: number | null
          last_status_check?: string | null
          error_message?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      log_audit_event: {
        Args: {
          p_action: string
          p_resource_type: string
          p_resource_id?: string
          p_details?: Json
        }
        Returns: undefined
      }
      place_comment_order: {
        Args: {
          order_link: string
          order_content: string
        }
        Returns: {
          order_id: number
          error_message: string
        }[]
      }
      place_upvote_order: {
        Args: {
          order_link: string
          order_quantity: number
          order_service: number
          order_speed: number
        }
        Returns: {
          order_id: number
          error_message: string
        }[]
      }
      purchase_reddit_account: {
        Args: { account_id: string }
        Returns: string
      }
      refund_order: {
        Args: { target_order_id: number }
        Returns: string
      }
      auto_refund_failed_order: {
        Args: { target_order_id: number }
        Returns: string
      }
      validate_password_strength: {
        Args: { password: string }
        Returns: boolean
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
