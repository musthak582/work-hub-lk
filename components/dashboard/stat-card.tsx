import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title:      string;
  value:      string | number;
  subtitle?:  string;
  icon:       LucideIcon;
  iconColor?: string;
  iconBg?:    string;
  trend?:     { value: number; label: string };
}

export function StatCard({
  title, value, subtitle, icon: Icon,
  iconColor = "text-primary",
  iconBg    = "bg-primary/10",
  trend,
}: StatCardProps) {
  return (
    <div className="bg-card border border-border/60 rounded-xl shadow-card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconBg)}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            trend.value >= 0
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          )}>
            {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
          </span>
        )}
      </div>
      <p className="text-2xl font-display font-bold text-foreground mb-0.5">
        {value}
      </p>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground/70 mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-card border border-border/60 rounded-xl shadow-card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl skeleton" />
      </div>
      <div className="h-7 w-20 rounded skeleton mb-1.5" />
      <div className="h-4 w-28 rounded skeleton" />
    </div>
  );
}