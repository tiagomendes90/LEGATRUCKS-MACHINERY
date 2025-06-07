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
      brands: {
        Row: {
          category: string
          created_at: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      featured_trucks: {
        Row: {
          created_at: string
          id: string
          position: number
          truck_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          position: number
          truck_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          position?: number
          truck_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_trucks_truck_id_fkey"
            columns: ["truck_id"]
            isOneToOne: true
            referencedRelation: "trucks"
            referencedColumns: ["id"]
          },
        ]
      }
      filter_options: {
        Row: {
          category: string
          created_at: string | null
          filter_type: string
          id: string
          option_label: string
          option_value: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          filter_type: string
          id?: string
          option_label: string
          option_value: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          filter_type?: string
          id?: string
          option_label?: string
          option_value?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number
          created_at: string | null
          customer_email: string
          customer_name: string
          id: string
          order_date: string
          payment_status: string
          status: string
          truck_id: string | null
          truck_model: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          customer_email: string
          customer_name: string
          id?: string
          order_date?: string
          payment_status?: string
          status?: string
          truck_id?: string | null
          truck_model: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          id?: string
          order_date?: string
          payment_status?: string
          status?: string
          truck_id?: string | null
          truck_model?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_truck_id_fkey"
            columns: ["truck_id"]
            isOneToOne: false
            referencedRelation: "trucks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trucks: {
        Row: {
          brand: string
          category: string | null
          condition: string
          created_at: string | null
          description: string
          engine: string
          features: string[] | null
          horsepower: number | null
          id: string
          images: string[] | null
          mileage: number | null
          model: string
          price: number
          subcategory: string | null
          transmission: string
          updated_at: string | null
          year: number
        }
        Insert: {
          brand: string
          category?: string | null
          condition: string
          created_at?: string | null
          description: string
          engine: string
          features?: string[] | null
          horsepower?: number | null
          id?: string
          images?: string[] | null
          mileage?: number | null
          model: string
          price: number
          subcategory?: string | null
          transmission: string
          updated_at?: string | null
          year: number
        }
        Update: {
          brand?: string
          category?: string | null
          condition?: string
          created_at?: string | null
          description?: string
          engine?: string
          features?: string[] | null
          horsepower?: number | null
          id?: string
          images?: string[] | null
          mileage?: number | null
          model?: string
          price?: number
          subcategory?: string | null
          transmission?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      vehicle_specifications: {
        Row: {
          abs_brakes: boolean | null
          adaptive_cruise_control: boolean | null
          air_conditioning: boolean | null
          axle_configuration: string | null
          blind_spot_monitoring: boolean | null
          bucket_capacity: number | null
          cabin_type: string | null
          collision_avoidance: boolean | null
          crane_capacity: string | null
          created_at: string
          cruise_control: boolean | null
          drive_type: string | null
          ebs_brakes: boolean | null
          esp_system: boolean | null
          euro_standard: string | null
          fuel_consumption: number | null
          fuel_type: string | null
          hydraulic_system: string | null
          id: string
          lane_departure_warning: boolean | null
          lifting_capacity: number | null
          loading_capacity: number | null
          max_reach: number | null
          noise_level: number | null
          operating_weight: number | null
          pto_available: boolean | null
          retarder: boolean | null
          suspension_type: string | null
          truck_id: string
          updated_at: string
          winch_available: boolean | null
          working_pressure: number | null
        }
        Insert: {
          abs_brakes?: boolean | null
          adaptive_cruise_control?: boolean | null
          air_conditioning?: boolean | null
          axle_configuration?: string | null
          blind_spot_monitoring?: boolean | null
          bucket_capacity?: number | null
          cabin_type?: string | null
          collision_avoidance?: boolean | null
          crane_capacity?: string | null
          created_at?: string
          cruise_control?: boolean | null
          drive_type?: string | null
          ebs_brakes?: boolean | null
          esp_system?: boolean | null
          euro_standard?: string | null
          fuel_consumption?: number | null
          fuel_type?: string | null
          hydraulic_system?: string | null
          id?: string
          lane_departure_warning?: boolean | null
          lifting_capacity?: number | null
          loading_capacity?: number | null
          max_reach?: number | null
          noise_level?: number | null
          operating_weight?: number | null
          pto_available?: boolean | null
          retarder?: boolean | null
          suspension_type?: string | null
          truck_id: string
          updated_at?: string
          winch_available?: boolean | null
          working_pressure?: number | null
        }
        Update: {
          abs_brakes?: boolean | null
          adaptive_cruise_control?: boolean | null
          air_conditioning?: boolean | null
          axle_configuration?: string | null
          blind_spot_monitoring?: boolean | null
          bucket_capacity?: number | null
          cabin_type?: string | null
          collision_avoidance?: boolean | null
          crane_capacity?: string | null
          created_at?: string
          cruise_control?: boolean | null
          drive_type?: string | null
          ebs_brakes?: boolean | null
          esp_system?: boolean | null
          euro_standard?: string | null
          fuel_consumption?: number | null
          fuel_type?: string | null
          hydraulic_system?: string | null
          id?: string
          lane_departure_warning?: boolean | null
          lifting_capacity?: number | null
          loading_capacity?: number | null
          max_reach?: number | null
          noise_level?: number | null
          operating_weight?: number | null
          pto_available?: boolean | null
          retarder?: boolean | null
          suspension_type?: string | null
          truck_id?: string
          updated_at?: string
          winch_available?: boolean | null
          working_pressure?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_specifications_truck_id_fkey"
            columns: ["truck_id"]
            isOneToOne: false
            referencedRelation: "trucks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_admin_profile: {
        Args: { user_email: string }
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      vehicle_category: "trucks" | "machinery" | "agriculture"
      vehicle_subcategory:
        | "tractor-unit"
        | "truck-over"
        | "light-trucks"
        | "excavators"
        | "loaders"
        | "loaders-backhoe"
        | "dumpers"
        | "motor-grades"
        | "compactors"
        | "asphalt-equipment"
        | "cranes"
        | "forklift"
        | "teleunder"
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
    Enums: {
      vehicle_category: ["trucks", "machinery", "agriculture"],
      vehicle_subcategory: [
        "tractor-unit",
        "truck-over",
        "light-trucks",
        "excavators",
        "loaders",
        "loaders-backhoe",
        "dumpers",
        "motor-grades",
        "compactors",
        "asphalt-equipment",
        "cranes",
        "forklift",
        "teleunder",
      ],
    },
  },
} as const
