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
      dewormings: {
        Row: {
          applied_at: string
          created_at: string
          id: string
          next_due: string | null
          notes: string | null
          owner_id: string
          pet_id: string
          product: string
          type: string | null
          updated_at: string
          vet_name: string | null
        }
        Insert: {
          applied_at: string
          created_at?: string
          id?: string
          next_due?: string | null
          notes?: string | null
          owner_id: string
          pet_id: string
          product: string
          type?: string | null
          updated_at?: string
          vet_name?: string | null
        }
        Update: {
          applied_at?: string
          created_at?: string
          id?: string
          next_due?: string | null
          notes?: string | null
          owner_id?: string
          pet_id?: string
          product?: string
          type?: string | null
          updated_at?: string
          vet_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dewormings_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitalizations: {
        Row: {
          admitted_at: string
          created_at: string
          discharged_at: string | null
          id: string
          notes: string | null
          owner_id: string
          pet_id: string
          reason: string
          status: string | null
          updated_at: string
          vet_name: string | null
        }
        Insert: {
          admitted_at: string
          created_at?: string
          discharged_at?: string | null
          id?: string
          notes?: string | null
          owner_id: string
          pet_id: string
          reason: string
          status?: string | null
          updated_at?: string
          vet_name?: string | null
        }
        Update: {
          admitted_at?: string
          created_at?: string
          discharged_at?: string | null
          id?: string
          notes?: string | null
          owner_id?: string
          pet_id?: string
          reason?: string
          status?: string | null
          updated_at?: string
          vet_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hospitalizations_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_files: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          pet_id: string
          type: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          pet_id: string
          type?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          pet_id?: string
          type?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_files_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_photos: {
        Row: {
          created_at: string
          description: string | null
          id: string
          owner_id: string
          pet_id: string
          taken_at: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          owner_id: string
          pet_id: string
          taken_at?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          owner_id?: string
          pet_id?: string
          taken_at?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_photos_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          allergies: string | null
          birth_date: string | null
          breed: string | null
          client_id: string | null
          color: string | null
          created_at: string
          id: string
          microchip: string | null
          name: string
          notes: string | null
          owner_id: string
          photo: string | null
          sex: string | null
          species: string | null
          sterilized: boolean | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          allergies?: string | null
          birth_date?: string | null
          breed?: string | null
          client_id?: string | null
          color?: string | null
          created_at?: string
          id?: string
          microchip?: string | null
          name: string
          notes?: string | null
          owner_id: string
          photo?: string | null
          sex?: string | null
          species?: string | null
          sterilized?: boolean | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          allergies?: string | null
          birth_date?: string | null
          breed?: string | null
          client_id?: string | null
          color?: string | null
          created_at?: string
          id?: string
          microchip?: string | null
          name?: string
          notes?: string | null
          owner_id?: string
          photo?: string | null
          sex?: string | null
          species?: string | null
          sterilized?: boolean | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: []
      }
      surgeries: {
        Row: {
          anesthesia: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          outcome: string | null
          owner_id: string
          performed_at: string
          pet_id: string
          updated_at: string
          vet_name: string | null
        }
        Insert: {
          anesthesia?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          outcome?: string | null
          owner_id: string
          performed_at: string
          pet_id: string
          updated_at?: string
          vet_name?: string | null
        }
        Update: {
          anesthesia?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          outcome?: string | null
          owner_id?: string
          performed_at?: string
          pet_id?: string
          updated_at?: string
          vet_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "surgeries_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccines: {
        Row: {
          application_date: string
          batch_number: string | null
          created_at: string
          id: string
          laboratory: string | null
          next_due_date: string | null
          notes: string | null
          owner_id: string
          pet_id: string
          updated_at: string
          vaccine_name: string
          veterinarian: string | null
        }
        Insert: {
          application_date: string
          batch_number?: string | null
          created_at?: string
          id?: string
          laboratory?: string | null
          next_due_date?: string | null
          notes?: string | null
          owner_id: string
          pet_id: string
          updated_at?: string
          vaccine_name: string
          veterinarian?: string | null
        }
        Update: {
          application_date?: string
          batch_number?: string | null
          created_at?: string
          id?: string
          laboratory?: string | null
          next_due_date?: string | null
          notes?: string | null
          owner_id?: string
          pet_id?: string
          updated_at?: string
          vaccine_name?: string
          veterinarian?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vaccines_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
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
