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
      account_balances: {
        Row: {
          account_id: string
          available_balance_minor: number
          calculated_at: string
          currency: string
          held_balance_minor: number
          ledger_balance_minor: number
          updated_at: string
          version: number
        }
        Insert: {
          account_id: string
          available_balance_minor?: number
          calculated_at?: string
          currency: string
          held_balance_minor?: number
          ledger_balance_minor?: number
          updated_at?: string
          version?: number
        }
        Update: {
          account_id?: string
          available_balance_minor?: number
          calculated_at?: string
          currency?: string
          held_balance_minor?: number
          ledger_balance_minor?: number
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "account_balances_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      account_holds: {
        Row: {
          account_id: string
          amount_minor: number
          captured_at: string | null
          created_at: string
          currency: string
          expires_at: string | null
          id: string
          idempotency_key: string
          reason_type: string
          released_at: string | null
          source_reference: string | null
          status: Database["public"]["Enums"]["account_hold_status"]
          updated_at: string
        }
        Insert: {
          account_id: string
          amount_minor: number
          captured_at?: string | null
          created_at?: string
          currency: string
          expires_at?: string | null
          id?: string
          idempotency_key: string
          reason_type: string
          released_at?: string | null
          source_reference?: string | null
          status?: Database["public"]["Enums"]["account_hold_status"]
          updated_at?: string
        }
        Update: {
          account_id?: string
          amount_minor?: number
          captured_at?: string | null
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          idempotency_key?: string
          reason_type?: string
          released_at?: string | null
          source_reference?: string | null
          status?: Database["public"]["Enums"]["account_hold_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_holds_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      account_status_history: {
        Row: {
          account_id: string
          changed_by: string | null
          created_at: string
          id: string
          internal_note: string | null
          new_status: Database["public"]["Enums"]["bank_account_status"]
          previous_status:
            | Database["public"]["Enums"]["bank_account_status"]
            | null
          reason_category: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          changed_by?: string | null
          created_at?: string
          id?: string
          internal_note?: string | null
          new_status: Database["public"]["Enums"]["bank_account_status"]
          previous_status?:
            | Database["public"]["Enums"]["bank_account_status"]
            | null
          reason_category?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          internal_note?: string | null
          new_status?: Database["public"]["Enums"]["bank_account_status"]
          previous_status?:
            | Database["public"]["Enums"]["bank_account_status"]
            | null
          reason_category?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_status_history_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_number: string
          account_type: Database["public"]["Enums"]["bank_account_type"]
          bank_code: string | null
          bic: string | null
          branch_code: string | null
          closed_at: string | null
          created_at: string
          currency: string
          currency_minor_unit: number
          display_name: string
          iban: string | null
          id: string
          is_primary: boolean
          opened_at: string | null
          public_reference: string
          status: Database["public"]["Enums"]["bank_account_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number: string
          account_type?: Database["public"]["Enums"]["bank_account_type"]
          bank_code?: string | null
          bic?: string | null
          branch_code?: string | null
          closed_at?: string | null
          created_at?: string
          currency?: string
          currency_minor_unit?: number
          display_name?: string
          iban?: string | null
          id?: string
          is_primary?: boolean
          opened_at?: string | null
          public_reference: string
          status?: Database["public"]["Enums"]["bank_account_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string
          account_type?: Database["public"]["Enums"]["bank_account_type"]
          bank_code?: string | null
          bic?: string | null
          branch_code?: string | null
          closed_at?: string | null
          created_at?: string
          currency?: string
          currency_minor_unit?: number
          display_name?: string
          iban?: string | null
          id?: string
          is_primary?: boolean
          opened_at?: string | null
          public_reference?: string
          status?: Database["public"]["Enums"]["bank_account_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      ledger_accounts: {
        Row: {
          account_class: Database["public"]["Enums"]["ledger_account_class"]
          bank_account_id: string | null
          code: string
          created_at: string
          currency: string
          id: string
          name: string
          normal_side: Database["public"]["Enums"]["ledger_side"]
          status: Database["public"]["Enums"]["ledger_account_status"]
          updated_at: string
        }
        Insert: {
          account_class: Database["public"]["Enums"]["ledger_account_class"]
          bank_account_id?: string | null
          code: string
          created_at?: string
          currency: string
          id?: string
          name: string
          normal_side: Database["public"]["Enums"]["ledger_side"]
          status?: Database["public"]["Enums"]["ledger_account_status"]
          updated_at?: string
        }
        Update: {
          account_class?: Database["public"]["Enums"]["ledger_account_class"]
          bank_account_id?: string | null
          code?: string
          created_at?: string
          currency?: string
          id?: string
          name?: string
          normal_side?: Database["public"]["Enums"]["ledger_side"]
          status?: Database["public"]["Enums"]["ledger_account_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_accounts_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          amount_minor: number
          created_at: string
          currency: string
          description: string | null
          entry_side: Database["public"]["Enums"]["ledger_side"]
          id: string
          ledger_account_id: string
          ledger_transaction_id: string
          line_number: number
        }
        Insert: {
          amount_minor: number
          created_at?: string
          currency: string
          description?: string | null
          entry_side: Database["public"]["Enums"]["ledger_side"]
          id?: string
          ledger_account_id: string
          ledger_transaction_id: string
          line_number: number
        }
        Update: {
          amount_minor?: number
          created_at?: string
          currency?: string
          description?: string | null
          entry_side?: Database["public"]["Enums"]["ledger_side"]
          id?: string
          ledger_account_id?: string
          ledger_transaction_id?: string
          line_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_ledger_account_id_fkey"
            columns: ["ledger_account_id"]
            isOneToOne: false
            referencedRelation: "ledger_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_ledger_transaction_id_fkey"
            columns: ["ledger_transaction_id"]
            isOneToOne: false
            referencedRelation: "ledger_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_transactions: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          description: string
          effective_at: string
          id: string
          idempotency_key: string
          metadata: Json
          posted_at: string | null
          public_reference: string
          reversal_of: string | null
          source_reference: string | null
          source_type: string
          status: Database["public"]["Enums"]["ledger_transaction_status"]
          transaction_type: Database["public"]["Enums"]["ledger_transaction_type"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency: string
          description: string
          effective_at?: string
          id?: string
          idempotency_key: string
          metadata?: Json
          posted_at?: string | null
          public_reference: string
          reversal_of?: string | null
          source_reference?: string | null
          source_type: string
          status?: Database["public"]["Enums"]["ledger_transaction_status"]
          transaction_type: Database["public"]["Enums"]["ledger_transaction_type"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string
          effective_at?: string
          id?: string
          idempotency_key?: string
          metadata?: Json
          posted_at?: string | null
          public_reference?: string
          reversal_of?: string | null
          source_reference?: string | null
          source_type?: string
          status?: Database["public"]["Enums"]["ledger_transaction_status"]
          transaction_type?: Database["public"]["Enums"]["ledger_transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "ledger_transactions_reversal_of_fkey"
            columns: ["reversal_of"]
            isOneToOne: true
            referencedRelation: "ledger_transactions"
            referencedColumns: ["id"]
          },
        ]
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
      customer_account_activity: {
        Row: {
          account_reference: string | null
          amount_minor: number | null
          completed_at: string | null
          counterparty_display: string | null
          currency: string | null
          direction: string | null
          display_description: string | null
          entry_id: string | null
          minor_unit: number | null
          occurred_at: string | null
          reference: string | null
          source_type: string | null
          status: string | null
          transaction_type: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      capture_account_hold: { Args: { _hold_id: string }; Returns: undefined }
      check_balance_projection_integrity: {
        Args: never
        Returns: {
          account_id: string
          ledger_computed: number
          matches: boolean
          projection_value: number
        }[]
      }
      create_account_hold: {
        Args: {
          _account_id: string
          _amount_minor: number
          _expires_at?: string
          _idempotency_key: string
          _reason_type: string
          _source_reference: string
        }
        Returns: string
      }
      customer_monthly_activity_summary: {
        Args: {
          _account_reference: string
          _period_end: string
          _period_start: string
        }
        Returns: {
          money_in_minor: number
          money_out_minor: number
          operation_count: number
        }[]
      }
      ensure_bank_account_ledger_account: {
        Args: { _bank_account_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      next_account_public_reference: { Args: never; Returns: string }
      next_ledger_transaction_reference: { Args: never; Returns: string }
      post_ledger_transaction: {
        Args: {
          _created_by?: string
          _currency: string
          _description: string
          _entries: Json
          _idempotency_key: string
          _metadata?: Json
          _reversal_of?: string
          _source_reference: string
          _source_type: string
          _transaction_type: Database["public"]["Enums"]["ledger_transaction_type"]
        }
        Returns: {
          already_posted: boolean
          id: string
          public_reference: string
        }[]
      }
      provision_primary_account: { Args: { _user_id: string }; Returns: string }
      recalculate_account_balance: {
        Args: { _account_id: string }
        Returns: undefined
      }
      release_account_hold: { Args: { _hold_id: string }; Returns: undefined }
      reverse_ledger_transaction: {
        Args: { _created_by?: string; _reason: string; _transaction_id: string }
        Returns: {
          already_posted: boolean
          id: string
          public_reference: string
        }[]
      }
    }
    Enums: {
      account_hold_status: "ACTIVE" | "RELEASED" | "CAPTURED" | "EXPIRED"
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
      bank_account_status:
        | "PENDING"
        | "ACTIVE"
        | "RESTRICTED"
        | "SUSPENDED"
        | "FROZEN"
        | "CLOSING"
        | "CLOSED"
      bank_account_type: "CURRENT" | "SAVINGS"
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
      ledger_account_class:
        | "ASSET"
        | "LIABILITY"
        | "EQUITY"
        | "REVENUE"
        | "EXPENSE"
      ledger_account_status: "ACTIVE" | "INACTIVE" | "CLOSED"
      ledger_side: "DEBIT" | "CREDIT"
      ledger_transaction_status: "DRAFT" | "POSTED"
      ledger_transaction_type:
        | "ACCOUNT_OPENING"
        | "TRANSFER"
        | "FUNDING"
        | "FEE"
        | "REFUND"
        | "ADJUSTMENT"
        | "REVERSAL"
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
      account_hold_status: ["ACTIVE", "RELEASED", "CAPTURED", "EXPIRED"],
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
      bank_account_status: [
        "PENDING",
        "ACTIVE",
        "RESTRICTED",
        "SUSPENDED",
        "FROZEN",
        "CLOSING",
        "CLOSED",
      ],
      bank_account_type: ["CURRENT", "SAVINGS"],
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
      ledger_account_class: [
        "ASSET",
        "LIABILITY",
        "EQUITY",
        "REVENUE",
        "EXPENSE",
      ],
      ledger_account_status: ["ACTIVE", "INACTIVE", "CLOSED"],
      ledger_side: ["DEBIT", "CREDIT"],
      ledger_transaction_status: ["DRAFT", "POSTED"],
      ledger_transaction_type: [
        "ACCOUNT_OPENING",
        "TRANSFER",
        "FUNDING",
        "FEE",
        "REFUND",
        "ADJUSTMENT",
        "REVERSAL",
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
