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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admins: {
        Row: {
          email: string
          id: string
        }
        Insert: {
          email: string
          id: string
        }
        Update: {
          email?: string
          id?: string
        }
        Relationships: []
      }
      balance_requests: {
        Row: {
          created_at: string
          errand_id: string
          evidence_photo_url: string | null
          id: string
          reason: string | null
          requested_amount: number
          status: Database["public"]["Enums"]["balance_request_status"]
        }
        Insert: {
          created_at?: string
          errand_id: string
          evidence_photo_url?: string | null
          id?: string
          reason?: string | null
          requested_amount: number
          status?: Database["public"]["Enums"]["balance_request_status"]
        }
        Update: {
          created_at?: string
          errand_id?: string
          evidence_photo_url?: string | null
          id?: string
          reason?: string | null
          requested_amount?: number
          status?: Database["public"]["Enums"]["balance_request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "balance_requests_errand_id_fkey"
            columns: ["errand_id"]
            isOneToOne: false
            referencedRelation: "errands"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string
          errand_id: string
          id: string
          message_text: string | null
          photo_url: string | null
          sender_id: string
        }
        Insert: {
          created_at?: string
          errand_id: string
          id?: string
          message_text?: string | null
          photo_url?: string | null
          sender_id: string
        }
        Update: {
          created_at?: string
          errand_id?: string
          id?: string
          message_text?: string | null
          photo_url?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_errand_id_fkey"
            columns: ["errand_id"]
            isOneToOne: false
            referencedRelation: "errands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          created_at: string
          errand_id: string
          id: string
          opened_by: string
          reason: string
          resolution: Database["public"]["Enums"]["dispute_resolution"] | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["dispute_status"]
        }
        Insert: {
          created_at?: string
          errand_id: string
          id?: string
          opened_by: string
          reason: string
          resolution?: Database["public"]["Enums"]["dispute_resolution"] | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
        }
        Update: {
          created_at?: string
          errand_id?: string
          id?: string
          opened_by?: string
          reason?: string
          resolution?: Database["public"]["Enums"]["dispute_resolution"] | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
        }
        Relationships: [
          {
            foreignKeyName: "disputes_errand_id_fkey"
            columns: ["errand_id"]
            isOneToOne: false
            referencedRelation: "errands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      errands: {
        Row: {
          accepted_at: string | null
          cancelled_at: string | null
          confirmed_at: string | null
          created_at: string
          delivered_at: string | null
          delivery_fee: number
          dropoff_location: string
          id: string
          item_budget: number
          item_description: string
          pickup_location: string
          processing_fee: number
          purchased_at: string | null
          requester_id: string
          scout_id: string | null
          status: Database["public"]["Enums"]["errand_status"]
        }
        Insert: {
          accepted_at?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_fee: number
          dropoff_location: string
          id?: string
          item_budget: number
          item_description: string
          pickup_location: string
          processing_fee?: number
          purchased_at?: string | null
          requester_id: string
          scout_id?: string | null
          status?: Database["public"]["Enums"]["errand_status"]
        }
        Update: {
          accepted_at?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_fee?: number
          dropoff_location?: string
          id?: string
          item_budget?: number
          item_description?: string
          pickup_location?: string
          processing_fee?: number
          purchased_at?: string | null
          requester_id?: string
          scout_id?: string | null
          status?: Database["public"]["Enums"]["errand_status"]
        }
        Relationships: [
          {
            foreignKeyName: "errands_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "errands_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "errands_scout_id_fkey"
            columns: ["scout_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "errands_scout_id_fkey"
            columns: ["scout_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_batch_items: {
        Row: {
          amount: number
          batch_id: string
          errand_id: string
          id: string
        }
        Insert: {
          amount: number
          batch_id: string
          errand_id: string
          id?: string
        }
        Update: {
          amount?: number
          batch_id?: string
          errand_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_batch_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "payout_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_batch_items_errand_id_fkey"
            columns: ["errand_id"]
            isOneToOne: false
            referencedRelation: "errands"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_batches: {
        Row: {
          id: string
          payout_date: string
          paystack_transfer_reference: string | null
          scout_id: string
          status: Database["public"]["Enums"]["payout_batch_status"]
          total_amount: number
          week_end: string
          week_start: string
        }
        Insert: {
          id?: string
          payout_date: string
          paystack_transfer_reference?: string | null
          scout_id: string
          status?: Database["public"]["Enums"]["payout_batch_status"]
          total_amount?: number
          week_end: string
          week_start: string
        }
        Update: {
          id?: string
          payout_date?: string
          paystack_transfer_reference?: string | null
          scout_id?: string
          status?: Database["public"]["Enums"]["payout_batch_status"]
          total_amount?: number
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_batches_scout_id_fkey"
            columns: ["scout_id"]
            isOneToOne: false
            referencedRelation: "public_scouts"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "payout_batches_scout_id_fkey"
            columns: ["scout_id"]
            isOneToOne: false
            referencedRelation: "scouts"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email: string
          full_name: string
          id: string
          phone?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      ratings: {
        Row: {
          created_at: string
          errand_id: string
          id: string
          note: string | null
          rated_by: string
          rated_user_id: string
          stars: number
        }
        Insert: {
          created_at?: string
          errand_id: string
          id?: string
          note?: string | null
          rated_by: string
          rated_user_id: string
          stars: number
        }
        Update: {
          created_at?: string
          errand_id?: string
          id?: string
          note?: string | null
          rated_by?: string
          rated_user_id?: string
          stars?: number
        }
        Relationships: [
          {
            foreignKeyName: "ratings_errand_id_fkey"
            columns: ["errand_id"]
            isOneToOne: false
            referencedRelation: "errands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_rated_by_fkey"
            columns: ["rated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_rated_by_fkey"
            columns: ["rated_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_rated_user_id_fkey"
            columns: ["rated_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_rated_user_id_fkey"
            columns: ["rated_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scouts: {
        Row: {
          ban_reason: string | null
          bank_account_details: Json | null
          banned_at: string | null
          completed_errands_count: number
          id_photo_url: string | null
          matric_number: string
          mercy_period_ends_at: string | null
          paystack_recipient_code: string | null
          profile_id: string
          rating_avg: number | null
          resubmission_count: number
          selfie_url: string | null
          trust_tier: Database["public"]["Enums"]["trust_tier"]
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          ban_reason?: string | null
          bank_account_details?: Json | null
          banned_at?: string | null
          completed_errands_count?: number
          id_photo_url?: string | null
          matric_number: string
          mercy_period_ends_at?: string | null
          paystack_recipient_code?: string | null
          profile_id: string
          rating_avg?: number | null
          resubmission_count?: number
          selfie_url?: string | null
          trust_tier?: Database["public"]["Enums"]["trust_tier"]
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          ban_reason?: string | null
          bank_account_details?: Json | null
          banned_at?: string | null
          completed_errands_count?: number
          id_photo_url?: string | null
          matric_number?: string
          mercy_period_ends_at?: string | null
          paystack_recipient_code?: string | null
          profile_id?: string
          rating_avg?: number | null
          resubmission_count?: number
          selfie_url?: string | null
          trust_tier?: Database["public"]["Enums"]["trust_tier"]
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "scouts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scouts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          errand_id: string
          id: string
          paystack_reference: string | null
          status: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          amount: number
          created_at?: string
          errand_id: string
          id?: string
          paystack_reference?: string | null
          status?: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          amount?: number
          created_at?: string
          errand_id?: string
          id?: string
          paystack_reference?: string | null
          status?: string
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_errand_id_fkey"
            columns: ["errand_id"]
            isOneToOne: false
            referencedRelation: "errands"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          department: string | null
          full_name: string | null
          id: string | null
        }
        Insert: {
          avatar_url?: string | null
          department?: string | null
          full_name?: string | null
          id?: string | null
        }
        Update: {
          avatar_url?: string | null
          department?: string | null
          full_name?: string | null
          id?: string | null
        }
        Relationships: []
      }
      public_scouts: {
        Row: {
          completed_errands_count: number | null
          profile_id: string | null
          rating_avg: number | null
          trust_tier: Database["public"]["Enums"]["trust_tier"] | null
        }
        Insert: {
          completed_errands_count?: number | null
          profile_id?: string | null
          rating_avg?: number | null
          trust_tier?: Database["public"]["Enums"]["trust_tier"] | null
        }
        Update: {
          completed_errands_count?: number | null
          profile_id?: string | null
          rating_avg?: number | null
          trust_tier?: Database["public"]["Enums"]["trust_tier"] | null
        }
        Relationships: [
          {
            foreignKeyName: "scouts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scouts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      balance_request_status: "pending" | "approved" | "declined" | "expired"
      dispute_resolution:
        | "release_to_scout"
        | "refund_to_requester"
        | "partial_split"
        | "escalate"
      dispute_status: "open" | "resolved"
      errand_status:
        | "open"
        | "accepted"
        | "purchased"
        | "delivered"
        | "confirmed"
        | "disputed"
        | "cancelled"
      payout_batch_status: "pending" | "paid"
      transaction_type:
        | "payment_in"
        | "item_cost_payout"
        | "commission_earned"
        | "refund"
        | "balance_topup"
      trust_tier: "new" | "trusted"
      verification_status: "pending" | "approved" | "rejected"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      balance_request_status: ["pending", "approved", "declined", "expired"],
      dispute_resolution: [
        "release_to_scout",
        "refund_to_requester",
        "partial_split",
        "escalate",
      ],
      dispute_status: ["open", "resolved"],
      errand_status: [
        "open",
        "accepted",
        "purchased",
        "delivered",
        "confirmed",
        "disputed",
        "cancelled",
      ],
      payout_batch_status: ["pending", "paid"],
      transaction_type: [
        "payment_in",
        "item_cost_payout",
        "commission_earned",
        "refund",
        "balance_topup",
      ],
      trust_tier: ["new", "trusted"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
