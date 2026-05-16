"use client";

import { useTransition } from "react";
import { motion }        from "framer-motion";
import { Flag, FlagOff } from "lucide-react";
import { toast }         from "sonner";
import { Button }        from "@/components/ui/button";
import { StarDisplay }   from "@/components/shared/star-rating";
import { flagReviewAction } from "@/actions/admin";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export function AdminReviewsClient({ reviews }: { reviews: any[] }) {
  const [isPending, startTransition] = useTransition();

  function handleFlag(reviewId: string, flagged: boolean) {
    startTransition(async () => {
      const result = await flagReviewAction(reviewId, !flagged);
      result.success
        ? toast.success(`Review ${!flagged ? "flagged" : "unflagged"}.`)
        : toast.error(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold mb-1">Reviews</h1>
        <p className="text-sm text-muted-foreground">
          {reviews.length} reviews (most recent 50)
        </p>
      </div>

      <div className="space-y-3">
        {reviews.map((review: any, i) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className={cn(
              "bg-card border rounded-xl p-5 shadow-card",
              review.is_flagged
                ? "border-red-200 bg-red-50/30"
                : "border-border/60"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <StarDisplay rating={review.rating} size="sm" />
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs font-medium text-foreground">
                    {(review.hirer as any)?.full_name} →{" "}
                    {(review.worker_profile as any)?.title}
                  </span>
                  {review.is_flagged && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 font-medium">
                      Flagged
                    </span>
                  )}
                </div>

                {review.comment && (
                  <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                    "{review.comment}"
                  </p>
                )}

                <p className="text-xs text-muted-foreground mt-2">
                  {formatDistanceToNow(new Date(review.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleFlag(review.id, review.is_flagged)}
                disabled={isPending}
                className={cn(
                  "text-xs h-7 px-2 flex-shrink-0",
                  review.is_flagged
                    ? "border-green-200 text-green-700 hover:bg-green-50"
                    : "border-red-200   text-red-700   hover:bg-red-50"
                )}
              >
                {review.is_flagged
                  ? <><FlagOff className="w-3 h-3 mr-1" />Unflag</>
                  : <><Flag    className="w-3 h-3 mr-1" />Flag</>
                }
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}