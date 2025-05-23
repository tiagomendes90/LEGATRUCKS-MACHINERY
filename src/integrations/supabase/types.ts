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
      profiles: {
        Row: {
          createdAt: string | null
          email: string
          id: string
          role: string
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string | null
          email: string
          id: string
          role?: string
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string | null
          email?: string
          id?: string
          role?: string
          updatedAt?: string | null
        }
        Relationships: []
      }
      stock: {
        Row: {
          ano: number | null
          criado_em: string | null
          descricao: string | null
          estado: string | null
          galeria: string | null
          id: string
          imagem_url: string | null
          kms: number | null
          marca: string
          modelo: string
          potencia: string | null
          preco: number | null
          tipo: string | null
        }
        Insert: {
          ano?: number | null
          criado_em?: string | null
          descricao?: string | null
          estado?: string | null
          galeria?: string | null
          id?: string
          imagem_url?: string | null
          kms?: number | null
          marca: string
          modelo: string
          potencia?: string | null
          preco?: number | null
          tipo?: string | null
        }
        Update: {
          ano?: number | null
          criado_em?: string | null
          descricao?: string | null
          estado?: string | null
          galeria?: string | null
          id?: string
          imagem_url?: string | null
          kms?: number | null
          marca?: string
          modelo?: string
          potencia?: string | null
          preco?: number | null
          tipo?: string | null
        }
        Relationships: []
      }
      stock_novo: {
        Row: {
          ano: number | null
          data_insercao: string | null
          descricao: string | null
          destaque: boolean | null
          disponivel: boolean | null
          estado: string | null
          galeria: string[] | null
          id: string
          imagem_principal: string | null
          kms: number | null
          marca: string | null
          modelo: string | null
          potencia: string | null
          preco: number | null
          tipo: string | null
          vendido_em: string | null
        }
        Insert: {
          ano?: number | null
          data_insercao?: string | null
          descricao?: string | null
          destaque?: boolean | null
          disponivel?: boolean | null
          estado?: string | null
          galeria?: string[] | null
          id?: string
          imagem_principal?: string | null
          kms?: number | null
          marca?: string | null
          modelo?: string | null
          potencia?: string | null
          preco?: number | null
          tipo?: string | null
          vendido_em?: string | null
        }
        Update: {
          ano?: number | null
          data_insercao?: string | null
          descricao?: string | null
          destaque?: boolean | null
          disponivel?: boolean | null
          estado?: string | null
          galeria?: string[] | null
          id?: string
          imagem_principal?: string | null
          kms?: number | null
          marca?: string | null
          modelo?: string | null
          potencia?: string | null
          preco?: number | null
          tipo?: string | null
          vendido_em?: string | null
        }
        Relationships: []
      }
      trucks: {
        Row: {
          brand: string
          condition: string
          createdAt: string | null
          description: string
          engine: string
          features: string[] | null
          horsepower: number
          id: string
          images: string[] | null
          mileage: number
          model: string
          price: number
          transmission: string
          updatedAt: string | null
          year: number
        }
        Insert: {
          brand: string
          condition: string
          createdAt?: string | null
          description: string
          engine: string
          features?: string[] | null
          horsepower: number
          id?: string
          images?: string[] | null
          mileage?: number
          model: string
          price: number
          transmission: string
          updatedAt?: string | null
          year: number
        }
        Update: {
          brand?: string
          condition?: string
          createdAt?: string | null
          description?: string
          engine?: string
          features?: string[] | null
          horsepower?: number
          id?: string
          images?: string[] | null
          mileage?: number
          model?: string
          price?: number
          transmission?: string
          updatedAt?: string | null
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
