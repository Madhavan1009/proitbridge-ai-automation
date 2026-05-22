export type RiskLevel = "HIGH" | "MEDIUM" | "LOW";

export type EventType =
  | "commit"
  | "pull_request"
  | "deployment"
  | "incident"
  | "approval"
  | "webhook";

export type SimulationScenario =
  | "deployment_failure"
  | "high_risk_pr"
  | "production_incident"
  | "pending_approval"
  | "routine_commit";

export interface AnalysisResult {
  summary: string;
  risk_level: RiskLevel;
  blockers: string[];
  pending_reviews: string[];
  recommended_actions: string[];
  confidence: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  event_type: EventType;
  actor: string;
  repository: string;
  title: string;
  description: string;
  risk_level: RiskLevel;
  analysis: AnalysisResult;
  zapier_triggered: boolean;
  zapier_response?: string;
}

export interface DashboardStats {
  total_activities: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  automations_triggered: number;
  pending_reviews: number;
  active_blockers: number;
  recent_activities: ActivityLog[];
  risk_trend: Array<{
    date: string;
    high: number;
    medium: number;
    low: number;
    total: number;
  }>;
  event_breakdown: Record<string, number>;
  integrations: {
    groq_configured: boolean;
    zapier_configured: boolean;
  };
}

export interface AutomationRule {
  id?: string;
  name: string;
  condition: string;
  risk_filter?: RiskLevel | null;
  event_filter?: EventType | null;
  actions: string[];
  enabled: boolean;
  created_at?: string;
}

export type HealthLevel = "GREEN" | "YELLOW" | "RED";

export interface DailySummary {
  id: string;
  generated_at: string;
  window_hours: number;
  activity_count: number;
  headline: string;
  overall_health: HealthLevel;
  summary: string;
  top_risks: string[];
  active_blockers: string[];
  pending_approvals: string[];
  completed_work: string[];
  recommended_focus: string[];
  risk_breakdown: Record<string, number>;
  event_breakdown: Record<string, number>;
  zapier_triggered: boolean;
  zapier_response?: string;
}
