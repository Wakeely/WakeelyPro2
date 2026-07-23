// Hand-written domain types that mirror supabase/migrations/0001_core_schema.sql.
//
// NOTE: once your Supabase project is live, run `npm run supabase:types` to
// generate `src/types/database.types.ts` (the exact, auto-synced table types).
// These domain types are a slightly friendlier layer on top of that for use
// in components — most fields match 1:1 with the old src/types.ts from the
// AI Studio prototype, just renamed to snake_case to match Postgres.

export type UserRole = "partner" | "associate" | "paralegal" | "client";
export type RiskLevel = "Low" | "Medium" | "High";
export type MatterStatus = "Active" | "On Hold" | "Closed" | "Archived";
export type TaskStatus = "To Do" | "In Progress" | "Under Review" | "Completed";
export type PriorityLevel = "Low" | "Medium" | "High";
export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";
export type PrivilegeType =
  | "Attorney-Client Privilege"
  | "Work-Product Doctrine"
  | "Common Interest Privilege"
  | "Bank Confidentiality"
  | "Sharia Professional Secrecy";
export type ReviewStatus = "Flagged" | "Verified" | "Withheld";

export interface Matter {
  id: string;
  firm_id: string;
  title: string;
  description: string | null;
  client_name: string;
  client_email: string;
  client_user_id: string | null;
  jurisdiction: string | null;
  opposing_party: string | null;
  opposing_counsel: string | null;
  judge: string | null;
  court: string | null;
  statute_of_limitations: string | null;
  risk_level: RiskLevel;
  status: MatterStatus;
  win_probability: number | null;
  budget: number;
  expenses: number;
  created_by: string | null;
  created_at: string;
}

export interface AppDocument {
  id: string;
  matter_id: string;
  name: string;
  category: string;
  storage_path: string;
  file_size_bytes: number;
  mime_type: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
  visible_to_client: boolean;
  version: number;
  parent_document_id: string | null;
  is_redacted: boolean;
  redacted_from_id: string | null;
  ai_summary: string | null;
  ai_tags: string[];
}

export interface Task {
  id: string;
  matter_id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  due_date: string | null;
  priority: PriorityLevel;
  status: TaskStatus;
  visible_to_client: boolean;
  depends_on_task_ids: string[];
}

export interface TimeEntry {
  id: string;
  matter_id: string;
  description: string;
  hours: number;
  rate: number;
  entry_date: string;
  billed: boolean;
  task_code: string | null;
  activity_code: string | null;
}

export interface Invoice {
  id: string;
  matter_id: string;
  invoice_number: string;
  total_amount: number;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string | null;
  payment_tx_id: string | null;
}

export interface PrivilegeLogEntry {
  id: string;
  matter_id: string;
  doc_control_num: string;
  doc_date: string | null;
  author: string | null;
  recipients: string | null;
  doc_type: string | null;
  subject: string | null;
  privilege_claimed: PrivilegeType;
  justification: string | null;
  is_redacted: boolean;
  review_status: ReviewStatus;
}

export interface CourtRuleDeadline {
  title: string;
  category: "Hearing" | "Court Deadline" | "Filing" | "Arbitration";
  days_from_trigger: number;
  calculated_date: string;
  rule_reference: string;
  description: string;
  priority: PriorityLevel;
}
