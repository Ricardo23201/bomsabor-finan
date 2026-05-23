import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  accent?: "primary" | "gold" | "destructive" | "muted";
  trend?: number;
}

export function StatCard({ label, value, hint, icon: Icon, accent = "muted", trend }: StatCardProps) {
  const accentBg = {
    primary: "bg-primary/10 text-primary",
    gold: "bg-[oklch(0.7_0.14_75)]/15 text-[oklch(0.55_0.13_75)]",
    destructive: "bg-destructive/10 text-destructive",
    muted: "bg-muted text-muted-foreground",
  }[accent];

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-card transition hover:shadow-elegant">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 truncate font-display text-2xl font-semibold text-foreground">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", accentBg)}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      {typeof trend === "number" && (
        <p className={cn("mt-3 text-xs font-medium", trend >= 0 ? "text-success" : "text-destructive")}>
          {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}% vs mês anterior
        </p>
      )}
    </div>
  );
}
