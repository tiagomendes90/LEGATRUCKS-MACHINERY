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
      brands: {
        Row: {
          id: string
          name: string
          slug: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      category_brands: {
        Row: {
          brand_id: string
          category_id: string
        }
        Insert: {
          brand_id: string
          category_id: string
        }
        Update: {
          brand_id?: string
          category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_brands_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_brands_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          interest: string | null
          message: string
          metadata: Json
          name: string
          phone: string | null
          source: string
          status: string
          updated_at: string
          vehicle_id: string | null
          vehicle_title: string | null
          vehicle_url: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          interest?: string | null
          message: string
          metadata?: Json
          name: string
          phone?: string | null
          source?: string
          status?: string
          updated_at?: string
          vehicle_id?: string | null
          vehicle_title?: string | null
          vehicle_url?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          interest?: string | null
          message?: string
          metadata?: Json
          name?: string
          phone?: string | null
          source?: string
          status?: string
          updated_at?: string
          vehicle_id?: string | null
          vehicle_title?: string | null
          vehicle_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_products: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          product_id: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number
          created_at: string
          customer_email: string
          id: string
          message: string | null
          name: string
          order_date: string | null
          payment_status: string
          phone: string | null
          status: string
          truck_model: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          customer_email: string
          id?: string
          message?: string | null
          name: string
          order_date?: string | null
          payment_status?: string
          phone?: string | null
          status?: string
          truck_model?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          customer_email?: string
          id?: string
          message?: string | null
          name?: string
          order_date?: string | null
          payment_status?: string
          phone?: string | null
          status?: string
          truck_model?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: []
      }
      product_images: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          is_primary: boolean | null
          product_id: string | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          is_primary?: boolean | null
          product_id?: string | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          is_primary?: boolean | null
          product_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_social_hash_audit: {
        Row: {
          changed_fields: Json
          created_at: string
          id: string
          new_hash: string
          new_snapshot: Json
          old_hash: string | null
          old_snapshot: Json | null
          product_id: string
          source: string
        }
        Insert: {
          changed_fields?: Json
          created_at?: string
          id?: string
          new_hash: string
          new_snapshot: Json
          old_hash?: string | null
          old_snapshot?: Json | null
          product_id: string
          source?: string
        }
        Update: {
          changed_fields?: Json
          created_at?: string
          id?: string
          new_hash?: string
          new_snapshot?: Json
          old_hash?: string | null
          old_snapshot?: Json | null
          product_id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_social_hash_audit_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_social_posts: {
        Row: {
          caption: string | null
          channel_key: string
          created_at: string
          event_id: string | null
          external_id: string | null
          external_url: string | null
          id: string
          media: Json
          product_id: string | null
          published_at: string
          raw_response: Json
          status: string
          updated_at: string
        }
        Insert: {
          caption?: string | null
          channel_key: string
          created_at?: string
          event_id?: string | null
          external_id?: string | null
          external_url?: string | null
          id?: string
          media?: Json
          product_id?: string | null
          published_at?: string
          raw_response?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          caption?: string | null
          channel_key?: string
          created_at?: string
          event_id?: string | null
          external_id?: string | null
          external_url?: string | null
          id?: string
          media?: Json
          product_id?: string | null
          published_at?: string
          raw_response?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_social_posts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "publishing_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_social_posts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand_id: string | null
          category_id: string | null
          condition: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          is_active: boolean | null
          location_city: string | null
          location_country: string | null
          model: string | null
          price: number | null
          social_caption: string | null
          social_hash: string | null
          social_status: string
          stock_status: string | null
          subcategory_id: string | null
          title: string
          year: number | null
        }
        Insert: {
          brand_id?: string | null
          category_id?: string | null
          condition?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          location_city?: string | null
          location_country?: string | null
          model?: string | null
          price?: number | null
          social_caption?: string | null
          social_hash?: string | null
          social_status?: string
          stock_status?: string | null
          subcategory_id?: string | null
          title: string
          year?: number | null
        }
        Update: {
          brand_id?: string | null
          category_id?: string | null
          condition?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          location_city?: string | null
          location_country?: string | null
          model?: string | null
          price?: number | null
          social_caption?: string | null
          social_hash?: string | null
          social_status?: string
          stock_status?: string | null
          subcategory_id?: string | null
          title?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          role: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      publishing_channels: {
        Row: {
          config: Json
          created_at: string
          enabled: boolean
          key: string
          label: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          enabled?: boolean
          key: string
          label: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          enabled?: boolean
          key?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      publishing_event_transitions: {
        Row: {
          attempts: number | null
          created_at: string
          event_id: string
          from_status: string | null
          id: string
          reason: string | null
          retry_cycle: number | null
          to_status: string
          worker: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string
          event_id: string
          from_status?: string | null
          id?: string
          reason?: string | null
          retry_cycle?: number | null
          to_status: string
          worker?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string
          event_id?: string
          from_status?: string | null
          id?: string
          reason?: string | null
          retry_cycle?: number | null
          to_status?: string
          worker?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "publishing_event_transitions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "publishing_events"
            referencedColumns: ["id"]
          },
        ]
      }
      publishing_events: {
        Row: {
          attempts: number
          created_at: string
          dedupe_key: string | null
          event_type: string
          id: string
          last_error: string | null
          locked_at: string | null
          locked_by: string | null
          next_attempt_at: string | null
          payload: Json
          processed_at: string | null
          product_id: string | null
          retry_cycle: number
          scheduled_for: string | null
          status: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          dedupe_key?: string | null
          event_type: string
          id?: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          next_attempt_at?: string | null
          payload?: Json
          processed_at?: string | null
          product_id?: string | null
          retry_cycle?: number
          scheduled_for?: string | null
          status?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          dedupe_key?: string | null
          event_type?: string
          id?: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          next_attempt_at?: string | null
          payload?: Json
          processed_at?: string | null
          product_id?: string | null
          retry_cycle?: number
          scheduled_for?: string | null
          status?: string
        }
        Relationships: []
      }
      publishing_logs: {
        Row: {
          attempts: number
          channel_key: string
          created_at: string
          error: string | null
          event_id: string | null
          id: string
          request: Json
          response: Json
          status: string
        }
        Insert: {
          attempts?: number
          channel_key: string
          created_at?: string
          error?: string | null
          event_id?: string | null
          id?: string
          request?: Json
          response?: Json
          status: string
        }
        Update: {
          attempts?: number
          channel_key?: string
          created_at?: string
          error?: string | null
          event_id?: string | null
          id?: string
          request?: Json
          response?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "publishing_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "publishing_events"
            referencedColumns: ["id"]
          },
        ]
      }
      publishing_metrics: {
        Row: {
          channel_key: string
          clicks: number | null
          collected_at: string
          comments: number | null
          id: string
          impressions: number | null
          likes: number | null
          post_id: string
          raw: Json
          reach: number | null
          shares: number | null
        }
        Insert: {
          channel_key: string
          clicks?: number | null
          collected_at?: string
          comments?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          post_id: string
          raw?: Json
          reach?: number | null
          shares?: number | null
        }
        Update: {
          channel_key?: string
          clicks?: number | null
          collected_at?: string
          comments?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          post_id?: string
          raw?: Json
          reach?: number | null
          shares?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "publishing_metrics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "product_social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      spec_definitions: {
        Row: {
          created_at: string | null
          data_type: string
          id: string
          is_filterable: boolean | null
          label: string
          name: string
          subcategory_id: string | null
          unit: string | null
        }
        Insert: {
          created_at?: string | null
          data_type: string
          id?: string
          is_filterable?: boolean | null
          label: string
          name: string
          subcategory_id?: string | null
          unit?: string | null
        }
        Update: {
          created_at?: string | null
          data_type?: string
          id?: string
          is_filterable?: boolean | null
          label?: string
          name?: string
          subcategory_id?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spec_definitions_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      spec_values: {
        Row: {
          id: string
          product_id: string | null
          spec_definition_id: string | null
          value_boolean: boolean | null
          value_number: number | null
          value_text: string | null
        }
        Insert: {
          id?: string
          product_id?: string | null
          spec_definition_id?: string | null
          value_boolean?: boolean | null
          value_number?: number | null
          value_text?: string | null
        }
        Update: {
          id?: string
          product_id?: string | null
          spec_definition_id?: string | null
          value_boolean?: boolean | null
          value_number?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spec_values_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spec_values_spec_definition_id_fkey"
            columns: ["spec_definition_id"]
            isOneToOne: false
            referencedRelation: "spec_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategories: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      build_product_social_snapshot: {
        Args: { p_product_id: string }
        Returns: Json
      }
      claim_publishing_events: {
        Args: { p_limit?: number; p_worker?: string }
        Returns: {
          attempts: number
          created_at: string
          dedupe_key: string | null
          event_type: string
          id: string
          last_error: string | null
          locked_at: string | null
          locked_by: string | null
          next_attempt_at: string | null
          payload: Json
          processed_at: string | null
          product_id: string | null
          retry_cycle: number
          scheduled_for: string | null
          status: string
        }[]
        SetofOptions: {
          from: "*"
          to: "publishing_events"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      compute_dedupe_key: {
        Args: { p_event_type: string; p_payload: Json; p_product_id: string }
        Returns: string
      }
      compute_product_social_hash: {
        Args: { p_product_id: string }
        Returns: string
      }
      diff_social_snapshots: {
        Args: { new_s: Json; old_s: Json }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
      refresh_product_social_hash: {
        Args: { p_product_id: string; p_source?: string }
        Returns: string
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
