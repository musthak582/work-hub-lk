"use client";

import { useState } from "react";
import { Star }     from "lucide-react";
import { cn }       from "@/lib/utils";

interface StarRatingProps {
  value:       number;
  onChange?:   (rating: number) => void;
  readonly?:   boolean;
  size?:       "sm" | "md" | "lg";
  showLabel?:  boolean;
}

const LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very good",
  5: "Excellent",
};

const SIZES = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

export function StarRating({
  value, onChange, readonly = false,
  size = "md", showLabel = false,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            className={cn(
              "transition-transform duration-100",
              !readonly && "hover:scale-110 cursor-pointer",
              readonly && "cursor-default"
            )}
          >
            <Star
              className={cn(
                SIZES[size],
                "transition-colors duration-100",
                star <= active
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-muted-foreground/30"
              )}
            />
          </button>
        ))}
      </div>
      {showLabel && active > 0 && (
        <span className="text-sm font-medium text-foreground ml-1">
          {LABELS[active]}
        </span>
      )}
    </div>
  );
}

// Read-only display with decimal support
export function StarDisplay({
  rating, size = "sm",
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled  = rating >= star;
        const partial = !filled && rating > star - 1;
        const pct     = partial ? Math.round((rating - (star - 1)) * 100) : 0;

        return (
          <div key={star} className={cn("relative", SIZES[size])}>
            {/* Background (empty) */}
            <Star
              className={cn(
                SIZES[size],
                "absolute inset-0 fill-transparent text-muted-foreground/20"
              )}
            />
            {/* Filled portion */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: filled ? "100%" : `${pct}%` }}
            >
              <Star
                className={cn(SIZES[size], "fill-amber-400 text-amber-400")}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}