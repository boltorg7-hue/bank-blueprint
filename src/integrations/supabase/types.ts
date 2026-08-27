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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      customer_addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          country: string
          created_at: string
          id: string
          is_primary: boolean
          postal_code: string | null
          region: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          country: string
          created_at?: string
          id?: string
          is_primary?: boolean
          postal_code?: string | null
          region?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          country?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          postal_code?: string | null
          region?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      identity_verifications: {
        Row: {
          created_at: string
          decided_at: string | null
          decision_reason: string | null
          id: string
          provider: string | null
          provider_reference: string | null
          requested_information: string | null
          status: Database["public"]["Enums"]["identity_verification_status"]
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decision_reason?: string | null
          id?: string
          provider?: string | null
          provider_reference?: string | null
          requested_information?: string | null
          status?: Database["public"]["Enums"]["identity_verification_status"]
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decision_reason?: string | null
          id?: string
          provider?: string | null
          provider_reference?: string | null
          requested_information?: string | null
          status?: Database["public"]["Enums"]["identity_verification_status"]
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          country_of_residence: string | null
          created_at: string
          date_of_birth: string | null
          first_name: string | null
          id: string
          last_name: string | null
          lifecycle_state: Database["public"]["Enums"]["customer_lifecycle_state"]
          marketing_consent: boolean
          middle_name: string | null
          nationality: string | null
          occupation: string | null
          onboarding_step: Database["public"]["Enums"]["onboarding_step"]
          phone: string | null
          phone_verified_at: string | null
          privacy_accepted_at: string | null
          terms_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          country_of_residence?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          lifecycle_state?: Database["public"]["Enums"]["customer_lifecycle_state"]
          marketing_consent?: boolean
          middle_name?: string | null
          nationality?: string | null
          occupation?: string | null
          onboarding_step?: Database["public"]["Enums"]["onboarding_step"]
          phone?: string | null
          phone_verified_at?: string | null
          privacy_accepted_at?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          country_of_residence?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          lifecycle_state?: Database["public"]["Enums"]["customer_lifecycle_state"]
          marketing_consent?: boolean
          middle_name?: string | null
          nationality?: string | null
          occupation?: string | null
          onboarding_step?: Database["public"]["Enums"]["onboarding_step"]
          phone?: string | null
          phone_verified_at?: string | null
          privacy_accepted_at?: string | null
          terms_accepted_at?: string | null
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
      verification_documents: {
        Row: {
          created_at: string
          document_type: Database["public"]["Enums"]["verification_document_type"]
          expires_at: string | null
          id: string
          mime_type: string | null
          original_filename: string | null
          rejection_reason: string | null
          size_bytes: number | null
          status: Database["public"]["Enums"]["verification_document_status"]
          storage_path: string
          updated_at: string
          user_id: string
          verification_id: string
        }
        Insert: {
          created_at?: string
          document_type: Database["public"]["Enums"]["verification_document_type"]
          expires_at?: string | null
          id?: string
          mime_type?: string | null
          original_filename?: string | null
          rejection_reason?: string | null
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["verification_document_status"]
          storage_path: string
          updated_at?: string
          user_id: string
          verification_id: string
        }
        Update: {
          created_at?: string
          document_type?: Database["public"]["Enums"]["verification_document_type"]
          expires_at?: string | null
          id?: string
          mime_type?: string | null
          original_filename?: string | null
          rejection_reason?: string | null
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["verification_document_status"]
          storage_path?: string
          updated_at?: string
          user_id?: string
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_documents_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "identity_verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_status: Database["public"]["Enums"]["identity_verification_status"]
          note: string | null
          previous_status:
            | Database["public"]["Enums"]["identity_verification_status"]
            | null
          user_id: string
          verification_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: Database["public"]["Enums"]["identity_verification_status"]
          note?: string | null
          previous_status?:
            | Database["public"]["Enums"]["identity_verification_status"]
            | null
          user_id: string
          verification_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["identity_verification_status"]
          note?: string | null
          previous_status?:
            | Database["public"]["Enums"]["identity_verification_status"]
            | null
          user_id?: string
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_status_history_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "identity_verifications"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "customer"
        | "support_agent"
        | "kyc_agent"
        | "compliance_officer"
        | "finance_operator"
        | "supervisor"
        | "administrator"
        | "super_admin"
        | "auditor"
      customer_lifecycle_state:
        | "VISITOR"
        | "REGISTERED"
        | "EMAIL_VERIFICATION_REQUIRED"
        | "CONTACT_VERIFICATION_REQUIRED"
        | "PROFILE_INCOMPLETE"
        | "IDENTITY_REQUIRED"
        | "IDENTITY_SUBMITTED"
        | "IDENTITY_UNDER_REVIEW"
        | "ADDITIONAL_DOCUMENT_REQUIRED"
        | "IDENTITY_VERIFIED"
        | "BANKING_REVIEW"
        | "ACTIVE"
        | "RESTRICTED"
        | "SUSPENDED"
        | "CLOSED"
      identity_verification_status:
        | "NOT_STARTED"
        | "IN_PROGRESS"
        | "SUBMITTED"
        | "UNDER_REVIEW"
        | "ADDITIONAL_INFORMATION_REQUIRED"
        | "VERIFIED"
        | "REJECTED"
        | "EXPIRED"
      onboarding_step:
        | "NOT_STARTED"
        | "CONTACT"
        | "PERSONAL_DETAILS"
        | "ADDRESS"
        | "IDENTITY"
        | "DOCUMENTS"
        | "REVIEW"
        | "COMPLETED"
      verification_document_status:
        | "UPLOADED"
        | "UNDER_REVIEW"
        | "ACCEPTED"
        | "ACTION_REQUIRED"
        | "EXPIRED"
        | "REJECTED"
      verification_document_type:
        | "IDENTITY_CARD"
        | "PASSPORT"
        | "RESIDENCE_PERMIT"
        | "PROOF_OF_ADDRESS"
        | "ADDITIONAL_DOCUMENT"
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
      app_role: [
        "customer",
        "support_agent",
        "kyc_agent",
        "compliance_officer",
        "finance_operator",
        "supervisor",
        "administrator",
        "super_admin",
        "auditor",
      ],
      customer_lifecycle_state: [
        "VISITOR",
        "REGISTERED",
        "EMAIL_VERIFICATION_REQUIRED",
        "CONTACT_VERIFICATION_REQUIRED",
        "PROFILE_INCOMPLETE",
        "IDENTITY_REQUIRED",
        "IDENTITY_SUBMITTED",
        "IDENTITY_UNDER_REVIEW",
        "ADDITIONAL_DOCUMENT_REQUIRED",
        "IDENTITY_VERIFIED",
        "BANKING_REVIEW",
        "ACTIVE",
        "RESTRICTED",
        "SUSPENDED",
        "CLOSED",
      ],
      identity_verification_status: [
        "NOT_STARTED",
        "IN_PROGRESS",
        "SUBMITTED",
        "UNDER_REVIEW",
        "ADDITIONAL_INFORMATION_REQUIRED",
        "VERIFIED",
        "REJECTED",
        "EXPIRED",
      ],
      onboarding_step: [
        "NOT_STARTED",
        "CONTACT",
        "PERSONAL_DETAILS",
        "ADDRESS",
        "IDENTITY",
        "DOCUMENTS",
        "REVIEW",
        "COMPLETED",
      ],
      verification_document_status: [
        "UPLOADED",
        "UNDER_REVIEW",
        "ACCEPTED",
        "ACTION_REQUIRED",
        "EXPIRED",
        "REJECTED",
      ],
      verification_document_type: [
        "IDENTITY_CARD",
        "PASSPORT",
        "RESIDENCE_PERMIT",
        "PROOF_OF_ADDRESS",
        "ADDITIONAL_DOCUMENT",
      ],
    },
  },
} as const
