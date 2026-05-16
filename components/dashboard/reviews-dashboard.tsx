"use client";

import { motion }     from "framer-motion";
import { Star }       from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarDisplay } from "@/components/shared/star-rating";
import { formatDistanceToNow } from "date-fns";

interface ReviewsDashboardProps {
  reviews:    any[];
  avgRating:  number;
  total:      number;
  breakdown:  Record<number, number>;
}

export function ReviewsDashboard({
  reviews, avgRating, total, breakdown,
}: ReviewsDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground mb-1">
          My reviews
        </h1>
        <p className="text-sm text-muted-foreground">
          What hirers are saying about your work.
        </p>
      </div>

      {total === 0 ? (
        <div className="text-center py-20 bg-card border border-border/60 rounded-2xl">
          <Star className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground mb-2">
            No reviews yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Complete jobs and ask hirers to leave you a review.
          </p>
        </div>
      ) : (
        <>
          {/* Summary card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border/60 rounded-2xl shadow-soft p-6"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Average */}
              <div className="text-center sm:border-r sm:border-border/60 sm:pr-8">
                <p className="text-5xl font-display font-bold text-foreground mb-1">
                  {avgRating.toFixed(1)}
                </p>
                <StarDisplay rating={avgRating} size="md" />
                <p className="text-xs text-muted-foreground mt-1.5">
                  {total} review{total !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Breakdown bars */}
              <div className="flex-1 w-full space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = breakdown[star] ?? 0;
                  const pct   = total ? Math.round((count / total) * 100) : 0;

                  return (
                    <div key={star} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-8 flex-shrink-0">
                        <span className="text-xs font-medium text-muted-foreground">
                          {star}
                        </span>
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      </div>
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full bg-amber-400 rounded-full"
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Reviews list */}
          <div className="space-y-4">
            {reviews.map((review: any, i: number) => {
              const hirer    = review.hirer;
              const name     = hirer?.full_name ?? "Anonymous";
              const initials = name
                .split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
              const timeAgo  = formatDistanceToNow(
                new Date(review.created_at), { addSuffix: true }
              );

              return (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border/60 rounded-xl shadow-card p-5"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-9 h-9 flex-shrink-0">
                      <AvatarImage src={hirer?.avatar_url ?? ""} />
                      <AvatarFallback className="bg-secondary text-sm font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {name}
                          </span>
                          <StarDisplay rating={review.rating} size="sm" />
                        </div>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {timeAgo}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}