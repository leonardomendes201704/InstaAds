import type { AiCostEstimate } from "@/lib/ai-cost";
import type { AdCategory, AdStyle, PublishTarget } from "@/lib/types";

export type ProfileStatus = "active" | "blocked";

export interface Profile {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  status: ProfileStatus;
  blockedAt: string | null;
  blockedReason: string | null;
  blockedBy: string | null;
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string | null;
}

export interface StoredGeneration {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  createdAt: string;
  status: "success" | "error";
  adCategory: AdCategory;
  adStyle: AdStyle;
  mainMessage: string;
  publishTarget: PublishTarget;
  headline: string;
  subheadline: string;
  benefits: [string, string, string];
  cta: string;
  originalPhotoUrl: string;
  generatedArtUrl?: string;
  generatedStoriesUrl?: string;
  errorMessage?: string;
  aiCost?: AiCostEstimate;
}

export interface AdminStats {
  totalGenerations: number;
  uniqueUsers: number;
  totalCostUsd: number;
  generationsToday: number;
}

export interface DashboardStats extends AdminStats {
  totalUsers: number;
  usersToday: number;
  usersThisWeek: number;
  blockedUsers: number;
  generationsByDay: { date: string; count: number }[];
}

export type ActivityType =
  | "user.sign_in"
  | "generation.completed"
  | "generation.failed"
  | "admin.user_blocked"
  | "admin.user_unblocked";

export interface ActivityEvent {
  id: string;
  userId: string | null;
  type: ActivityType;
  metadata: Record<string, unknown>;
  createdAt: string;
  userEmail?: string | null;
  userName?: string | null;
}

export interface ProfileRow {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  status: ProfileStatus;
  blocked_at: string | null;
  blocked_reason: string | null;
  blocked_by: string | null;
  created_at: string;
  updated_at: string;
  last_seen_at: string | null;
}

export interface GenerationRow {
  id: string;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  created_at: string;
  status: "success" | "error";
  ad_category: AdCategory;
  ad_style: AdStyle;
  main_message: string;
  publish_target: PublishTarget;
  headline: string;
  subheadline: string;
  benefits: [string, string, string];
  cta: string;
  original_path: string;
  feed_path: string | null;
  stories_path: string | null;
  error_message: string | null;
  ai_cost: AiCostEstimate | null;
}

export interface ActivityRow {
  id: string;
  user_id: string | null;
  type: ActivityType;
  metadata: Record<string, unknown>;
  created_at: string;
  profiles?: { email: string | null; name: string | null } | null;
}
