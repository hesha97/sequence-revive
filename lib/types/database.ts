// Generated from Supabase schema v2. Do not edit by hand.
// Regenerate via Supabase MCP `generate_typescript_types` after every migration.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_calls: {
        Row: {
          cache_creation_tokens: number
          cache_read_tokens: number
          call_type: string
          cost_usd: number
          created_at: string
          error_message: string | null
          id: string
          input_tokens: number
          latency_ms: number | null
          metadata: Json | null
          model: string
          organization_id: string | null
          output_tokens: number
          success: boolean
          user_id: string | null
        }
        Insert: {
          cache_creation_tokens?: number
          cache_read_tokens?: number
          call_type: string
          cost_usd?: number
          created_at?: string
          error_message?: string | null
          id?: string
          input_tokens?: number
          latency_ms?: number | null
          metadata?: Json | null
          model: string
          organization_id?: string | null
          output_tokens?: number
          success?: boolean
          user_id?: string | null
        }
        Update: {
          cache_creation_tokens?: number
          cache_read_tokens?: number
          call_type?: string
          cost_usd?: number
          created_at?: string
          error_message?: string | null
          id?: string
          input_tokens?: number
          latency_ms?: number | null
          metadata?: Json | null
          model?: string
          organization_id?: string | null
          output_tokens?: number
          success?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      brain_versions: {
        Row: {
          brain: Json
          client_id: string
          created_at: string
          created_by_user_id: string | null
          id: string
          organization_id: string
          source: string
          version: number
          voice_modes: Json | null
        }
        Insert: {
          brain: Json
          client_id: string
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          organization_id: string
          source?: string
          version: number
          voice_modes?: Json | null
        }
        Update: {
          brain?: Json
          client_id?: string
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          organization_id?: string
          source?: string
          version?: number
          voice_modes?: Json | null
        }
        Relationships: []
      }
      campaign_prospects: {
        Row: {
          added_at: string
          campaign_id: string
          current_step: number
          generated_emails: Json | null
          generation_status: string
          id: string
          last_action_at: string | null
          organization_id: string
          outcome: string | null
          prospect_id: string
          stage: string
        }
        Insert: {
          added_at?: string
          campaign_id: string
          current_step?: number
          generated_emails?: Json | null
          generation_status?: string
          id?: string
          last_action_at?: string | null
          organization_id: string
          outcome?: string | null
          prospect_id: string
          stage?: string
        }
        Update: {
          added_at?: string
          campaign_id?: string
          current_step?: number
          generated_emails?: Json | null
          generation_status?: string
          id?: string
          last_action_at?: string | null
          organization_id?: string
          outcome?: string | null
          prospect_id?: string
          stage?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          architecture: Json | null
          client_id: string
          created_at: string
          id: string
          instantly_campaign_id: string | null
          launched_at: string | null
          lemlist_campaign_id: string | null
          name: string
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          architecture?: Json | null
          client_id: string
          created_at?: string
          id?: string
          instantly_campaign_id?: string | null
          launched_at?: string | null
          lemlist_campaign_id?: string | null
          name: string
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          architecture?: Json | null
          client_id?: string
          created_at?: string
          id?: string
          instantly_campaign_id?: string | null
          launched_at?: string | null
          lemlist_campaign_id?: string | null
          name?: string
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          brain: Json | null
          created_at: string
          icp: Json | null
          id: string
          name: string
          organization_id: string
          slug: string
          updated_at: string
          voice_modes: Json | null
        }
        Insert: {
          brain?: Json | null
          created_at?: string
          icp?: Json | null
          id?: string
          name: string
          organization_id: string
          slug: string
          updated_at?: string
          voice_modes?: Json | null
        }
        Update: {
          brain?: Json | null
          created_at?: string
          icp?: Json | null
          id?: string
          name?: string
          organization_id?: string
          slug?: string
          updated_at?: string
          voice_modes?: Json | null
        }
        Relationships: []
      }
      list_prospects: {
        Row: {
          added_at: string
          id: string
          list_id: string
          organization_id: string
          prospect_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          list_id: string
          organization_id: string
          prospect_id: string
        }
        Update: {
          added_at?: string
          id?: string
          list_id?: string
          organization_id?: string
          prospect_id?: string
        }
        Relationships: []
      }
      lists: {
        Row: {
          client_id: string | null
          created_at: string
          created_by_user_id: string | null
          filters: Json | null
          id: string
          kind: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by_user_id?: string | null
          filters?: Json | null
          id?: string
          kind?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by_user_id?: string | null
          filters?: Json | null
          id?: string
          kind?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      mailbox_connections: {
        Row: {
          created_at: string
          daily_cap: number
          display_name: string | null
          email_address: string
          external_id: string | null
          id: string
          last_health_check_at: string | null
          metadata: Json | null
          organization_id: string
          provider: string
          status: string
          updated_at: string
          warmup_started_at: string | null
          warmup_state: string
        }
        Insert: {
          created_at?: string
          daily_cap?: number
          display_name?: string | null
          email_address: string
          external_id?: string | null
          id?: string
          last_health_check_at?: string | null
          metadata?: Json | null
          organization_id: string
          provider: string
          status?: string
          updated_at?: string
          warmup_started_at?: string | null
          warmup_state?: string
        }
        Update: {
          created_at?: string
          daily_cap?: number
          display_name?: string | null
          email_address?: string
          external_id?: string | null
          id?: string
          last_health_check_at?: string | null
          metadata?: Json | null
          organization_id?: string
          provider?: string
          status?: string
          updated_at?: string
          warmup_started_at?: string | null
          warmup_state?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          body: string
          created_at: string
          created_by_user_id: string | null
          id: string
          organization_id: string
          prospect_id: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          organization_id: string
          prospect_id: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          organization_id?: string
          prospect_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          ai_spend_usd_this_month: number
          created_at: string
          emails_found_this_month: number
          emails_sent_this_month: number
          id: string
          name: string
          phones_found_this_month: number
          plan: string
          slug: string
          updated_at: string
          usage_period_start: string
        }
        Insert: {
          ai_spend_usd_this_month?: number
          created_at?: string
          emails_found_this_month?: number
          emails_sent_this_month?: number
          id?: string
          name: string
          phones_found_this_month?: number
          plan?: string
          slug: string
          updated_at?: string
          usage_period_start?: string
        }
        Update: {
          ai_spend_usd_this_month?: number
          created_at?: string
          emails_found_this_month?: number
          emails_sent_this_month?: number
          id?: string
          name?: string
          phones_found_this_month?: number
          plan?: string
          slug?: string
          updated_at?: string
          usage_period_start?: string
        }
        Relationships: []
      }
      prospects: {
        Row: {
          client_id: string
          company_name: string | null
          created_at: string
          email: string | null
          email_verification_status: string | null
          first_name: string | null
          id: string
          intel_status: string
          job_title: string | null
          last_name: string | null
          lifecycle: string
          linkedin_url: string | null
          organization_id: string
          research: Json | null
          source: string
          source_id: string | null
          tags: string[]
          updated_at: string
        }
        Insert: {
          client_id: string
          company_name?: string | null
          created_at?: string
          email?: string | null
          email_verification_status?: string | null
          first_name?: string | null
          id?: string
          intel_status?: string
          job_title?: string | null
          last_name?: string | null
          lifecycle?: string
          linkedin_url?: string | null
          organization_id: string
          research?: Json | null
          source: string
          source_id?: string | null
          tags?: string[]
          updated_at?: string
        }
        Update: {
          client_id?: string
          company_name?: string | null
          created_at?: string
          email?: string | null
          email_verification_status?: string | null
          first_name?: string | null
          id?: string
          intel_status?: string
          job_title?: string | null
          last_name?: string | null
          lifecycle?: string
          linkedin_url?: string | null
          organization_id?: string
          research?: Json | null
          source?: string
          source_id?: string | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      replies: {
        Row: {
          action_taken: string | null
          body: string | null
          campaign_id: string | null
          channel: string
          classification: string | null
          classification_confidence: number | null
          created_at: string
          direction: string
          draft_response: string | null
          id: string
          is_hot_lead: boolean
          operator_reviewed_at: string | null
          organization_id: string
          prospect_id: string | null
          received_at: string
        }
        Insert: {
          action_taken?: string | null
          body?: string | null
          campaign_id?: string | null
          channel: string
          classification?: string | null
          classification_confidence?: number | null
          created_at?: string
          direction: string
          draft_response?: string | null
          id?: string
          is_hot_lead?: boolean
          operator_reviewed_at?: string | null
          organization_id: string
          prospect_id?: string | null
          received_at: string
        }
        Update: {
          action_taken?: string | null
          body?: string | null
          campaign_id?: string | null
          channel?: string
          classification?: string | null
          classification_confidence?: number | null
          created_at?: string
          direction?: string
          draft_response?: string | null
          id?: string
          is_hot_lead?: boolean
          operator_reviewed_at?: string | null
          organization_id?: string
          prospect_id?: string | null
          received_at?: string
        }
        Relationships: []
      }
      signals: {
        Row: {
          body: string | null
          created_at: string
          detected_at: string
          id: string
          organization_id: string
          prospect_id: string | null
          signal_type: string
          source_url: string | null
          strength: string
          title: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          detected_at?: string
          id?: string
          organization_id: string
          prospect_id?: string | null
          signal_type: string
          source_url?: string | null
          strength?: string
          title?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          detected_at?: string
          id?: string
          organization_id?: string
          prospect_id?: string | null
          signal_type?: string
          source_url?: string | null
          strength?: string
          title?: string | null
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by_user_id: string | null
          organization_id: string
          role: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by_user_id?: string | null
          organization_id: string
          role?: string
          status?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by_user_id?: string | null
          organization_id?: string
          role?: string
          status?: string
          token?: string
        }
        Relationships: []
      }
      usage_events: {
        Row: {
          cost_credits: number
          cost_usd: number
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          organization_id: string
        }
        Insert: {
          cost_credits?: number
          cost_usd?: number
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          organization_id: string
        }
        Update: {
          cost_credits?: number
          cost_usd?: number
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      user_org_ids: { Args: Record<string, never>; Returns: string[] }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
