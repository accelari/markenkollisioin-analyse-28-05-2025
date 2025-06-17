import { createClient } from "@supabase/supabase-js"
// Update to use the config
import { config } from "./config"

export const supabase = createClient(config.supabase.url, config.supabase.anonKey)

export interface CaseData {
  id?: string
  case_number?: string
  status?: string
  auftragsmarke: string
  gegenmarke: string
  claude_analysis?: string
  deepseek_analysis?: string
  gemini_analysis?: string
  openai_analysis?: string
  final_analysis?: string
  recommendation?: string
  confidence_level?: number
  client_email?: string
  client_name?: string
  opposition_prepared?: boolean
  opposition_email_sent?: boolean
  opposition_deadline?: string
  analysis_date?: string
  created_at?: string
  updated_at?: string
}
