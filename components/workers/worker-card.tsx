import Link from "next/link";
import {
  Star, MapPin, Briefcase, CheckCircle2,
  Clock, DollarSign,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { WorkerProfileWithDetails } from "@/types/database";
import { cn } from "@/lib/utils";

interface WorkerCardProps {
  worker:  WorkerProfileWithDetails;
  variant?: "default" | "compact";
}

const AVAILABILITY_CONFIG = {
  available:   { label: "Available",   color: "bg-green-100 text-green-700  border-green-200" },
  busy:        { label: "Busy",        color: "bg-amber-100 text-amber-700  border-amber-200" },
  unavailable: { label: "Unavailable", color: "bg-red-100   text-red-700    border-red-200"   },
};

export function WorkerCard({ worker, variant = "default" }: WorkerCardProps) {
  const avail   = AVAILABILITY_CONFIG[worker.availability] ?? AVAILABILITY_CONFIG.available;
  const initials = (worker.user as any)?.full_name
    ?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const name     = (worker.user as any)?.full_name ?? "Worker";
  const avatar   = (worker.user as any)?.avatar_url ?? null;
  const catName  = (worker.category as any)?.name   ?? "";

  return (
    <Link
      href={`/workers/${worker.id}`}
      className={cn(
        "group block card-premium p-5 transition-all duration-200",
        variant === "compact" ? "p-4" : "p-5"
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Avatar className={cn(
            "ring-2 ring-border group-hover:ring-primary/30 transition-all flex-shrink-0",
            variant === "compact" ? "w-10 h-10" : "w-12 h-12"
          )}>
            <AvatarImage
              src={worker.profile_image_url ?? avatar ?? ""}
              alt={name}
            />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {name}
              </p>
              {worker.is_verified && (
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{worker.title}</p>
          </div>
        </div>

        {/* Availability badge */}
        <span className={cn(
          "text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0",
          avail.color
        )}>
          {avail.label}
        </span>
      </div>

      {/* Category + District */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {catName && (
          <Badge variant="secondary" className="text-xs font-medium">
            {catName}
          </Badge>
        )}
        <Badge variant="outline" className="text-xs text-muted-foreground gap-1">
          <MapPin className="w-2.5 h-2.5" />
          {worker.district}
        </Badge>
      </div>

      {/* Description preview */}
      {variant === "default" && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
          {worker.description}
        </p>
      )}

      {/* Portfolio preview */}
      {variant === "default" &&
        worker.portfolio &&
        worker.portfolio.length > 0 && (
          <div className="flex gap-1.5 mb-3 overflow-hidden rounded-lg">
            {worker.portfolio.slice(0, 3).map((img: any) => (
              <div
                key={img.id}
                className="w-16 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0"
              >
                <img
                  src={img.image_url}
                  alt={img.caption ?? "Portfolio"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
            {worker.portfolio.length > 3 && (
              <div className="w-16 h-12 rounded-md bg-muted flex-shrink-0 flex items-center justify-center">
                <span className="text-xs text-muted-foreground font-medium">
                  +{worker.portfolio.length - 3}
                </span>
              </div>
            )}
          </div>
        )}

      {/* Bottom row */}
      <div className="flex items-center justify-between pt-3 border-t border-border/40">
        <div className="flex items-center gap-3">
          {/* Rating */}
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-foreground">
              {Number(worker.avg_rating).toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">
              ({worker.total_reviews})
            </span>
          </div>

          {/* Experience */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Briefcase className="w-3 h-3" />
            {worker.experience_years}y
          </div>
        </div>

        {/* Price */}
        {worker.starting_price && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground leading-none mb-0.5">from</p>
            <p className="text-sm font-bold text-foreground">
              LKR {Number(worker.starting_price).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}