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
      bookings: {
        Row: {
          admin_notes: string | null
          adults: number
          booking_reference: string
          check_in: string
          check_out: string
          children: number
          created_at: string
          guest_email: string
          guest_name: string
          guest_phone: string
          id: string
          nights: number
          pitch_id: string
          special_requests: string | null
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at: string
          vehicle_plate: string | null
        }
        Insert: {
          admin_notes?: string | null
          adults?: number
          booking_reference: string
          check_in: string
          check_out: string
          children?: number
          created_at?: string
          guest_email: string
          guest_name: string
          guest_phone: string
          id?: string
          nights: number
          pitch_id: string
          special_requests?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at?: string
          vehicle_plate?: string | null
        }
        Update: {
          admin_notes?: string | null
          adults?: number
          booking_reference?: string
          check_in?: string
          check_out?: string
          children?: number
          created_at?: string
          guest_email?: string
          guest_name?: string
          guest_phone?: string
          id?: string
          nights?: number
          pitch_id?: string
          special_requests?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number
          updated_at?: string
          vehicle_plate?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_pitch_id_fkey"
            columns: ["pitch_id"]
            isOneToOne: false
            referencedRelation: "pitches"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          address_line: string
          bic: string
          business_id: string
          city: string
          company_name: string
          country: string
          created_at: string
          email: string
          iban: string
          id: string
          invoice_prefix: string
          payment_terms_days: number
          phone: string
          postal_code: string
          updated_at: string
          vat_rate: number
          website: string
        }
        Insert: {
          address_line?: string
          bic?: string
          business_id?: string
          city?: string
          company_name?: string
          country?: string
          created_at?: string
          email?: string
          iban?: string
          id?: string
          invoice_prefix?: string
          payment_terms_days?: number
          phone?: string
          postal_code?: string
          updated_at?: string
          vat_rate?: number
          website?: string
        }
        Update: {
          address_line?: string
          bic?: string
          business_id?: string
          city?: string
          company_name?: string
          country?: string
          created_at?: string
          email?: string
          iban?: string
          id?: string
          invoice_prefix?: string
          payment_terms_days?: number
          phone?: string
          postal_code?: string
          updated_at?: string
          vat_rate?: number
          website?: string
        }
        Relationships: []
      }
      pitch_closures: {
        Row: {
          created_at: string
          ends_on: string
          id: string
          pitch_id: string
          reason: string | null
          starts_on: string
        }
        Insert: {
          created_at?: string
          ends_on: string
          id?: string
          pitch_id: string
          reason?: string | null
          starts_on: string
        }
        Update: {
          created_at?: string
          ends_on?: string
          id?: string
          pitch_id?: string
          reason?: string | null
          starts_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "pitch_closures_pitch_id_fkey"
            columns: ["pitch_id"]
            isOneToOne: false
            referencedRelation: "pitches"
            referencedColumns: ["id"]
          },
        ]
      }
      pitches: {
        Row: {
          capacity: number
          created_at: string
          description: string | null
          has_electricity: boolean
          id: string
          is_active: boolean
          name: string
          pitch_type: Database["public"]["Enums"]["pitch_type"]
          price_per_night: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          description?: string | null
          has_electricity?: boolean
          id?: string
          is_active?: boolean
          name: string
          pitch_type: Database["public"]["Enums"]["pitch_type"]
          price_per_night: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          description?: string | null
          has_electricity?: boolean
          id?: string
          is_active?: boolean
          name?: string
          pitch_type?: Database["public"]["Enums"]["pitch_type"]
          price_per_night?: number
          sort_order?: number
          updated_at?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_pitch_availability: {
        Args: {
          _check_in: string
          _check_out: string
          _pitch_type?: Database["public"]["Enums"]["pitch_type"]
        }
        Returns: {
          capacity: number
          description: string
          has_electricity: boolean
          name: string
          pitch_id: string
          pitch_type: Database["public"]["Enums"]["pitch_type"]
          price_per_night: number
        }[]
      }
      generate_booking_reference: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff"
      booking_status:
        | "pending"
        | "confirmed"
        | "checked_in"
        | "completed"
        | "cancelled"
      pitch_type: "tent" | "motorhome" | "caravan" | "cabin"
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
      app_role: ["admin", "staff"],
      booking_status: [
        "pending",
        "confirmed",
        "checked_in",
        "completed",
        "cancelled",
      ],
      pitch_type: ["tent", "motorhome", "caravan", "cabin"],
    },
  },
} as const
