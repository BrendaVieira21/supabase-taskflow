import type { Tables } from "@/integrations/supabase/types";

export type Task = Tables<"tasks">;
export type Filter = "all" | "pending" | "completed";